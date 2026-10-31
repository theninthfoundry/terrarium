import React, { useState, useEffect, useCallback } from 'react';
import { AnalysisReport, ExperimentParams, SampleSourceFile } from './types/terrarium';
import { SAMPLE_FILES, INITIAL_DEMO_REPORT } from './data/sampleRepo';
import { analyzeProject } from './engine/astAnalyzer';
import { NavigationRail } from './components/NavigationRail';
import { TopBar } from './components/TopBar';
import { RepoCard } from './components/RepoCard';
import { MetricCards } from './components/MetricCards';
import { ImpactPanel } from './components/ImpactPanel';
import { MutationLedger } from './components/MutationLedger';
import { TrustReport } from './components/TrustReport';
import { CodeViewerModal } from './components/CodeViewerModal';
import { ExperimentConfigModal } from './components/ExperimentConfigModal';
import { Toast } from './components/Toast';

export function App() {
  const [files, setFiles] = useState<SampleSourceFile[]>(SAMPLE_FILES);
  const [report, setReport] = useState<AnalysisReport | null>(INITIAL_DEMO_REPORT);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<string>('observatory');
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  const [config, setConfig] = useState<ExperimentParams>({
    repositoryPath: 'sample_repo',
    changedFiles: ['src/pricing.py'],
    maxMutations: 4,
    graphType: 'ast',
    includeReflectionTest: true,
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  }, []);

  const runExperiment = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    showToast('Baseline → impact graph → controlled mutations');

    try {
      // Filter out reflection test if user unticked it in config
      const activeFiles = config.includeReflectionTest
        ? files
        : files.filter((f) => !f.path.includes('reflection'));

      // Simulate isolated execution delay like python test runner
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Execute dynamic analysis with real AST parser and mutation generation
      const newReport = analyzeProject({
        files: activeFiles,
        changedFiles: config.changedFiles,
        maxMutations: config.maxMutations,
        useGraphify: config.graphType === 'graphify',
      });

      setReport(newReport);
      showToast('Experiment complete. Evidence updated.');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Analysis failed safely';
      showToast(errMsg);
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, showToast, config, files]);

  // Handle keyboard shortcut (⌘+Enter / Ctrl+Enter)
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

  // Handle smooth scroll or view navigation
  const handleSelectView = (view: string) => {
    setActiveView(view);
    if (view === 'observatory') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'experiments') {
      const el = document.getElementById('experimentsPanel');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (view === 'blindspots') {
      const el = document.getElementById('blindspotsPanel');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleUpdateFileContent = (path: string, newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, content: newContent } : f))
    );
    showToast(`Saved changes to ${path}`);
  };

  const handleDownloadReceipt = () => {
    if (!report) return;
    const receiptData = {
      meta: {
        tool: 'TERRARIUM',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        engine: 'AST + Mutation Verification Sandbox',
      },
      report,
    };
    const blob = new Blob([JSON.stringify(receiptData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `terrarium-evidence-receipt-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Evidence receipt downloaded');
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-[#f5f5f5] font-sans antialiased selection:bg-white selection:text-black">
      {/* Navigation Rail */}
      <NavigationRail
        activeView={activeView}
        onSelectView={handleSelectView}
        onOpenCodeViewer={() => setIsCodeModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="ml-[232px] w-[calc(100%-232px)] max-w-[1680px] p-[39px_4.5vw_26px] max-[760px]:ml-[58px] max-[760px]:w-[calc(100%-58px)] max-[760px]:p-[22px_15px]">
        {/* Topbar */}
        <TopBar
          onRefresh={() => (report ? setReport({ ...report }) : runExperiment())}
          onOpenConfig={() => setIsConfigModalOpen(true)}
        />

        {/* Intro Row */}
        <section className="my-[39px_25px] flex items-center justify-between max-[760px]:flex-col max-[760px]:items-start max-[760px]:gap-[15px]">
          <div>
            <p className="text-[clamp(23px,2.2vw,31px)] font-bold tracking-[-1.5px] mt-0 mb-[7px] leading-[1.12] text-white max-[760px]:text-[22px]">
              See what breaks.{' '}
              <span className="text-[#8b8b8b]">Know how much to trust.</span>
            </p>
            <p className="m-0 text-[#999999] text-[11px]">
              A test-impact prediction is only useful when its blind spots are visible.
            </p>
          </div>

          <button
            onClick={runExperiment}
            disabled={isRunning}
            className="bg-white text-black border border-white rounded-none p-[13px_17px] font-sans font-bold text-[11px] cursor-pointer flex items-center gap-[10px] hover:bg-black hover:text-white transition-colors disabled:opacity-60 disabled:cursor-wait shrink-0"
          >
            <span className="text-[9px] font-bold">
              {isRunning ? '◌' : '▶'}
            </span>
            <span>
              {isRunning ? 'Running isolated experiments…' : 'Run experiment'}
            </span>
            <span className="font-mono text-[9px] opacity-50 ml-[8px]">⌘ ↵</span>
          </button>
        </section>

        {/* Repository Card */}
        <RepoCard
          repositoryName="terrarium-sample"
          branch="main"
          changedFiles={config.changedFiles}
          changedFunctionsCount={report?.changed_functions.length ?? 2}
          onInspectCode={() => setIsCodeModalOpen(true)}
        />

        {/* 4 Metric Cards */}
        <MetricCards report={report} />

        {/* Content Grid (01 Impact Analysis & 02 Controlled Experiments) */}
        <section className="grid grid-cols-2 gap-[10px] max-[760px]:grid-cols-1">
          <ImpactPanel report={report} />
          <MutationLedger report={report} />
        </section>

        {/* 03 Evidence & Limitations */}
        <TrustReport
          report={report}
          onDownloadReceipt={handleDownloadReceipt}
          onInspectReflection={() => setIsCodeModalOpen(true)}
        />

        {/* Footer */}
        <footer className="flex justify-between mt-[20px] text-[#666666] font-mono text-[8px] tracking-[0.4px] max-[760px]:flex-col max-[760px]:gap-[8px]">
          <div className="flex items-center">
            <span>TERRARIUM</span>
            <span className="text-white text-[7px] mx-[5px]">●</span>
            <span>SOFTWARE CHANGE INTELLIGENCE</span>
          </div>
          <div>
            Scores describe this experiment only. They are not a guarantee of regression coverage.
          </div>
        </footer>
      </main>

      {/* Code Viewer Modal */}
      <CodeViewerModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        files={files}
        onUpdateFileContent={handleUpdateFileContent}
        onTriggerAnalysis={runExperiment}
      />

      {/* Experiment Configuration Modal */}
      <ExperimentConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onChangeConfig={setConfig}
        onApplyAndRun={runExperiment}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} />
    </div>
  );
}

export default App;
