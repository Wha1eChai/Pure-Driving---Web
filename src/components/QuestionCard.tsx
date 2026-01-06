import React, { useRef, useState, useEffect } from 'react';
import { useDriving } from '../contexts/DrivingContext';
import { clsx } from 'clsx';
import { CheckCircle2, XCircle, Copy, Check, Ban } from 'lucide-react';
import html2canvas from 'html2canvas';

interface QuestionCardProps {
  questionId: string;
  showAnswer?: boolean;
  onAnswer?: (isCorrect: boolean, selected: string) => void;
  userSelected?: string | null;
  onReport?: () => void;
  extraAction?: React.ReactNode; // Slot for custom actions
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  questionId,
  showAnswer = false,
  onAnswer,
  userSelected,
  onReport,
  extraAction,
}) => {
  const { questions } = useDriving();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const question = questions.find((q) => q.id === questionId);

  // Keyboard Shortcuts for Options
  useEffect(() => {
    if (!question || userSelected || showAnswer) return;

    const handleKey = (e: KeyboardEvent) => {
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        const key = e.key.toLowerCase();
        const options = Object.keys(question.options);
        let selectedKey = '';

        if (['1', 'a'].includes(key) && options.length >= 1) selectedKey = options[0];
        if (['2', 'b'].includes(key) && options.length >= 2) selectedKey = options[1];
        if (['3', 'c'].includes(key) && options.length >= 3) selectedKey = options[2];
        if (['4', 'd'].includes(key) && options.length >= 4) selectedKey = options[3];

        if (selectedKey) {
            handleSelect(selectedKey);
        }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [questionId, userSelected, showAnswer]);

  if (!question) return <div>题目加载错误</div>;

  const isJudgment = question.type === 'judgment';

  const correctKey = Object.keys(question.options).find(key => {
      const val = question.options[key];
      if (question.answer === key) return true;
      if (question.answer === val) return true;
      return false;
  }) || question.answer;

  const handleSelect = (key: string) => {
    if (userSelected || showAnswer) return;
    const isCorrect = key === correctKey;
    onAnswer?.(isCorrect, key);
  };

  const handleCopy = async () => {
      if (!cardRef.current || isCopying) return;
      setIsCopying(true);
      try {
          const canvas = await html2canvas(cardRef.current, {
              useCORS: true,
              scale: 2,
              backgroundColor: '#ffffff',
              ignoreElements: (element) => element.classList.contains('no-capture')
          });

          canvas.toBlob(async (blob) => {
              if (!blob) return;
              try {
                  await navigator.clipboard.write([
                      new ClipboardItem({ 'image/png': blob })
                  ]);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
              } catch (err) {
                  console.error('Clipboard write failed', err);
                  alert('复制失败，请检查浏览器权限');
              } finally {
                  setIsCopying(false);
              }
          });
      } catch (err) {
          console.error('Capture failed', err);
          setIsCopying(false);
      }
  };

  const getOptionStyle = (key: string) => {
    const isSelected = userSelected === key;
    const isCorrect = key === correctKey;
    const showResult = !!userSelected || showAnswer;

    if (!showResult) {
      return isSelected
        ? 'bg-blue-100 border-blue-500 text-blue-700'
        : 'bg-white border-gray-200 hover:bg-gray-50';
    }

    if (isCorrect) {
      return 'bg-green-100 border-green-500 text-green-800';
    }

    if (isSelected && !isCorrect) {
      return 'bg-red-100 border-red-500 text-red-800';
    }

    return 'bg-white border-gray-200 opacity-60';
  };

  const hasOptions = Object.keys(question.options).length > 0;

  return (
    <div ref={cardRef} className="w-full max-w-2xl mx-auto p-4 bg-white rounded-xl shadow-sm border border-gray-100 relative group/card">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className={clsx(
                "px-2 py-0.5 rounded text-xs font-medium",
                isJudgment ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
            )}>
                {isJudgment ? '判断题' : '选择题'}
            </span>
            <span>ID: {question.id}</span>
            {extraAction && <div className="ml-2 no-capture">{extraAction}</div>}
          </div>

          {/* Copy Button */}
          <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 focus-within:opacity-100 transition-opacity">
              <button
                onClick={onReport}
                className="no-capture p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="标记为错误/图片过多 (不再显示)"
              >
                  <Ban className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={isCopied || isCopying}
                className="no-capture p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="复制为图片"
              >
                  {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
          </div>
      </div>

      {/* Question Text */}
      <h3 className="text-lg font-medium text-gray-900 mb-4 leading-relaxed">
        {question.question}
      </h3>

      {/* Images */}
      {question.images && question.images.length > 0 && (
        <div className={clsx(
            "mb-6 gap-2",
            question.images.length > 1 ? "grid grid-cols-2" : "flex justify-center"
        )}>
          {question.images.map((img, idx) => (
             <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img
                    src={`/${img}`}
                    alt={`Question ${idx}`}
                    className={clsx(
                        "object-contain mx-auto transition-transform hover:scale-110 cursor-zoom-in",
                        question.images!.length > 1 ? "max-h-48 w-full" : "max-h-80"
                    )}
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    onClick={() => window.open(`/${img}`, '_blank')}
                />
             </div>
          ))}
        </div>
      )}

      {/* Options */}
      {hasOptions ? (
      <div className="space-y-3">
        {Object.entries(question.options).map(([key, value], idx) => (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            disabled={!!userSelected || showAnswer}
            className={clsx(
              "w-full text-left p-4 rounded-lg border transition-all duration-200 flex items-center justify-between group relative",
              getOptionStyle(key)
            )}
          >
            <div className="flex items-center gap-3">
                <span className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border shrink-0",
                    // Circle styles
                    userSelected === key || (showAnswer && key === correctKey)
                     ? "border-transparent bg-white/20"
                     : "border-gray-300 text-gray-500 group-hover:border-blue-400 group-hover:text-blue-500"
                )}>
                    {key}
                </span>
                <span className="font-medium">{value}</span>
            </div>

            {!userSelected && !showAnswer && (
                <span className="hidden group-hover:block md:block absolute right-4 text-xs font-mono opacity-20 group-hover:opacity-50">
                    [{idx + 1}]
                </span>
            )}

            {(userSelected || showAnswer) && (
                <div>
                    {key === correctKey && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {key === userSelected && key !== correctKey && <XCircle className="w-5 h-5 text-red-600" />}
                </div>
            )}
          </button>
        ))}
      </div>
      ) : (
          <div className="p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center">
              <p className="text-gray-500 mb-2">⚠️ 此题未解析到选项</p>
              <p className="text-xs text-gray-400">这可能是原始文档格式问题。您可以点击右上角禁止图标屏蔽此题，并在“已隐藏题目”中添加备注。</p>
          </div>
      )}

      {(userSelected || showAnswer || !hasOptions) && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
            <div className="flex items-center gap-2 font-medium mb-1">
                <span>正确答案:</span>
                <span className="text-green-600 font-bold text-lg">{correctKey || question.answer || '未知'}</span>
            </div>
        </div>
      )}
    </div>
  );
};
