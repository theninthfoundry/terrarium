import React, { useState } from 'react';
import { AnalysisReport, SampleSourceFile } from '../types/terrarium';

interface InspectCodeViewProps {
  files: SampleSourceFile[];
  report: AnalysisReport | null;
  onUpdateFileContent: (path: string, newContent: string) => void;
  onRunExperiment: () => void;
}

export const InspectCodeView: React.FC<InspectCodeViewProps> = ({
  files,
  report,
  onUpdateFileContent,
  onRunExperiment,
}) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>(files[0]?.path || '');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editBuffer, setEditBuffer] = useState<string>('');

  const currentFile = files.find((f) => f.path === selectedFilePath) || files[0];

  const handleSelectFile = (path: string) => {
    setSelectedFilePath(path);
    setIsEditing(false);
    setSelectedSymbol(null);
  };

  const handleStartEdit = () => {
    setEditBuffer(currentFile.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onUpdateFileContent(currentFile.path, editBuffer);
    setIsEditing(false);
  };

  // Find related paths and tests for selected symbol
  const relatedPaths = report?.dependency_paths.filter((p) =>
    selectedSymbol ? p.some((step) => step.includes(selectedSymbol)) : false
  ) || [];

  const relatedTests = report?.predicted_tests.filter((t) =>
    selectedSymbol
      ? report.dependency_paths.some(
          (p) => p[0] === t && p.some((step) => step.includes(selectedSymbol))
        )
      : false
  ) || [];

  const mutationsInCurrentFile = report?.mutations.filter((m) => m.file === currentFile.path) || [];

  return (
    <div className="space-y-[20px]">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#292929] pb-[16px]">
        <div>
          <div className="font-mono text-[9px] tracking-[1.15px] text-[#8c8c8c]">
            CODE INTELLIGENCE <span className="text-white px-[4px]">/</span> SYMBOLS, DEPENDENCIES & MUTATIONS
          </div>
          <h1 className="text-[24px] font-bold text-white mt-[6px] mb-0 tracking-tight">
            Inspect Code & Call Paths
          </h1>
        </div>

        <div className="flex items-center gap-[10px] font-mono text-[9px]">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-[12px] py-[8px] border border-[#555] bg-transparent text-[#ccc] hover:bg-[#222] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-[14px] py-[8px] bg-white text-black font-bold border border-white hover:bg-black hover:text-white cursor-pointer"
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleStartEdit}
                className="px-[12px] py-[8px] border border-[#555] bg-transparent text-[#ccc] hover:text-white hover:border-white transition-colors cursor-pointer"
              >
                ✎ Edit Source
              </button>
              <button
                onClick={onRunExperiment}
                className="px-[14px] py-[8px] bg-white text-black font-bold border border-white hover:bg-black hover:text-white transition-colors cursor-pointer"
              >
                ▶ Re-analyze Repository
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3-Column Layout: File Tree + Source Viewer + Symbol/Impact Graph */}
      <div className="grid grid-cols-[240px_1fr_320px] gap-[16px] max-[1150px]:grid-cols-[220px_1fr] max-[850px]:grid-cols-1">
        {/* Column 1: Files & Symbol Navigator */}
        <section className="bg-[#0b0b0b] border border-[#292929] p-[16px] flex flex-col justify-between">
          <div>
            <div className="font-mono text-[9px] tracking-wider text-[#888888] pb-[8px] border-b border-[#222] mb-[12px]">
              REPOSITORY FILES
            </div>

            <div className="space-y-[4px] mb-[20px]">
              {files.map((f) => {
                const isSelected = f.path === currentFile.path;
                const isChanged = report?.changed_files.includes(f.path);

                return (
                  <button
                    key={f.path}
                    onClick={() => handleSelectFile(f.path)}
                    className={`w-full text-left p-[8px_10px] font-mono text-[10px] flex items-center justify-between border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#181818] text-white border-white font-bold'
                        : 'bg-[#0e0e0e] text-[#888888] border-[#242424] hover:text-[#cccccc] hover:border-[#444444]'
                    }`}
                  >
                    <span className="truncate flex items-center gap-[6px]">
                      <span>{f.isTestFile ? '◈' : '●'}</span>
                      <span className="truncate">{f.title}</span>
                    </span>
                    {isChanged && (
                      <span className="text-[7px] bg-[#333] text-white px-[4px] py-[1px] shrink-0">
                        CHANGED
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Function Symbols in Selected File */}
            <div className="font-mono text-[9px] tracking-wider text-[#888888] pb-[8px] border-b border-[#222] mb-[10px]">
              DEFINED SYMBOLS ({currentFile.functions.length})
            </div>

            <div className="space-y-[3px]">
              {currentFile.functions.map((fnName) => {
                const isSelected = selectedSymbol === fnName;
                return (
                  <button
                    key={fnName}
                    onClick={() => setSelectedSymbol(isSelected ? null : fnName)}
                    className={`w-full text-left p-[6px_8px] font-mono text-[9px] border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-[#101010] text-[#aaaaaa] border-[#222222] hover:text-white hover:border-[#555]'
                    }`}
                  >
                    def {fnName}()
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-[14px] border-t border-[#222] mt-[16px] text-[8px] font-mono text-[#666]">
            Interactive AST Symbol Index
          </div>
        </section>

        {/* Column 2: Source Code Viewer with Line Highlighting & Mutation Markers */}
        <section className="bg-[#0b0b0b] border border-[#292929] p-[16px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-[10px] border-b border-[#242424] mb-[12px] font-mono text-[10px]">
              <span className="text-white font-bold flex items-center gap-[8px]">
                <span>{currentFile.path}</span>
                <span className="text-[#888888] text-[9px] font-normal">
                  ({currentFile.content.split('\n').length} lines)
                </span>
              </span>
              <span className="text-[#888888] text-[9px]">
                {mutationsInCurrentFile.length} mutation sites
              </span>
            </div>

            {/* In-browser Editor or Viewer */}
            {isEditing ? (
              <textarea
                value={editBuffer}
                onChange={(e) => setEditBuffer(e.target.value)}
                className="w-full h-[480px] bg-[#050505] text-[#eeeeee] p-[12px] border border-[#444444] rounded-none font-mono text-[11px] focus:outline-none focus:border-white resize-none"
                spellCheck={false}
              />
            ) : (
              <div className="bg-[#050505] border border-[#1f1f1f] p-[12px] font-mono text-[11px] leading-[1.6] max-h-[500px] overflow-y-auto">
                {currentFile.content.split('\n').map((line, idx) => {
                  const lineNum = idx + 1;
                  const isSymbolLine = selectedSymbol ? line.includes(`def ${selectedSymbol}`) : false;
                  const mutationOnThisLine = mutationsInCurrentFile.find((m) => m.line === lineNum);
                  const isReflection = line.includes('getattr(');

                  return (
                    <div
                      key={idx}
                      className={`flex items-start py-[1px] ${
                        isSymbolLine
                          ? 'bg-[#222222] text-white font-bold'
                          : isReflection
                          ? 'bg-[#332211] text-[#fff]'
                          : mutationOnThisLine
                          ? 'bg-[#181818]'
                          : ''
                      }`}
                    >
                      <span className="w-[38px] select-none text-[#555555] text-right pr-[10px] shrink-0 text-[10px]">
                        {lineNum}
                      </span>
                      <span className="flex-1 whitespace-pre">{line}</span>
                      {mutationOnThisLine && (
                        <span className="text-[7px] font-mono bg-[#333] text-white px-[4px] py-[1px] ml-[8px] shrink-0">
                          {mutationOnThisLine.mutation_id}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-[12px] border-t border-[#222] mt-[12px] flex items-center justify-between text-[8px] font-mono text-[#666]">
            <span>SYNTAX: PYTHON 3.10 AST</span>
            <span>CLICK DEFINED SYMBOLS TO TRACE CALL GRAPHS</span>
          </div>
        </section>

        {/* Column 3: Symbol Dependency & Test Surface Graph */}
        <section className="bg-[#0b0b0b] border border-[#292929] p-[16px] flex flex-col justify-between max-[1150px]:col-span-2 max-[850px]:col-span-1">
          <div>
            <div className="font-mono text-[9px] tracking-wider text-[#888888] pb-[8px] border-b border-[#222] mb-[12px]">
              DEPENDENCY & TEST TRACE
            </div>

            {selectedSymbol ? (
              <div className="space-y-[14px] font-mono text-[10px]">
                <div>
                  <div className="text-[#888888] text-[8px] mb-[4px]">SELECTED SYMBOL:</div>
                  <div className="text-white font-bold text-[12px]">def {selectedSymbol}()</div>
                </div>

                {/* Related Tests */}
                <div>
                  <div className="text-[#888888] text-[8px] mb-[6px]">
                    ASSOCIATED TESTS ({relatedTests.length}):
                  </div>
                  {relatedTests.length > 0 ? (
                    <div className="space-y-[3px]">
                      {relatedTests.map((t) => (
                        <div key={t} className="p-[4px_6px] bg-[#141414] text-[#cccccc] text-[9px] truncate">
                          ✓ {t}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[#666666] text-[9px]">
                      No direct static dependency edge found reaching this symbol.
                    </div>
                  )}
                </div>

                {/* Active Call Paths */}
                <div>
                  <div className="text-[#888888] text-[8px] mb-[6px]">
                    RESOLVED CALL PATHS ({relatedPaths.length}):
                  </div>
                  {relatedPaths.length > 0 ? (
                    <div className="space-y-[6px] max-h-[220px] overflow-y-auto">
                      {relatedPaths.map((p, idx) => (
                        <div key={idx} className="p-[6px] bg-[#0e0e0e] border border-[#222] text-[8px]">
                          {p.map((step, sIdx) => (
                            <div key={sIdx} className={step.includes(selectedSymbol) ? 'text-white font-bold' : 'text-[#777]'}>
                              {sIdx > 0 ? '↳ ' : ''}{step}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[#666666] text-[9px]">
                      No call paths mapped through this symbol.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-[#777777] font-mono text-[10px] text-center py-[40px]">
                <div className="text-[18px] text-white mb-[8px]">⌥</div>
                <strong className="text-white block mb-[4px]">No symbol selected</strong>
                <span>Click a function symbol in the left panel to trace its callers, dependencies, and test predictions.</span>
              </div>
            )}
          </div>

          <div className="pt-[14px] border-t border-[#222] mt-[16px] text-[8px] font-mono text-[#666]">
            {report?.graph_source}
          </div>
        </section>
      </div>
    </div>
  );
};
