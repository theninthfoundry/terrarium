import React from 'react';
import { AnalysisReport } from '../types/terrarium';

interface MetricCardsProps {
  report: AnalysisReport | null;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ report }) => {
  const recall = report?.mutation_tested_recall;
  const recallPct = recall !== null && recall !== undefined ? Math.round(recall * 100) : null;
  const killedCount = report?.valid_mutants ?? 0;
  const totalCount = report?.total_mutants ?? 0;
  const failurePairsCount =
    report?.mutations
      .filter((m) => m.status === 'killed')
      .reduce((acc, m) => acc + m.failing_tests.length, 0) ?? 0;

  return (
    <section className="grid grid-cols-4 gap-[10px] my-[12px] max-[1050px]:grid-cols-2 max-[430px]:grid-cols-2 max-[430px]:gap-[7px]">
      {/* 1. Recall */}
      <article className="bg-[#0b0b0b] border border-[#292929] rounded-none p-[17px] min-h-[137px] flex flex-col justify-between max-[430px]:min-h-[125px] max-[430px]:p-[11px]">
        <div className="flex items-center justify-between font-mono text-[8px] text-[#aaaaaa] tracking-[1.15px] max-[430px]:text-[7px]">
          <span>MUTATION-TESTED RECALL</span>
          <span
            className="border border-[#777777] rounded-full w-[14px] h-[14px] grid place-items-center text-[9px] font-serif text-[#dddddd] cursor-help"
            title="Observed failing test/mutant pairs that were predicted"
          >
            i
          </span>
        </div>

        <div>
          <div className="text-[39px] font-bold tracking-[-2px] my-[12px_4px] text-white max-[760px]:text-[32px] max-[430px]:text-[28px]">
            {recallPct !== null ? (
              <>
                {recallPct}
                <small className="font-mono text-[12px] text-[#aaaaaa] tracking-normal ml-[4px]">
                  %
                </small>
              </>
            ) : (
              '—'
            )}
          </div>
          <div className="flex items-center justify-between text-[#888888] text-[9px]">
            <span>
              {report
                ? `${killedCount} killed mutants · ${failurePairsCount} failure pairs`
                : 'Awaiting experiment'}
            </span>
            <span className="text-white text-[16px] leading-none">↗</span>
          </div>
        </div>

        <div className="h-[2px] bg-[#333333] rounded-none mt-[13px] overflow-hidden">
          <span
            className="block h-full bg-white transition-all duration-700 ease-out"
            style={{ width: recallPct !== null ? `${recallPct}%` : '0%' }}
          />
        </div>
      </article>

      {/* 2. Valid Mutants */}
      <article className="bg-[#0b0b0b] border border-[#292929] rounded-none p-[17px] min-h-[137px] flex flex-col justify-between max-[430px]:min-h-[125px] max-[430px]:p-[11px]">
        <div className="flex items-center justify-between font-mono text-[8px] text-[#aaaaaa] tracking-[1.15px] max-[430px]:text-[7px]">
          <span>VALID MUTANTS</span>
          <span className="font-mono text-[8px] text-black bg-white px-[7px] py-[4px] rounded-none font-bold">
            KILLED
          </span>
        </div>

        <div>
          <div className="text-[39px] font-bold tracking-[-2px] my-[12px_4px] text-white max-[760px]:text-[32px] max-[430px]:text-[28px]">
            {report ? (
              <>
                {killedCount}
                <small className="font-mono text-[12px] text-[#aaaaaa] tracking-normal ml-[4px]">
                  / {totalCount}
                </small>
              </>
            ) : (
              '—'
            )}
          </div>
          <div className="text-[#888888] text-[9px]">
            <span>Mutations that triggered test failures</span>
          </div>
        </div>

        <div className="h-[2px] bg-[#333333] rounded-none mt-[13px]">
          <span
            className="block h-full bg-white transition-all duration-700 ease-out"
            style={{ width: totalCount > 0 ? `${(killedCount / totalCount) * 100}%` : '0%' }}
          />
        </div>
      </article>

      {/* 3. Predicted Tests */}
      <article className="bg-[#0b0b0b] border border-[#292929] rounded-none p-[17px] min-h-[137px] flex flex-col justify-between max-[430px]:min-h-[125px] max-[430px]:p-[11px]">
        <div className="flex items-center justify-between font-mono text-[8px] text-[#aaaaaa] tracking-[1.15px] max-[430px]:text-[7px]">
          <span>PREDICTED TESTS</span>
          <span className="font-mono text-[8px] text-[#dddddd] bg-[#222222] px-[7px] py-[4px] rounded-none">
            IMPACT SET
          </span>
        </div>

        <div>
          <div className="text-[39px] font-bold tracking-[-2px] my-[12px_4px] text-white max-[760px]:text-[32px] max-[430px]:text-[28px]">
            {report ? report.predicted_tests.length : '—'}
          </div>
          <div className="text-[#888888] text-[9px]">
            <span>Tests reached by the dependency graph</span>
          </div>
        </div>

        <div className="h-[2px] bg-[#333333] rounded-none mt-[13px]">
          <span
            className="block h-full bg-white transition-all duration-700 ease-out"
            style={{ width: report?.predicted_tests.length ? '100%' : '0%' }}
          />
        </div>
      </article>

      {/* 4. Missed Tests */}
      <article className="bg-[#0b0b0b] border border-[#292929] rounded-none p-[17px] min-h-[137px] flex flex-col justify-between max-[430px]:min-h-[125px] max-[430px]:p-[11px]">
        <div className="flex items-center justify-between font-mono text-[8px] text-[#aaaaaa] tracking-[1.15px] max-[430px]:text-[7px]">
          <span>MISSED TESTS</span>
          <span className="font-mono text-[8px] text-white bg-[#333333] border border-[#777777] px-[7px] py-[4px] rounded-none">
            BLIND SPOTS
          </span>
        </div>

        <div>
          <div className="text-[39px] font-bold tracking-[-2px] my-[12px_4px] text-white max-[760px]:text-[32px] max-[430px]:text-[28px]">
            {report ? report.missed_tests.length : '—'}
          </div>
          <div className="text-[#888888] text-[9px]">
            <span>Observed failures absent from prediction</span>
          </div>
        </div>

        <div className="h-[2px] bg-[#333333] rounded-none mt-[13px]">
          <span
            className="block h-full bg-white transition-all duration-700 ease-out"
            style={{ width: report?.missed_tests.length ? '100%' : '0%' }}
          />
        </div>
      </article>
    </section>
  );
};
