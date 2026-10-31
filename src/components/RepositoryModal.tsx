import React, { useState } from 'react';
import { RepositoryWorkspace, SampleSourceFile } from '../types/terrarium';

interface RepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositories: RepositoryWorkspace[];
  activeRepoId: string;
  onSelectRepo: (repo: RepositoryWorkspace) => void;
  onCreateRepo: (newRepo: RepositoryWorkspace) => void;
}

export const RepositoryModal: React.FC<RepositoryModalProps> = ({
  isOpen,
  onClose,
  repositories,
  activeRepoId,
  onSelectRepo,
  onCreateRepo,
}) => {
  const [mode, setMode] = useState<'select' | 'create'>('select');

  // New repo form state
  const [newRepoName, setNewRepoName] = useState<string>('');
  const [newBranch, setNewBranch] = useState<string>('main');
  const [newDescription, setNewDescription] = useState<string>('');
  const [sourceCode, setSourceCode] = useState<string>(`def calculate_rate(base: float, multiplier: float) -> float:
    if multiplier == 0.0:
        return base
    return base * multiplier
`);
  const [testCode, setTestCode] = useState<string>(`from src.core import calculate_rate

def test_zero_multiplier():
    assert calculate_rate(100.0, 0.0) == 100.0

def test_standard_multiplier():
    assert calculate_rate(50.0, 1.5) == 75.0
`);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!newRepoName.trim()) return;

    const id = newRepoName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const files: SampleSourceFile[] = [
      {
        path: 'src/core.py',
        title: 'core.py',
        language: 'python',
        isTestFile: false,
        functions: ['calculate_rate'],
        content: sourceCode,
      },
      {
        path: 'tests/test_core.py',
        title: 'test_core.py',
        language: 'python',
        isTestFile: true,
        functions: ['test_zero_multiplier', 'test_standard_multiplier'],
        content: testCode,
      },
    ];

    const newWorkspace: RepositoryWorkspace = {
      id,
      name: newRepoName.trim(),
      branch: newBranch.trim() || 'main',
      description: newDescription.trim() || 'Custom user repository workspace',
      language: 'Python 3.10',
      revision: `${newBranch} @ ${Math.random().toString(16).substring(2, 8)}`,
      defaultChangedFile: 'src/core.py',
      files,
      isCustom: true,
    };

    onCreateRepo(newWorkspace);
    setMode('select');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#0b0b0b] border border-[#555555] w-full max-w-[760px] flex flex-col rounded-none shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-[16px_20px] border-b border-[#292929]">
          <div>
            <div className="font-mono text-[9px] tracking-[1.15px] text-[#8c8c8c]">
              REPOSITORY WORKSPACE <span className="text-white px-[4px]">/</span> SOURCE SCANNER
            </div>
            <h2 className="text-[16px] font-bold text-white mt-[4px] mb-0 tracking-tight">
              {mode === 'select' ? 'Select or Switch Repository' : 'Import New Repository Workspace'}
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

        {/* Tab Controls */}
        <div className="flex border-b border-[#292929] bg-[#050505]">
          <button
            onClick={() => setMode('select')}
            className={`font-mono text-[10px] px-[16px] py-[10px] border-r border-[#292929] cursor-pointer transition-colors ${
              mode === 'select'
                ? 'bg-[#141414] text-white font-bold border-b-2 border-b-white'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            Available Repositories ({repositories.length})
          </button>
          <button
            onClick={() => setMode('create')}
            className={`font-mono text-[10px] px-[16px] py-[10px] border-r border-[#292929] cursor-pointer transition-colors ${
              mode === 'create'
                ? 'bg-[#141414] text-white font-bold border-b-2 border-b-white'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            + Create / Import Repository
          </button>
        </div>

        {/* Body */}
        <div className="p-[20px] max-h-[60vh] overflow-y-auto font-mono text-[11px]">
          {mode === 'select' ? (
            <div className="space-y-[12px]">
              {repositories.map((repo) => {
                const isSelected = repo.id === activeRepoId;
                const totalTests = repo.files
                  .filter((f) => f.isTestFile)
                  .reduce((acc, f) => acc + f.functions.length, 0);

                return (
                  <div
                    key={repo.id}
                    onClick={() => {
                      onSelectRepo(repo);
                      onClose();
                    }}
                    className={`p-[16px] border cursor-pointer transition-all flex items-start justify-between ${
                      isSelected
                        ? 'bg-[#181818] border-white text-white'
                        : 'bg-[#0e0e0e] border-[#292929] text-[#cccccc] hover:border-[#555555]'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-[16px]">
                      <div className="flex items-center gap-[8px] mb-[4px]">
                        <span className="font-bold text-[13px] text-white">
                          {repo.name}
                        </span>
                        <span className="text-[9px] bg-white text-black px-[6px] py-[1px] font-bold">
                          {repo.branch}
                        </span>
                        {repo.isCustom && (
                          <span className="text-[8px] border border-[#555] text-[#aaa] px-[4px] py-[1px]">
                            CUSTOM
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[9px] text-[#a0ffa0] font-bold">
                            ● ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#888888] m-0 mb-[8px] leading-[1.5]">
                        {repo.description}
                      </p>
                      <div className="flex items-center gap-[12px] text-[8px] text-[#666666]">
                        <span>{repo.files.length} files</span>
                        <span>·</span>
                        <span>{totalTests} test cases</span>
                        <span>·</span>
                        <span>{repo.language}</span>
                        <span>·</span>
                        <span>{repo.revision}</span>
                      </div>
                    </div>

                    <button
                      className={`font-mono text-[9px] px-[10px] py-[6px] border shrink-0 ${
                        isSelected
                          ? 'bg-white text-black border-white font-bold'
                          : 'bg-transparent text-[#aaa] border-[#444] hover:text-white hover:border-white'
                      }`}
                    >
                      {isSelected ? 'Current Workspace' : 'Switch Workspace ➔'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Create / Import Mode */
            <div className="space-y-[16px]">
              <div className="grid grid-cols-2 gap-[12px]">
                <div>
                  <label className="block text-[#888888] text-[9px] mb-[4px]">
                    REPOSITORY NAME *
                  </label>
                  <input
                    type="text"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                    placeholder="e.g. notifications-service"
                    className="w-full bg-[#050505] border border-[#444] p-[8px] text-white text-[11px] font-mono focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-[#888888] text-[9px] mb-[4px]">
                    DEFAULT BRANCH
                  </label>
                  <input
                    type="text"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    placeholder="main"
                    className="w-full bg-[#050505] border border-[#444] p-[8px] text-white text-[11px] font-mono focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#888888] text-[9px] mb-[4px]">
                  DESCRIPTION
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Microservice handling dispatch and queue retry logic"
                  className="w-full bg-[#050505] border border-[#444] p-[8px] text-white text-[11px] font-mono focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-[4px]">
                  <label className="text-[#888888] text-[9px]">
                    SOURCE CODE (src/core.py)
                  </label>
                  <span className="text-[8px] text-[#666]">Python function under test</span>
                </div>
                <textarea
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  className="w-full h-[120px] bg-[#050505] border border-[#444] p-[10px] text-white text-[10px] font-mono focus:outline-none focus:border-white resize-none"
                  spellCheck={false}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-[4px]">
                  <label className="text-[#888888] text-[9px]">
                    TEST SUITE (tests/test_core.py)
                  </label>
                  <span className="text-[8px] text-[#666]">Python test assertions</span>
                </div>
                <textarea
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value)}
                  className="w-full h-[120px] bg-[#050505] border border-[#444] p-[10px] text-white text-[10px] font-mono focus:outline-none focus:border-white resize-none"
                  spellCheck={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-[14px_20px] border-t border-[#292929] bg-[#080808] flex items-center justify-between">
          <div className="text-[9px] text-[#666666]">
            {mode === 'select'
              ? 'Select any repository to immediately trace its AST dependency graph and run mutation tests.'
              : 'New repository will be scanned and persisted to local workspace.'}
          </div>

          <div className="flex gap-[8px]">
            <button
              onClick={onClose}
              className="font-mono text-[9px] px-[12px] py-[6px] border border-[#555] bg-transparent text-[#ccc] hover:bg-[#222] cursor-pointer"
            >
              Close
            </button>
            {mode === 'create' && (
              <button
                onClick={handleCreate}
                disabled={!newRepoName.trim()}
                className="font-mono text-[9px] font-bold px-[14px] py-[6px] bg-white text-black border border-white hover:bg-black hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Create Workspace & Scan ➔
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
