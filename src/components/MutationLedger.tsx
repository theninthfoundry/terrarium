import React, { useState } from 'react';
import { AnalysisReport, MutationResult } from '../types/terrarium';

interface MutationLedgerProps {
  report: AnalysisReport | null;
}

export const MutationLedger: React.FC<MutationLedgerProps> = ({ report }) => {
  const [selectedMutation, setSelectedMutation] = useState<MutationResult | null>(null);

  const experimentCount = report ? `${report.mutations.length} RUNS` : '0 RUNS';

  return (
    <article
      id="experimentsPanel"
      className="bg-[#0b0b0b] border border-[#292929] rounded-none p-[19px] flex flex-col justify-between max-[430px]:p-[15px_13px]"
    >
      <div>
        {/* Panel Head */}
        <div className="flex items-center justify-between mb-[18px]">
          <div>
            <div className="font-mono text-[9px] tracking-[1.15px] text-[#8c8c8c]">
              02 / CONTROLLED EXPERIMENTS
            </div>
            <h2 className="text-[16px] font-bold text-white mt-[7px] mb-0 tracking-[-0.5px]">
              Mutation ledger
            </h2>
          </div>
          <span className="font-mono text-[8px] tracking-[1.15px] text-[#cccccc] border border-[#444444] px-[8px] py-[6px] rounded-none">
            {experimentCount}
          </span>
        </div>

        {/* Mutation List */}
        <div className="min-h-[180px] max-h-[340px] overflow-y-auto">
          {!report || report.mutations.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center flex-col text-[#777777] text-center">
              <div className="text-[22px] text-white mb-[8px]">⌗</div>
              <strong className="text-[12px] text-[#eeeeee] mb-[5px]">
                No mutations generated
              </strong>
              <span className="text-[9px]">
                Baseline must pass and mutation candidates must be available.
              </span>
            </div>
          ) : (
            report.mutations.map((mut) => {
              const isSelected = selectedMutation?.mutation_id === mut.mutation_id;
              const functionSimpleName = mut.function.split('::').pop() || mut.function;
              const hasBlindSpotInThisMutant = mut.failing_tests.some(
                (t) => !mut.predicted_tests.includes(t)
              );

              return (
                <div key={mut.mutation_id} className="border-t border-[#242424]">
                  <div
                    onClick={() => setSelectedMutation(isSelected ? null : mut)}
                    className="flex items-center p-[11px_0] gap-[11px] cursor-pointer hover:bg-[#111111] transition-colors"
                  >
                    <span className="font-mono text-[9px] text-[#888888] w-[30px] shrink-0">
                      {mut.mutation_id}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[10px] text-[#eeeeee] flex items-center gap-[6px]">
                        <span>{functionSimpleName}</span>
                        {hasBlindSpotInThisMutant && (
                          <span className="text-[8px] font-mono bg-[#2a1212] text-[#ffaaaa] border border-[#552222] px-[4px] py-[1px]">
                            BLIND SPOT TRIGGERED
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-[#777777] mt-[4px]">
                        {mut.description} <span className="text-[#555555]">·</span> {mut.duration_seconds}s
                      </div>
                    </div>
                    <span
                      className={`font-mono text-[8px] px-[7px] py-[4px] rounded-none shrink-0 border ${
                        mut.status === 'killed'
                          ? 'bg-white text-black border-white font-bold'
                          : mut.status === 'survived'
                          ? 'bg-[#222222] text-white border-[#777777]'
                          : 'bg-[#111111] text-[#bbbbbb] border-[#555555]'
                      }`}
                    >
                      {mut.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Expanded Mutant Details */}
                  {isSelected && (
                    <div className="p-[10px_12px] bg-[#121212] border-l-2 border-white mb-[8px] text-[9px] font-mono">
                      <div className="text-[8px] text-[#888888] mb-[6px] tracking-wider">
                        MUTANT EXECUTION LEDGER ({mut.mutation_id})
                      </div>

                      <div className="mb-[6px]">
                        <span className="text-[#666666]">TARGET: </span>
                        <span className="text-white">{mut.function}</span>
                      </div>

                      <div className="mb-[8px]">
                        <span className="text-[#666666]">OPERATOR: </span>
                        <span className="text-[#cccccc]">{mut.description}</span>
                      </div>

                      <div className="mb-[6px] text-[#888888]">
                        FAILING TESTS ({mut.failing_tests.length}):
                      </div>
                      <div className="space-y-[3px] mb-[8px]">
                        {mut.failing_tests.map((ft) => {
                          const isPredicted = mut.predicted_tests.includes(ft);
                          return (
                            <div
                              key={ft}
                              className={`p-[3px_6px] flex items-center justify-between ${
                                isPredicted
                                  ? 'bg-[#181818] text-[#cccccc]'
                                  : 'bg-[#221010] text-[#ffdddd] border border-[#662222]'
                              }`}
                            >
                              <span className="truncate">{ft}</span>
                              <span
                                className={`text-[8px] px-[4px] ml-[8px] shrink-0 ${
                                  isPredicted
                                    ? 'text-[#888888]'
                                    : 'text-white bg-[#880000] font-bold'
                                }`}
                              >
                                {isPredicted ? 'PREDICTED' : 'BLIND SPOT!'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-[#666666] text-[8px] pt-[4px] border-t border-[#292929]">
                        Isolated process sandbox · duration {mut.duration_seconds}s
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Panel Foot */}
      <div className="border-t border-[#292929] pt-[13px] text-[#777777] font-mono text-[8px] flex items-center justify-between tracking-[1.15px] mt-[12px]">
        <span>ISOLATED TEMPORARY COPIES</span>
        <span>ORIGINAL REPO UNTOUCHED</span>
      </div>
    </article>
  );
};
