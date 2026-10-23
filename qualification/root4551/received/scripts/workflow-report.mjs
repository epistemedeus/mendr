#!/usr/bin/env node
// Narrow ingest only. Mendr owns matching, registry evidence and classification.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function workflowReport(mendrRoot, format, input, source = '(supplied export)') {
  const { loadLlmRegistry } = await import(pathToFileURL(join(resolve(mendrRoot), 'dist/usage/llmRegistry.js')).href);
  const { scanConfigText } = await import(pathToFileURL(join(resolve(mendrRoot), 'dist/config/scanConfig.js')).href);
  const { registryProvenance } = await import(pathToFileURL(join(resolve(mendrRoot), 'dist/usage/llmRegistry.js')).href);
  const registry = loadLlmRegistry();
  if (!['n8n', 'make'].includes(format)) throw new Error('format must be n8n or make');
  const nodes = format === 'n8n' ? input?.nodes : input?.flow;
  if (!Array.isArray(nodes)) throw new Error(`expected ${format === 'n8n' ? 'nodes' : 'flow'} array`);
  const candidates = [];
  let unsupportedNodes = 0;
  for (const [index, node] of nodes.entries()) {
    // These exact synthetic-qualified shapes are the entire supported surface.
    // Unknown vendors/modules cannot inherit direct OpenAI authority by name.
    if (!node || typeof node !== 'object') { unsupportedNodes++; continue; }
    const supported = format === 'n8n'
      ? node.type === '@n8n/n8n-nodes-langchain.lmChatOpenAi'
      : node.module === 'openai-gpt-3:CreateCompletion';
    if (!supported) { unsupportedNodes++; continue; }
    const base = format === 'n8n' ? `/nodes/${index}/parameters` : `/flow/${index}/mapper`;
    const params = format === 'n8n' ? node.parameters : node.mapper;
    let pointer = base + '/model';
    let model = params?.model;
    if (format === 'n8n' && model && typeof model === 'object' && model.__rl === true && ['list','id'].includes(model.mode)) {
      pointer += '/value';
      model = model.value;
    }
    // Always use the array pointer: ids may be absent or duplicated. Do not echo
    // node labels, credentials, notes, arbitrary options or embedded expressions.
    const parameterNames = new Set(['temperature','topP','top_p','maxTokens','max_tokens','maxCompletionTokens','max_completion_tokens','reasoningEffort','reasoning_effort','frequencyPenalty','frequency_penalty','presencePenalty','presence_penalty','prompt_cache_retention']);
    const pointers = (obj,path) => obj && typeof obj === 'object' ? Object.keys(obj).filter(k=>parameterNames.has(k)).map(k=>path+'/'+k) : [];
    const context = { pointer, parameterPointers: [...pointers(params,base),...pointers(params?.options,base+'/options')] };
    if (typeof model !== 'string' || !model || /\{\{|\}\}/.test(model)) {
      candidates.push({ ...context, assessment:'not_assessed', reason:'missing, dynamic or unsupported model selector' });
      continue;
    }
    const options = params?.options;
    const customEndpoint = [params,options].some(obj => obj && typeof obj === 'object' && Object.keys(obj).some(k => /^(baseURL|baseUrl|base_url|apiBase|api_base|endpoint|endpointUrl)$/i.test(k)));
    const matches = scanConfigText(customEndpoint ? 'openai-compatible/selection.json' : 'selection.json', JSON.stringify({model},null,2), registry);
    candidates.push({ ...context, model, assessment:matches.length ? 'retirement_reference' : 'not_in_pinned_retirement_registry',
      runtimeUsage:'not_measured', compatibility:'not_assessed',
      evidence:matches.map(m => ({ provider:m.deprecation.provider, deprecated:m.deprecation.deprecated,
        shutdownDate:m.deprecation.shutdownDate ?? null,
        sourceUrl:m.deprecation.sourceUrl ?? null,
        registryCandidate:customEndpoint ? null : m.deprecation.replacement,
        providerSurface:customEndpoint ? 'provider_ambiguous' : m.providerSurface,
        tier:m.tier, disposition:'review', patchEligible:false })) });
  }
  return { schema:'pilot-mendr-workflow-report/v1', source, format,
    registry:registryProvenance(registry), coverage:{totalNodes:nodes.length,supportedNodes:candidates.length,unsupportedNodes},
    limitations:['Synthetic-qualified input shapes only; connector versions and actual request bodies are unreceived.',
      'Unsupported nodes are not assessed. No workflow execution, model availability or semantic equivalence was measured.',
      'Registry candidates require review. This adapter never migrates or writes source.'], candidates };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [mendrRoot,format,file] = process.argv.slice(2);
  if (!mendrRoot || !format || !file) throw new Error('usage: workflow-report.mjs MENDR_ROOT n8n|make EXPORT.json');
  const bytes=readFileSync(file);
  const report=await workflowReport(mendrRoot,format,JSON.parse(bytes.toString('utf8')),basename(file));
  console.log(JSON.stringify({...report,sourceSha256:createHash('sha256').update(bytes).digest('hex')},null,2));
}
