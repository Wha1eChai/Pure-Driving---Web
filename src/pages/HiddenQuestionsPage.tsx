import React from 'react';
import { useDriving } from '../contexts/DrivingContext';
import { QuestionCard } from '../components/QuestionCard';
import { NoteSection } from '../components/NoteSection';
import { Undo2, Trash2 } from 'lucide-react';

export const HiddenQuestionsPage: React.FC = () => {
  const { questions, progress, unhideQuestion } = useDriving();
  const hiddenIds = progress.hiddenIds || [];

  if (hiddenIds.length === 0) {
    return (
      <div className="h-full overflow-y-auto scroll-smooth">
        <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">回收站是空的</h2>
            <p className="text-gray-500 mt-2">没有被标记隐藏的题目。</p>
        </div>
      </div>
    );
  }

  // Filter questions that are hidden
  const hiddenQuestions = questions.filter(q => hiddenIds.includes(q.id));

  return (
    <div className="h-full overflow-y-auto scroll-smooth">
      <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24 md:pb-8 space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Trash2 className="w-6 h-6" />
                已隐藏题目 (回收站)
            </h2>
            <span className="text-sm text-gray-500">共 {hiddenQuestions.length} 题</span>
        </div>

        <div className="space-y-4">
            {hiddenQuestions.map((q) => (
            <div key={q.id} className="relative group">
                <div className="opacity-75 hover:opacity-100 transition-opacity">
                    <QuestionCard
                        questionId={q.id}
                    />
                    <NoteSection questionId={q.id} />
                </div>

                {/* Overlay Restore Button */}
                <div className="absolute top-4 right-16 z-10">
                    <button
                        onClick={() => unhideQuestion(q.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg shadow hover:bg-green-700 transition-all"
                    >
                        <Undo2 className="w-4 h-4" />
                        恢复题目
                    </button>
                </div>
            </div>
            ))}

            {hiddenQuestions.length === 0 && hiddenIds.length > 0 && (
                <p className="text-center text-gray-500 py-8">
                    当前题库没有隐藏的题目（其他隐藏题目可能在另一个题库中）。
                </p>
            )}
        </div>
      </div>
    </div>
  );
};