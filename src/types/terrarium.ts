export interface FunctionNode {
  id: string;
  name: string;
  qualified_name: string;
  file: string;
  line: number;
  is_test?: boolean;
}

export interface DependencyEdge {
  source: string;
  target: string;
  provenance: string;
}

export interface MutationResult {
  mutation_id: string;
  file: string;
  function: string;
  description: string;
  status: 'killed' | 'survived' | 'invalid';
  predicted_tests: string[];
  failing_tests: string[];
  duration_seconds: number;
  error?: string | null;
}

export interface AnalysisReport {
  repository: string;
  graph_source: string;
  changed_files: string[];
  changed_functions: string[];
  predicted_tests: string[];
  dependency_paths: string[][];
  baseline_passed: boolean;
  baseline_summary: string;
  mutations: MutationResult[];
  mutation_tested_recall: number | null;
  valid_mutants: number;
  total_mutants: number;
  missed_tests: string[];
  explanation: string;
  warnings: string[];
}

export interface SampleSourceFile {
  path: string;
  title: string;
  language: string;
  content: string;
  functions: string[];
  isTestFile: boolean;
}

export interface ExperimentParams {
  repositoryPath: string;
  changedFiles: string[];
  maxMutations: number;
  graphType: 'ast' | 'graphify';
  includeReflectionTest: boolean;
}
