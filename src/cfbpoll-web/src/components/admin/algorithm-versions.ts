export const ALGORITHM_VERSIONS = ['V1', 'V2'] as const;

export type AlgorithmVersion = typeof ALGORITHM_VERSIONS[number];
