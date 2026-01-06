import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import localforage from 'localforage';
import type { AppState, Question, UserProgress } from '../types';
import { STORAGE_KEYS, QUESTION_BANK_CONFIG } from '../config/examParams';

interface DrivingContextType extends AppState {
  setQuestions: (questions: Question[]) => void;
  updateProgress: (newProgress: Partial<UserProgress>) => void;
  setBank: (bank: 'quick' | 'full') => void;
  addMistake: (questionId: string) => void;
  markAnswered: (questionId: string) => void;
  markHidden: (questionId: string) => void;
  unhideQuestion: (questionId: string) => void;
  updateNote: (questionId: string, note: string) => void;
  removeMistake: (questionId: string) => void;
  toggleFavorite: (questionId: string) => void;
  resetProgress: () => void;
}

const DrivingContext = createContext<DrivingContextType | undefined>(undefined);

const INITIAL_PROGRESS: UserProgress = {
  currentBank: 'quick',
  currentIndex: { quick: 0, full: 0 },
  answeredIds: [],
  hiddenIds: [],
  notes: {},
  mistakes: [],
  favorites: [],
  examHistory: [],
};

export const DrivingProvider = ({ children }: { children: React.ReactNode }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<UserProgress>(INITIAL_PROGRESS);
  const saveTimerRef = useRef<number | undefined>(undefined);

  // Load Progress
  useEffect(() => {
    localforage.getItem<UserProgress>(STORAGE_KEYS.USER_PROGRESS).then((saved) => {
      if (saved) {
        setProgress(prev => ({
            ...prev,
            ...saved,
            currentIndex: { ...INITIAL_PROGRESS.currentIndex, ...(saved.currentIndex || {}) }
        }));
      }
    });
  }, []);

  // Load Questions when bank changes
  useEffect(() => {
    setLoading(true);
    const bank = progress.currentBank || 'quick';
    const file = QUESTION_BANK_CONFIG.PATHS[bank];

    fetch(file)
      .then((res) => res.json())
      .then((data: Question[]) => {
        const processed = data.map(q => ({
            ...q,
            id: `${bank}-${q.id}`,
        }));
        setQuestions(processed);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load questions:', err);
        setLoading(false);
      });
  }, [progress.currentBank]);

  // Save Progress with Debounce (500ms)
  useEffect(() => {
    if (!loading) {
      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Set new timer
      saveTimerRef.current = window.setTimeout(() => {
        localforage.setItem(STORAGE_KEYS.USER_PROGRESS, progress);
      }, 500);
    }

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [progress, loading]);

  const setBank = (bank: 'quick' | 'full') => {
      setProgress(p => ({ ...p, currentBank: bank }));
  };

  const markAnswered = (questionId: string) => {
    setProgress((prev) => {
        if (prev.answeredIds && prev.answeredIds.includes(questionId)) return prev;
        return { ...prev, answeredIds: [...(prev.answeredIds || []), questionId] };
    });
  };

  const markHidden = (questionId: string) => {
    setProgress((prev) => {
        if (prev.hiddenIds && prev.hiddenIds.includes(questionId)) return prev;
        return { ...prev, hiddenIds: [...(prev.hiddenIds || []), questionId] };
    });
  };

  const unhideQuestion = (questionId: string) => {
    setProgress((prev) => ({
      ...prev,
      hiddenIds: (prev.hiddenIds || []).filter((id) => id !== questionId),
    }));
  };

  const updateNote = (questionId: string, note: string) => {
    setProgress((prev) => ({
      ...prev,
      notes: { ...prev.notes, [questionId]: note },
    }));
  };

  const updateProgress = (newProgress: Partial<UserProgress>) => {
    setProgress((prev) => ({ ...prev, ...newProgress }));
  };

  const addMistake = (questionId: string) => {
    setProgress((prev) => {
      if (prev.mistakes.includes(questionId)) return prev;
      return { ...prev, mistakes: [...prev.mistakes, questionId] };
    });
  };

  const removeMistake = (questionId: string) => {
    setProgress((prev) => ({
      ...prev,
      mistakes: prev.mistakes.filter((id) => id !== questionId),
    }));
  };

  const toggleFavorite = (questionId: string) => {
    setProgress((prev) => {
      const isFav = prev.favorites.includes(questionId);
      return {
        ...prev,
        favorites: isFav
          ? prev.favorites.filter((id) => id !== questionId)
          : [...prev.favorites, questionId],
      };
    });
  };

  const resetProgress = () => {
    if (window.confirm('确定要重置所有进度吗？此操作无法撤销。')) {
      setProgress(INITIAL_PROGRESS);
    }
  };

  return (
    <DrivingContext.Provider
      value={{
        questions,
        loading,
        progress,
        currentBank: progress.currentBank,
        setQuestions,
        setBank,
        updateProgress,
        markAnswered,
        markHidden,
        unhideQuestion,
        updateNote,
        addMistake,
        removeMistake,
        toggleFavorite,
        resetProgress,
      }}
    >
      {children}
    </DrivingContext.Provider>
  );
};

export const useDriving = () => {
  const context = useContext(DrivingContext as React.Context<DrivingContextType | undefined>);
  if (!context) {
    throw new Error('useDriving must be used within a DrivingProvider');
  }
  return context;
};
