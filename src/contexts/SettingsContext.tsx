import React, { createContext, useContext, useState, useEffect } from 'react';

// 定义支持的刷题模式
export type PracticeMode = 'sequence' | 'random' | 'exam' | 'mistake';

export interface AppSettings {
  // 自动下一题配置
  autoAdvance: {
    enabled: boolean;        // 全局主开关
    delay: number;           // 延迟毫秒数 (默认 500ms)
    modeOverrides: {         // 针对不同模式的细粒度控制 (预留)
      [key in PracticeMode]?: boolean;
    };
  };
  // 预留其他设置
  soundEnabled: boolean;
  darkMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  autoAdvance: {
    enabled: true, // 默认开启，提升心流
    delay: 500,
    modeOverrides: {
      exam: false, // 考试模式默认不自动跳转，防止误操作
    },
  },
  soundEnabled: true,
  darkMode: false,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateAutoAdvance: (config: Partial<AppSettings['autoAdvance']>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    // 从 localStorage 加载
    const saved = localStorage.getItem('deepv_driving_settings');
    if (saved) {
      try {
        // Deep merge could be better here, but simple spread is okay for now
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed, autoAdvance: { ...DEFAULT_SETTINGS.autoAdvance, ...parsed.autoAdvance } };
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  // 自动保存
  useEffect(() => {
    localStorage.setItem('deepv_driving_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateAutoAdvance = (config: Partial<AppSettings['autoAdvance']>) => {
    setSettings(prev => ({
      ...prev,
      autoAdvance: {
        ...prev.autoAdvance,
        ...config
      }
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, updateAutoAdvance }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext as React.Context<SettingsContextType | undefined>);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
