import React, { useState, useEffect } from 'react';
import { useDriving } from '../contexts/DrivingContext';
import { StickyNote, ChevronDown, ChevronUp, PenLine } from 'lucide-react';

export const NoteSection: React.FC<{ questionId: string }> = ({ questionId }) => {
  const { progress, updateNote } = useDriving();
  const [note, setNote] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Sync with context on mount or id change
  useEffect(() => {
    const savedNote = progress.notes?.[questionId] || '';
    setNote(savedNote);
    // Auto open if there is a note
    if (savedNote) setIsOpen(true);
    else setIsOpen(false);
  }, [questionId, progress.notes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNote(val);
  };

  const handleBlur = () => {
    // Auto save on blur
    if (note !== (progress.notes?.[questionId] || '')) {
        updateNote(questionId, note);
    }
  };

  if (!isOpen && !note) {
      return (
          <div className="w-full max-w-2xl mx-auto mt-4 flex justify-end">
              <button
                onClick={() => setIsOpen(true)}
                className="text-sm text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors px-3 py-1 rounded-md hover:bg-gray-50"
              >
                  <PenLine className="w-4 h-4" />
                  添加笔记
              </button>
          </div>
      );
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-4">
      <div className="bg-yellow-50 rounded-xl border border-yellow-200 overflow-hidden transition-all duration-300">
        <div
            className="flex items-center justify-between p-3 cursor-pointer bg-yellow-100/50 hover:bg-yellow-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
        >
            <div className="flex items-center gap-2 text-yellow-800 font-medium text-sm">
                <StickyNote className="w-4 h-4" />
                <span>我的笔记</span>
            </div>
            {isOpen ? <ChevronUp className="w-4 h-4 text-yellow-600" /> : <ChevronDown className="w-4 h-4 text-yellow-600" />}
        </div>

        {isOpen && (
            <div className="p-4 pt-0">
                <textarea
                    value={note}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="记下你的心得，比如：这题容易看错红绿灯..."
                    className="w-full bg-white border border-yellow-200 rounded-lg p-3 text-sm text-gray-700 placeholder-yellow-800/40 focus:outline-none focus:bg-white focus:ring-2 focus:ring-yellow-400 transition-all resize-y min-h-[80px] mt-3"
                    autoFocus={!note}
                />
            </div>
        )}
      </div>
    </div>
  );
};
