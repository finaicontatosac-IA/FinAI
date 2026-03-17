
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage.ts';

interface Workbook {
  id: string;
  title: string;
  type: string;
  size: string;
  status: 'READY' | 'SYNCING';
  date: string;
}

const Reports: React.FC = () => {
  const [workbooks, setWorkbooks] = useState<Workbook[]>([
    { id: 'wb1', title: 'Workbook: Valuation DCF - Setor Tech', type: 'Google Sheets', size: '1.2MB', status: 'READY', date: '15/05/2024' },
    { id: 'wb2', title: 'Workbook: Cálculo Simples Nacional 2024', type: 'Google Sheets', size: '0.8MB', status: 'READY', date: '14/05/2024' },
    { id: 'wb3', title: 'Workbook: Projeção de Fluxo de Caixa Q3', type: 'Excel/CSV', size: '2.5MB', status: 'READY', date: '10/05/2024' },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [calcInput, setCalcInput] = useState('');

  const reports = [
    { title: 'DRE - DEMONSTRATIVO DE RESULTADO', lastGenerated: '02/11/23', status: 'OK' },
    { title: 'BALANÇO PATRIMONIAL', lastGenerated: '01/11/23', status: 'OK' },
    { title: 'FLUXO DE CAIXA DIRETO', lastGenerated: '30/10/23', status: 'REVISÃO' },
    { title: 'RELATÓRIO DE IMPOSTOS', lastGenerated: '28/10/23', status: 'OK' },
  ];

  const handleGenerateWorkbook = () => {
    if (!calcInput.trim() || isGenerating) return;
    
    setIsGenerating(true);
    // Simula a IA processando documentos RAG para gerar a planilha
    setTimeout(() => {
      const newWb: Workbook = {
        id: Math.random().toString(36).substr(2, 9),
        title: `Workbook: ${calcInput.toUpperCase()}`,
        type: 'Google Sheets',
        size: '1.1MB',
        status: 'READY',
        date: new Date().toLocaleDateString('pt-BR')
      };
      setWorkbooks(prev => [newWb, ...prev]);
      setIsGenerating(false);
      setCalcInput('');
      alert("Cálculo finalizado! Workbook gerado e disponível para sincronização com Google Drive.");
    }, 3000);
  };

  const syncWithDrive = (title: string) => {
    alert(`Sincronizando "${title}"... Os dados foram organizados em colunas e as fórmulas contábeis foram preservadas no seu Google Drive.`);
  };

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto h-full overflow-y-auto custom-scrollbar bg-[#F2EFEA]">
      <header className="mb-12 border-b-2 border-[#1A1A1A] pb-8 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A1A] uppercase tracking-tighter">RELATÓRIOS & PLANILHAS</h1>
          <p className="text-[#7A7A7A] mt-2 font-bold text-[10px] uppercase tracking-widest italic">Hub de Geração de Workbooks via IA & Google Cloud</p>
        </div>
        <div className="flex gap-2">
           <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-3 py-1 sketch-border shadow-none border-emerald-700">GOOGLE DRIVE CONNECTED</span>
        </div>
      </header>

      {/* Hub de Cálculos RAG */}
      <section className="bg-[#1A1A1A] p-8 text-[#F2EFEA] sketch-border mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-2h2v2zm0-4H7v-2h2v2zm0-4H7V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>
        </div>
        
        <div className="relative z-10">
          <h3 className="text-xl font-black mb-2 uppercase italic tracking-tighter">CALCULADORA RAG DE WORKBOOKS</h3>
          <p className="text-[#B5B5B5] text-[10px] font-bold mb-8 tracking-widest uppercase">Transforme análises de IA em planilhas estruturadas instantaneamente.</p>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-2xl">
            <input 
              type="text" 
              value={calcInput}
              onChange={(e) => setCalcInput(e.target.value)}
              placeholder="Ex: Auditoria de Custos de Marketing 2024..."
              className="flex-1 bg-[#4A4A4A] border-2 border-[#F2EFEA]/20 p-4 text-[10px] font-black uppercase outline-none focus:bg-[#1A1A1A] transition-colors"
            />
            <button 
              onClick={handleGenerateWorkbook}
              disabled={isGenerating || !calcInput.trim()}
              className="bg-[#F2EFEA] text-[#1A1A1A] font-black py-4 px-10 uppercase text-[10px] tracking-widest hover:bg-white transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'PROCESSANDO...' : 'GERAR WORKBOOK'}
            </button>
          </div>
          {isGenerating && (
            <p className="text-emerald-400 text-[8px] font-black uppercase mt-4 animate-pulse">● Acessando base de documentos e aplicando normas CPC/IFRS...</p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Lista de Demonstrativos PDF */}
        <div className="lg:col-span-2">
          <h3 className="text-[10px] font-black text-[#1A1A1A] mb-6 uppercase tracking-widest border-b-2 border-[#1A1A1A] pb-2 inline-block italic">Demonstrativos Gerenciais (PDF)</h3>
          <div className="space-y-4">
            {reports.map((report, idx) => (
              <div key={idx} className="bg-white p-5 sketch-border flex items-center justify-between hover:bg-[#F2EFEA] transition-colors group">
                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 bg-[#1A1A1A] text-white flex items-center justify-center font-black text-[10px] sketch-border shadow-none">PDF</div>
                  <div>
                    <h4 className="font-black text-[#1A1A1A] text-[10px] uppercase tracking-tight">{report.title}</h4>
                    <p className="text-[#7A7A7A] text-[8px] font-bold uppercase tracking-widest mt-1">Auditado: {report.lastGenerated}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[7px] font-black px-2 py-0.5 ${report.status === 'OK' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    STATUS: {report.status}
                  </span>
                  <button className="text-[#1A1A1A] font-black text-[9px] uppercase underline hover:no-underline transition-all">Download</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Planilhas Google Drive */}
        <div className="lg:col-span-1">
          <h3 className="text-[10px] font-black text-[#1A1A1A] mb-6 uppercase tracking-widest border-b-2 border-[#1A1A1A] pb-2 inline-block italic">Workbooks Cloud (Sheets)</h3>
          <div className="space-y-4">
            {workbooks.map((wb) => (
              <div key={wb.id} className="bg-white p-4 sketch-border flex flex-col gap-3 group hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start">
                  <h4 className="font-black text-[#1A1A1A] text-[9px] uppercase leading-tight max-w-[150px]">{wb.title}</h4>
                  <span className="text-[7px] font-black bg-emerald-600 text-white px-2 py-0.5">DRIVE</span>
                </div>
                <div className="flex justify-between items-end border-t border-gray-100 pt-3">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[7px] font-bold text-[#7A7A7A] uppercase">{wb.type} • {wb.size}</p>
                    <p className="text-[7px] font-bold text-[#7A7A7A] uppercase">Criado em: {wb.date}</p>
                  </div>
                  <button 
                    onClick={() => syncWithDrive(wb.title)}
                    className="text-[9px] font-black text-[#1A1A1A] uppercase bg-[#F2EFEA] px-3 py-1 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all"
                  >
                    Sync
                  </button>
                </div>
              </div>
            ))}
            
            <div className="p-4 bg-emerald-50 border-2 border-emerald-200 text-center">
              <p className="text-[8px] font-black text-emerald-700 uppercase leading-relaxed">
                As fórmulas nestas planilhas são dinâmicas e baseadas em RAG Auditor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
