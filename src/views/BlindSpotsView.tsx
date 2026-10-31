import React, { useState } from 'react';
import { BlindSpotItem } from '../types/terrarium';

interface BlindSpotsViewProps {
  blindSpots: BlindSpotItem[];
  onApplyFix: (item: BlindSpotItem) => void;
  onInspectCode: (location: string) => void;
}

export const BlindSpotsView: React.FC<BlindSpotsViewProps> = ({
  blindSpots,
  onApplyFix,
  onInspectCode,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(blindSpots[0]?.id || null);

  const filteredItems = filterType === 'all'
    ? blindSpots
    : blindSpots.filter((b) => b.type === filterType);

  return (
    <div className="space-y-[24px]">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#292929] pb-[16px]">
        <div>
          <div className="font-mono text-[9px] tracking-[1.15px] text-[#8c8c8c]">
            PREDICTION VULNERABILITY AUDIT <span className="text-white px-[4px]">/</span> EVIDENCE-BACKED BLIND SPOTS
          </div>
          <h1 className="text-[24px] font-bold text-white mt-[6px] mb-0 tracking-tight">
            Blind Spots Observatory
          </h1>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-[6px] font-mono text-[9px]">
          <button
            onClick={() => setFilterType('all')}
            className={`px-[10px] py-[6px] border cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-black border-white font-bold'
                : 'bg-[#111] text-[#888] border-[#333] hover:text-white'
            }`}
          >
            ALL ({blindSpots.length})
          </button>
          <button
            onClick={() => setFilterType('dynamic_dispatch')}
            className={`px-[10px] py-[6px] border cursor-pointer ${
              filterType === 'dynamic_dispatch'
                ? 'bg-white text-black border-white font-bold'
                : 'bg-[#111] text-[#888] border-[#333] hover:text-white'
            }`}
          >
            DYNAMIC DISPATCH
          </button>
          <button
            onClick={() => setFilterType('surviving_mutation')}
            className={`px-[10px] py-[6px] border cursor-pointer ${
              filterType === 'surviving_mutation'
                ? 'bg-white text-black border-white font-bold'
                : 'bg-[#111] text-[#888] border-[#333] hover:text-white'
            }`}
          >
            SURVIVING MUTATIONS
          </button>
        </div>
      </div>

      {/* Explanatory Banner */}
      <section className="bg-[#0b0b0b] border border-[#292929] p-[18px] flex items-start gap-[16px]">
        <div className="w-[36px] h-[36px] border border-[#777777] bg-white text-black font-bold text-[18px] grid place-items-center shrink-0">
          ◎
        </div>
        <div className="text-[11px] font-mono">
          <div className="font-bold text-white mb-[4px]">
            EVIDENCE-SENSITIVE ASSESSMENT · NO FAKE METRICS
          </div>
          <p className="text-[#aaaaaa] m-0 leading-[1.6]">
            Every blind spot shown below was detected by an actual mutation experiment.
            When a controlled mutant causes a test failure that was absent from static graph impact predictions,
            an evidence record is generated explaining the exact mechanism (e.g. reflection, runtime attribute lookups, or uninstrumented callbacks).
          </p>
        </div>
      </section>

      {/* Blind Spots List */}
      <section className="space-y-[12px]">
        {filteredItems.length === 0 ? (
          <div className="bg-[#0b0b0b] border border-[#292929] p-[40px] text-center font-mono text-[11px] text-[#777777]">
            <div className="text-[24px] text-white mb-[8px]">✓</div>
            <strong className="text-white text-[13px] block mb-[4px]">
              No blind spots detected in this category
            </strong>
            <span>All observed mutation test failures were predicted by the dependency graph.</span>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;

            return (
              <article
                key={item.id}
                className="bg-[#0b0b0b] border border-[#292929] rounded-none overflow-hidden transition-all"
              >
                {/* Item Summary Bar */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-[16px_20px] flex items-center justify-between cursor-pointer hover:bg-[#111111] transition-colors"
                >
                  <div className="flex items-center gap-[12px] min-w-0">
                    <span
                      className={`w-[8px] h-[8px] rounded-full shrink-0 ${
                        item.severity === 'high' ? 'bg-[#ff4444]' : 'bg-[#ffaa00]'
                      }`}
                    />
                    <div>
                      <div className="font-bold text-white text-[13px] flex items-center gap-[8px]">
                        <span>{item.title}</span>
                        <span className="font-mono text-[8px] border border-[#555] px-[6px] py-[1px] text-[#ccc]">
                          {item.detectedInExperimentId}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-[#888888] mt-[3px]">
                        {item.location}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-[12px] font-mono text-[9px]">
                    <span
                      className={`px-[8px] py-[3px] border ${
                        item.severity === 'high'
                          ? 'border-[#882222] bg-[#220a0a] text-[#ffaaaa]'
                          : 'border-[#775522] bg-[#22180a] text-[#ffddaa]'
                      }`}
                    >
                      {item.severity.toUpperCase()} RISK
                    </span>
                    <span className="text-white text-[14px]">
                      {isExpanded ? '▴' : '▾'}
                    </span>
                  </div>
                </div>

                {/* Expanded 6-Dimension Audit Details */}
                {isExpanded && (
                  <div className="border-t border-[#222222] bg-[#080808] p-[20px] font-mono text-[11px] space-y-[16px]">
                    <div className="grid grid-cols-2 gap-[16px] max-[760px]:grid-cols-1">
                      {/* 1. What was missed */}
                      <div className="bg-[#0f0f0f] border border-[#222222] p-[14px]">
                        <div className="text-[9px] text-[#777777] mb-[4px]">1. WHAT WAS MISSED:</div>
                        <div className="text-white leading-[1.6]">{item.whatWasMissed}</div>
                      </div>

                      {/* 2. Where it occurred */}
                      <div className="bg-[#0f0f0f] border border-[#222222] p-[14px]">
                        <div className="text-[9px] text-[#777777] mb-[4px]">2. WHERE IT OCCURRED:</div>
                        <div className="text-white leading-[1.6]">{item.location}</div>
                      </div>

                      {/* 3. Why it matters */}
                      <div className="bg-[#0f0f0f] border border-[#222222] p-[14px]">
                        <div className="text-[9px] text-[#777777] mb-[4px]">3. WHY IT MATTERS:</div>
                        <div className="text-white leading-[1.6]">{item.whyItMatters}</div>
                      </div>

                      {/* 4. Empirical evidence */}
                      <div className="bg-[#0f0f0f] border border-[#222222] p-[14px]">
                        <div className="text-[9px] text-[#777777] mb-[4px]">4. SUPPORTING EVIDENCE:</div>
                        <div className="text-[#dddddd] leading-[1.6]">{item.evidence}</div>
                      </div>
                    </div>

                    {/* 5. Remediation & Suggested Fix */}
                    <div className="bg-[#121212] border border-[#333333] p-[16px]">
                      <div className="text-[9px] text-[#888888] mb-[6px]">5. WHAT TO INVESTIGATE & REMEDIATE:</div>
                      <div className="text-white leading-[1.6] mb-[12px]">{item.remediation}</div>

                      {item.suggestedTestCode && (
                        <div className="bg-[#050505] border border-[#222222] p-[10px] text-[#a0ffa0] text-[10px] font-mono mb-[14px] whitespace-pre-wrap">
                          {item.suggestedTestCode}
                        </div>
                      )}

                      <div className="flex gap-[10px] pt-[8px] border-t border-[#222222]">
                        <button
                          onClick={() => onApplyFix(item)}
                          className="font-mono text-[9px] font-bold px-[12px] py-[6px] bg-white text-black border border-white hover:bg-black hover:text-white cursor-pointer transition-colors"
                        >
                          ⚡ Apply Remediation to Code & Re-Test Live
                        </button>
                        <button
                          onClick={() => onInspectCode(item.location)}
                          className="font-mono text-[9px] px-[12px] py-[6px] border border-[#555] bg-transparent text-[#ccc] hover:bg-[#222] cursor-pointer"
                        >
                          View File in Code Inspector ↗
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};
