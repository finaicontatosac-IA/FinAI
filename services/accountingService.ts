
import { Invoice, FinancialMetric, DocumentSource } from '../types.ts';

export const AccountingService = {
  fetchInvoices: async (provider: DocumentSource): Promise<Invoice[]> => {
    // Simulação de delay de rede da API externa
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockInvoices: Record<string, Invoice[]> = {
      xero: [
        { id: 'x1', number: 'INV-001', contact: 'Google Cloud Services', date: '2024-05-01', dueDate: '2024-05-30', amount: 4500.00, status: 'PAID', currency: 'BRL' },
        { id: 'x2', number: 'INV-002', contact: 'AWS Enterprise', date: '2024-05-15', dueDate: '2024-06-15', amount: 8920.50, status: 'DUE', currency: 'BRL' },
        { id: 'x3', number: 'INV-003', contact: 'Local Office Rental', date: '2024-05-10', dueDate: '2024-05-10', amount: 12000.00, status: 'PAID', currency: 'BRL' },
      ],
      quickbooks: [
        { id: 'q1', number: 'QB-9982', contact: 'Microsoft 365', date: '2024-05-02', dueDate: '2024-05-02', amount: 1540.20, status: 'PAID', currency: 'BRL' },
        { id: 'q2', number: 'QB-9983', contact: 'Figma Pro', date: '2024-05-12', dueDate: '2024-06-12', amount: 450.00, status: 'DUE', currency: 'BRL' },
      ]
    };

    return mockInvoices[provider as string] || [];
  },

  getFinancialSummary: async (provider: DocumentSource): Promise<FinancialMetric[]> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return [
      { label: 'RECEITA BRUTA', value: 125400.00, prefix: 'R$', trend: 'up', change: 12.5 },
      { label: 'CONTAS A PAGAR', value: 34200.50, prefix: 'R$', trend: 'down', change: 4.2 },
      { label: 'LUCRO LÍQUIDO (EBITDA)', value: 45800.00, prefix: 'R$', trend: 'up', change: 8.9 },
      { label: 'LIQUIDEZ CORRENTE', value: 2.45, suffix: ' pts', trend: 'neutral', change: 0.2 },
    ];
  },

  getAccountLedger: async () => {
    return [
      { account: '1.1.01 - Caixa Geral', debit: 50000, credit: 0, balance: 50000 },
      { account: '1.1.02 - Bancos Conta Movimento', debit: 120000, credit: 45000, balance: 75000 },
      { account: '2.1.01 - Fornecedores Nacionais', debit: 15000, credit: 45000, balance: -30000 },
      { account: '3.1.01 - Receita de Vendas', debit: 0, credit: 150000, balance: -150000 },
    ];
  }
};
