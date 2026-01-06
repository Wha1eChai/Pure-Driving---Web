/**
 * 考试参数配置
 * 可根据不同考试类型进行调整
 */
export const EXAM_CONFIG = {
  /** 考试题目数量 */
  TOTAL_QUESTIONS: 100,

  /** 考试时长（分钟） */
  DURATION_MINUTES: 45,

  /** 及格分数 */
  PASS_SCORE: 90,

  /** 每题分值 */
  SCORE_PER_QUESTION: 1,

  /** 剩余时间警告阈值（分钟） */
  URGENT_TIME_THRESHOLD: 5,
} as const;

/**
 * 题库配置
 */
export const QUESTION_BANK_CONFIG = {
  /** 快速题库大小 */
  QUICK_BANK_SIZE: 500,

  /** 完整题库大小 */
  FULL_BANK_SIZE: 2309,

  /** 题库文件路径 */
  PATHS: {
    quick: '/data/questions.json',
    full: '/data/questions_full.json',
  }
} as const;

/**
 * 本地存储 Key
 */
export const STORAGE_KEYS = {
  USER_PROGRESS: 'user_progress',
  EXAM_STATE: 'exam_state_snapshot',
} as const;

/**
 * UI 配置
 */
export const UI_CONFIG = {
  /** 答题卡网格列数 (移动端) */
  NAVIGATOR_COLS_MOBILE: 5,

  /** 答题卡网格列数 (桌面端) */
  NAVIGATOR_COLS_DESKTOP: 6,

  /** 虚拟列表每项高度 (px) */
  VIRTUAL_ITEM_HEIGHT: 60,
} as const;
