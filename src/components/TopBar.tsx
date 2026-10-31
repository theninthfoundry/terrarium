import React from 'react';

interface TopBarProps {
  onRefresh: () => void;
  onOpenConfig: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onRefresh, onOpenConfig }) => {
  return (
    <header className="flex items-center justify-between">
      <div>
        <div className="font-mono text-[9px] tracking-[1.15px] text-[#8c8c8c] max-[430px]:text-[7px]">
          SOFTWARE CHANGE INTELLIGENCE <span className="text-white px-[5px]">/</span> OVERVIEW
        </div>
        <h1 className="text-[28px] tracking-[-1.4px] font-bold mt-[9px] mb-0 text-white max-[760px]:text-[21px]">
          Change Observatory
        </h1>
      </div>

      <div className="flex items-center gap-[14px]">
        <span className="font-mono text-[9px] tracking-[1.15px] text-[#bbbbbb] border border-[#555555] px-[11px] py-[9px] rounded-none flex items-center max-[760px]:hidden">
          <i className="inline-block w-[6px] h-[6px] rounded-full bg-white mr-[8px] not-italic" />
          DEMO REPOSITORY
        </span>

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
