import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { Grid, useGridRef } from 'react-window';
import type { CellComponentProps } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { UI_CONFIG } from '../config/examParams';

export type QuestionStatus = 'correct' | 'wrong' | 'current' | 'unanswered';

interface QuestionNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  currentIndex: number;
  onSelect: (index: number) => void;
  getStatus: (index: number) => QuestionStatus;
}

interface CellProps {
  index: number;
  columnCount: number;
  total: number;
  currentIndex: number;
  getStatus: (index: number) => QuestionStatus;
  onSelect: (index: number) => void;
  onClose: () => void;
}

// Cell component for virtualized grid
const Cell = ({ columnIndex, rowIndex, style, ...rest }: CellComponentProps<CellProps>) => {
  const cellProps = rest as unknown as CellProps;
  const { columnCount, total, currentIndex, getStatus, onSelect, onClose } = cellProps;
  const index = rowIndex * columnCount + columnIndex;

  // Empty cell if index exceeds total
  if (index >= total) {
    return <div style={style} />;
  }

  const status = getStatus(index);
  const isCurrent = index === currentIndex;

  return (
    <div style={style} className="p-1.5">
      <button
        onClick={() => {
          onSelect(index);
          onClose();
        }}
        className={clsx(
          "relative w-full h-full rounded-lg flex items-center justify-center text-sm font-medium transition-all",
          // Current Item Style
          isCurrent
            ? "ring-2 ring-blue-500 ring-offset-2 bg-blue-50 text-blue-700 z-10 shadow-md"
            : "hover:bg-gray-50 active:scale-95",

          // Status Colors (Backgrounds)
          !isCurrent && status === 'correct' && "bg-green-50 text-green-700 border border-green-200",
          !isCurrent && status === 'wrong' && "bg-red-50 text-red-700 border border-red-200",
          !isCurrent && status === 'unanswered' && "bg-white border border-gray-200 text-gray-500"
        )}
      >
        {index + 1}

        {/* Status Dot Indicator */}
        {status === 'wrong' && !isCurrent && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        )}
      </button>
    </div>
  );
};

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  isOpen,
  onClose,
  total,
  currentIndex,
  onSelect,
  getStatus,
}) => {
  const gridRef = useGridRef(null);

  // Scroll to current question when opened
  useEffect(() => {
    if (isOpen && gridRef.current) {
      const isMobile = window.innerWidth < 640;
      const columnCount = isMobile ? UI_CONFIG.NAVIGATOR_COLS_MOBILE : UI_CONFIG.NAVIGATOR_COLS_DESKTOP;
      const rowIndex = Math.floor(currentIndex / columnCount);

      gridRef.current.scrollToRow({ index: rowIndex, align: 'center' });
    }
  }, [isOpen, currentIndex, gridRef]);

  if (!isOpen) return null;

  // Calculate grid dimensions
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const columnCount = isMobile ? UI_CONFIG.NAVIGATOR_COLS_MOBILE : UI_CONFIG.NAVIGATOR_COLS_DESKTOP;
  const rowCount = Math.ceil(total / columnCount);

  const cellProps: CellProps = {
    index: currentIndex,
    columnCount,
    total,
    currentIndex,
    getStatus,
    onSelect,
    onClose,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-white shadow-xl flex flex-col animate-slide-in-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">题目导航</h2>
            <p className="text-xs text-gray-500 mt-1">
              共 {total} 题 ·
              <span className="text-green-600 mx-1">● 正确</span>
              <span className="text-red-500 mx-1">● 错误</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="关闭导航"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Virtualized Grid */}
        <div className="flex-1 overflow-hidden px-2 py-4">
          <AutoSizer
            renderProp={({ height, width }: { height: number | undefined; width: number | undefined }) => {
              if (!height || !width) return null;
              return (
                <Grid<CellProps>
                  gridRef={gridRef}
                  cellComponent={Cell}
                  cellProps={cellProps}
                  columnCount={columnCount}
                  columnWidth={width / columnCount}
                  defaultHeight={height}
                  defaultWidth={width}
                  rowCount={rowCount}
                  rowHeight={UI_CONFIG.VIRTUAL_ITEM_HEIGHT}
                  overscanCount={2}
                />
              );
            }}
          />
        </div>

        {/* Footer Legend */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-400 shrink-0">
          点击题号跳转 · 键盘 ← → 翻页
        </div>
      </div>
    </div>
  );
};