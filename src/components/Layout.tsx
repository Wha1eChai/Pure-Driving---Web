import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, LayoutDashboard, PenTool, AlertTriangle, Shuffle, EyeOff } from 'lucide-react';

export const Layout: React.FC = () => {
  return (
    // Root: Use h-dvh for full mobile viewport support, locked overflow
    <div className="h-dvh w-full bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 p-4 shrink-0 z-10 md:hidden flex justify-center items-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">Pure Driving</h1>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full shrink-0">
        <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-blue-600">Pure Driving</h1>
            <p className="text-xs text-gray-500 mt-1">驾考科目一纯净刷题 Web</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavLinks />
        </nav>
      </aside>

      {/* Main Content - Independent Scroll Area */}
      {/* Changed: Removed global overflow-y-auto to allow PracticeLayout to manage its own scrolling for fixed footer */}
      <main className="flex-1 h-full overflow-hidden relative flex flex-col">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <NavLinks mobile />
      </nav>
    </div>
  );
};

const NavLinks: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const links = [
    { to: '/', icon: LayoutDashboard, label: '首页' },
    { to: '/practice', icon: BookOpen, label: '顺序练习' },
    { to: '/random', icon: Shuffle, label: '随机练习' },
    { to: '/exam', icon: PenTool, label: '模拟考试' },
    { to: '/mistakes', icon: AlertTriangle, label: '错题本' },
    { to: '/hidden', icon: EyeOff, label: '已隐藏题目' },
  ];

  return (
    <>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            mobile
              ? `flex flex-col items-center p-2 rounded-lg text-[10px] sm:text-xs transition-colors ${
                  isActive ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'
                }`
              : `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
          }
        >
          <link.icon className={mobile ? 'w-6 h-6 mb-1' : 'w-5 h-5'} />
          <span>{link.label}</span>
        </NavLink>
      ))}
    </>
  );
};