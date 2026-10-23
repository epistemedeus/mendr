#!/usr/bin/env python3
"""Bounded, serial, no-key command receipt runner. Linux /proc RSS is sampled."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import time

p = argparse.ArgumentParser()
p.add_argument("name")
p.add_argument("--cwd", required=True)
p.add_argument("--outputs", required=True)
p.add_argument("--offline", action="store_true")
p.add_argument("--native-root", type=int, required=True)
p.add_argument("--timeout", type=int, default=1800)
p.add_argument("command", nargs=argparse.REMAINDER)
a = p.parse_args()
cmd = a.command[1:] if a.command[:1] == ["--"] else a.command
out = Path(a.outputs).resolve()
out.mkdir(parents=True, exist_ok=True)
home = Path(__file__).resolve().parents[1] / ".scratch/home"
home.mkdir(parents=True, exist_ok=True)
env = {k: os.environ[k] for k in ("PATH", "LANG", "LC_ALL") if k in os.environ}
env["HOME"] = str(home)
env["TMPDIR"] = str(home.parent)
env["GIT_CONFIG_NOSYSTEM"] = "1"
env["GIT_CONFIG_GLOBAL"] = "/dev/null"
env.update(CI="1", NO_COLOR="1", MENDR_REGISTRY_REFRESH="off", NODE_OPTIONS="--max-old-space-size=640")
if a.offline:
    env["NODE_OPTIONS"] += " --require " + str(Path(a.cwd).resolve() / "scripts/no-network.cjs")

def processes():
    found = {}
    for entry in Path("/proc").iterdir():
        if not entry.name.isdigit():
            continue
        try:
            fields = (entry / "stat").read_text().rsplit(")", 1)[1].split()
            status = (entry / "status").read_text().splitlines()
            rss = next((int(x.split()[1]) for x in status if x.startswith("VmRSS:")), 0)
            found[int(entry.name)] = (int(fields[1]), rss)
        except (FileNotFoundError, PermissionError, ProcessLookupError):
            pass
    return found

# Explicit admitted supervisor tree plus this owned command runner tree.
# Native tools use the host exec daemon, so ancestor inference is insufficient.
assert Path(f"/proc/{a.native_root}").exists(), "admitted supervisor missing"
ancestors = set()
source_binding = {
    "head": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=a.cwd).decode().strip(),
    "trackedDiffSha256": hashlib.sha256(subprocess.check_output(["git", "diff", "--binary"], cwd=a.cwd)).hexdigest(),
    "sourceTreeSha256": hashlib.sha256(b"".join(str(p.relative_to(Path(a.cwd))).encode() + b"\0" + p.read_bytes() + b"\0" for p in sorted(Path(a.cwd).glob("src/**/*.ts")))).hexdigest(),
    "scopeSha256": {str(p.relative_to(Path(a.cwd))): hashlib.sha256(p.read_bytes()).hexdigest()
                    for p in sorted(Path(a.cwd).glob("src/**/*.ts"))
                    if p.name.startswith("root4410-") or str(p.relative_to(Path(a.cwd))) in {
                       "src/assurance/recovery.ts", "src/assurance/assurance.test.ts", "src/assurance/telemetry.ts",
                       "src/runtime/evidence.ts", "src/usage/tsSurface.ts", "src/usage/scanLiterals.ts",
                       "src/usage/requestObjectFlow.test.ts"}},
    "lockSha256": hashlib.sha256((Path(a.cwd) / "package-lock.json").read_bytes()).hexdigest(),
}
binding_path = out / (a.name + ".source.json")
assert not binding_path.exists(), "fresh source receipt required"
binding_path.write_text(json.dumps(source_binding, indent=2) + "\n")
start = time.monotonic()
stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
peak = 0
reason = None
owned = {os.getpid()}
native_seen = {a.native_root}
log = out / (a.name + ".log")
assert not log.exists(), "fresh receipt name required"
with log.open("wb") as f:
    child = subprocess.Popen(cmd, cwd=a.cwd, env=env, stdout=f, stderr=subprocess.STDOUT, start_new_session=True)
    owned.add(child.pid)
    while True:
        ps = processes()
        selected = set(owned)
        while True:
            expanded = selected | {pid for pid, (ppid, _) in ps.items() if ppid in selected}
            if selected == expanded:
                break
            selected = expanded
        owned |= selected
        native_selected = set(native_seen)
        while True:
            expanded = native_selected | {pid for pid, (ppid, _) in ps.items() if ppid in native_selected}
            if expanded == native_selected:
                break
            native_selected = expanded
        native_seen |= native_selected
        rss = sum(ps.get(pid, (0, 0))[1] for pid in selected | native_selected)
        peak = max(peak, rss)
        if rss > 1966080:
            reason = "RSS safety stop below 2097152 KiB aggregate reserve"
        elif time.monotonic() - start > a.timeout:
            reason = "command deadline"
        if reason:
            for pid in owned - {os.getpid()}:
                try:
                    os.kill(pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            child.wait()
            break
        if child.poll() is not None:
            break
        time.sleep(0.1)
    code = child.wait()
survivors = [pid for pid in owned - {os.getpid()} if pid in processes()]
survivor_states = []
for pid in survivors:
    try:
        fields = Path(f"/proc/{pid}/stat").read_text().rsplit(")", 1)[1].split()
        survivor_states.append({"pid": pid, "state": fields[0], "ppid": int(fields[1])})
    except FileNotFoundError:
        pass
data = log.read_bytes()
artifact = None
if "--json" in cmd:
    try:
        parsed = json.loads(data)
        def compact(value):
            if isinstance(value, dict):
                return {k: compact(v) for k, v in value.items() if k != "snippet"}
            if isinstance(value, list):
                return [compact(v) for v in value]
            return value
        artifact = a.name + ".report.json"
        (out / artifact).write_text(json.dumps(compact(parsed), indent=2) + "\n")
        log.write_text("JSON received; source snippets omitted in " + artifact + ".\n")
    except (ValueError, UnicodeDecodeError):
        pass
if artifact is None and len(data) > 262144:
    log.write_bytes(data[:131072] + b"\n[bounded log: middle omitted]\n" + data[-131072:])
receipt = dict(name=a.name, command=cmd, cwd=str(Path(a.cwd).resolve()), startedAt=stamp,
               elapsedSeconds=round(time.monotonic()-start, 3), exitCode=code,
               offlinePreload=a.offline, environment="allowlisted; no provider or Git credentials inherited",
               peakAggregateRssKiB=peak, reservationKiB=2097152, sampleMs=100,
               accounting="admitted native/supervisor process tree + owned runner/command descendants; 100ms sampled RSS, not cgroup peak", nativeRoot=a.native_root,
               stopReason=reason, survivingOwnedPids=survivors, logBytesBeforeBounding=len(data),
               survivingOwnedProcesses=survivor_states,
               outputSha256=hashlib.sha256(data).hexdigest(), reportArtifact=artifact)
(out / (a.name + ".json")).write_text(json.dumps(receipt, indent=2) + "\n")
print(json.dumps(receipt))
raise SystemExit(code if code >= 0 else 128-code)
