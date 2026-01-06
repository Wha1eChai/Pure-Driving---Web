import React, { useState, useEffect } from 'react';
import { useDriving } from '../contexts/DrivingContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAutoAdvance } from '../hooks/useAutoAdvance';
import { QuestionCard } from '../components/QuestionCard';
import { NoteSection } from '../components/NoteSection';
import { QuestionNavigator } from '../components/QuestionNavigator';
import { PracticeLayout } from '../components/PracticeLayout';
import type { QuestionStatus } from '../components/QuestionNavigator';
import { ChevronLeft, ChevronRight, LayoutGrid, BookOpen } from 'lucide-react';

export const PracticePage: React.FC = () => {
  const { questions, progress, updateProgress, addMistake, markAnswered, currentBank, markHidden } = useDriving();
  const { settings, updateAutoAdvance } = useSettings();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Sync with global progress on mount or bank change
  useEffect(() => {
    if (questions.length > 0) {
      // Get saved index for current bank
      const savedIndex = progress.currentIndex[currentBank] || 0;
      setCurrentIndex(Math.min(savedIndex, questions.length - 1));
      setSelectedAnswer(null);
    }
  }, [questions.length, currentBank]); // Reset on bank change

  const currentQuestion = questions[currentIndex];

  const nextQuestion = () => {
    let nextIdx = currentIndex + 1;
    // Skip hidden questions
    while (nextIdx < questions.length && progress.hiddenIds?.includes(questions[nextIdx].id)) {
        nextIdx++;
    }

    if (nextIdx < questions.length) {
      setCurrentIndex(nextIdx);
      setSelectedAnswer(null);
    }
  };

  const prevQuestion = () => {
    let prevIdx = currentIndex - 1;
    // Skip hidden questions
    while (prevIdx >= 0 && progress.hiddenIds?.includes(questions[prevIdx].id)) {
        prevIdx--;
    }

    if (prevIdx >= 0) {
      setCurrentIndex(prevIdx);
      setSelectedAnswer(null);
    }
  };

  const { triggerAutoAdvance } = useAutoAdvance(nextQuestion, 'sequence');

  const handleAnswer = (isCorrect: boolean, key: string) => {
    setSelectedAnswer(key);

    // Save progress
    const savedIndex = progress.currentIndex[currentBank] || 0;
    if (currentIndex >= savedIndex) {
        updateProgress({
            currentIndex: {
                ...progress.currentIndex,
                [currentBank]: currentIndex + 1
            }
        });
    }

    // Mark as answered for random mode
    if (currentQuestion) {
        markAnswered(currentQuestion.id);
    }

    if (!isCorrect && currentQuestion) {
      addMistake(currentQuestion.id);
    }

    // Auto Advance Logic
    triggerAutoAdvance(isCorrect);
  };

  const handleReport = () => {
    if (currentQuestion && window.confirm('确定要隐藏这道题吗？(之后将不再出现)')) {
        markHidden(currentQuestion.id);
        nextQuestion(); // Auto skip
    }
  };

  // Keyboard support for Navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
        // Prevent conflict with input fields
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

        if (e.key === 'ArrowRight') nextQuestion();
        if (e.key === 'ArrowLeft') prevQuestion();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, questions.length]);

  const getQuestionStatus = (index: number): QuestionStatus => {
      const qId = questions[index]?.id;
      if (!qId) return 'unanswered';

      // If it's the current one being viewed
      if (index === currentIndex && !selectedAnswer) return 'current';

      const isMistake = progress.mistakes.includes(qId);
      const isAnswered = progress.answeredIds.includes(qId);

      if (isMistake) return 'wrong';
      if (isAnswered) return 'correct';
      return 'unanswered';
  };

  if (!currentQuestion) return <div>Loading...</div>;

  return (
    <>
      <PracticeLayout
        variant="default"
        title="顺序练习"
        icon={BookOpen}
        subtitle={
            <span>
                <span className="text-blue-600 font-bold text-base">{currentIndex + 1}</span>
                <span className="mx-1 opacity-50">/</span>
                {questions.length}
            </span>
        }
        extraHeaderContent={
            <div className="flex items-center gap-1 sm:gap-2">
                <label
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer select-none transition-colors border border-transparent hover:border-gray-200"
                    title="答对自动跳转下一题"
                >
                    <div className={`w-9 h-5 rounded-full relative transition-colors ${settings.autoAdvance.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
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
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <button
                    onClick={() => setIsNavOpen(true)}
                    className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                    title="题目列表"
                >
                    <LayoutGrid className="w-5 h-5" />
                </button>
            </div>
        }
        footerLeft={
             <button
                onClick={prevQuestion}
                disabled={currentIndex === 0}
                className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
             >
                <ChevronLeft className="w-5 h-5 mr-1" />
                <span className="font-medium">上一题</span>
                <span className="hidden md:inline text-xs ml-1 opacity-40 font-mono">[←]</span>
             </button>
        }
        footerRight={
             <button
                onClick={nextQuestion}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95"
             >
                <span className="font-bold">下一题</span>
                <span className="hidden md:inline text-xs ml-1 opacity-60 font-mono">[→]</span>
                <ChevronRight className="w-5 h-5 ml-1" />
             </button>
        }
      >
         <QuestionCard
            key={currentQuestion.id} // Reset state when id changes
            questionId={currentQuestion.id}
            onAnswer={handleAnswer}
            userSelected={selectedAnswer}
            onReport={handleReport}
         />

         <NoteSection questionId={currentQuestion.id} />
      </PracticeLayout>

      {/* Navigator Modal */}
      <QuestionNavigator
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        total={questions.length}
        currentIndex={currentIndex}
        onSelect={(idx) => {
            setCurrentIndex(idx);
            setSelectedAnswer(null);
        }}
        getStatus={getQuestionStatus}
      />
    </>
  );
};