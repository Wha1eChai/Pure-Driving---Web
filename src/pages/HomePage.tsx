import React from 'react';
import { useDriving } from '../contexts/DrivingContext';
import { Link } from 'react-router-dom';
import { BookOpen, AlertTriangle, PenTool, PieChart, Database, Shuffle } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { questions, progress, loading, setBank, currentBank } = useDriving();

  if (loading) {
    return <div className="flex justify-center p-12">加载中...</div>;
  }

  const total = questions.length;
  // Get current bank index safely
  const done = progress.currentIndex[currentBank] || 0;

  const mistakeCount = progress.mistakes.length;
  const percent = Math.round((done / total) * 100) || 0;

  return (
    <div className="h-full overflow-y-auto scroll-smooth">
      <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24 md:pb-8 space-y-6">
        {/* Bank Switcher */}
        <div className="flex justify-end">
          <div className="inline-flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setBank('quick')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${currentBank === 'quick' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  速成500题
              </button>
              <button
                onClick={() => setBank('full')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${currentBank === 'full' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  完整2309题
              </button>
          </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold mb-2">
                    {currentBank === 'quick' ? '科目一 · 精选速成' : '科目一 · 完整题库'}
                </h2>
                <p className="opacity-90">每天进步一点点，拿证快人一步。</p>
            </div>
            <Database className="w-8 h-8 opacity-20" />
        </div>

        <div className="flex items-center gap-8 mt-6">
            <div>
                <div className="text-3xl font-bold">{done} <span className="text-sm opacity-60 font-normal">/ {total}</span></div>
                <div className="text-xs opacity-70 mt-1">做题进度</div>
            </div>
            <div>
                 <div className="text-3xl font-bold">{mistakeCount}</div>
                 <div className="text-xs opacity-70 mt-1">错题待消灭</div>
            </div>
        </div>
      </div>

      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/practice" className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-5 group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">顺序练习</h3>
            <p className="text-sm text-gray-500 mt-2">按题号顺序刷题，自动记录进度</p>
        </Link>

        <Link to="/random" className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-5 group-hover:scale-110 transition-transform">
                <Shuffle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">随机练习</h3>
            <p className="text-sm text-gray-500 mt-2">优先刷未做过的题，告别死记硬背</p>
        </Link>

        <Link to="/mistakes" className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-5 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">错题本</h3>
            <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">专项攻克薄弱环节</p>
                {mistakeCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{mistakeCount}</span>
                )}
            </div>
        </Link>

        <Link to="/exam" className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-5 group-hover:scale-110 transition-transform">
                <PenTool className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">模拟考试</h3>
            <p className="text-sm text-gray-500 mt-2">全真模拟，限时交卷，智能判分</p>
        </Link>
      </div>

      {/* Stats / Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-gray-800">学习数据</h3>
        </div>
        <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
                <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    总体进度
                </span>
                </div>
                <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                    {percent}%
                </span>
                </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                <div style={{ width: `${percent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
            </div>
        </div>
      </div>
    </div>
    </div>
  );
};
