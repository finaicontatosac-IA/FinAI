
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  sources?: string[];
  image?: {
    data: string;
    mimeType: string;
  };
}

export type SyncStatus = 'synced' | 'pending' | 'local' | 'conflict' | 'syncing';

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdate: Date;
  updatedAt: string;
  deletedAt?: Date;
  syncStatus?: SyncStatus;
  syncedAt?: Date;
  version: number;
  isPinned?: boolean;
  userId?: string;
}

export type DocumentSource = 'local' | 'google_docs' | 'google_sheets' | 'google_analytics' | 'google_drive' | 'google_slides' | 'xero' | 'quickbooks' | 'omie';

export interface Document {
  id: string;
  name: string;
  content: string;
  type: string;
  uploadDate: Date;
  size: number;
  sourceType: DocumentSource;
  externalUrl?: string;
  userId?: string;
  metadata?: {
    propertyId?: string;
    lastSync?: Date;
    category?: 'cost' | 'tax' | 'management' | 'general' | 'exercise';
  };
}

// Accounting Types
export interface Invoice {
  id: string;
  number: string;
  contact: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'PAID' | 'DUE' | 'VOID' | 'DRAFT';
  currency: string;
}

export interface FinancialMetric {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend: 'up' | 'down' | 'neutral';
  change: number;
}

export enum ViewState {
  Dashboard = 'DASHBOARD',
  StudentArea = 'STUDENT_AREA',
  Chat = 'CHAT',
  FinancialAI = 'FINANCIAL_AI',
  Documents = 'DOCUMENTS',
  Accounting = 'ACCOUNTING',
  Reports = 'REPORTS',
  Trash = 'TRASH'
}

// Interface for News results from Gemini
export interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  source: string;
  time: string;
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

// Interface for market chart candles
export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}
