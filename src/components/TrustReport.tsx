import React from 'react';
import { AnalysisReport } from '../types/terrarium';

interface TrustReportProps {
  report: AnalysisReport | null;
  onDownloadReceipt: () => void;
  onInspectReflection: () => void;
}

export const TrustReport: React.FC<TrustReportProps> = ({
  report,
  onDownloadReceipt,
  onInspectReflection,
}) => {
  const baselinePassed = report?.baseline_passed ?? false;
  const baselineStatus = report
    ? baselinePassed
      ? 'BASELINE PASSED'
      : 'BASELINE FAILED'
    : 'BASELINE PENDING';

  const explanationTitle = !report
    ? 'Trust is earned, not assumed.'
    : report.missed_tests.length > 0
    ? 'A blind spot was observed.'
    : report.mutation_tested_recall === null
    ? 'Trust score unavailable.'
    : 'Evidence collected for this change.';

  return (
    <section
      id="blindspotsPanel"
      className="bg-[#0b0b0b] border border-[#292929] rounded-none p-[19px] mt-[10px] max-[430px]:p-[15px_13px]"
    >
      {/* Panel Head */}
      <div className="flex items-center justify-between mb-[18px]">
        <div>
          <div className="font-mono text-[9px] tracking-[1.15px] text-[#8c8c8c]">
            03 / EVIDENCE & LIMITATIONS
          </div>
          <h2 className="text-[16px] font-bold text-white mt-[7px] mb-0 tracking-[-0.5px]">
            Trust report
          </h2>
        </div>
        <span
          className={`font-mono text-[8px] tracking-[1.15px] border px-[8px] py-[6px] rounded-none ${
            baselinePassed
              ? 'text-white border-[#555555] bg-[#141414]'
              : 'text-[#888888] border-[#333333] bg-[#0d0d0d]'
          }`}
        >
          {baselineStatus}
        </span>
      </div>

      {/* Evidence Body */}
      <div className="flex gap-[17px] py-[9px] pb-[15px]">
        <div className="h-[36px] w-[36px] shrink-0 grid place-items-center border border-[#888888] text-white rounded-none text-[19px]">
          ✳
        </div>
        <div className="flex-1">
          <h3 className="text-[13px] font-bold text-white mt-0 mb-[7px]">
            {explanationTitle}
          </h3>
          <p className="text-[10px] leading-[1.8] text-[#aaaaaa] m-0 max-w-[900px]">
            {report
              ? report.explanation
              : 'Run an experiment to compare the predicted test set against tests that actually fail under controlled mutations.'}
          </p>

          {/* Warnings List */}
          {report && report.warnings.length > 0 && (
            <div className="mt-[11px] grid gap-[6px]">
              {report.warnings.map((w, idx) => (
                <div key={idx} className="text-[#dddddd] text-[9px] leading-[1.5] flex items-start gap-[6px]">
                  <span className="text-[#888888]">⚠</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Missed Row */}
      {report && report.missed_tests.length > 0 && (
        <div className="border-t border-[#292929] pt-[13px] flex gap-[20px] font-mono text-[8px] text-[#aaaaaa] flex-wrap items-center">
          <span className="text-[#888888] tracking-wider shrink-0">MISSED TEST EVIDENCE:</span>
          <div className="flex flex-wrap gap-[6px] items-center flex-1">
            {report.missed_tests.map((test) => (
              <span
                key={test}
                className="inline-block border border-[#666666] bg-[#141414] px-[8px] py-[5px] rounded-none text-white text-[9px] font-mono"
              >
                {test}
              </span>
            ))}
            <button
              onClick={onInspectReflection}
              className="ml-auto font-mono text-[8px] border border-[#555555] bg-transparent text-[#cccccc] hover:bg-white hover:text-black px-[8px] py-[4px] cursor-pointer transition-colors"
            >
              Examine Reflection Reason ↗
            </button>
          </div>
        </div>
      )}

      {/* Footer & Receipt Download */}
      {report && (
        <div className="border-t border-[#292929] pt-[12px] mt-[12px] flex items-center justify-between">
          <div className="text-[8px] font-mono text-[#666666]">
            RECORD HASH: {report.repository}-exp-{report.mutations.length}m-{report.valid_mutants}k
          </div>
          <button
            onClick={onDownloadReceipt}
            className="font-mono text-[9px] font-bold border border-white bg-white text-black hover:bg-black hover:text-white px-[12px] py-[6px] rounded-none cursor-pointer transition-colors flex items-center gap-[6px]"
          >
            <span>↓</span> Download evidence receipt
          </button>
        </div>
      )}
    </section>
  );
};
