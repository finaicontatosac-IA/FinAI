
import React, { useState, useEffect } from 'react';
import { MarketService, MarketRates, StockInfo } from '../services/marketService.ts';
import { Candle } from '../types.ts';

const Dashboard: React.FC = () => {
  const [rates, setRates] = useState<MarketRates | null>(null);
  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [timeframe, setTimeframe] = useState('1h');
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoadingMarket(true);
      try {
        const rateData = await MarketService.fetchExchangeRates();
        const [stockData, candleData] = await Promise.all([
          MarketService.fetchStockData(rateData),
          MarketService.fetchHistoricalCandles(selectedAsset, timeframe)
        ]);
        setRates(rateData);
        setStocks(stockData);
        setCandles(candleData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMarket(false);
      }
    };
    loadData();
  }, [selectedAsset, timeframe]);

  // Calculations for Chart Scaling
  const allHighs = candles.map(c => c.high);
  const allLows = candles.map(c => c.low);
  const maxPrice = Math.max(...allHighs);
  const minPrice = Math.min(...allLows);
  const priceRange = maxPrice - minPrice || 1;

  const getPercent = (price: number) => {
    return ((price - minPrice) / priceRange) * 100;
  };

  return (
    <div className="p-6 lg:p-12 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar bg-[#F2EFEA]">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">Sincronizado via RAG</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1A1A1A]">Visão Geral</h1>
          <p className="text-gray-400 font-medium text-sm mt-1">Terminal de Inteligência Financeira & IA Auditora</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Atualizado</span>
            <span className="text-xs font-bold text-[#1A1A1A]">{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </header>

      {/* Asset Selection Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-10">
        {stocks.map((stock) => (
          <button 
            key={stock.symbol}
            onClick={() => setSelectedAsset(stock.symbol)}
            className={`
              p-5 rounded-2xl transition-all duration-300 text-left border
              ${selectedAsset === stock.symbol 
                ? 'bg-[#1A1A1A] border-[#1A1A1A] shadow-xl shadow-black/10 scale-105 z-10' 
                : 'bg-white border-gray-100 hover:border-gray-300 shadow-sm'
              }
            `}
          >
            <p className={`text-[10px] font-bold uppercase tracking-tight mb-1 ${selectedAsset === stock.symbol ? 'text-gray-400' : 'text-gray-400'}`}>
              {stock.symbol}
            </p>
            <h4 className={`text-sm font-bold truncate mb-2 ${selectedAsset === stock.symbol ? 'text-white' : 'text-[#1A1A1A]'}`}>
              {stock.price}
            </h4>
            <span className={`text-[10px] font-bold ${stock.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {stock.isPositive ? '↑' : '↓'} {stock.change}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg font-bold">
                {selectedAsset.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A]">{selectedAsset} Market</h3>
                <p className="text-xs text-gray-400 font-medium">Intervalo: {timeframe} • Fonte: Binance/B3</p>
              </div>
            </div>
            <div className="flex bg-gray-50 p-1 rounded-xl">
              {['1h', '4h', '1d', '1w'].map(tf => (
                <button 
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${timeframe === tf ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Candlestick Chart */}
          <div className="flex-1 w-full relative mt-4 border-l border-b border-gray-100" onMouseLeave={() => setHoveredCandle(null)}>
             {/* Grid Lines */}
             <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map(i => (
                   <div key={i} className="w-full h-px bg-gray-50"></div>
                ))}
             </div>

             {/* Chart Area */}
             <div className="absolute inset-0 flex items-end justify-between px-4 pb-0 pt-4 gap-[2px]">
                {loadingMarket ? (
                   <div className="w-full h-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-gray-100 border-t-gray-400 rounded-full animate-spin"></div>
                   </div>
                ) : (
                   candles.map((c, i) => {
                      const isGreen = c.close >= c.open;
                      const highPct = getPercent(c.high);
                      const lowPct = getPercent(c.low);
                      const openPct = getPercent(c.open);
                      const closePct = getPercent(c.close);
                      
                      const wickHeight = highPct - lowPct;
                      const bodyBottom = Math.min(openPct, closePct);
                      const bodyHeight = Math.abs(openPct - closePct);
                      
                      return (
                         <div 
                           key={i} 
                           className="flex-1 h-full relative group cursor-crosshair hover:z-20"
                           onMouseEnter={() => setHoveredCandle(c)}
                         >
                            {/* Hover Guide Line */}
                            <div className="hidden group-hover:block absolute top-0 bottom-0 left-1/2 w-px bg-gray-200 -translate-x-1/2 z-0"></div>
                            
                            {/* Wick */}
                            <div 
                               className={`absolute left-1/2 -translate-x-1/2 w-[1px] ${isGreen ? 'bg-emerald-500' : 'bg-rose-500'} z-10`}
                               style={{ bottom: `${lowPct}%`, height: `${wickHeight}%` }}
                            ></div>
                            
                            {/* Body */}
                            <div 
                               className={`absolute left-[15%] right-[15%] rounded-[1px] ${isGreen ? 'bg-emerald-500' : 'bg-rose-500'} z-10`}
                               style={{ bottom: `${bodyBottom}%`, height: `${Math.max(1, bodyHeight)}%` }}
                            ></div>
                         </div>
                      );
                   })
                )}
             </div>

             {/* Dynamic Tooltip */}
             {hoveredCandle && (
                <div className="absolute top-2 left-2 right-auto bg-[#1A1A1A]/90 backdrop-blur-md text-white p-3 rounded-lg text-xs font-mono shadow-2xl z-30 pointer-events-none border border-white/10 animate-in fade-in duration-150">
                   <div className="flex gap-6 items-center">
                      <div className="flex flex-col">
                         <span className="text-gray-500 text-[9px] font-bold">TIME</span>
                         <span className="font-bold tracking-tight">{hoveredCandle.time}</span>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-gray-500 text-[9px] font-bold">OPEN</span>
                         <span className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400' : 'text-rose-400'}>{hoveredCandle.open.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-gray-500 text-[9px] font-bold">HIGH</span>
                         <span>{hoveredCandle.high.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-gray-500 text-[9px] font-bold">LOW</span>
                         <span>{hoveredCandle.low.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-gray-500 text-[9px] font-bold">CLOSE</span>
                         <span className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400' : 'text-rose-400'}>{hoveredCandle.close.toFixed(2)}</span>
                      </div>
                   </div>
                </div>
             )}
          </div>
          
          <div className="flex justify-between mt-4 text-[9px] font-bold text-gray-300 uppercase tracking-widest px-2">
            <span>{candles[candles.length-1]?.time}</span>
            <span>{candles[0]?.time}</span>
          </div>
        </div>

        {/* Side Panel: Intelligence */}
        <div className="space-y-6">
          <div className="bg-[#1A1A1A] text-white rounded-[2rem] p-8 shadow-xl shadow-black/10">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 text-blue-400">Deep Audit IA</h3>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              A análise técnica indica consolidação de preços em torno da média móvel de 20 períodos. O volume de negociação corporativa aumentou 12% nas últimas 24h.
            </p>
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">Sentimento</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">BULLISH</span>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6 text-gray-400">KPIs de Liquidez</h3>
            <div className="space-y-6">
              {[
                { label: 'Fluxo Livre', val: 'R$ 4.2M', trend: '+5.2%' },
                { label: 'Patrimônio', val: 'R$ 15.8M', trend: '+1.8%' },
                { label: 'EBITDA 12M', val: '24.5%', trend: '+0.5%' }
              ].map((kpi, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{kpi.label}</p>
                    <p className="text-lg font-bold text-[#1A1A1A]">{kpi.val}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500">{kpi.trend}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
