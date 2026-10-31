import React, { useState } from 'react';
import { SampleSourceFile } from '../types/terrarium';

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: SampleSourceFile[];
  onUpdateFileContent: (path: string, newContent: string) => void;
  onTriggerAnalysis: () => void;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({
  isOpen,
  onClose,
  files,
  onUpdateFileContent,
  onTriggerAnalysis,
}) => {
  const [selectedPath, setSelectedPath] = useState<string>(files[0]?.path || '');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editBuffer, setEditBuffer] = useState<string>('');

  if (!isOpen) return null;

  const currentFile = files.find((f) => f.path === selectedPath) || files[0];

  const handleSelectFile = (path: string) => {
    setSelectedPath(path);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditBuffer(currentFile.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onUpdateFileContent(currentFile.path, editBuffer);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#0b0b0b] border border-[#555555] w-full max-w-[850px] max-h-[85vh] flex flex-col rounded-none shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-[16px_20px] border-b border-[#292929]">
          <div>
            <div className="font-mono text-[9px] tracking-[1.15px] text-[#8c8c8c]">
              REPOSITORY INSPECTION <span className="text-white px-[4px]">/</span> SOURCE & TESTS
            </div>
            <h2 className="text-[16px] font-bold text-white mt-[4px] mb-0 tracking-tight">
              Sample Repository Codebase
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

        {/* File Tabs */}
        <div className="flex border-b border-[#292929] bg-[#050505] overflow-x-auto">
          {files.map((file) => (
            <button
              key={file.path}
              onClick={() => handleSelectFile(file.path)}
              className={`font-mono text-[10px] px-[16px] py-[10px] border-r border-[#292929] cursor-pointer transition-colors flex items-center gap-[6px] whitespace-nowrap ${
                file.path === currentFile.path
                  ? 'bg-[#111111] text-white font-bold border-b-2 border-b-white'
                  : 'text-[#888888] hover:text-[#cccccc] hover:bg-[#0a0a0a]'
              }`}
            >
              <span>{file.isTestFile ? '◈' : '●'}</span>
              <span>{file.path}</span>
            </button>
          ))}
        </div>

        {/* Explanation banner if reflection test is active */}
        {currentFile.path === 'tests/test_reflection.py' && (
          <div className="p-[10px_16px] bg-[#1a1510] border-b border-[#443320] text-[#f0d0a0] text-[10px] font-mono flex items-center gap-[8px]">
            <span className="text-[14px]">⚡</span>
            <span>
              <strong>BLIND SPOT GROUNDING:</strong> This test uses <code className="bg-[#2a2015] px-1 py-0.5 text-white">getattr(pricing, "apply_discount")</code>. Static AST analyzers cannot resolve this dynamic token without runtime dispatch traces.
            </span>
          </div>
        )}

        {/* Editor / Viewer Body */}
        <div className="flex-1 p-[16px_20px] overflow-y-auto font-mono text-[11px] leading-[1.6]">
          {isEditing ? (
            <textarea
              value={editBuffer}
              onChange={(e) => setEditBuffer(e.target.value)}
              className="w-full h-[320px] bg-[#050505] text-[#eeeeee] p-[12px] border border-[#444444] rounded-none font-mono text-[11px] focus:outline-none focus:border-white resize-none"
              spellCheck={false}
            />
          ) : (
            <pre className="m-0 text-[#e0e0e0] font-mono whitespace-pre-wrap select-text">
              {currentFile.content.split('\n').map((line, idx) => {
                const isReflectionLine = line.includes('getattr(pricing');
                return (
                  <div
                    key={idx}
                    className={`flex items-start py-[1px] ${
                      isReflectionLine ? 'bg-[#332211] text-[#fff]' : ''
                    }`}
                  >
                    <span className="w-[36px] select-none text-[#555555] text-right pr-[12px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{line}</span>
                  </div>
                );
              })}
            </pre>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-[12px_20px] border-t border-[#292929] bg-[#080808] flex items-center justify-between">
          <div className="text-[9px] font-mono text-[#777777]">
            {currentFile.path} · {currentFile.language} · {currentFile.functions.length} functions
          </div>
          <div className="flex gap-[8px]">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="font-mono text-[9px] px-[12px] py-[6px] border border-[#555555] bg-transparent text-[#cccccc] hover:bg-[#222222] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="font-mono text-[9px] font-bold px-[12px] py-[6px] border border-white bg-white text-black hover:bg-black hover:text-white cursor-pointer"
                >
                  Save Code
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleStartEdit}
                  className="font-mono text-[9px] px-[12px] py-[6px] border border-[#555555] bg-transparent text-[#cccccc] hover:bg-white hover:text-black cursor-pointer transition-colors"
                >
                  Edit in-place
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onTriggerAnalysis();
                  }}
                  className="font-mono text-[9px] font-bold px-[12px] py-[6px] border border-white bg-white text-black hover:bg-black hover:text-white cursor-pointer transition-colors"
                >
                  Run Experiment with this Code
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
