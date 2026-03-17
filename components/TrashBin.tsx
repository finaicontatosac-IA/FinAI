import React, { useState, useEffect } from 'react';
import { ChatSession } from '../types.ts';
import { StorageService } from '../services/storage.ts';
import { auth } from '../firebase.ts';

const TrashBin: React.FC = () => {
  const [deletedSessions, setDeletedSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const types = ['accounting', 'financial', 'student'];
    const unsubscribes = types.map(type => 
      StorageService.getChatSessions(user.uid, type, (sessions) => {
        setDeletedSessions(prev => {
          const filteredPrev = prev.filter(s => !sessions.some(ns => ns.id === s.id));
          const currentTypeDeleted = sessions.filter(s => !!s.deletedAt);
          return [...filteredPrev, ...currentTypeDeleted].sort((a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime());
        });
      })
    );

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const handlePermanentDelete = (id: string) => {
    if (window.confirm("ALERTA DE SEGURANÇA: Esta ação é IRREVERSÍVEL. Deseja excluir permanentemente este chat e todos os seus metadados do terminal?")) {
      StorageService.deletePermanently(id);
      setDeletedSessions(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleRestore = (id: string) => {
    StorageService.restoreChatSession(id);
    setDeletedSessions(prev => prev.filter(s => s.id !== id));
  };

  const getDaysLeft = (deletedAt?: Date) => {
    if (!deletedAt) return 0;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - deletedAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  };

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto h-full overflow-y-auto custom-scrollbar bg-[#F2EFEA]">
      <header className="mb-12 border-b-2 border-[#1A1A1A] pb-8">
        <h1 className="text-3xl font-black text-[#1A1A1A] uppercase tracking-tighter">PROTOCOLO DE EXPURGO</h1>
        <p className="text-[#7A7A7A] mt-2 font-bold text-[10px] uppercase tracking-widest italic">Lixeira de Chats • Apenas Exclusão Definitiva Certificada</p>
      </header>

      {deletedSessions.length === 0 ? (
        <div className="bg-white sketch-border p-20 text-center animate-in fade-in zoom-in duration-300">
          <svg className="w-16 h-16 mx-auto mb-6 text-[#B5B5B5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <h3 className="text-xl font-black uppercase mb-2">Terminal Limpo</h3>
          <p className="text-[#7A7A7A] text-[10px] font-bold uppercase tracking-widest">Nenhuma consulta aguardando expurgo definitivo.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-5 bg-[#1A1A1A] text-white sketch-border mb-8">
            <div className="w-10 h-10 border-2 border-rose-500 text-rose-500 flex items-center justify-center font-black animate-pulse">!</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                AVISO DE PRIVACIDADE: Itens deletados não podem ser recuperados. 
                <br/>
                O terminal realiza a limpeza física dos dados após 30 dias ou via comando manual abaixo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pb-20">
            {deletedSessions.map((session) => {
              const daysLeft = getDaysLeft(session.deletedAt);
              return (
                <div 
                  key={session.id} 
                  className="bg-white p-6 sketch-border flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-rose-50 transition-colors group gap-6"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-[#F2EFEA] text-[#1A1A1A] flex flex-col items-center justify-center sketch-border shadow-none group-hover:bg-white">
                      <span className="text-[8px] font-black leading-none mb-1">MSGS</span>
                      <span className="text-lg font-black">{session.messages.length}</span>
                    </div>
                    <div>
                      <h4 className="font-black text-[#1A1A1A] text-xs uppercase tracking-tight truncate max-w-[300px]">
                        {session.title || 'Consulta sem título'}
                      </h4>
                      <p className="text-[#7A7A7A] text-[8px] font-bold uppercase tracking-widest mt-1">
                        Deletado em: {session.deletedAt?.toLocaleDateString()} • Expira em {daysLeft} dias
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <button 
                      onClick={() => handleRestore(session.id)}
                      className="w-full md:w-auto border-2 border-[#1A1A1A] text-[#1A1A1A] px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95"
                    >
                      Restaurar
                    </button>
                    <button 
                      onClick={() => handlePermanentDelete(session.id)}
                      className="w-full md:w-auto border-2 border-[#EF4444] text-[#EF4444] px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#EF4444] hover:text-white transition-all active:scale-95"
                    >
                      Expurgar Dados
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashBin;