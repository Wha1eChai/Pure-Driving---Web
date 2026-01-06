import React, { useState, useEffect } from 'react';
import { useDriving } from '../contexts/DrivingContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAutoAdvance } from '../hooks/useAutoAdvance';
import { QuestionCard } from '../components/QuestionCard';
import { NoteSection } from '../components/NoteSection';
import { PracticeLayout } from '../components/PracticeLayout';
import { Shuffle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export const RandomPracticePage: React.FC = () => {
  const { questions, progress, addMistake, markAnswered, markHidden } = useDriving();
  const { settings, updateAutoAdvance } = useSettings();

  const [currentQId, setCurrentQId] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [unansweredIds, setUnansweredIds] = useState<string[]>([]);
  // History Stack for "Undo" functionality
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [isHistoryMode, setIsHistoryMode] = useState(false);

  // Initialize pool
  useEffect(() => {
      if (questions.length === 0) return;

      const answeredSet = new Set(progress.answeredIds || []);
      const hiddenSet = new Set(progress.hiddenIds || []);
      const pool = questions.filter(q => !answeredSet.has(q.id) && !hiddenSet.has(q.id)).map(q => q.id);

      setUnansweredIds(pool);

      // Only pick initial if not already set (e.g. from nav back)
      if (!currentQId && pool.length > 0) {
          const randomIndex = Math.floor(Math.random() * pool.length);
          setCurrentQId(pool[randomIndex]);
      }
  }, [questions]);

  const pickNextRandom = () => {
      // 1. Save current to history before moving
      if (currentQId) {
          setHistoryStack(prev => [...prev, currentQId]);
      }

      // 2. Reset history mode flag if we were viewing history
      setIsHistoryMode(false);

      // 3. Pick new
      const answeredSet = new Set(progress.answeredIds || []);
      const hiddenSet = new Set(progress.hiddenIds || []);
      // Always recalc pool to be safe
      const pool = questions.filter(q => !answeredSet.has(q.id) && !hiddenSet.has(q.id)).map(q => q.id);

      if (pool.length === 0) {
          setCurrentQId(null);
          return;
      }

      const randomIndex = Math.floor(Math.random() * pool.length);
      setCurrentQId(pool[randomIndex]);
      setSelectedAnswer(null);
      setUnansweredIds(pool);
  };

  const { triggerAutoAdvance } = useAutoAdvance(pickNextRandom, 'random');

  const goBack = () => {
      if (historyStack.length === 0) return;

      const prevId = historyStack[historyStack.length - 1];
      const newStack = historyStack.slice(0, -1);

      // If we are currently on a new random question (not in history view),
      // we might want to push IT to a "forward" stack?
      // Simplified logic: Just go back to the prev ID.

      setHistoryStack(newStack);
      setCurrentQId(prevId);
      setIsHistoryMode(true);
      // When going back, we usually show the answer state if it was answered.
      // But we don't store "selectedAnswer" in history yet.
      // So user will see it as fresh card unless we lookup answeredIds.
      setSelectedAnswer(null);
  };

  const handleReport = () => {
      if (currentQId) {
          if(window.confirm('确定要隐藏这道题吗？(之后将不再出现)')) {
              markHidden(currentQId);
              pickNextRandom();
          }
      }
  };

  const handleAnswer = (isCorrect: boolean, key: string) => {
    setSelectedAnswer(key);
    if (currentQId) {
        markAnswered(currentQId);
        if (!isCorrect) {
            addMistake(currentQId);
        }
    }
    triggerAutoAdvance(isCorrect);
  };

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

        // Next
        if (e.code === 'Space' || e.code === 'Enter' || e.key === 'ArrowRight') {
            e.preventDefault();
            pickNextRandom();
        }
        // Prev
        if (e.key === 'ArrowLeft') {
            goBack();
        }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [unansweredIds, historyStack, currentQId]);

  if (!currentQId && questions.length > 0) {
       return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">全部刷完了！</h2>
              <p className="text-gray-500 mt-2">太厉害了，你已经把题库里的题都做了一遍。</p>
          </div>
      );
  }

  const currentQuestion = questions.find(q => q.id === currentQId);
  if (!currentQuestion) return <div>Loading...</div>;

  // Check if current question is already answered (for history view)
  const isAnsweredAlready = progress.answeredIds?.includes(currentQId || '');

  return (
    <PracticeLayout
        variant="random"
        title="随机练习"
        icon={Shuffle}
        subtitle={
            <span>
                剩余未做: <span className="text-purple-600 font-bold text-base">{unansweredIds.length}</span>
            </span>
        }
        extraHeaderContent={
            <label
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer select-none transition-colors border border-transparent hover:border-gray-200"
                title="答对自动跳转下一题"
            >
                <div className={`w-9 h-5 rounded-full relative transition-colors ${settings.autoAdvance.enabled ? 'bg-purple-600' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${settings.autoAdvance.enabled ? 'left-5' : 'left-1'}`} />
                </div>
                <input
                    type="checkbox"
                    checked={settings.autoAdvance.enabled}
                    onChange={e => updateAutoAdvance({ enabled: e.target.checked })}
                    className="hidden"
                />
                <span className="text-xs font-medium text-gray-600 hidden sm:inline">自动下一题</span>
            </label>
        }
        footerLeft={
            <button
                onClick={goBack}
                disabled={historyStack.length === 0}
                className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
             >
                <ChevronLeft className="w-5 h-5 mr-1" />
                <span className="font-medium">上一题</span>
            </button>
        }
        footerRight={
             <button
                onClick={pickNextRandom}
                className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-md shadow-purple-200 transition-all active:scale-95"
             >
                <Shuffle className="w-4 h-4 mr-2" />
                <span className="font-bold">下一题</span>
                <ChevronRight className="w-5 h-5 ml-1" />
             </button>
        }
    >
         <QuestionCard
            key={currentQuestion.id}
            questionId={currentQuestion.id}
            onAnswer={handleAnswer}
            userSelected={selectedAnswer} // Note: History view won't show selection unless we store it
            showAnswer={isHistoryMode && isAnsweredAlready} // Auto show answer if reviewing history
            onReport={handleReport}
         />
         <NoteSection questionId={currentQuestion.id} />
    </PracticeLayout>
  );
};
