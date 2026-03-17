import React, { useState, useEffect, useRef } from 'react';
import { Document, DocumentSource } from '../types.ts';
import { StorageService } from '../services/storage.ts';
import { auth } from '../firebase.ts';

const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [parsingStatus, setParsingStatus] = useState<string>('');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<DocumentSource>('google_docs');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = StorageService.getDocuments(user.uid, (docs) => {
      setDocuments(docs);
    });

    return () => unsubscribe();
  }, []);

  const deleteDoc = async (id: string) => {
    if (window.confirm("Remover permanentemente da base de conhecimento?")) {
      await StorageService.deleteDocument(id);
    }
  };

  return (
    <div className="p-6 lg:p-12 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1A1A1A]">Knowledge Base</h1>
          <p className="text-gray-400 font-medium text-sm mt-1 italic">Gestão de Documentos & Indexação RAG em Tempo Real</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="modern-button bg-gray-50 !text-[#1A1A1A] border border-gray-200"
          >
            Upload Local
          </button>
          <button className="modern-button bg-[#4285F4] shadow-lg shadow-blue-500/20">Google Cloud Sync</button>
          <input type="file" ref={fileInputRef} className="hidden" multiple />
        </div>
      </header>

      {/* Quick Link Entry */}
      <section className="bg-white rounded-[2rem] p-10 mb-12 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Indexação de Recursos Externos</h3>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <select 
            value={selectedProvider} 
            onChange={(e) => setSelectedProvider(e.target.value as DocumentSource)}
            className="bg-gray-50 px-6 py-4 rounded-2xl text-[11px] font-bold text-[#1A1A1A] outline-none border border-transparent focus:border-blue-200"
          >
            <option value="google_docs">Google Docs</option>
            <option value="google_sheets">Google Sheets</option>
            <option value="google_analytics">Google Analytics</option>
          </select>
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Cole a URL do documento aqui..."
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="w-full bg-gray-50 px-6 py-4 rounded-2xl text-[11px] font-bold outline-none border border-transparent focus:border-blue-200"
            />
          </div>
          <button className="modern-button px-10">Conectar Fonte</button>
        </div>
      </section>

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm group hover:shadow-xl hover:shadow-black/5 transition-all duration-300 flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-bold text-gray-400 text-xs">
                {doc.sourceType.charAt(0).toUpperCase()}
              </div>
              <button 
                onClick={() => deleteDoc(doc.id)}
                className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <h4 className="text-xs font-bold text-[#1A1A1A] truncate mb-2">{doc.name}</h4>
            <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-gray-300 uppercase">{new Date(doc.uploadDate).toLocaleDateString()}</span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase mt-0.5 tracking-tighter">Pronto para RAG</span>
              </div>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            </div>
          </div>
        ))}
      </div>

      {isUploading && (
        <div className="fixed bottom-12 right-12 bg-[#1A1A1A] text-white px-8 py-4 rounded-2xl shadow-2xl z-[110] flex items-center gap-4 animate-in slide-in-from-bottom-10">
          <div className="w-4 h-4 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">{parsingStatus || 'Indexando...'}</p>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;