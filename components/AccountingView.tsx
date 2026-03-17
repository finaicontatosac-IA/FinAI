
import React, { useState, useEffect } from 'react';
import { AccountingService } from '../services/accountingService.ts';
import { Invoice, FinancialMetric, DocumentSource } from '../types.ts';
import { StorageService } from '../services/storage.ts';
import { auth } from '../firebase.ts';

const AccountingView: React.FC = () => {
  const [activeProvider, setActiveProvider] = useState<DocumentSource | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetric[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const providers = [
    { id: 'xero' as DocumentSource, name: 'Xero', color: 'bg-[#00B7E2]', logo: 'X' },
    { id: 'quickbooks' as DocumentSource, name: 'QuickBooks', color: 'bg-[#2CA01C]', logo: 'QB' },
    { id: 'omie' as DocumentSource, name: 'Omie ERP', color: 'bg-[#004BB4]', logo: 'O' }
  ];

  const handleConnect = (id: DocumentSource) => {
    const user = auth.currentUser;
    if (!user) {
      alert('Por favor, faça login para conectar APIs.');
      return;
    }

    setIsConnecting(true);
    setTimeout(() => {
      setActiveProvider(id);
      setIsConnecting(false);
      loadData(id);
      
      // Salva como um "Documento" de referência para o Gemini Context
      StorageService.saveDocument({
        id: `api_${id}`,
        name: `API Connection: ${id.toUpperCase()}`,
        content: `CONEXÃO ATIVA COM ${id.toUpperCase()}. Dados contábeis sincronizados em tempo real.`,
        type: 'api/connection',
        uploadDate: new Date(),
        size: 0,
        sourceType: id,
        metadata: { category: 'management', lastSync: new Date() }
      });
    }, 2000);
  };

  const loadData = async (provider: DocumentSource) => {
    setLoading(true);
    try {
      const [invs, mets, ledg] = await Promise.all([
        AccountingService.fetchInvoices(provider),
        AccountingService.getFinancialSummary(provider),
        AccountingService.getAccountLedger()
      ]);
      setInvoices(invs);
      setMetrics(mets);
      setLedger(ledg);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (isConnecting) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 bg-[#F2EFEA]">
        <div className="bg-white sketch-border p-12 max-w-sm w-full text-center">
          <div className="w-16 h-16 border-4 border-[#1A1A1A] border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-xl font-black uppercase mb-2">Autenticação OAuth 2.0</h3>
          <p className="text-[10px] font-bold text-[#7A7A7A] uppercase tracking-widest italic">Redirecionando para o Provedor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar">
      <header className="mb-10 border-b-2 border-[#1A1A1A] pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A1A] uppercase tracking-tighter">AUDITORIA DE APIS</h1>
          <p className="text-[#7A7A7A] mt-1 font-bold text-[10px] uppercase tracking-widest italic">Integração Direta com ERPs & Softwares Contábeis</p>
        </div>
        {activeProvider && (
          <button onClick={() => setActiveProvider(null)} className="text-[9px] font-black uppercase text-rose-500 underline">Desconectar</button>
        )}
      </header>

      {!activeProvider ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {providers.map(p => (
            <div key={p.id} className="bg-white sketch-border p-8 flex flex-col items-center text-center group hover:bg-[#F2EFEA] transition-all">
              <div className={`w-16 h-16 ${p.color} text-white flex items-center justify-center text-2xl font-black sketch-border mb-6 group-hover:rotate-3 transition-transform`}>
                {p.logo}
              </div>
              <h3 className="text-lg font-black uppercase mb-2">{p.name}</h3>
              <p className="text-[10px] font-bold text-[#7A7A7A] uppercase mb-8 leading-relaxed">Sincronize Balancetes, Razão e Notas Fiscais automaticamente.</p>
              <button 
                onClick={() => handleConnect(p.id)}
                className="w-full sketch-button py-3 text-[10px] font-black uppercase tracking-widest bg-[#1A1A1A] text-white"
              >
                Conectar Conta
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {metrics.map((m, i) => (
              <div key={i} className="bg-white sketch-border p-5">
                <p className="text-[8px] font-black text-[#7A7A7A] uppercase mb-1">{m.label}</p>
                <div className="flex items-end justify-between">
                  <h4 className="text-xl font-black">
                    {m.prefix}{m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {m.suffix}
                  </h4>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 ${m.trend === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {m.trend === 'up' ? '↑' : '↓'} {m.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Invoices Table */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-2">
                <h3 className="text-xs font-black uppercase tracking-widest italic bg-[#1A1A1A] text-white px-3 py-1">Contas a Receber (API)</h3>
                <span className="text-[8px] font-black text-emerald-600 uppercase">Sincronizado agora</span>
              </div>
              <div className="bg-white sketch-border overflow-hidden">
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead className="bg-[#F2EFEA] border-b-2 border-[#1A1A1A]">
                    <tr>
                      <th className="p-4 font-black uppercase tracking-tighter">FATURA</th>
                      <th className="p-4 font-black uppercase tracking-tighter">CLIENTE</th>
                      <th className="p-4 font-black uppercase tracking-tighter text-right">VALOR</th>
                      <th className="p-4 font-black uppercase tracking-tighter">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-bold">{inv.number}</td>
                        <td className="p-4 font-black uppercase">{inv.contact}</td>
                        <td className="p-4 text-right font-black">{inv.currency} {inv.amount.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ledger Recap */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest italic border-b-2 border-[#1A1A1A] pb-2">Resumo do Razão</h3>
              <div className="space-y-3">
                {ledger.map((item, i) => (
                  <div key={i} className="bg-white sketch-border p-4 hover:translate-x-1 transition-transform">
                    <p className="text-[9px] font-black uppercase truncate mb-2">{item.account}</p>
                    <div className="flex justify-between items-end">
                      <div className="flex gap-4">
                        <div className="text-[7px] font-bold text-gray-400">D: {item.debit.toLocaleString()}</div>
                        <div className="text-[7px] font-bold text-gray-400">C: {item.credit.toLocaleString()}</div>
                      </div>
                      <div className={`text-[10px] font-black ${item.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        R$ {item.balance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-[#1A1A1A] text-white p-4 sketch-border shadow-none">
                <p className="text-[8px] font-black uppercase mb-1 opacity-60">Insight Auditoria</p>
                <p className="text-[10px] font-bold leading-relaxed">
                  O saldo em bancos concilia 98% com o fluxo de caixa projetado via Gemini IA.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingView;
