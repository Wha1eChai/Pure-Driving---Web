import React, { useState, useEffect, useRef } from 'react';
import { useDriving } from '../contexts/DrivingContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAutoAdvance } from '../hooks/useAutoAdvance';
import { QuestionCard } from '../components/QuestionCard';
import { PracticeLayout } from '../components/PracticeLayout';
import { QuestionNavigator } from '../components/QuestionNavigator';
import type { QuestionStatus } from '../components/QuestionNavigator';
import { Timer, FileText, ChevronLeft, ChevronRight, LayoutGrid, Flag } from 'lucide-react';
import { EXAM_CONFIG, STORAGE_KEYS } from '../config/examParams';
import localforage from 'localforage';

type ExamState = 'intro' | 'active' | 'finished';

interface ExamSnapshot {
  state: ExamState;
  questionIds: string[];
  answers: { [id: string]: string };
  currentIndex: number;
  timeLeft: number;
  timestamp: number;
}

export const ExamPage: React.FC = () => {
  const { questions } = useDriving();
  const [examState, setExamState] = useState<ExamState>('intro');
  const [examQuestions, setExamQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<{ [id: string]: string }>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_CONFIG.DURATION_MINUTES * 60);
  const [isNavOpen, setIsNavOpen] = useState(false);

  const timerRef = useRef<number | undefined>(undefined);

  const { settings, updateAutoAdvance } = useSettings();

  const nextQuestion = () => {
    setCurrentIndex(i => Math.min(examQuestions.length - 1, i + 1));
  };

  const { triggerAutoAdvance } = useAutoAdvance(nextQuestion, 'exam');

  const isAutoEnabled = settings.autoAdvance.enabled && settings.autoAdvance.modeOverrides?.exam !== false;

  const toggleAutoAdvance = (enabled: boolean) => {
      updateAutoAdvance({
          enabled: enabled ? true : settings.autoAdvance.enabled,
          modeOverrides: {
              ...settings.autoAdvance.modeOverrides,
              exam: enabled
          }
      });
  };

  // Load previous exam state on mount (if exists and recent)
  useEffect(() => {
    const loadSnapshot = async () => {
      const snapshot = await localforage.getItem<ExamSnapshot>(STORAGE_KEYS.EXAM_STATE);
      if (snapshot && snapshot.state === 'active') {
        const elapsed = Date.now() - snapshot.timestamp;
        const FIVE_MINUTES = 5 * 60 * 1000;

        // Only restore if within 5 minutes
        if (elapsed < FIVE_MINUTES && window.confirm('检测到未完成的考试，是否继续？')) {
          setExamState(snapshot.state);
          setExamQuestions(snapshot.questionIds);
          setAnswers(snapshot.answers);
          setCurrentIndex(snapshot.currentIndex);
          setTimeLeft(Math.max(0, snapshot.timeLeft - Math.floor(elapsed / 1000)));
        } else {
          // Clear stale snapshot
          await localforage.removeItem(STORAGE_KEYS.EXAM_STATE);
        }
      }
    };
    loadSnapshot();
  }, []);

  // Save exam state snapshot when active
  useEffect(() => {
    if (examState === 'active') {
      const snapshot: ExamSnapshot = {
        state: examState,
        questionIds: examQuestions,
        answers,
        currentIndex,
        timeLeft,
        timestamp: Date.now(),
      };
      localforage.setItem(STORAGE_KEYS.EXAM_STATE, snapshot);
    } else if (examState === 'finished' || examState === 'intro') {
      // Clear snapshot when exam ends or resets
      localforage.removeItem(STORAGE_KEYS.EXAM_STATE);
    }
  }, [examState, examQuestions, answers, currentIndex, timeLeft]);

  // Prevent accidental page close during exam
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (examState === 'active') {
        e.preventDefault();
        e.returnValue = '考试正在进行中，确定要离开吗？';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [examState]);

  // Start Exam
  const startExam = () => {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, EXAM_CONFIG.TOTAL_QUESTIONS).map(q => q.id);
    setExamQuestions(selected);
    setExamState('active');
    setTimeLeft(EXAM_CONFIG.DURATION_MINUTES * 60);
    setAnswers({});
    setCurrentIndex(0);
  };

  // Timer Tick
  useEffect(() => {
    if (examState === 'active' && timeLeft > 0) {
      timerRef.current = window.setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && examState === 'active') {
      // Auto-submit when time's up
      setExamState('finished');
      alert('考试时间已到，系统已自动交卷！');
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, examState]);

  const finishExam = () => {
    if (window.confirm('确定要交卷吗？交卷后将不能修改答案。')) {
      setExamState('finished');
    }
  };

  const handleAnswer = (_isCorrect: boolean, key: string) => {
    const currentId = examQuestions[currentIndex];
    setAnswers(prev => ({ ...prev, [currentId]: key }));
    triggerAutoAdvance(_isCorrect);
  };

  // Score Calculation
  const calculateScore = () => {
    let correctCount = 0;
    examQuestions.forEach(id => {
      const q = questions.find(item => item.id === id);
      if (!q) return;

      const userAns = answers[id];
      const correctKey = Object.keys(q.options).find(key => {
        const val = q.options[key];
        if (q.answer === key) return true;
        if (q.answer === val) return true;
        return false;
      }) || q.answer;

      if (userAns === correctKey) correctCount++;
    });
    return correctCount * EXAM_CONFIG.SCORE_PER_QUESTION;
  };

  // Helper for Navigator Colors
  const getQuestionStatus = (index: number): QuestionStatus => {
    const qId = examQuestions[index];
    const isAnswered = !!answers[qId];

    if (index === currentIndex) return 'current';
    if (isAnswered) return 'correct';
    return 'unanswered';
  };

  // Keyboard Navigation
  useEffect(() => {
    if (examState !== 'active') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(i => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(i => Math.min(examQuestions.length - 1, i + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [examState, examQuestions.length]);

  if (examState === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-fade-in">
        <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-4">
          <FileText className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">全真模拟考试</h1>
          <p className="text-gray-500 mt-2">按公安部最新题库标准组卷</p>
        </div>
        <div className="grid grid-cols-3 gap-8 text-center bg-gray-50 p-6 rounded-2xl w-full max-w-lg">
          <div>
            <div className="text-2xl font-bold text-gray-800">{EXAM_CONFIG.TOTAL_QUESTIONS}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase">题数</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{EXAM_CONFIG.DURATION_MINUTES}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase">分钟</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{EXAM_CONFIG.PASS_SCORE}</div>
            <div className="text-xs text-gray-400 mt-1 uppercase">及格分</div>
          </div>
        </div>
        <button
          onClick={startExam}
          className="px-10 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-200 transition-transform active:scale-95"
        >
          开始考试
        </button>
      </div>
    );
  }

  if (examState === 'finished') {
    const score = calculateScore();
    const passed = score >= EXAM_CONFIG.PASS_SCORE;
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-fade-in">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-xl ${passed ? 'bg-green-500 shadow-green-200' : 'bg-red-500 shadow-red-200'}`}>
          {score}
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{passed ? '恭喜通过！' : '考试不合格'}</h2>
          <p className="text-gray-500 mt-2">
            共答 {Object.keys(answers).length} / {examQuestions.length} 题
          </p>
        </div>
        <button
          onClick={() => setExamState('intro')}
          className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
        >
          返回首页
        </button>
      </div>
    );
  }

  // Active Exam UI
  const currentId = examQuestions[currentIndex];
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const isUrgent = timeLeft < EXAM_CONFIG.URGENT_TIME_THRESHOLD * 60;

  return (
    <>
      <PracticeLayout
        variant="exam"
        title="模拟考试"
        icon={Timer}
        subtitle={
          <span className={`font-mono text-lg font-bold ${isUrgent ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
            {mins}:{secs}
          </span>
        }
        extraHeaderContent={
          <div className="flex items-center gap-2">
            <label
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer select-none transition-colors border border-transparent hover:border-gray-200"
                title="答对自动跳转下一题"
            >
                <div className={`w-9 h-5 rounded-full relative transition-colors ${isAutoEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${isAutoEnabled ? 'left-5' : 'left-1'}`} />
                </div>
                <input
                    type="checkbox"
                    checked={isAutoEnabled}
                    onChange={e => toggleAutoAdvance(e.target.checked)}
                    className="hidden"
                />
                <span className="text-xs font-medium text-gray-600 hidden sm:inline">自动</span>
            </label>

            <div className="w-px h-6 bg-gray-200 mx-1"></div>

            <button
                onClick={finishExam}
                className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors"
            >
                交卷
            </button>
          </div>
        }
        footerLeft={
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
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
            答题卡
            <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-xs">
              {Object.keys(answers).length}/{examQuestions.length}
            </span>
          </button>
        }
        footerRight={
          <button
            onClick={() => setCurrentIndex(i => Math.min(examQuestions.length - 1, i + 1))}
            disabled={currentIndex === examQuestions.length - 1}
            className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
          >
            <span className="font-medium">下一题</span>
            <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        }
      >
        <QuestionCard
          key={currentId}
          questionId={currentId}
          onAnswer={handleAnswer}
          userSelected={answers[currentId]}
          showAnswer={false}
          extraAction={
            <div className="flex items-center gap-1 text-xs text-gray-400 border px-2 py-1 rounded">
              <Flag className="w-3 h-3" />
              存疑标记
            </div>
          }
        />
      </PracticeLayout>

      <QuestionNavigator
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        total={examQuestions.length}
        currentIndex={currentIndex}
        onSelect={(idx) => {
          setCurrentIndex(idx);
        }}
        getStatus={getQuestionStatus}
      />
    </>
  );
};
