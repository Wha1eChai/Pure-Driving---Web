import React, { useState, useEffect } from 'react';
import { useDriving } from '../contexts/DrivingContext';
import { QuestionCard } from '../components/QuestionCard';
import { NoteSection } from '../components/NoteSection';
import { PracticeLayout } from '../components/PracticeLayout';
import { QuestionNavigator } from '../components/QuestionNavigator';
import type { QuestionStatus } from '../components/QuestionNavigator';
import { ChevronLeft, ChevronRight, AlertTriangle, LayoutGrid, Check } from 'lucide-react';

export const MistakesPage: React.FC = () => {
  const { questions, progress, removeMistake } = useDriving();
  const [localIndex, setLocalIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  const mistakeIds = progress.mistakes;
  const hasMistakes = mistakeIds.length > 0;
  const currentQId = hasMistakes ? mistakeIds[localIndex] : null;
  const currentQuestion = questions.find(q => q.id === currentQId);

  const handleAnswer = (_isCorrect: boolean, key: string) => {
    setSelectedAnswer(key);
  };

  const handleRemove = () => {
      if (currentQId) {
          if (window.confirm('恭喜掌握！确定要将此题移出错题本吗？')) {
             removeMistake(currentQId);
             // Index adjustment happens automatically via re-render logic below,
             // but we want to prevent out of bounds
             if (localIndex >= mistakeIds.length - 1) {
                 setLocalIndex(Math.max(0, mistakeIds.length - 2));
             }
             setSelectedAnswer(null);
          }
      }
  };

  const nextQuestion = () => {
    if (localIndex < mistakeIds.length - 1) {
      setLocalIndex(p => p + 1);
      setSelectedAnswer(null);
    }
  };

  const prevQuestion = () => {
    if (localIndex > 0) {
      setLocalIndex(p => p - 1);
      setSelectedAnswer(null);
    }
  };

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
        if (e.key === 'ArrowRight') nextQuestion();
        if (e.key === 'ArrowLeft') prevQuestion();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [localIndex, mistakeIds.length]);

  const getQuestionStatus = (index: number): QuestionStatus => {
     // For mistakes page, all are 'wrong' basically, or we can use 'current'
     if (index === localIndex) return 'current';
     return 'wrong';
  };

  if (!hasMistakes) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-4xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">错题本空空如也！</h2>
              <p className="text-gray-500 mt-2">太棒了，所有错题都已被你消灭。</p>
          </div>
      )
  }

  return (
    <>
    <PracticeLayout
        variant="mistake"
        title="错题本"
        icon={AlertTriangle}
        subtitle={
            <span>
                <span className="text-red-600 font-bold text-base">{localIndex + 1}</span>
                <span className="mx-1 opacity-50">/</span>
                {mistakeIds.length}
            </span>
        }
        footerLeft={
            <button
                onClick={prevQuestion}
                disabled={localIndex === 0}
                className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
             >
                <ChevronLeft className="w-5 h-5 mr-1" />
                <span className="font-medium">上一题</span>
            </button>
        }
        footerCenter={
             <button
                onClick={() => setIsNavOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
             >
                 <LayoutGrid className="w-4 h-4" />
                 错题列表
             </button>
        }
        footerRight={
            <button
                onClick={nextQuestion}
                disabled={localIndex >= mistakeIds.length - 1}
                className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
             >
                <span className="font-medium">下一题</span>
                <ChevronRight className="w-5 h-5 ml-1" />
             </button>
        }
    >
         {currentQuestion ? (
             <>
                <QuestionCard
                    key={currentQuestion.id}
                    questionId={currentQuestion.id}
                    onAnswer={handleAnswer}
                    userSelected={selectedAnswer}
                    extraAction={
                        <button
                            onClick={handleRemove}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                            title="标记为已掌握并移出错题本"
                        >
                            <Check className="w-3.5 h-3.5" />
                            我已掌握
                        </button>
                    }
                />
                <NoteSection questionId={currentQuestion.id} />
             </>
         ) : (
             <div>题目加载错误</div>
         )}
    </PracticeLayout>

    {/* Navigator for Mistakes */}
    <QuestionNavigator
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        total={mistakeIds.length}
        currentIndex={localIndex}
        onSelect={(idx) => {
            setLocalIndex(idx);
            setSelectedAnswer(null);
        }}
        getStatus={getQuestionStatus}
      />
    </>
  );
};