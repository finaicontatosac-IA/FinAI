
import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from './firebase.ts';
import { ViewState, User } from './types.ts';
import { StorageService } from './services/storage.ts';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import ChatInterface from './components/ChatInterface.tsx';
import FinancialAI from './components/FinancialAI.tsx';
import DocumentManager from './components/DocumentManager.tsx';
import AccountingView from './components/AccountingView.tsx';
import Reports from './components/Reports.tsx';
import TrashBin from './components/TrashBin.tsx';
import FloatingAssistant from './components/FloatingAssistant.tsx';
import StudentArea from './components/StudentArea.tsx';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-[#F2EFEA] dark:bg-[#121212] p-6 text-center">
          <div className="max-w-md w-full bg-white dark:bg-[#1A1A1A] rounded-[2rem] p-12 shadow-2xl border border-transparent dark:border-white/5">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Algo deu errado</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Ocorreu um erro inesperado no sistema. Por favor, tente recarregar a página.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="modern-button w-full"
            >
              Recarregar Sistema
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-8 p-4 bg-gray-100 dark:bg-black rounded-xl text-[10px] text-left overflow-auto max-h-40">
                {this.state.error?.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.Dashboard);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(StorageService.getTheme());

  useEffect(() => {
    StorageService.testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user exists in Firestore, if not create them
        const existingUser = await StorageService.getUser(firebaseUser.uid);
        if (existingUser) {
          setUser(existingUser);
        } else {
          const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Usuário',
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${firebaseUser.uid}`
          };
          await StorageService.setUser(newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    StorageService.setTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Deseja realmente encerrar a sessão?")) {
      try {
        await signOut(auth);
        setView(ViewState.Dashboard);
      } catch (error) {
        console.error("Logout failed", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#F2EFEA] dark:bg-[#121212] transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gray-200 dark:border-gray-800 border-t-[#1A1A1A] dark:border-t-white rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Sincronizando Terminal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#F2EFEA] dark:bg-[#121212] p-6 transition-colors duration-300">
        <div className="max-w-md w-full bg-white dark:bg-[#1A1A1A] rounded-[2rem] p-12 text-center shadow-2xl shadow-black/5 dark:shadow-black/20 animate-in zoom-in duration-500 border border-transparent dark:border-white/5">
          <div className="w-16 h-16 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] flex items-center justify-center text-2xl font-black rounded-2xl mx-auto mb-8 shadow-xl shadow-blue-500/20">
            F
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-[#1A1A1A] dark:text-white">FinAIGPT Terminal</h1>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
            Inteligência Artificial Especializada em <br/> Contabilidade & Análise CFA.
          </p>
          <button 
            onClick={handleLogin}
            className="modern-button w-full dark:bg-white dark:text-[#1A1A1A]"
          >
            Acessar com Google
          </button>
          <div className="mt-12 flex items-center justify-center gap-2 opacity-30">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
            <p className="text-[8px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-[0.3em]">Build 2.5.0-STABLE</p>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
          </div>
        </div>
      </div>
    );
  }

  // Determine if we are in a chat view to conditionally hide the global menu button
  const isChatView = [ViewState.Chat, ViewState.FinancialAI, ViewState.StudentArea].includes(view);

  const renderView = () => {
    const commonProps = {
      onOpenMenu: () => setIsMobileMenuOpen(true)
    };

    switch (view) {
      case ViewState.Dashboard: return <Dashboard />;
      case ViewState.Chat: return <ChatInterface {...commonProps} />;
      case ViewState.FinancialAI: return <FinancialAI {...commonProps} />;
      case ViewState.StudentArea: return <StudentArea {...commonProps} />;
      case ViewState.Documents: return <DocumentManager />;
      case ViewState.Accounting: return <AccountingView />;
      case ViewState.Reports: return <Reports />;
      case ViewState.Trash: return <TrashBin />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-full w-full bg-[#F2EFEA] dark:bg-[#121212] overflow-hidden transition-colors duration-300">
      {/* Mobile Menu Trigger - Only show on non-chat views. Chat views handle their own menu button. */}
      {!isChatView && (
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden fixed top-6 left-6 z-[60] p-3.5 bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 active:scale-90 transition-all"
        >
          <svg className="w-5 h-5 text-[#1A1A1A] dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <Sidebar 
        currentView={view} 
        setView={setView} 
        user={user} 
        onLogout={handleLogout} 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 h-full overflow-hidden relative">
        <div className="h-full pt-safe pb-safe lg:pt-0 lg:pb-0">
          {renderView()}
        </div>
        {!isChatView && <FloatingAssistant />}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
