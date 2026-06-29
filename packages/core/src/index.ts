// Ports (the hexagonal boundary)
export * from './ports.js';

// Pipeline orchestration
export { runPipeline } from './pipeline.js';
export type { RunPipelineInput } from './pipeline.js';

// Individual stages (exported for reuse and testing)
export { understandTask, classifyIntent, extractEntities } from './task-understanding/index.js';
export { rankItems, scoreItem } from './ranking/index.js';
export type { RankOptions, RankWeights } from './ranking/index.js';
export { cosineSimilarity } from './ranking/vector.js';
export * from './verification/index.js';
export { compressItems } from './compression/index.js';
export { computeConfidence } from './confidence/index.js';
export type { ConfidenceWeights, ConfidenceInput } from './confidence/index.js';
export { buildPack, slugify } from './pack/generator.js';
export type { BuildPackInput } from './pack/generator.js';
