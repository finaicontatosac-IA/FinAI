
import { Candle } from '../types.ts';

export interface MarketRates {
  usd_brl: number;
  eur_brl: number;
  gbp_brl: number;
  btc_brl: number;
  eth_brl: number;
  last_update: string;
}

export interface StockInfo {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
}

export interface AnalyticsMetrics {
  activeUsers: number;
  sessions: number;
  conversionRate: number;
  revenue: number;
  previousActiveUsers: number;
}

const getIntervalMinutes = (interval: string): number => {
  const value = parseInt(interval);
  if (isNaN(value)) return 60;
  if (interval.endsWith('m')) return value;
  if (interval.endsWith('h')) return value * 60;
  if (interval.endsWith('d')) return value * 1440;
  return 60; // default
};

export const MarketService = {
  fetchExchangeRates: async (): Promise<MarketRates> => {
    try {
      const fiatResponse = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!fiatResponse.ok) throw new Error('API Fiduciária Down');
      const fiatData = await fiatResponse.json();
      const brl = fiatData.rates.BRL || 5.80;
      const eurRate = fiatData.rates.EUR || 0.92;
      const gbpRate = fiatData.rates.GBP || 0.78;

      const [btcRes, ethRes] = await Promise.all([
        fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCBRL').catch(() => null),
        fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHBRL').catch(() => null)
      ]);

      let btc_brl = 0;
      let eth_brl = 0;

      if (btcRes?.ok) {
        const data = await btcRes.json();
        btc_brl = parseFloat(data.price);
      } else {
        btc_brl = brl * 65000; // Fallback estimate
      }

      if (ethRes?.ok) {
        const data = await ethRes.json();
        eth_brl = parseFloat(data.price);
      } else {
        eth_brl = brl * 3500; // Fallback estimate
      }

      return {
        usd_brl: brl,
        eur_brl: brl / eurRate,
        gbp_brl: brl / gbpRate,
        btc_brl: btc_brl,
        eth_brl: eth_brl,
        last_update: new Date().toISOString()
      };
    } catch (e) {
      console.error("Market API Error:", e);
      return {
        usd_brl: 5.85,
        eur_brl: 6.35,
        gbp_brl: 7.50,
        btc_brl: 450000,
        eth_brl: 18000,
        last_update: new Date().toISOString()
      };
    }
  },

  fetchStockData: async (rates: MarketRates): Promise<StockInfo[]> => {
    return [
      { symbol: 'BTC', name: 'Bitcoin', price: `R$ ${rates.btc_brl.toLocaleString('pt-BR')}`, change: '+2.4%', isPositive: true },
      { symbol: 'ETH', name: 'Ethereum', price: `R$ ${rates.eth_brl.toLocaleString('pt-BR')}`, change: '-0.8%', isPositive: false },
      { symbol: 'USD', name: 'Dólar Comercial', price: `R$ ${rates.usd_brl.toFixed(2)}`, change: '+0.12%', isPositive: true },
      { symbol: 'EUR', name: 'Euro Comercial', price: `R$ ${rates.eur_brl.toFixed(2)}`, change: '-0.05%', isPositive: false },
      { symbol: 'IBOV', name: 'Ibovespa', price: '128.450', change: '+1.25%', isPositive: true },
      { symbol: 'PETR4', name: 'Petrobras', price: 'R$ 38,40', change: '+2.1%', isPositive: true },
      { symbol: 'VALE3', name: 'Vale ON', price: 'R$ 65,20', change: '-1.4%', isPositive: false },
    ];
  },

  fetchHistoricalCandles: async (symbol: string, interval: string): Promise<Candle[]> => {
    const count = 60;
    const now = new Date();
    const intervalMins = getIntervalMinutes(interval);
    
    // Simulate realistic base prices
    const basePrices: Record<string, number> = {
      'BTC': 450000,
      'ETH': 18000,
      'USD': 5.80,
      'EUR': 6.30,
      'IBOV': 128000,
      'PETR4': 38,
      'VALE3': 65
    };

    const basePrice = basePrices[symbol] || 100;
    const candles: Candle[] = [];
    let currentPrice = basePrice * (0.95 + Math.random() * 0.1);

    for (let i = count; i >= 0; i--) {
      const time = new Date(now.getTime() - i * intervalMins * 60 * 1000);
      const volatility = basePrice * 0.005;
      const open = currentPrice;
      const close = open + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * (volatility * 0.3);
      const low = Math.min(open, close) - Math.random() * (volatility * 0.3);
      
      candles.push({
        time: time.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          ...(intervalMins >= 1440 ? { day: '2-digit', month: '2-digit' } : {})
        }),
        open,
        high,
        low,
        close
      });
      currentPrice = close;
    }

    return candles;
  },

  fetchMockAnalytics: async (propertyId: string): Promise<AnalyticsMetrics> => {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Seed random based on propertyId string to keep it semi-consistent
    const seed = propertyId.length;
    return {
      activeUsers: 1240 + Math.floor(Math.random() * 500),
      sessions: 3500 + Math.floor(Math.random() * 1000),
      conversionRate: 2.4 + (Math.random() * 1.5),
      revenue: 45200 + Math.floor(Math.random() * 15000),
      previousActiveUsers: 1100 + Math.floor(Math.random() * 200)
    };
  }
};
