import React from 'react';

interface NavigationRailProps {
  activeView: string;
  onSelectView: (view: string) => void;
  onOpenCodeViewer: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeView,
  onSelectView,
  onOpenCodeViewer,
}) => {
  return (
    <aside className="w-[232px] shrink-0 border-r border-[#292929] p-[27px_18px] flex flex-col fixed inset-y-0 left-0 bg-[#050505] z-20 max-[760px]:w-[58px] max-[760px]:p-[18px_8px]">
      {/* Brand */}
      <div className="flex items-center gap-[11px] text-[#f5f5f5] text-[12px] tracking-[2.4px] font-bold mb-[66px] ml-[4px] max-[760px]:mb-[45px] max-[760px]:justify-center max-[760px]:ml-0">
        <span className="w-[29px] height-[29px] h-[29px] grid place-items-center bg-white text-black font-bold text-[16px] tracking-[-1px] rounded-none shrink-0">
          T
        </span>
        <span className="max-[760px]:hidden">TERRARIUM</span>
      </div>

      {/* Rail Label */}
      <div className="font-mono text-[9px] tracking-[1.15px] text-[#666666] mb-[14px] ml-[10px] max-[760px]:hidden">
        WORKSPACE
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-[5px]">
        <button
          onClick={() => onSelectView('observatory')}
          className={`h-[42px] w-full border-0 text-left px-[12px] rounded-none font-sans font-semibold text-[12px] cursor-pointer transition-colors flex items-center max-[760px]:justify-center max-[760px]:px-0 ${
            activeView === 'observatory'
              ? 'bg-white text-black'
              : 'bg-transparent text-[#888888] hover:text-white hover:bg-[#151515]'
          }`}
          title="Observatory"
        >
          <span className="inline-block w-[25px] text-[16px] max-[760px]:w-auto">◫</span>
          <span className="max-[760px]:hidden">Observatory</span>
        </button>

        <button
          onClick={() => onSelectView('experiments')}
          className={`h-[42px] w-full border-0 text-left px-[12px] rounded-none font-sans font-semibold text-[12px] cursor-pointer transition-colors flex items-center max-[760px]:justify-center max-[760px]:px-0 ${
            activeView === 'experiments'
              ? 'bg-white text-black'
              : 'bg-transparent text-[#888888] hover:text-white hover:bg-[#151515]'
          }`}
          title="Experiments"
        >
          <span className="inline-block w-[25px] text-[16px] max-[760px]:w-auto">⌁</span>
          <span className="max-[760px]:hidden">Experiments</span>
        </button>

        <button
          onClick={() => onSelectView('blindspots')}
          className={`h-[42px] w-full border-0 text-left px-[12px] rounded-none font-sans font-semibold text-[12px] cursor-pointer transition-colors flex items-center max-[760px]:justify-center max-[760px]:px-0 ${
            activeView === 'blindspots'
              ? 'bg-white text-black'
              : 'bg-transparent text-[#888888] hover:text-white hover:bg-[#151515]'
          }`}
          title="Blind spots"
        >
          <span className="inline-block w-[25px] text-[16px] max-[760px]:w-auto">◎</span>
          <span className="max-[760px]:hidden">Blind spots</span>
        </button>

        <button
          onClick={onOpenCodeViewer}
          className="h-[42px] w-full border-0 text-left px-[12px] rounded-none font-sans font-semibold text-[12px] cursor-pointer transition-colors flex items-center bg-transparent text-[#888888] hover:text-white hover:bg-[#151515] max-[760px]:justify-center max-[760px]:px-0"
          title="Source Code"
        >
          <span className="inline-block w-[25px] text-[16px] max-[760px]:w-auto">⌥</span>
          <span className="max-[760px]:hidden">Inspect Code</span>
        </button>
      </nav>

      {/* Rail Bottom */}
      <div className="mt-auto max-[760px]:hidden">
        <div className="flex items-center gap-[9px] text-[#dddddd] p-[12px_9px] font-mono text-[9px] tracking-[1.15px]">
          <span className="w-[6px] h-[6px] bg-white rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.1)] shrink-0 animate-pulse" />
          <span>ENGINE ONLINE</span>
        </div>
        <div className="text-[#666666] p-[8px_9px] font-mono text-[9px] tracking-[1.15px]">
          BUILD 0.1.0 <span className="px-[5px] text-[#aaaaaa]">·</span> LOCAL-FIRST
        </div>
      </div>
    </aside>
  );
};
