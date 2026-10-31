import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AnalysisReport,
  BlindSpotItem,
  ExperimentParams,
  ExperimentRecord,
  RepositoryWorkspace,
  SampleSourceFile,
} from './types/terrarium';
import {
  getAllRepositories,
  saveCustomRepository,
} from './data/repositories';
import { analyzeProject } from './engine/astAnalyzer';
import {
  getStoredExperiments,
  saveStoredExperiment,
} from './storage/experimentStore';
import { NavigationRail } from './components/NavigationRail';
import { TopBar } from './components/TopBar';
import { ObservatoryView } from './views/ObservatoryView';
import { ExperimentsView } from './views/ExperimentsView';
import { BlindSpotsView } from './views/BlindSpotsView';
import { InspectCodeView } from './views/InspectCodeView';
import { ExperimentConfigModal } from './components/ExperimentConfigModal';
import { CodeViewerModal } from './components/CodeViewerModal';
import { RepositoryModal } from './components/RepositoryModal';
import { Toast } from './components/Toast';

export function App() {
  const [repositories, setRepositories] = useState<RepositoryWorkspace[]>(() =>
    getAllRepositories()
  );
  const [activeRepo, setActiveRepo] = useState<RepositoryWorkspace>(() =>
    repositories[0]
  );
  const [files, setFiles] = useState<SampleSourceFile[]>(() => activeRepo.files);
  const [activeView, setActiveView] = useState<string>('observatory');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [isRepoModalOpen, setIsRepoModalOpen] = useState<boolean>(false);

  const [config, setConfig] = useState<ExperimentParams>({
    repositoryPath: activeRepo.id,
    changedFiles: [activeRepo.defaultChangedFile],
    maxMutations: 4,
    graphType: 'ast',
    includeReflectionTest: true,
  });

  // Initial live computation for default repository
  const initialExecution = useMemo(() => {
    return analyzeProject({
      files: activeRepo.files,
      changedFiles: [activeRepo.defaultChangedFile],
      maxMutations: 4,
      useGraphify: false,
      experimentIndex: 1,
      repositoryId: activeRepo.id,
      repositoryName: activeRepo.name,
      revision: activeRepo.revision,
    });
  }, [activeRepo]);

  const [experiments, setExperiments] = useState<ExperimentRecord[]>(() => {
    const stored = getStoredExperiments();
    if (stored.length > 0) return stored;
    saveStoredExperiment(initialExecution.experimentRecord);
    return [initialExecution.experimentRecord];
  });

  const [activeExperiment, setActiveExperiment] = useState<ExperimentRecord>(
    () => experiments.find((e) => e.repositoryId === activeRepo.id) || initialExecution.experimentRecord
  );

  const [blindSpots, setBlindSpots] = useState<BlindSpotItem[]>(
    () => initialExecution.blindSpots
  );

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  }, []);

  // Run live deterministic experiment
  const runExperiment = useCallback(
    async (
      customFiles?: SampleSourceFile[],
      customParams?: ExperimentParams,
      targetRepo?: RepositoryWorkspace
    ) => {
      if (isRunning) return;
      setIsRunning(true);
      showToast('Baseline → impact graph → isolated mutation execution…');

      try {
        const repo = targetRepo || activeRepo;
        const sourceFiles = customFiles || files;
        const currentParams = customParams || config;

        // Filter out reflection/dynamic test if unticked
        const activeFiles = currentParams.includeReflectionTest
          ? sourceFiles
          : sourceFiles.filter((f) => !f.path.includes('reflection') && !f.path.includes('dynamic'));

        await new Promise((resolve) => setTimeout(resolve, 600));

        const expIndex = experiments.length + 1;
        const execution = analyzeProject({
          files: activeFiles,
          changedFiles: currentParams.changedFiles,
          maxMutations: currentParams.maxMutations,
          useGraphify: currentParams.graphType === 'graphify',
          experimentIndex: expIndex,
          repositoryId: repo.id,
          repositoryName: repo.name,
          revision: repo.revision,
        });

        saveStoredExperiment(execution.experimentRecord);

        setExperiments((prev) => [execution.experimentRecord, ...prev]);
        setActiveExperiment(execution.experimentRecord);
        setBlindSpots(execution.blindSpots);

        showToast(`Experiment ${execution.experimentRecord.id} completed. Evidence saved.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Execution error';
        showToast(`Error: ${msg}`);
      } finally {
        setIsRunning(false);
      }
    },
    [isRunning, showToast, activeRepo, files, config, experiments.length]
  );

  // Switch repository
  const handleSelectRepository = (repo: RepositoryWorkspace) => {
    setActiveRepo(repo);
    setFiles(repo.files);
    const newConfig: ExperimentParams = {
      repositoryPath: repo.id,
      changedFiles: [repo.defaultChangedFile],
      maxMutations: 4,
      graphType: 'ast',
      includeReflectionTest: true,
    };
    setConfig(newConfig);

    // Run experiment on the new repo
    runExperiment(repo.files, newConfig, repo);
    showToast(`Switched workspace to '${repo.name}' (${repo.branch})`);
  };

  // Create & import new repository
  const handleCreateRepository = (newRepo: RepositoryWorkspace) => {
    saveCustomRepository(newRepo);
    setRepositories((prev) => [...prev, newRepo]);
    handleSelectRepository(newRepo);
  };

  // Keyboard shortcut: ⌘+Enter / Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runExperiment();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runExperiment]);

  const handleUpdateFileContent = (path: string, newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, content: newContent } : f))
    );
    showToast(`Saved changes to ${path}. Run an experiment to test.`);
  };

  // Live Remediation: Fix Dynamic Reflection Blind Spot
  const handleApplyFix = (item: BlindSpotItem) => {
    if (item.type === 'dynamic_dispatch') {
      const updatedFiles = files.map((f) => {
        if (f.path.includes('reflection') || f.path.includes('dynamic') || f.path.includes('webhook')) {
          const newContent = f.content
            .replace(
              'operation = getattr(pricing, "apply_discount")',
              'operation = pricing.apply_discount'
            )
            .replace(
              'checker = getattr(auth, "check_permission")',
              'checker = auth.check_permission'
            )
            .replace(
              'tax_calculator = getattr(billing, "calculate_tax")',
              'tax_calculator = billing.calculate_tax'
            );
          return { ...f, content: newContent };
        }
        return f;
      });

      setFiles(updatedFiles);
      showToast('Dynamic dispatch converted to direct reference! Re-running experiment…');
      runExperiment(updatedFiles);
    } else {
      showToast('Inspect code to add test coverage for this surviving mutant.');
      setActiveView('inspect');
    }
  };

  const handleDownloadReceipt = () => {
    const currentReport = activeExperiment?.report;
    if (!currentReport) return;
    const receiptData = {
      meta: {
        tool: 'TERRARIUM',
        version: '0.1.0',
        repository: activeRepo.name,
        revision: activeRepo.revision,
        experimentId: activeExperiment.id,
        timestamp: new Date().toISOString(),
        engine: 'Deterministic AST + Mutation Sandbox',
      },
      report: currentReport,
      stages: activeExperiment.stages,
    };
    const blob = new Blob([JSON.stringify(receiptData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `terrarium-${activeRepo.name}-${activeExperiment.id}-receipt.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Evidence receipt downloaded');
  };

  // Filter experiments for the active repository
  const repoExperiments = experiments.filter(
    (e) => e.repositoryId === activeRepo.id || !e.repositoryId
  );

  const displayedExperiment =
    activeExperiment && activeExperiment.repositoryId === activeRepo.id
      ? activeExperiment
      : repoExperiments[0] || initialExecution.experimentRecord;

  return (
    <div className="flex min-h-screen bg-[#050505] text-[#f5f5f5] font-sans antialiased selection:bg-white selection:text-black">
      {/* Navigation Rail with 4 Workspaces */}
      <NavigationRail
        activeView={activeView}
        onSelectView={setActiveView}
        experimentsCount={repoExperiments.length}
        blindSpotsCount={blindSpots.length}
      />

      {/* Main Workspace Canvas */}
      <main className="ml-[232px] w-[calc(100%-232px)] max-w-[1680px] p-[39px_4.5vw_26px] max-[760px]:ml-[58px] max-[760px]:w-[calc(100%-58px)] max-[760px]:p-[22px_15px]">
        {/* Topbar with Repository Selector */}
        <TopBar
          activeRepo={activeRepo}
          onOpenRepoModal={() => setIsRepoModalOpen(true)}
          onRefresh={() => runExperiment()}
          onOpenConfig={() => setIsConfigModalOpen(true)}
        />

        {/* Workspace Switcher */}
        <div className="mt-[24px]">
          {activeView === 'observatory' && (
            <ObservatoryView
              report={displayedExperiment?.report || null}
              currentExperiment={displayedExperiment}
              activeRepo={activeRepo}
              isRunning={isRunning}
              onRunExperiment={() => runExperiment()}
              onInspectCode={() => setActiveView('inspect')}
              onNavigateToExperiments={() => setActiveView('experiments')}
              onNavigateToBlindSpots={() => setActiveView('blindspots')}
              onDownloadReceipt={handleDownloadReceipt}
              onOpenRepoSwitcher={() => setIsRepoModalOpen(true)}
            />
          )}

          {activeView === 'experiments' && (
            <ExperimentsView
              experiments={repoExperiments}
              activeExperiment={displayedExperiment}
              onSelectExperiment={setActiveExperiment}
              onReplayExperiment={(exp) => {
                showToast(`Replaying ${exp.id} from scratch…`);
                runExperiment();
              }}
              onRunNewExperiment={() => runExperiment()}
            />
          )}

          {activeView === 'blindspots' && (
            <BlindSpotsView
              blindSpots={blindSpots}
              onApplyFix={handleApplyFix}
              onInspectCode={() => {
                setActiveView('inspect');
              }}
            />
          )}

          {activeView === 'inspect' && (
            <InspectCodeView
              files={files}
              report={displayedExperiment?.report || null}
              onUpdateFileContent={handleUpdateFileContent}
              onRunExperiment={() => runExperiment()}
            />
          )}
        </div>

        {/* Global Footer */}
        <footer className="flex justify-between mt-[32px] pt-[16px] border-t border-[#1c1c1c] text-[#666666] font-mono text-[8px] tracking-[0.4px] max-[760px]:flex-col max-[760px]:gap-[8px]">
          <div className="flex items-center">
            <span>TERRARIUM</span>
            <span className="text-white text-[7px] mx-[5px]">●</span>
            <span>SOFTWARE CHANGE INTELLIGENCE</span>
            <span className="text-[#444] mx-[8px]">|</span>
            <span className="text-[#888]">{activeRepo.name} ({activeRepo.branch})</span>
          </div>
          <div>
            Scores describe this experiment only. Deterministic evidence ledger.
          </div>
        </footer>
      </main>

      {/* Repository Switcher & Ingestion Modal */}
      <RepositoryModal
        isOpen={isRepoModalOpen}
        onClose={() => setIsRepoModalOpen(false)}
        repositories={repositories}
        activeRepoId={activeRepo.id}
        onSelectRepo={handleSelectRepository}
        onCreateRepo={handleCreateRepository}
      />

      {/* Code Viewer Modal */}
      <CodeViewerModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        files={files}
        onUpdateFileContent={handleUpdateFileContent}
        onTriggerAnalysis={() => runExperiment()}
      />

      {/* Experiment Configuration Modal */}
      <ExperimentConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onChangeConfig={setConfig}
        onApplyAndRun={() => runExperiment(undefined, config)}
      />

      {/* Real-time Toast Notifications */}
      <Toast message={toastMessage} />
    </div>
  );
}

export default App;
