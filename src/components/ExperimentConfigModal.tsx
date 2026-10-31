import React from 'react';
import { ExperimentParams } from '../types/terrarium';

interface ExperimentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExperimentParams;
  onChangeConfig: (newConfig: ExperimentParams) => void;
  onApplyAndRun: () => void;
}

export const ExperimentConfigModal: React.FC<ExperimentConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onApplyAndRun,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#0b0b0b] border border-[#555555] w-full max-w-[560px] flex flex-col rounded-none shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-[16px_20px] border-b border-[#292929]">
          <div>
            <div className="font-mono text-[9px] tracking-[1.15px] text-[#8c8c8c]">
              CONFIGURATION <span className="text-white px-[4px]">/</span> EXPERIMENT PARAMETERS
            </div>
            <h2 className="text-[16px] font-bold text-white mt-[4px] mb-0 tracking-tight">
              Experiment Setup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-[32px] h-[32px] border border-[#555555] bg-transparent text-white hover:bg-white hover:text-black transition-colors font-mono grid place-items-center cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-[20px] space-y-[20px] text-[11px] font-mono">
          {/* Max Mutations */}
          <div>
            <div className="flex justify-between text-[#cccccc] mb-[6px]">
              <span>MUTATION OPERATOR BUDGET:</span>
              <span className="text-white font-bold">{config.maxMutations} mutants</span>
            </div>
            <input
              type="range"
              min="1"
              max="12"
              value={config.maxMutations}
              onChange={(e) =>
                onChangeConfig({ ...config, maxMutations: parseInt(e.target.value, 10) })
              }
              className="w-full accent-white bg-[#222222] cursor-pointer"
            />
            <div className="text-[9px] text-[#777777] mt-[4px]">
              Controls how many AST operator mutations (Eq, Mult, Constants, Rounding) are synthesized.
            </div>
          </div>

          {/* Graph Source */}
          <div>
            <div className="text-[#cccccc] mb-[8px]">DEPENDENCY GRAPH RESOLVER:</div>
            <div className="grid grid-cols-2 gap-[10px]">
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, graphType: 'ast' })}
                className={`p-[10px] text-left border cursor-pointer transition-colors ${
                  config.graphType === 'ast'
                    ? 'border-white bg-[#1a1a1a] text-white'
                    : 'border-[#333333] bg-[#0c0c0c] text-[#777777] hover:border-[#666666]'
                }`}
              >
                <div className="font-bold text-[10px] text-white">Python AST Fallback</div>
                <div className="text-[8px] text-[#888888] mt-[3px]">
                  Built-in AST walker. Direct static function invocations only.
                </div>
              </button>

              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, graphType: 'graphify' })}
                className={`p-[10px] text-left border cursor-pointer transition-colors ${
                  config.graphType === 'graphify'
                    ? 'border-white bg-[#1a1a1a] text-white'
                    : 'border-[#333333] bg-[#0c0c0c] text-[#777777] hover:border-[#666666]'
                }`}
              >
                <div className="font-bold text-[10px] text-white">Graphify CPG Graph</div>
                <div className="text-[8px] text-[#888888] mt-[3px]">
                  Code-property graph with multi-file symbol and import indices.
                </div>
              </button>
            </div>
          </div>

          {/* Reflection Test Inclusion */}
          <div className="pt-[10px] border-t border-[#222222]">
            <label className="flex items-start gap-[10px] cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeReflectionTest}
                onChange={(e) =>
                  onChangeConfig({ ...config, includeReflectionTest: e.target.checked })
                }
                className="mt-[2px] accent-white"
              />
              <div>
                <div className="text-white font-bold text-[10px]">
                  Include Dynamic Reflection Test (test_reflection.py)
                </div>
                <div className="text-[#888888] text-[9px] mt-[2px]">
                  When checked, tests invoking <code className="text-[#cccccc]">getattr(pricing, "apply_discount")</code> are included in the test suite, exposing the AST blind spot and lowering recall from 100% to ~85%.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-[14px_20px] border-t border-[#292929] bg-[#080808] flex items-center justify-between">
          <button
            onClick={onClose}
            className="font-mono text-[9px] px-[12px] py-[6px] border border-[#555555] bg-transparent text-[#cccccc] hover:bg-[#222222] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
              onApplyAndRun();
            }}
            className="font-mono text-[9px] font-bold px-[14px] py-[8px] border border-white bg-white text-black hover:bg-black hover:text-white cursor-pointer transition-colors flex items-center gap-[6px]"
          >
            <span>▶</span> Apply & Run Experiment
          </button>
        </div>
      </div>
    </div>
  );
};
