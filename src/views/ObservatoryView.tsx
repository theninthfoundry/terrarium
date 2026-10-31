import React, { useState } from 'react';
import { AnalysisReport, ExperimentRecord, RepositoryWorkspace } from '../types/terrarium';
import { RepoCard } from '../components/RepoCard';
import { MetricCards } from '../components/MetricCards';
import { ImpactPanel } from '../components/ImpactPanel';
import { MutationLedger } from '../components/MutationLedger';
import { TrustReport } from '../components/TrustReport';

interface ObservatoryViewProps {
  report: AnalysisReport | null;
  currentExperiment: ExperimentRecord | null;
  activeRepo: RepositoryWorkspace;
  isRunning: boolean;
  onRunExperiment: () => void;
  onInspectCode: () => void;
  onNavigateToExperiments: () => void;
  onNavigateToBlindSpots: () => void;
  onDownloadReceipt: () => void;
  onOpenRepoSwitcher: () => void;
}

export const ObservatoryView: React.FC<ObservatoryViewProps> = ({
  report,
  currentExperiment,
  activeRepo,
  isRunning,
  onRunExperiment,
  onInspectCode,
  onNavigateToExperiments,
  onNavigateToBlindSpots,
  onDownloadReceipt,
  onOpenRepoSwitcher,
}) => {
  const [showDiff, setShowDiff] = useState<boolean>(false);

  return (
    <div className="space-y-[24px]">
      {/* Intro Row */}
      <section className="flex items-center justify-between max-[760px]:flex-col max-[760px]:items-start max-[760px]:gap-[15px]">
        <div>
          <p className="text-[clamp(23px,2.2vw,31px)] font-bold tracking-[-1.5px] mt-0 mb-[7px] leading-[1.12] text-white max-[760px]:text-[22px]">
            See what breaks.{' '}
            <span className="text-[#8b8b8b]">Know how much to trust.</span>
          </p>
          <p className="m-0 text-[#999999] text-[11px]">
            A test-impact prediction is only useful when its blind spots are visible.
          </p>
        </div>

        <div className="flex items-center gap-[10px] shrink-0">
          <button
            onClick={onOpenRepoSwitcher}
            className="font-mono text-[10px] px-[12px] py-[10px] border border-[#444444] bg-[#0c0c0c] text-[#cccccc] hover:text-white hover:border-white transition-colors cursor-pointer"
          >
            Switch Repository ({activeRepo.name}) ⇄
          </button>

          <button
            onClick={() => setShowDiff(!showDiff)}
            className="font-mono text-[10px] px-[12px] py-[10px] border border-[#444444] bg-[#0c0c0c] text-[#cccccc] hover:text-white hover:border-white transition-colors cursor-pointer"
          >
            {showDiff ? 'Hide Change Diff ▴' : 'View Change Diff ▾'}
          </button>

          <button
            onClick={onRunExperiment}
            disabled={isRunning}
            className="bg-white text-black border border-white rounded-none p-[13px_17px] font-sans font-bold text-[11px] cursor-pointer flex items-center gap-[10px] hover:bg-black hover:text-white transition-colors disabled:opacity-60 disabled:cursor-wait shrink-0"
          >
            <span className="text-[9px] font-bold">{isRunning ? '◌' : '▶'}</span>
            <span>{isRunning ? 'Running isolated experiments…' : 'Run experiment'}</span>
            <span className="font-mono text-[9px] opacity-50 ml-[8px]">⌘ ↵</span>
          </button>
        </div>
      </section>

      {/* Optional In-line Diff Viewer */}
      {showDiff && currentExperiment && (
        <section className="bg-[#0e0e0e] border border-[#333333] p-[16px] font-mono text-[10px] leading-[1.6]">
          <div className="flex items-center justify-between text-[#888888] pb-[8px] border-b border-[#222222] mb-[8px]">
            <span>CHANGE UNDER INSPECTION: {currentExperiment.changedFiles[0]} (Revision {currentExperiment.revision})</span>
            <button
              onClick={onInspectCode}
              className="text-white hover:underline cursor-pointer"
            >
              Open Full Code Inspector ↗
            </button>
          </div>
          <pre className="text-[#cccccc] m-0 overflow-x-auto whitespace-pre-wrap">
            {currentExperiment.diff}
          </pre>
        </section>
      )}

      {/* Repository Card */}
      <RepoCard
        repository={activeRepo}
        changedFiles={report?.changed_files || [activeRepo.defaultChangedFile]}
        changedFunctionsCount={report?.changed_functions.length ?? 2}
        onInspectCode={onInspectCode}
        onOpenRepoSwitcher={onOpenRepoSwitcher}
      />

      {/* 4 Metric Cards */}
      <MetricCards report={report} />

      {/* Latest Experiment Banner */}
      {currentExperiment && (
        <div className="bg-[#0e0e0e] border border-[#222222] p-[12px_16px] flex items-center justify-between font-mono text-[9px] text-[#aaaaaa]">
          <div className="flex items-center gap-[12px]">
            <span className="w-[6px] h-[6px] bg-white rounded-full inline-block" />
            <span className="text-white font-bold">{currentExperiment.id}</span>
            <span>Completed in {currentExperiment.durationSeconds}s</span>
            <span>·</span>
            <span className="text-[#888888]">{new Date(currentExperiment.timestamp).toLocaleTimeString()}</span>
          </div>

          <button
            onClick={onNavigateToExperiments}
            className="text-white border-b border-white hover:opacity-75 cursor-pointer pb-[1px]"
          >
            Inspect Evidence Replay Pipeline ↗
          </button>
        </div>
      )}

      {/* Content Grid (01 Impact Analysis & 02 Controlled Experiments) */}
      <section className="grid grid-cols-2 gap-[10px] max-[760px]:grid-cols-1">
        <ImpactPanel report={report} />
        <MutationLedger report={report} />
      </section>

      {/* 03 Evidence & Limitations */}
      <TrustReport
        report={report}
        onDownloadReceipt={onDownloadReceipt}
        onInspectReflection={onNavigateToBlindSpots}
      />
    </div>
  );
};
