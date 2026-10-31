import React, { useState } from 'react';
import { EvidenceReplayStage, ExperimentRecord } from '../types/terrarium';

interface ExperimentsViewProps {
  experiments: ExperimentRecord[];
  activeExperiment: ExperimentRecord | null;
  onSelectExperiment: (exp: ExperimentRecord) => void;
  onReplayExperiment: (exp: ExperimentRecord) => void;
  onRunNewExperiment: () => void;
}

export const ExperimentsView: React.FC<ExperimentsViewProps> = ({
  experiments,
  activeExperiment,
  onSelectExperiment,
  onReplayExperiment,
  onRunNewExperiment,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<string>('evidence');
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareTargetId, setCompareTargetId] = useState<string>(
    experiments.length > 1 ? experiments[1]?.id : ''
  );

  const currentExp = activeExperiment || experiments[0];
  const compareExp = experiments.find((e) => e.id === compareTargetId);

  const activeStage = currentExp?.stages.find((s) => s.id === selectedStageId) || currentExp?.stages[0];

  return (
    <div className="space-y-[24px]">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#292929] pb-[16px]">
        <div>
          <div className="font-mono text-[9px] tracking-[1.15px] text-[#8c8c8c]">
            EXPERIMENTS LEDGER <span className="text-white px-[4px]">/</span> EVIDENCE REPLAY & REPRODUCIBILITY
          </div>
          <h1 className="text-[24px] font-bold text-white mt-[6px] mb-0 tracking-tight">
            Mutation Experiments
          </h1>
        </div>

        <div className="flex items-center gap-[10px]">
          {experiments.length > 1 && (
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`font-mono text-[10px] px-[12px] py-[8px] border transition-colors cursor-pointer ${
                compareMode
                  ? 'bg-white text-black border-white font-bold'
                  : 'bg-[#111111] text-[#cccccc] border-[#444444] hover:text-white hover:border-white'
              }`}
            >
              {compareMode ? 'Exit Comparison' : 'Compare Experiments ⇄'}
            </button>
          )}

          <button
            onClick={onRunNewExperiment}
            className="font-mono text-[10px] font-bold px-[14px] py-[8px] bg-white text-black border border-white hover:bg-black hover:text-white transition-colors cursor-pointer flex items-center gap-[6px]"
          >
            <span>▶</span> Run New Experiment
          </button>
        </div>
      </div>

      {/* Comparison Drawer / Matrix */}
      {compareMode && compareExp && currentExp && (
        <section className="bg-[#0e0e0e] border border-[#444444] p-[20px] font-mono text-[11px]">
          <div className="flex items-center justify-between pb-[12px] border-b border-[#292929] mb-[16px]">
            <div className="font-bold text-white text-[13px]">
              EXPERIMENT COMPARISON: {currentExp.id} vs {compareExp.id}
            </div>
            <div className="flex items-center gap-[8px]">
              <span className="text-[#888888] text-[9px]">Compare with:</span>
              <select
                value={compareTargetId}
                onChange={(e) => setCompareTargetId(e.target.value)}
                className="bg-[#181818] border border-[#555555] text-white p-[4px_8px] text-[10px]"
              >
                {experiments
                  .filter((e) => e.id !== currentExp.id)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.id} ({new Date(e.timestamp).toLocaleTimeString()})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-[12px] text-center">
            {/* MTIR Delta */}
            <div className="bg-[#141414] border border-[#292929] p-[12px]">
              <div className="text-[9px] text-[#888888] mb-[6px]">MUTATION-TESTED RECALL (MTIR)</div>
              <div className="text-[20px] font-bold text-white">
                {currentExp.report.mutation_tested_recall !== null
                  ? `${Math.round(currentExp.report.mutation_tested_recall * 100)}%`
                  : '—'}
                <span className="text-[#888888] text-[12px] mx-[6px]">vs</span>
                <span className="text-[#aaaaaa]">
                  {compareExp.report.mutation_tested_recall !== null
                    ? `${Math.round(compareExp.report.mutation_tested_recall * 100)}%`
                    : '—'}
                </span>
              </div>
            </div>

            {/* Mutants Killed */}
            <div className="bg-[#141414] border border-[#292929] p-[12px]">
              <div className="text-[9px] text-[#888888] mb-[6px]">KILLED MUTANTS</div>
              <div className="text-[20px] font-bold text-white">
                {currentExp.report.valid_mutants} / {currentExp.report.total_mutants}
                <span className="text-[#888888] text-[12px] mx-[6px]">vs</span>
                <span className="text-[#aaaaaa]">
                  {compareExp.report.valid_mutants} / {compareExp.report.total_mutants}
                </span>
              </div>
            </div>

            {/* Predicted Tests */}
            <div className="bg-[#141414] border border-[#292929] p-[12px]">
              <div className="text-[9px] text-[#888888] mb-[6px]">PREDICTED TESTS</div>
              <div className="text-[20px] font-bold text-white">
                {currentExp.report.predicted_tests.length}
                <span className="text-[#888888] text-[12px] mx-[6px]">vs</span>
                <span className="text-[#aaaaaa]">
                  {compareExp.report.predicted_tests.length}
                </span>
              </div>
            </div>

            {/* Missed Tests */}
            <div className="bg-[#141414] border border-[#292929] p-[12px]">
              <div className="text-[9px] text-[#888888] mb-[6px]">MISSED TESTS (BLIND SPOTS)</div>
              <div className="text-[20px] font-bold text-white">
                {currentExp.report.missed_tests.length}
                <span className="text-[#888888] text-[12px] mx-[6px]">vs</span>
                <span className="text-[#aaaaaa]">
                  {compareExp.report.missed_tests.length}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Grid: Experiment History List & Active Evidence Replay */}
      <div className="grid grid-cols-[320px_1fr] gap-[20px] max-[1050px]:grid-cols-1">
        {/* Left: Experiment History List */}
        <section className="bg-[#0b0b0b] border border-[#292929] p-[16px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-[10px] border-b border-[#242424] mb-[12px]">
              <span className="font-mono text-[9px] tracking-wider text-[#888888]">
                STORED EXPERIMENT RUNS ({experiments.length})
              </span>
              <span className="font-mono text-[8px] text-[#555555]">PERSISTED</span>
            </div>

            <div className="space-y-[8px] max-h-[600px] overflow-y-auto">
              {experiments.map((exp) => {
                const isSelected = exp.id === currentExp?.id;
                const recallPct =
                  exp.report.mutation_tested_recall !== null
                    ? `${Math.round(exp.report.mutation_tested_recall * 100)}%`
                    : '—';

                return (
                  <div
                    key={exp.id}
                    onClick={() => onSelectExperiment(exp)}
                    className={`p-[12px] border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#181818] border-white text-white shadow-md'
                        : 'bg-[#0e0e0e] border-[#292929] text-[#cccccc] hover:border-[#555555]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="font-bold flex items-center gap-[6px]">
                        <span className={`w-[6px] h-[6px] rounded-full ${isSelected ? 'bg-white' : 'bg-[#666666]'}`} />
                        {exp.id}
                      </span>
                      <span className="text-[9px] bg-[#222222] px-[6px] py-[2px] text-white">
                        MTIR: {recallPct}
                      </span>
                    </div>

                    <div className="text-[9px] text-[#777777] font-mono mt-[6px]">
                      {exp.changedFiles[0] || 'sample_repo'} · {exp.durationSeconds}s
                    </div>

                    <div className="flex items-center justify-between text-[8px] font-mono text-[#555555] mt-[6px] pt-[6px] border-t border-[#1c1c1c]">
                      <span>{new Date(exp.timestamp).toLocaleTimeString()}</span>
                      <span>{exp.report.mutations.length} mutants</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {currentExp && (
            <div className="pt-[14px] border-t border-[#292929] mt-[16px]">
              <button
                onClick={() => onReplayExperiment(currentExp)}
                className="w-full font-mono text-[10px] py-[8px] border border-[#555555] bg-[#141414] text-white hover:bg-white hover:text-black transition-colors cursor-pointer flex items-center justify-center gap-[6px]"
              >
                <span>↺</span> Replay {currentExp.id}
              </button>
            </div>
          )}
        </section>

        {/* Right: Interactive Evidence Replay Pipeline */}
        {currentExp ? (
          <section className="bg-[#0b0b0b] border border-[#292929] p-[20px] flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-[14px] border-b border-[#292929] mb-[20px]">
                <div>
                  <div className="font-mono text-[9px] tracking-wider text-[#888888]">
                    AUDITABLE EXECUTION PIPELINE
                  </div>
                  <h2 className="text-[18px] font-bold text-white mt-[4px] mb-0">
                    Evidence Replay: {currentExp.id}
                  </h2>
                </div>

                <div className="font-mono text-[9px] text-[#aaaaaa] border border-[#333333] px-[10px] py-[6px]">
                  REVISION: {currentExp.revision}
                </div>
              </div>

              {/* 7-Stage Interactive Pipeline Flow */}
              <div className="mb-[24px]">
                <div className="font-mono text-[9px] text-[#777777] mb-[10px] tracking-wider">
                  CLICK A STAGE TO INSPECT DETERMINISTIC AUDIT EVIDENCE:
                </div>

                <div className="grid grid-cols-7 gap-[6px] max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
                  {currentExp.stages.map((stage, idx) => {
                    const isStageActive = stage.id === selectedStageId;
                    const isWarning = stage.status === 'warning';

                    return (
                      <button
                        key={stage.id}
                        onClick={() => setSelectedStageId(stage.id)}
                        className={`p-[10px_8px] text-left border rounded-none cursor-pointer transition-all flex flex-col justify-between min-h-[72px] ${
                          isStageActive
                            ? 'bg-white text-black border-white font-bold'
                            : isWarning
                            ? 'bg-[#181111] text-[#ffcccc] border-[#773333] hover:border-[#aa4444]'
                            : 'bg-[#101010] text-[#aaaaaa] border-[#292929] hover:border-[#555555]'
                        }`}
                      >
                        <div className="font-mono text-[8px] flex items-center justify-between">
                          <span>0{idx + 1}</span>
                          <span>{stage.status === 'warning' ? '⚠' : '✓'}</span>
                        </div>
                        <div className="font-mono text-[9px] font-bold leading-tight my-[4px]">
                          {stage.name}
                        </div>
                        <div className="font-mono text-[7px] truncate opacity-75">
                          {stage.summary}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Stage Inspection Body */}
              {activeStage && (
                <div className="bg-[#101010] border border-[#333333] p-[18px] font-mono text-[11px] leading-[1.6]">
                  <div className="flex items-center justify-between pb-[10px] border-b border-[#292929] mb-[14px]">
                    <div>
                      <div className="text-[9px] text-[#888888] tracking-wider">
                        STAGE AUDIT DATA
                      </div>
                      <h3 className="text-[14px] font-bold text-white mt-[2px] mb-0">
                        {activeStage.details.title}
                      </h3>
                    </div>
                    <span
                      className={`text-[8px] px-[6px] py-[3px] border ${
                        activeStage.status === 'warning'
                          ? 'bg-[#331111] text-[#ffaaaa] border-[#773333]'
                          : 'bg-[#181818] text-[#cccccc] border-[#555555]'
                      }`}
                    >
                      STATUS: {activeStage.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-[10px] text-[#bbbbbb] mb-[16px]">
                    {activeStage.details.description}
                  </p>

                  {/* Stage-specific dynamic data display */}
                  <div className="bg-[#050505] border border-[#222222] p-[14px] text-[10px] max-h-[280px] overflow-y-auto">
                    {activeStage.id === 'change' && (
                      <div>
                        <div className="text-[#888888] mb-[6px]">CHANGED TARGET FUNCTIONS:</div>
                        {activeStage.details.data.changedFunctions?.map((fn: string) => (
                          <div key={fn} className="text-white py-[2px]">
                            ● {fn}
                          </div>
                        ))}
                      </div>
                    )}

                    {activeStage.id === 'impact' && (
                      <div>
                        <div className="text-[#888888] mb-[6px]">
                          SAMPLE RESOLVED DEPENDENCY PATHS ({activeStage.details.data.pathsCount}):
                        </div>
                        {activeStage.details.data.pathsSample?.map((path: string[], idx: number) => (
                          <div key={idx} className="mb-[6px] text-[#cccccc]">
                            {path.join('  ↳  ')}
                          </div>
                        ))}
                      </div>
                    )}

                    {activeStage.id === 'tests' && (
                      <div>
                        <div className="text-[#888888] mb-[6px]">PREDICTED TEST SURFACE:</div>
                        {activeStage.details.data.predictedTests?.map((t: string) => (
                          <div key={t} className="text-white py-[2px]">
                            ✓ {t}
                          </div>
                        ))}
                      </div>
                    )}

                    {activeStage.id === 'mutations' && (
                      <div className="space-y-[4px]">
                        <div className="text-[#888888] mb-[6px]">SYNTHESIZED MUTANTS:</div>
                        {activeStage.details.data.mutations?.map((m: any) => (
                          <div key={m.id} className="flex justify-between py-[2px] border-b border-[#1a1a1a]">
                            <span className="text-white">{m.id}: {m.description}</span>
                            <span className="text-[#888888]">{m.target}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeStage.id === 'execution' && (
                      <div>
                        <div className="text-[#888888] mb-[8px]">BASELINE STATUS: {activeStage.details.data.baseline}</div>
                        <div className="space-y-[4px]">
                          {activeStage.details.data.mutantRuns?.map((run: any) => (
                            <div key={run.id} className="flex justify-between py-[2px] border-b border-[#1a1a1a]">
                              <span className="text-white">{run.id} · {run.duration}s</span>
                              <span className={run.status === 'killed' ? 'text-white font-bold' : 'text-[#888888]'}>
                                {run.status.toUpperCase()} ({run.failingCount} test failures)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeStage.id === 'evidence' && (
                      <div>
                        <div className="text-[#888888] mb-[6px]">
                          OBSERVED TEST FAILURES VS PREDICTED:
                        </div>
                        <div className="mb-[8px]">
                          Actual failure pairs: <strong className="text-white">{activeStage.details.data.actualPairs}</strong> | Predicted pairs: <strong className="text-white">{activeStage.details.data.predictedPairs}</strong>
                        </div>
                        {activeStage.details.data.missedTests?.length > 0 ? (
                          <div className="p-[8px] bg-[#221010] border border-[#662222] text-[#ffcccc] mt-[6px]">
                            <strong>UNPREDICTED BLIND SPOT: </strong>
                            {activeStage.details.data.missedTests.join(', ')}
                          </div>
                        ) : (
                          <div className="text-white">Zero blind spots observed. All failures predicted.</div>
                        )}
                      </div>
                    )}

                    {activeStage.id === 'verified' && (
                      <div>
                        <div className="text-[14px] font-bold text-white mb-[8px]">
                          MUTATION-TESTED RECALL: {activeStage.details.data.mtir !== null ? `${Math.round(activeStage.details.data.mtir * 100)}%` : '—'}
                        </div>
                        <div className="text-[#aaaaaa] leading-[1.6]">
                          {activeStage.details.data.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#292929] pt-[14px] mt-[20px] flex items-center justify-between font-mono text-[8px] text-[#777777]">
              <span>REPRODUCIBLE TEST RUNNER AUDIT TRAIL</span>
              <span>IMMUTABLE EVIDENCE LEDGER</span>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};
