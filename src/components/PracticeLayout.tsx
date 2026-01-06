import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

export type PracticeVariant = 'default' | 'random' | 'mistake' | 'exam';

interface PracticeLayoutProps {
  variant?: PracticeVariant;
  icon?: LucideIcon;
  title: string;
  subtitle?: React.ReactNode; // Stats or extra info in header
  extraHeaderContent?: React.ReactNode; // Right side of header (e.g. NavGrid button)
  children: React.ReactNode; // The QuestionCard

  // Footer Actions
  footerLeft?: React.ReactNode;
  footerCenter?: React.ReactNode;
  footerRight?: React.ReactNode;

  className?: string;
}

const THEME_STYLES = {
  default: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    titleColor: 'text-gray-800',
  },
  random: {
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    titleColor: 'text-gray-800',
  },
  mistake: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    titleColor: 'text-gray-800',
  },
  exam: {
    iconBg: 'bg-white', // Exam header is often distinct
    iconColor: 'text-gray-800',
    titleColor: 'text-gray-900',
  }
};

export const PracticeLayout: React.FC<PracticeLayoutProps> = ({
  variant = 'default',
  icon: Icon,
  title,
  subtitle,
  extraHeaderContent,
  children,
  footerLeft,
  footerCenter,
  footerRight,
  className
}) => {
  const theme = THEME_STYLES[variant];

  return (
    <div className={clsx("flex flex-col h-full relative overflow-hidden", className)}>
      {/* 1. Header Area - Fixed top */}
      <div className="shrink-0 p-4 pb-0 w-full max-w-3xl mx-auto z-10">
        <header className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-100 min-h-[64px]">
          <div className="flex items-center gap-3 overflow-hidden">
              {Icon && (
                  <div className={clsx("p-2 rounded-lg shrink-0", theme.iconBg)}>
                      <Icon className={clsx("w-5 h-5", theme.iconColor)} />
                  </div>
              )}
              <div className="flex flex-col min-w-0">
                  <h2 className={clsx("text-lg font-bold truncate leading-tight", theme.titleColor)}>
                      {title}
                  </h2>
                  {subtitle && (
                      <div className="text-xs text-gray-500 truncate mt-0.5 font-medium">
                          {subtitle}
                      </div>
                  )}
              </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-2">
              {extraHeaderContent}
          </div>
        </header>
      </div>

      {/* 2. Main Content Area (Scrollable) */}
      <main className="flex-1 overflow-y-auto scroll-smooth w-full">
         <div className="w-full max-w-3xl mx-auto min-h-full flex flex-col justify-center p-4">
            {children}
         </div>
      </main>

      {/* 3. Footer Area - Fixed bottom */}
      {(footerLeft || footerCenter || footerRight) && (
        <footer className="shrink-0 bg-white border-t border-gray-200 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           <div className="w-full max-w-3xl mx-auto px-4 py-3 flex items-center justify-between relative min-h-[60px]">
               {/* Left */}
               <div className="flex-1 flex justify-start">
                   {footerLeft}
               </div>

               {/* Center */}
               {footerCenter && (
                   <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                       {footerCenter}
                   </div>
               )}

               {/* Right */}
               <div className="flex-1 flex justify-end">
                   {footerRight}
               </div>
           </div>
        </footer>
      )}
    </div>
  );
};
