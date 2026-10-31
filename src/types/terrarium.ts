export type MutationStatus = 'killed' | 'survived' | 'invalid' | 'incompetent' | 'infra_error';

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
  relationshipType: 'calls' | 'imports' | 'references' | 'reflection';
  confidence: 'certain' | 'inferred' | 'uncertain';
}

export interface MutationResult {
  mutation_id: string;
  file: string;
  function: string;
  description: string;
  status: MutationStatus;
  predicted_tests: string[];
  failing_tests: string[];
  duration_seconds: number;
  originalSnippet?: string;
  replacementSnippet?: string;
  line?: number;
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
  mutation_tested_recall: number | null; // MTIR
  valid_mutants: number;
  total_mutants: number;
  missed_tests: string[];
  explanation: string;
  warnings: string[];
  untested_functions?: string[];
  raw_logs?: string[];
}

export interface EvidenceReplayStage {
  id: 'change' | 'impact' | 'tests' | 'mutations' | 'execution' | 'evidence' | 'verified';
  name: string;
  status: 'passed' | 'warning' | 'active';
  summary: string;
  details: {
    title: string;
    description: string;
    data: any;
  };
}

export interface ExperimentRecord {
  id: string;
  name: string;
  repositoryId: string;
  timestamp: string;
  revision: string;
  changedFiles: string[];
  durationSeconds: number;
  status: 'completed' | 'running' | 'failed';
  report: AnalysisReport;
  stages: EvidenceReplayStage[];
  diff: string;
}

export interface BlindSpotItem {
  id: string;
  title: string;
  type: 'missed_test' | 'surviving_mutation' | 'untested_function' | 'dynamic_dispatch';
  severity: 'high' | 'medium' | 'low';
  location: string;
  detectedInExperimentId: string;
  whatWasMissed: string;
  whyItMatters: string;
  evidence: string;
  remediation: string;
  suggestedTestCode?: string;
}

export interface SampleSourceFile {
  path: string;
  title: string;
  language: string;
  content: string;
  functions: string[];
  isTestFile: boolean;
}

export interface RepositoryWorkspace {
  id: string;
  name: string;
  branch: string;
  description: string;
  language: string;
  revision: string;
  files: SampleSourceFile[];
  defaultChangedFile: string;
  isCustom?: boolean;
}

export interface ExperimentParams {
  repositoryPath: string;
  changedFiles: string[];
  maxMutations: number;
  graphType: 'ast' | 'graphify';
  includeReflectionTest: boolean;
}
