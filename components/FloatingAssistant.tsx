
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService.ts';
import { Message, Document } from '../types.ts';
import { StorageService } from '../services/storage.ts';
import { auth } from '../firebase.ts';

const FloatingAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Olá! Sou seu assistente rápido de auditoria. Qual sua dúvida financeira agora?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = StorageService.getDocuments(user.uid, (docs) => {
      setDocuments(docs);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const response = await GeminiService.generateChatResponseStream(
        input, 
        [...messages, userMsg], 
        (chunk) => {},
        documents
      );
      const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, modelMsg]);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col items-end">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-12 h-12 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center shadow-xl shadow-black/20 transition-all duration-300 active:scale-90
          ${isOpen ? 'rotate-180 scale-90' : 'hover:scale-105 hover:translate-y-1'}
        `}
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-lg font-black">F</span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="mt-4 w-[350px] md:w-[400px] h-[600px] bg-black rounded-[26px] flex flex-col overflow-hidden shadow-2xl shadow-black/50 border border-[#333] animate-in slide-in-from-top-6 fade-in duration-500">
          <header className="p-4 flex items-center justify-between border-b border-[#212121]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-xs">AI</div>
              <div>
                <h3 className="text-sm font-semibold text-white">Smart Support</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-medium text-gray-400">Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-black">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[85%] px-4 py-2.5 text-[14px] leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-[#2F2F2F] text-white rounded-[20px]' 
                    : 'text-gray-200 bg-transparent pl-0'
                  }
                `}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start px-0">
                 <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                 </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-black">
            <div className="bg-[#2F2F2F] rounded-[26px] p-2 pl-4 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message..."
                className="flex-1 bg-transparent text-white text-[15px] outline-none placeholder-gray-500"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${(input.trim()) ? 'bg-white text-black' : 'bg-[#676767] text-[#2F2F2F]'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingAssistant;
