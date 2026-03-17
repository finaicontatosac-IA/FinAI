
import React from 'react';
import { ViewState, User } from '../types.ts';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: User;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

// Icons
const DashboardIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const AIChatIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
const FinanceIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const GraduationIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>;
const DocumentsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const AccountingIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const ReportsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, user, onLogout, isOpen, onClose, theme, onToggleTheme }) => {
  const menuItems = [
    { id: ViewState.Dashboard, label: 'Dashboard', icon: <DashboardIcon /> },
    { id: ViewState.Chat, label: 'IA Auditora', icon: <AIChatIcon /> },
    { id: ViewState.FinancialAI, label: 'IA Financeira', icon: <FinanceIcon /> },
    { id: ViewState.StudentArea, label: 'Área do Aluno', icon: <GraduationIcon /> },
    { id: ViewState.Documents, label: 'Knowledge Base', icon: <DocumentsIcon /> },
    { id: ViewState.Accounting, label: 'Auditoria API', icon: <AccountingIcon /> },
    { id: ViewState.Reports, label: 'Relatórios', icon: <ReportsIcon /> },
  ];

  const handleNav = (view: ViewState) => {
    setView(view);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] lg:hidden animate-in fade-in duration-300" 
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[80]
        w-72 bg-white dark:bg-[#1A1A1A] border-r border-gray-100 dark:border-white/5 
        flex flex-col transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-8 pb-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] flex items-center justify-center text-xl font-black rounded-xl shadow-xl shadow-black/10">
              F
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-[#1A1A1A] dark:text-white leading-none">FinAIGPT</h1>
              <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Build 2.5 STABLE</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`
                w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 group
                ${currentView === item.id 
                  ? 'bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] shadow-lg shadow-black/10 scale-[1.02]' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-[#1A1A1A] dark:hover:text-white'
                }
              `}
            >
              <span className={`transition-transform duration-200 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer / User Profile */}
        <div className="p-4 mt-auto">
          <div className="bg-gray-50 dark:bg-white/5 rounded-[2rem] p-4 border border-transparent dark:border-white/5">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between mb-4 bg-white dark:bg-[#1A1A1A] p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
              <button 
                onClick={() => theme !== 'light' && onToggleTheme()}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${theme === 'light' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.364 17.364l-.707.707M17.364 17.364l-.707-.707M6.364 6.364l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                <span className="text-[9px] font-bold uppercase tracking-widest">Solar</span>
              </button>
              <button 
                onClick={() => theme !== 'dark' && onToggleTheme()}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${theme === 'dark' ? 'bg-white text-[#1A1A1A] shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                <span className="text-[9px] font-bold uppercase tracking-widest">Lunar</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <img src={user.avatar} className="w-10 h-10 rounded-xl bg-white p-1 border border-gray-100 dark:border-white/5" alt="Avatar" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-[#1A1A1A] dark:text-white uppercase truncate">{user.name}</p>
                <p className="text-[8px] font-bold text-gray-400 truncate">{user.email}</p>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
