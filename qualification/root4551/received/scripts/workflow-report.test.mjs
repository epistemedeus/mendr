import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { workflowReport } from './workflow-report.mjs';

const mendr = process.env.ROOT4410_MENDR_ROOT ?? process.cwd();
const fixture = name => JSON.parse(readFileSync(new URL('../fixtures/'+name+'.json',import.meta.url),'utf8'));
test('n8n resource locator and scalar are located; notes and credentials are excluded', async () => {
  const input=fixture('n8n'); const before=JSON.stringify(input);
  const r=await workflowReport(mendr,'n8n',input);
  assert.deepEqual(r.candidates.map(x=>x.pointer),['/nodes/0/parameters/model/value','/nodes/1/parameters/model']);
  assert.deepEqual(r.candidates.map(x=>x.model),['o4-mini','o4-mini']);
  assert.deepEqual(r.candidates[0].parameterPointers,['/nodes/0/parameters/options/temperature']);
  assert.equal(r.coverage.unsupportedNodes,1);
  assert.ok(r.candidates.every(x=>x.evidence.every(e=>e.tier==='B' && !e.patchEligible)));
  assert.equal(JSON.stringify(input),before);
  assert.ok(!JSON.stringify(r).includes('synthetic-only'));
});
test('Make mapper uses exact module scope, with parameter locators', async () => {
  const r=await workflowReport(mendr,'make',fixture('make'));
  assert.deepEqual(r.candidates.map(x=>x.pointer),['/flow/0/mapper/model']);
  assert.deepEqual(r.candidates[0].parameterPointers,['/flow/0/mapper/temperature','/flow/0/mapper/max_tokens']);
  assert.equal(r.candidates[0].evidence[0].registryCandidate,'gpt-5.6-luna');
});
test('custom endpoints cannot receive direct-provider replacement authority', async () => {
  const input=fixture('n8n'); input.nodes[0].parameters.options.baseURL='https://proxy.invalid';
  const r=await workflowReport(mendr,'n8n',input);
  assert.equal(r.candidates[0].evidence[0].registryCandidate,null);
  assert.equal(r.candidates[0].evidence[0].providerSurface,'provider_ambiguous');
});
test('dynamic, unknown, missing and duplicate identities retain honest coverage', async () => {
  const input=fixture('n8n'); input.nodes[0].parameters.model.value='={{ $credentials.secret }}';
  input.nodes[1].id=input.nodes[0].id; input.nodes[1].parameters.model='synthetic-future-model';
  const r=await workflowReport(mendr,'n8n',input);
  assert.equal(r.candidates[0].assessment,'not_assessed');
  assert.equal(r.candidates[1].assessment,'not_in_pinned_retirement_registry');
  assert.ok(!JSON.stringify(r).includes('$credentials'));
  assert.equal(r.coverage.totalNodes,3);
  delete input.nodes[0].parameters.model;
  assert.equal((await workflowReport(mendr,'n8n',input)).candidates[0].assessment,'not_assessed');
  input.nodes[0].parameters.model={__rl:true,value:'o4-mini',mode:'expression'};
  assert.equal((await workflowReport(mendr,'n8n',input)).candidates[0].assessment,'not_assessed');
});
test('malformed shape fails; a healthy subsequent report recovers', async () => {
  await assert.rejects(()=>workflowReport(mendr,'n8n',{}),/expected nodes/);
  await assert.rejects(()=>workflowReport(mendr,'unsupported',{}),/format must/);
  assert.equal((await workflowReport(mendr,'make',fixture('make'))).candidates.length,1);
});
