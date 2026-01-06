export type QuestionType = 'choice' | 'judgment';

export interface Question {
  id: string;
  question: string;
  options: {
    [key: string]: string; // "A": "Option text", "B": "..."
  };
  answer: string; // "A", "B", "C", "D" or "正确", "错误" (We need to normalize judgment answers to A/B or match text)
  // Based on our parser, judgment answer is "正确" or "错误", but options are usually A:正确, B:错误.
  // Actually let's check the JSON again.
  type: QuestionType;
  images: string[];
}

export interface UserProgress {
  currentBank: 'quick' | 'full'; // 'quick' (500) or 'full' (2309)
  currentIndex: { [bank: string]: number }; // Separate index per bank
  answeredIds: string[]; // Set of all answered IDs (to support "random uncompleted")
  hiddenIds: string[]; // Set of defective/reported questions to ignore
  notes: { [questionId: string]: string }; // User notes
  mistakes: string[]; // List of Question IDs (prefixed or not, we need to handle collisions if IDs overlap)
  // Actually, parser uses sequential IDs (1, 2, 3...) for both files.
  // We MUST prefix IDs when loading or storing to avoid collision.
  // Strategy: When loading "full", prefix ID with "full-". When loading "quick", prefix "quick-".
  favorites: string[];
  examHistory: {
    date: number;
    score: number;
    duration: number;
    bank: string;
  }[];
}

export interface AppState {
  questions: Question[];
  loading: boolean;
  progress: UserProgress;
  currentBank: 'quick' | 'full';
}
