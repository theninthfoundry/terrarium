import React from 'react';
import { RepositoryWorkspace } from '../types/terrarium';

interface RepoCardProps {
  repository: RepositoryWorkspace;
  changedFiles: string[];
  changedFunctionsCount: number;
  onInspectCode: () => void;
  onOpenRepoSwitcher: () => void;
}

export const RepoCard: React.FC<RepoCardProps> = ({
  repository,
  changedFiles,
  changedFunctionsCount,
  onInspectCode,
  onOpenRepoSwitcher,
}) => {
  const totalTests = repository.files
    .filter((f) => f.isTestFile)
    .reduce((acc, f) => acc + f.functions.length, 0);

  return (
    <section className="bg-[#0b0b0b] border border-[#292929] p-[19px_20px] rounded-none flex items-center justify-start gap-[15px] flex-wrap max-[760px]:flex-wrap">
      {/* Symbol */}
      <div
        onClick={onOpenRepoSwitcher}
        className="h-[40px] w-[40px] border border-[#777777] bg-white text-black rounded-none grid place-items-center text-[19px] shrink-0 font-bold cursor-pointer hover:bg-black hover:text-white hover:border-white transition-colors"
        title="Click to switch or import repository"
      >
        ⌘
      </div>

      {/* Meta */}
      <div className="min-w-[230px] max-[430px]:min-w-0">
        <div className="text-[13px] font-bold text-white flex items-center">
          <button
            onClick={onOpenRepoSwitcher}
            className="hover:underline text-left cursor-pointer flex items-center gap-[6px]"
          >
            <span>{repository.name}</span>
            <span className="text-[9px] text-[#888888]">▾</span>
          </button>
          <span className="font-mono text-[9px] text-black bg-white px-[7px] py-[4px] rounded-none ml-[8px]">
            {repository.branch}
          </span>
        </div>
        <div className="text-[#999999] font-mono text-[9px] mt-[7px] max-[430px]:leading-[1.7]">
          /{repository.id} <span className="px-[5px] text-[#555555]">·</span> {repository.language}{' '}
          <span className="px-[5px] text-[#555555]">·</span> {totalTests} tests{' '}
          <span className="px-[5px] text-[#555555]">·</span> {repository.revision}
        </div>
      </div>

      {/* Change Under Inspection */}
      <div className="ml-auto max-[760px]:ml-[54px] max-[760px]:w-full max-[760px]:mt-2">
        <div className="font-mono text-[8px] tracking-[1.15px] text-[#8c8c8c] mb-[7px]">
          CHANGE UNDER INSPECTION
        </div>
        <button
          onClick={onInspectCode}
          className="font-mono text-[10px] text-[#dddddd] bg-[#111111] border border-[#444444] px-[10px] py-[8px] rounded-none flex items-center hover:border-white transition-colors cursor-pointer text-left"
          title="Click to view file contents and test graph"
        >
          <span className="text-white text-[8px] mr-[5px]">●</span>
          {changedFiles[0] || repository.defaultChangedFile}
          <span className="text-white ml-[10px]">+{changedFunctionsCount} functions</span>
        </button>
      </div>
    </section>
  );
};
