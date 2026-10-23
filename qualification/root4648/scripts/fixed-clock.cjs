// Synthetic qualification only. Opt-in production uses MENDR_EVALUATED_AT instead.
const RealDate = Date;
const pinned = process.env.ROOT4648_FIXED_NOW;
if (pinned) {
  const epoch = RealDate.parse(pinned);
  if (!Number.isFinite(epoch)) throw new Error('invalid synthetic clock');
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [epoch])); }
    static now() { return epoch; }
  };
}
