export const ALGORITHM_VERSIONS = ['V1', 'V2'] as const;

export type AlgorithmVersion = typeof ALGORITHM_VERSIONS[number];

// Defaults the experimental picker to the most recently added algorithm version.
export const DEFAULT_ALGORITHM_VERSIONS: AlgorithmVersion[] = [ALGORITHM_VERSIONS[ALGORITHM_VERSIONS.length - 1]];
