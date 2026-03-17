
import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatSession } from '../types.ts';
import { GeminiService } from '../services/geminiService.ts';
import { StorageService } from '../services/storage.ts';
import { auth } from '../firebase.ts';

interface StudentAreaProps {
  onOpenMenu?: () => void;
}

const ChatListItem: React.FC<{
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  onTogglePin: (e: React.MouseEvent, id: string, isPinned: boolean) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}> = ({ session, isActive, onClick, onTogglePin, onDelete }) => (
  <div 
    onClick={onClick}
    className={`
      group relative flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 rounded-lg mx-2
      ${isActive 
        ? 'bg-[#212121] text-white' 
        : 'text-gray-400 hover:bg-[#212121] hover:text-white'
      }
    `}
  >
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium truncate text-gray-200">
          {session.title || 'Novo Estudo'}
        </h4>
      </div>
      <p className="text-[11px] text-gray-500 mt-0.5 truncate">
        {session.messages[session.messages.length - 1]?.content.substring(0, 30) || 'Sem mensagens'}
      </p>
    </div>
    {session.isPinned && <span className="text-[10px] text-gray-500">★</span>}
    <button 
      onClick={(e) => onDelete(e, session.id)} 
      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
    </button>
  </div>
);

const StudentArea: React.FC<StudentAreaProps> = ({ onOpenMenu }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = StorageService.getChatSessions(user.uid, 'student', (loaded) => {
      const activeSessions = loaded.filter(s => !s.deletedAt);
      setSessions(activeSessions);
      if (activeSessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(activeSessions[0].id);
        if (window.innerWidth >= 1024) setShowListOnMobile(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [sessions, streamingText]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const createNewSession = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Nova Aula de Finanças',
      messages: [{ id: 'init', role: 'model', content: 'Olá! Sou seu Tutor de Finanças. Qual tema você quer dominar hoje? (Débito/Crédito, IFRS, Valuation...)', timestamp: new Date() }],
      lastUpdate: new Date(),
      updatedAt: new Date().toISOString(),
      version: 1,
      userId: user.uid
    };
    await StorageService.saveChatSession(newSession, 'student', user.uid);
    setCurrentSessionId(newSession.id);
    setShowListOnMobile(false);
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setShowListOnMobile(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !currentSessionId || isLoading) return;

    const user = auth.currentUser;
    if (!user) return;

    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (!currentSession) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    const updatedSession = { ...currentSession, messages: [...currentSession.messages, userMsg], lastUpdate: new Date() };
    
    const textToSend = input;
    setInput('');
    setIsLoading(true);
    if(textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const response = await GeminiService.generateStudentResponseStream(
        textToSend,
        updatedSession.messages,
        (chunk) => setStreamingText(chunk)
      );

      const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', content: response, timestamp: new Date() };
      const finalSession = { ...updatedSession, messages: [...updatedSession.messages, modelMsg] };
      await StorageService.saveChatSession(finalSession, 'student', user.uid);
      
      if (finalSession.messages.length <= 3) {
        const title = await GeminiService.generateTitle(textToSend || "Aula de Contabilidade");
        const titledSession = { ...finalSession, title };
        await StorageService.saveChatSession(titledSession, 'student', user.uid);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setStreamingText('');
    }
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="flex h-full bg-black text-white overflow-hidden font-sans">
      {/* Sidebar List (Dark Mode) */}
      <div className={`
        ${showListOnMobile ? 'flex' : 'hidden'} lg:flex
        w-full lg:w-[260px] border-r border-[#333] flex-col bg-black shrink-0
      `}>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2 lg:hidden px-2 pt-2">
            <button onClick={onOpenMenu} className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="font-bold">Student Area</span>
            <div className="w-6"></div>
          </div>
          <button 
            onClick={createNewSession} 
            className="w-full py-2.5 px-3 hover:bg-[#212121] rounded-lg text-sm font-medium transition-all flex items-center justify-between group text-gray-200"
          >
            <div className="flex items-center gap-2">
              <div className="bg-amber-600 text-white p-1 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              </div>
              <span>Nova Aula</span>
            </div>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar">
          <h3 className="text-[11px] font-bold text-gray-500 px-4 py-2 mt-2 uppercase tracking-wider">Trilhas de Estudo</h3>
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-600">Nenhuma aula iniciada</div>
          ) : (
            sessions.map(s => (
              <ChatListItem 
                key={s.id} session={s} isActive={s.id === currentSessionId} 
                onClick={() => handleSelectSession(s.id)} 
                onTogglePin={(e, id, isPinned) => { e.stopPropagation(); StorageService.togglePin(id, isPinned); }} 
                onDelete={(e, id) => { e.stopPropagation(); StorageService.deleteChatSession(id); }} 
              />
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`
        ${!showListOnMobile ? 'flex' : 'hidden'} lg:flex
        flex-1 flex-col bg-black relative w-full
      `}>
        {currentSession ? (
          <>
            <header className="h-14 px-4 flex items-center justify-between shrink-0 bg-black z-20">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowListOnMobile(true)} className="lg:hidden p-2 text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex items-center gap-2 cursor-pointer hover:bg-[#212121] px-3 py-1.5 rounded-lg transition-colors">
                  <span className="text-[15px] font-semibold text-gray-200">{currentSession.title}</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#2F2F2F] text-white text-[13px] font-semibold hover:bg-[#3F3F3F] transition-colors">
                    <span className="text-amber-400">✦</span>
                    Upgrade
                 </button>
                 <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold border border-white/10">
                    EDU
                 </div>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-0 custom-scrollbar scroll-smooth">
              <div className="max-w-3xl mx-auto w-full pt-4 pb-32 px-4">
                 {currentSession.messages.map(m => (
                    <div key={m.id} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
                       <div className={`max-w-[85%] lg:max-w-[75%] flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                             {m.role === 'user' 
                               ? <div className="w-full h-full bg-[#555]"></div> 
                               : <div className="w-full h-full bg-amber-600 flex items-center justify-center"><span className="text-white font-bold text-xs">AI</span></div>
                             }
                          </div>
                          
                          <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`
                               py-2.5 px-5 rounded-[20px] text-[15px] leading-7
                               ${m.role === 'user' 
                                 ? 'bg-[#2F2F2F] text-white' 
                                 : 'text-gray-100 bg-transparent px-0 py-0'
                               }
                            `}>
                               <div className="whitespace-pre-wrap">{m.content}</div>
                            </div>
                          </div>
                       </div>
                    </div>
                 ))}
                 {isLoading && (
                    <div className="flex w-full justify-start mb-6">
                       <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center shrink-0">
                             <span className="text-white font-bold text-xs">AI</span>
                          </div>
                          <div className="pt-2">
                             <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                             </div>
                             {streamingText && <div className="mt-2 text-gray-300 text-[15px] leading-7 whitespace-pre-wrap">{streamingText}</div>}
                          </div>
                       </div>
                    </div>
                 )}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black to-transparent pt-10 pb-6 px-4">
               <div className="max-w-3xl mx-auto w-full relative">
                  <div className="bg-[#2F2F2F] rounded-[26px] p-2 pl-3 flex items-end gap-2 shadow-lg ring-1 ring-white/5">
                     <button className="w-8 h-8 rounded-full bg-transparent hover:bg-[#3F3F3F] text-gray-400 hover:text-white flex items-center justify-center shrink-0 mb-0.5 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                     </button>
                     <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder="Pergunte ao Professor..."
                        rows={1}
                        className="flex-1 bg-transparent text-white text-[15px] placeholder-gray-500 outline-none resize-none py-3 max-h-[150px] custom-scrollbar"
                     />
                     <button 
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className={`
                           w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all
                           ${(input.trim()) 
                              ? 'bg-white text-black hover:bg-gray-200' 
                              : 'bg-[#676767] text-[#2F2F2F]'
                           }
                        `}
                     >
                        {input.trim() ? (
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        ) : (
                            <svg className="w-4 h-4 text-[#1A1A1A]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                        )}
                     </button>
                  </div>
                  <p className="text-center text-[10px] text-gray-500 mt-3 font-medium">FinAIGPT pode cometer erros. Verifique informações importantes.</p>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
            <div className="w-24 h-24 bg-amber-600 text-white rounded-[20px] flex items-center justify-center text-4xl mb-6 shadow-2xl">
              🎓
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sala de Aula Virtual</h3>
            <p className="text-sm font-medium text-gray-400 max-w-xs leading-relaxed">Selecione uma aula no histórico ou inicie um novo tema agora.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentArea;
