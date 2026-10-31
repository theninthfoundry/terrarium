import React from 'react';
import { RepositoryWorkspace } from '../types/terrarium';

interface TopBarProps {
  activeRepo: RepositoryWorkspace;
  onOpenRepoModal: () => void;
  onRefresh: () => void;
  onOpenConfig: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeRepo,
  onOpenRepoModal,
  onRefresh,
  onOpenConfig,
}) => {
  return (
    <header className="flex items-center justify-between border-b border-[#1c1c1c] pb-[16px]">
      <div>
        <div className="font-mono text-[9px] tracking-[1.15px] text-[#8c8c8c] max-[430px]:text-[7px]">
          SOFTWARE CHANGE INTELLIGENCE <span className="text-white px-[5px]">/</span> OBSERVATORY
        </div>
        <h1 className="text-[28px] tracking-[-1.4px] font-bold mt-[6px] mb-0 text-white max-[760px]:text-[21px]">
          Change Observatory
        </h1>
      </div>

      <div className="flex items-center gap-[10px]">
        {/* Interactive Repository Switcher Trigger */}
        <button
          onClick={onOpenRepoModal}
          className="font-mono text-[10px] text-white bg-[#111111] border border-[#444444] px-[12px] py-[8px] rounded-none flex items-center gap-[8px] hover:border-white transition-colors cursor-pointer"
          title="Switch or import repository"
        >
          <span className="w-[6px] h-[6px] rounded-full bg-white shrink-0" />
          <span className="font-bold">{activeRepo.name}</span>
          <span className="text-[#888888] text-[9px]">({activeRepo.branch})</span>
          <span className="text-[#666666] ml-[4px]">▾</span>
        </button>

        <button
          onClick={onOpenConfig}
          className="w-[36px] h-[36px] border border-[#555555] bg-transparent text-white rounded-none text-[15px] cursor-pointer hover:bg-white hover:text-black transition-colors grid place-items-center"
          title="Experiment Configuration"
          aria-label="Experiment Configuration"
        >
          ⚙
        </button>

        <button
          onClick={onRefresh}
          className="w-[36px] h-[36px] border border-[#555555] bg-transparent text-white rounded-none text-[19px] cursor-pointer hover:bg-white hover:text-black transition-colors grid place-items-center"
          title="Refresh Analysis"
          aria-label="Refresh Analysis"
        >
          ↻
        </button>
      </div>
    </header>
  );
};
