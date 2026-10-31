import React, { useState } from 'react';
import { AnalysisReport } from '../types/terrarium';

interface ImpactPanelProps {
  report: AnalysisReport | null;
}

export const ImpactPanel: React.FC<ImpactPanelProps> = ({ report }) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'paths'>('tests');
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  const graphSource = report?.graph_source
    ? report.graph_source.toLowerCase().startsWith('graphify')
      ? 'GRAPHIFY GRAPH'
      : 'AST FALLBACK'
    : 'NOT RUN';

  return (
    <article className="bg-[#0b0b0b] border border-[#292929] rounded-none p-[19px] flex flex-col justify-between max-[430px]:p-[15px_13px]">
      <div>
        {/* Panel Head */}
        <div className="flex items-center justify-between mb-[18px]">
          <div>
            <div className="font-mono text-[9px] tracking-[1.15px] text-[#8c8c8c]">
              01 / IMPACT ANALYSIS
            </div>
            <h2 className="text-[16px] font-bold text-white mt-[7px] mb-0 tracking-[-0.5px]">
              Predicted test surface
            </h2>
          </div>
          <span className="font-mono text-[8px] tracking-[1.15px] text-[#cccccc] border border-[#444444] px-[8px] py-[6px] rounded-none">
            {graphSource}
          </span>
        </div>

        {/* Sub Navigation / Tabs */}
        {report && (
          <div className="flex gap-[8px] mb-[12px] border-b border-[#242424] pb-[8px]">
            <button
              onClick={() => setActiveTab('tests')}
              className={`font-mono text-[9px] px-[8px] py-[4px] rounded-none cursor-pointer transition-colors ${
                activeTab === 'tests'
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#151515] text-[#888888] hover:text-white'
              }`}
            >
              PREDICTED TESTS ({report.predicted_tests.length})
            </button>
            <button
              onClick={() => setActiveTab('paths')}
              className={`font-mono text-[9px] px-[8px] py-[4px] rounded-none cursor-pointer transition-colors ${
                activeTab === 'paths'
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#151515] text-[#888888] hover:text-white'
              }`}
            >
              CALL PATHS ({report.dependency_paths.length})
            </button>
          </div>
        )}

        {/* Content list */}
        <div className="min-h-[180px] max-h-[340px] overflow-y-auto">
          {!report ? (
            <div className="h-[180px] flex items-center justify-center flex-col text-[#777777] text-center">
              <div className="text-[22px] text-white mb-[8px]">⌁</div>
              <strong className="text-[12px] text-[#eeeeee] mb-[5px]">
                Waiting for an experiment
              </strong>
              <span className="text-[9px]">Run the analysis to see the predicted test surface.</span>
            </div>
          ) : activeTab === 'tests' ? (
            report.predicted_tests.length > 0 ? (
              report.predicted_tests.map((test, index) => {
                const pathsForThisTest = report.dependency_paths.filter((p) => p[0] === test);
                const isExpanded = expandedTest === test;

                return (
                  <div key={test} className="border-t border-[#242424]">
                    <div
                      onClick={() => setExpandedTest(isExpanded ? null : test)}
                      className="flex items-center p-[11px_0] gap-[11px] cursor-pointer hover:bg-[#111111] transition-colors"
                    >
                      <div className="w-[24px] h-[24px] grid place-items-center bg-white text-black font-mono text-[12px] shrink-0 font-bold">
                        ✓
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[10px] text-[#eeeeee] truncate">
                          {test}
                        </div>
                        <div className="text-[9px] text-[#777777] mt-[4px] flex items-center gap-[6px]">
                          <span>Dependency path identified · predicted</span>
                          {pathsForThisTest.length > 1 && (
                            <span className="text-[#aaaaaa] font-mono text-[8px] border border-[#333333] px-[4px]">
                              {pathsForThisTest.length} paths
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-[8px] text-[#aaaaaa] ml-auto shrink-0">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {isExpanded && pathsForThisTest.length > 0 && (
                      <div className="p-[8px_12px] bg-[#111111] border-l-2 border-white mb-[8px] text-[9px] font-mono text-[#bbbbbb]">
                        <div className="text-[8px] text-[#777777] mb-[4px] tracking-wider">
                          STATIC CALL GRAPH TRACE:
                        </div>
                        {pathsForThisTest.map((path, pIdx) => (
                          <div key={pIdx} className="mb-[6px] last:mb-0">
                            {path.map((step, sIdx) => (
                              <div
                                key={sIdx}
                                style={{ paddingLeft: `${sIdx * 12}px` }}
                                className="flex items-center gap-[4px] py-[1px]"
                              >
                                {sIdx > 0 && <span className="text-[#555555]">↳</span>}
                                <span className={sIdx === 0 ? 'text-white' : 'text-[#888888]'}>
                                  {step}
                                </span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="h-[180px] flex items-center justify-center flex-col text-[#777777] text-center">
                <strong className="text-[12px] text-[#eeeeee] mb-[5px]">No tests predicted</strong>
                <span className="text-[9px]">Inspect the graph and changed-file mapping.</span>
              </div>
            )
          ) : (
            /* Paths Tab */
            report.dependency_paths.map((path, idx) => (
              <div key={idx} className="p-[10px_0] border-t border-[#242424] font-mono text-[9px]">
                <div className="text-[8px] text-[#666666] mb-[2px]">PATH #{idx + 1}</div>
                {path.map((node, nodeIdx) => (
                  <div
                    key={nodeIdx}
                    style={{ paddingLeft: `${nodeIdx * 10}px` }}
                    className="flex items-center gap-[4px] text-[#cccccc] py-[1px]"
                  >
                    {nodeIdx > 0 && <span className="text-[#555555]">↳</span>}
                    <span className={nodeIdx === 0 ? 'text-white font-semibold' : 'text-[#888888]'}>
                      {node}
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Panel Foot */}
      <div className="border-t border-[#292929] pt-[13px] text-[#777777] font-mono text-[8px] flex items-center justify-between tracking-[1.15px] mt-[12px]">
        <span>STATIC DEPENDENCY EVIDENCE</span>
        <span>{report ? `${report.dependency_paths.length} paths` : '0 paths'}</span>
      </div>
    </article>
  );
};
