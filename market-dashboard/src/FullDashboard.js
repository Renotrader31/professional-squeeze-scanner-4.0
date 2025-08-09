import './dashboard.css';
import React, { useState, useEffect, useCallback } from 'react';
import AIRecommendations from './AIRecommendations';
import MarketStatus from './MarketStatus';
import {
  TrendingUp, 
  Activity, 
  BarChart3, 
  Zap, 
  Target,
  AlertTriangle,
  DollarSign,
  Eye,
  RefreshCw,
  Settings,
  Play,
  Pause,
  Brain
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

function FullDashboard() {
  // State Management
  const [activeTab, setActiveTab] = useState('ai');
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [marketData, setMarketData] = useState({});
  const [scannerResults, setScannerResults] = useState([]);
  const [gexData, setGexData] = useState(null);
  const [optionsFlow, setOptionsFlow] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);

  // API Keys
  const API_KEYS = {
    polygon: process.env.REACT_APP_POLYGON_KEY,
    unusualWhales: process.env.REACT_APP_UNUSUAL_WHALES_KEY,
    alphaVantage: process.env.REACT_APP_ALPHA_VANTAGE_KEY,
    fmp: process.env.REACT_APP_FMP_KEY,
    twelveData: process.env.REACT_APP_TWELVE_DATA_KEY
  };

  // Tab Configuration
  const tabs = [
    { id: 'ai', name: 'AI Intel', icon: <Brain className="w-4 h-4" /> }, 
    { id: 'scanner', name: 'Scanner', icon: <Activity className="w-4 h-4" /> },
    { id: 'gex', name: 'GEX Analysis', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'flow', name: 'Options Flow', icon: <Zap className="w-4 h-4" /> },
    { id: 'squeeze', name: 'Squeeze Tracker', icon: <Target className="w-4 h-4" /> },
    { id: 'alerts', name: 'Alerts', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'watchlist', name: 'Watchlist', icon: <Eye className="w-4 h-4" /> }
  ];

  // Popular tickers to scan
  const SCAN_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'AMD', 'SPY', 'QQQ', 'META', 'GOOGL', 'MSFT', 'AMZN'];

  // Fetch price data from multiple sources
  const fetchPriceData = async (symbol) => {
    // Try Polygon first
    if (API_KEYS.polygon) {
      try {
        const response = await fetch(
          `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=${API_KEYS.polygon}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results[0]) {
            const result = data.results[0];
            return {
              symbol,
              price: result.c,
              change: result.c - result.o,
              changePercent: ((result.c - result.o) / result.o * 100),
              volume: result.v,
              high: result.h,
              low: result.l,
              open: result.o
            };
          }
        }
      } catch (err) {
        console.error('Polygon error:', err);
      }
    }

    // Fallback to Alpha Vantage
    if (API_KEYS.alphaVantage) {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEYS.alphaVantage}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data['Global Quote']) {
            const quote = data['Global Quote'];
            return {
              symbol,
              price: parseFloat(quote['05. price']),
              change: parseFloat(quote['09. change']),
              changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
              volume: parseInt(quote['06. volume']),
              high: parseFloat(quote['03. high']),
              low: parseFloat(quote['04. low']),
              open: parseFloat(quote['02. open'])
            };
          }
        }
      } catch (err) {
        console.error('Alpha Vantage error:', err);
      }
    }

    // Return mock data if no APIs work
    return {
      symbol,
      price: 100 + Math.random() * 200,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 100000000),
      high: 105 + Math.random() * 200,
      low: 95 + Math.random() * 200,
      open: 100 + Math.random() * 200
    };
  };

  // Generate GEX data (mock for now, would use Unusual Whales API)
  const generateGEXData = (symbol, price) => {
    const strikes = [];
    const baseStrike = Math.round(price / 5) * 5;
    
    for (let i = -10; i <= 10; i++) {
      const strike = baseStrike + (i * 5);
      strikes.push({
        strike,
        gamma: Math.random() * 1000000000 * (1 - Math.abs(i) / 10),
        callVolume: Math.floor(Math.random() * 10000),
        putVolume: Math.floor(Math.random() * 10000),
        netGamma: (Math.random() - 0.5) * 500000000
      });
    }

    return {
      symbol,
      currentPrice: price,
      totalGamma: strikes.reduce((sum, s) => sum + s.gamma, 0),
      netGamma: strikes.reduce((sum, s) => sum + s.netGamma, 0),
      gammaFlip: baseStrike + (Math.random() - 0.5) * 10,
      maxPain: baseStrike + (Math.random() - 0.5) * 5,
      strikes,
      lastUpdate: new Date().toLocaleTimeString()
    };
  };

  // Generate squeeze metrics
  const generateSqueezeMetrics = (symbol, price) => {
    const shortInterest = Math.random() * 30;
    const borrowRate = Math.random() * 50;
    const daysToCover = Math.random() * 10;
    const utilizationRate = Math.random() * 100;
    
    // Calculate squeeze score
    const squeezeScore = (
      (shortInterest / 30) * 25 +
      (borrowRate / 50) * 25 +
      (daysToCover / 10) * 25 +
      (utilizationRate / 100) * 25
    );

    return {
      symbol,
      price,
      shortInterest,
      borrowRate,
      daysToCover,
      utilizationRate,
      squeezeScore,
      signal: squeezeScore > 70 ? 'HIGH' : squeezeScore > 40 ? 'MEDIUM' : 'LOW'
    };
  };

  // Generate options flow data
  const generateOptionsFlow = () => {
    const flows = [];
    const types = ['CALL', 'PUT'];
    const exchanges = ['CBOE', 'PHLX', 'ISE', 'NYSE', 'BOX'];
    
    for (let i = 0; i < 20; i++) {
      const isCall = Math.random() > 0.5;
      const spot = 100 + Math.random() * 200;
      const strike = Math.round(spot + (Math.random() - 0.5) * 20);
      
      flows.push({
        id: i,
        time: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString(),
        symbol: SCAN_SYMBOLS[Math.floor(Math.random() * SCAN_SYMBOLS.length)],
        type: isCall ? 'CALL' : 'PUT',
        strike,
        expiry: '2024-12-20',
        spot,
        volume: Math.floor(Math.random() * 10000),
        oi: Math.floor(Math.random() * 50000),
        premium: Math.random() * 1000000,
        iv: 20 + Math.random() * 80,
        exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
        sentiment: isCall ? 'BULLISH' : 'BEARISH',
        unusual: Math.random() > 0.7
      });
    }
    
    return flows.sort((a, b) => b.premium - a.premium);
  };

  // Scanner function
  const runScanner = async () => {
    setLoading(true);
    const results = [];
    
    for (const symbol of SCAN_SYMBOLS) {
      const priceData = await fetchPriceData(symbol);
      const squeezeData = generateSqueezeMetrics(symbol, priceData.price);
      const gexSample = generateGEXData(symbol, priceData.price);
      
      // Calculate momentum score
      const momentumScore = Math.random() * 100;
      const flowScore = Math.random() * 100;
      const technicalScore = Math.random() * 100;
      const totalScore = (momentumScore + flowScore + squeezeData.squeezeScore + technicalScore) / 4;
      
      results.push({
        ...priceData,
        ...squeezeData,
        momentumScore,
        flowScore,
        technicalScore,
        totalScore,
        rank: 0,
        signals: []
      });
      
      // Add signals
      if (squeezeData.squeezeScore > 70) results[results.length - 1].signals.push('SQUEEZE');
      if (momentumScore > 80) results[results.length - 1].signals.push('MOMENTUM');
      if (flowScore > 75) results[results.length - 1].signals.push('FLOW');
    }
    
    // Sort by total score and assign ranks
    results.sort((a, b) => b.totalScore - a.totalScore);
    results.forEach((r, i) => r.rank = i + 1);
    
    setScannerResults(results);
    setLoading(false);
  };

  // Load data for selected symbol
  const loadSymbolData = useCallback(async (symbol) => {
    const priceData = await fetchPriceData(symbol);
    setMarketData(prev => ({ ...prev, [symbol]: priceData }));
    
    const gex = generateGEXData(symbol, priceData.price);
    setGexData(gex);
    
    const flows = generateOptionsFlow();
    setOptionsFlow(flows);
  }, []);

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        runScanner();
        if (selectedSymbol) {
          loadSymbolData(selectedSymbol);
        }
      }, refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, selectedSymbol, loadSymbolData]);

  // Initial load
  useEffect(() => {
    runScanner();
  }, []);

  // Format helpers
  const formatNumber = (num) => {
    if (!num) return '0';
    if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatPrice = (price) => `$${price?.toFixed(2) || '0.00'}`;
  const formatPercent = (percent) => {
    const formatted = percent?.toFixed(2) || '0.00';
    return percent >= 0 ? `+${formatted}%` : `${formatted}%`;
  };

  // Render different tab content
  const renderTabContent = () => {
    switch (activeTab) {
 case 'ai':  // ADD THIS CASE
      return <AIRecommendations 
        marketData={marketData} 
        scannerResults={scannerResults} 
        selectedSymbol={selectedSymbol} 
      />;
    case 'scanner':
      return <ScannerTab results={scannerResults} onSelectSymbol={handleSelectSymbol} />;
      case 'scanner':
        return <ScannerTab results={scannerResults} onSelectSymbol={handleSelectSymbol} />;
      case 'gex':
        return <GEXTab data={gexData} symbol={selectedSymbol} onRefresh={() => loadSymbolData(selectedSymbol)} />;
      case 'flow':
        return <FlowTab flows={optionsFlow} />;
      case 'squeeze':
        return <SqueezeTab results={scannerResults.filter(r => r.squeezeScore > 40)} />;
      case 'alerts':
        return <AlertsTab />;
      case 'watchlist':
        return <WatchlistTab symbols={SCAN_SYMBOLS} marketData={marketData} />;
      default:
        return null;
    }
  };

  const handleSelectSymbol = (symbol) => {
    setSelectedSymbol(symbol);
    loadSymbolData(symbol);
    setActiveTab('gex');
  };

  // Component: Scanner Tab
  const ScannerTab = ({ results, onSelectSymbol }) => (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Market Scanner</h2>
        <button
          onClick={runScanner}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-black font-bold rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>
      
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Symbol</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Change</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Volume</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Signals</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {results.map((result) => (
              <tr key={result.symbol} className="hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-white">#{result.rank}</td>
                <td className="px-4 py-3 text-white font-bold">{result.symbol}</td>
                <td className="px-4 py-3 text-white">{formatPrice(result.price)}</td>
                <td className={`px-4 py-3 font-bold ${result.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercent(result.changePercent)}
                </td>
                <td className="px-4 py-3 text-white">{formatNumber(result.volume)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {result.signals.map((signal, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-yellow-500 bg-opacity-20 text-yellow-400 rounded">
                        {signal}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                        style={{ width: `${result.totalScore}%` }}
                      />
                    </div>
                    <span className="text-white text-sm">{result.totalScore.toFixed(0)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onSelectSymbol(result.symbol)}
                    className="px-3 py-1 bg-blue-500 bg-opacity-20 text-blue-400 rounded hover:bg-opacity-30"
                  >
                    Analyze
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Component: GEX Tab
  const GEXTab = ({ data, symbol, onRefresh }) => {
    if (!data) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-400 mb-4">Select a symbol to view GEX data</p>
          <button
            onClick={() => symbol && onRefresh()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Load Data
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">GEX Analysis - {symbol}</h2>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-black font-bold rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Current Price</p>
            <p className="text-2xl font-bold text-white">{formatPrice(data.currentPrice)}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Total Gamma</p>
            <p className="text-2xl font-bold text-white">{formatNumber(data.totalGamma)}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Net Gamma</p>
            <p className={`text-2xl font-bold ${data.netGamma >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatNumber(data.netGamma)}
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Gamma Flip</p>
            <p className="text-2xl font-bold text-white">{formatPrice(data.gammaFlip)}</p>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-white mb-4">Gamma by Strike</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.strikes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="strike" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" tickFormatter={(value) => formatNumber(value)} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Bar dataKey="gamma" fill="#10B981" />
              <Bar dataKey="netGamma" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Component: Flow Tab
  const FlowTab = ({ flows }) => (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Options Flow</h2>
      </div>
      
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Strike</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Spot</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Volume</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Premium</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">IV</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Unusual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {flows.map((flow) => (
                <tr key={flow.id} className="hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 text-white text-sm">{flow.time}</td>
                  <td className="px-4 py-3 text-white font-bold">{flow.symbol}</td>
                  <td className={`px-4 py-3 font-bold ${flow.type === 'CALL' ? 'text-green-400' : 'text-red-400'}`}>
                    {flow.type}
                  </td>
                  <td className="px-4 py-3 text-white">{formatPrice(flow.strike)}</td>
                  <td className="px-4 py-3 text-white">{formatPrice(flow.spot)}</td>
                  <td className="px-4 py-3 text-white">{formatNumber(flow.volume)}</td>
                  <td className="px-4 py-3 text-white font-bold">{formatPrice(flow.premium)}</td>
                  <td className="px-4 py-3 text-white">{flow.iv.toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    {flow.unusual && (
                      <span className="px-2 py-1 text-xs bg-yellow-500 bg-opacity-20 text-yellow-400 rounded">
                        UNUSUAL
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Component: Squeeze Tab
  const SqueezeTab = ({ results }) => (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Short Squeeze Tracker</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((stock) => (
          <div key={stock.symbol} className="bg-gray-900 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{stock.symbol}</h3>
                <p className="text-2xl font-bold text-white">{formatPrice(stock.price)}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${
                stock.signal === 'HIGH' ? 'bg-red-500 bg-opacity-20 text-red-400' :
                stock.signal === 'MEDIUM' ? 'bg-yellow-500 bg-opacity-20 text-yellow-400' :
                'bg-gray-700 text-gray-400'
              }`}>
                {stock.signal}
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Short Interest</span>
                <span className="text-white">{stock.shortInterest.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Borrow Rate</span>
                <span className="text-white">{stock.borrowRate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Days to Cover</span>
                <span className="text-white">{stock.daysToCover.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Utilization</span>
                <span className="text-white">{stock.utilizationRate.toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Squeeze Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        stock.squeezeScore > 70 ? 'bg-red-500' :
                        stock.squeezeScore > 40 ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}
                      style={{ width: `${stock.squeezeScore}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-bold">{stock.squeezeScore.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Component: Alerts Tab
  const AlertsTab = () => {
    const [alerts] = useState([
      { id: 1, time: '10:30 AM', type: 'SQUEEZE', symbol: 'GME', message: 'Squeeze score increased to 85' },
      { id: 2, time: '10:45 AM', type: 'FLOW', symbol: 'TSLA', message: 'Unusual call buying detected' },
      { id: 3, time: '11:00 AM', type: 'GEX', symbol: 'SPY', message: 'Approaching gamma flip level' },
      { id: 4, time: '11:15 AM', type: 'MOMENTUM', symbol: 'NVDA', message: 'Breaking above resistance' }
    ]);

    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Alerts</h2>
        </div>
        
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-gray-900 p-4 rounded-lg flex items-center gap-4">
              <div className={`p-2 rounded-lg ${
                alert.type === 'SQUEEZE' ? 'bg-red-500 bg-opacity-20' :
                alert.type === 'FLOW' ? 'bg-blue-500 bg-opacity-20' :
                alert.type === 'GEX' ? 'bg-purple-500 bg-opacity-20' :
                'bg-green-500 bg-opacity-20'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  alert.type === 'SQUEEZE' ? 'text-red-400' :
                  alert.type === 'FLOW' ? 'text-blue-400' :
                  alert.type === 'GEX' ? 'text-purple-400' :
                  'text-green-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold">{alert.symbol}</span>
                  <span className="text-gray-400 text-sm">{alert.time}</span>
                </div>
                <p className="text-gray-300">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Component: Watchlist Tab
  const WatchlistTab = ({ symbols, marketData }) => (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Watchlist</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {symbols.map((symbol) => {
          const data = marketData[symbol] || { price: 0, change: 0, changePercent: 0 };
          return (
            <div key={symbol} className="bg-gray-900 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-2">{symbol}</h3>
              <p className="text-2xl font-bold text-white mb-1">{formatPrice(data.price)}</p>
              <p className={`font-bold ${data.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(data.changePercent)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
{/* Header */}
<div className="bg-gray-900 border-b border-gray-800">
  <div className="container mx-auto px-4 py-4">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-8">  {/* ADD THIS DIV */}
        <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          🚀 Market Dashboard Pro
        </h1>
        <MarketStatus />  {/* ADD THIS LINE */}
      </div>  {/* CLOSE THE NEW DIV */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Auto-refresh:</span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg ${autoRefresh ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-gray-800 text-gray-400'}`}
          >
            {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
        {/* ... rest of the controls ... */}
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm"
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
{tabs.map((tab) => (
  <button
    key={tab.id}
    onClick={() => setActiveTab(tab.id)}
    className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
      activeTab === tab.id
        ? 'text-white border-b-2 border-blue-500 bg-gray-800'
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`}
  >
    <span className="flex items-center gap-2">
      {tab.icon}
      <span>{tab.name}</span>
    </span>
  </button>
))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {renderTabContent()}
      </div>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-2">
        <div className="container mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">APIs:</span>
            {Object.entries(API_KEYS).map(([key, value]) => (
              <span key={key} className={`${value ? 'text-green-400' : 'text-gray-600'}`}>
                {value ? '✓' : '✗'} {key}
              </span>
            ))}
          </div>
          <span className="text-gray-400">
            Last update: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FullDashboard;
