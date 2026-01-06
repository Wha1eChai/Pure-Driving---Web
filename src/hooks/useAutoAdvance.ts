import { useRef, useEffect, useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import type { PracticeMode } from '../contexts/SettingsContext';

export function useAutoAdvance(
  onNext: () => void,
  mode: PracticeMode = 'sequence'
) {
  const { settings } = useSettings();
  const timeoutRef = useRef<number | undefined>(undefined);

  const triggerAutoAdvance = useCallback((isCorrect: boolean) => {
    // 1. 基础检查：是否开启
    if (!settings.autoAdvance.enabled) return;

    // 2. 模式检查：是否被特定模式禁用 (例如考试模式)
    if (settings.autoAdvance.modeOverrides[mode] === false) return;

    // 3. 只有答对才自动跳转
    if (!isCorrect) return;

    // 4. 清除之前的定时器（防止多次快速点击）
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 5. 设置延迟跳转
    const delay = settings.autoAdvance.delay || 500;
    timeoutRef.current = window.setTimeout(() => {
      onNext();
    }, delay);
  }, [settings.autoAdvance, mode, onNext]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { triggerAutoAdvance };
}
