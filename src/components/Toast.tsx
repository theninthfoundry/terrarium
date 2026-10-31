import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-[24px] right-[25px] bg-white text-black px-[16px] py-[12px] rounded-none font-sans font-semibold text-[11px] shadow-2xl pointer-events-none z-50 transition-all duration-200 transform translate-y-0 opacity-100 flex items-center gap-[8px]">
      <span className="w-[6px] h-[6px] rounded-full bg-black shrink-0" />
      <span>{message}</span>
    </div>
  );
};
