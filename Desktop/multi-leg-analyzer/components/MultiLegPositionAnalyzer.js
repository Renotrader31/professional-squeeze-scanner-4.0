'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Plus, Trash2, AlertCircle, TrendingUp, TrendingDown,
  Clock, DollarSign, Shield, Target, Activity, BarChart3,
  ArrowUpRight, ArrowDownRight, RefreshCw, Save, Calculator,
  Info, CheckCircle, XCircle, AlertTriangle, Zap, Download,
  FileText, Settings, Wifi, WifiOff, Search, Key, X
} from 'lucide-react';

// API Configuration
const API_CONFIG = {
  unusualWhales: {
    baseUrl: 'https://api.unusualwhales.com/api',
    key: ''
  },
  polygon: {
    baseUrl: 'https://api.polygon.io',
    key: ''
  },
  fmp: {
    baseUrl: 'https://financialmodelingprep.com/api/v3',
    key: ''
  },
  twelveData: {
    baseUrl: 'https://api.twelvedata.com',
    key: ''
  },
  alphaVantage: {
    baseUrl: 'https://www.alphavantage.co/query',
    key: ''
  },
  ortex: {
    baseUrl: 'https://api.ortex.com',
    key: ''
  }
};

const legTypes = ['Stock', 'Call', 'Put'];
const popularSymbols = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'SPY', 'QQQ', 'AMD', 'META', 'GOOGL', 'AMZN'];

const getRecommendation = (analysis) => {
  const { profitLoss, daysToExpiry, deltaExposure, profitPercent } = analysis;
  
  if (daysToExpiry > 0 && daysToExpiry <= 7) {
    if (profitPercent > 50) return { action: 'CLOSE', reason: 'Take profits before expiration', urgency: 'high' };
    if (profitPercent < -50) return { action: 'ROLL', reason: 'Roll to avoid max loss', urgency: 'high' };
  }
  
  if (profitPercent > 75) return { action: 'CLOSE', reason: 'Excellent profit - consider taking it', urgency: 'medium' };
  if (profitPercent < -30 && daysToExpiry > 21) return { action: 'HOLD', reason: 'Time to recover', urgency: 'low' };
  if (Math.abs(deltaExposure) > 100) return { action: 'HEDGE', reason: 'High directional risk', urgency: 'medium' };
  
  return { action: 'HOLD', reason: 'Position within normal parameters', urgency: 'low' };
};

export default function MultiLegPositionAnalyzer() {
  const [legs, setLegs] = useState([
    { id: 1, symbol: 'AAPL', type: 'Stock', quantity: 100, entryPrice: 205.00, strike: null, expiry: null }
  ]);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [savedPositions, setSavedPositions] = useState([]);
  const [showSavedPositions, setShowSavedPositions] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [showExitStrategy, setShowExitStrategy] = useState(false);
  const [whatIfScenarios, setWhatIfScenarios] = useState(null);
  const [exitStrategy, setExitStrategy] = useState(null);
  const [marketData, setMarketData] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [showSymbolSearch, setShowSymbolSearch] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedKeys = localStorage.getItem('tradingCenterApiKeys');
      if (savedKeys) {
        return JSON.parse(savedKeys);
      }
    }
    return {
      unusualWhales: '',
      polygon: '',
      fmp: '',
      twelveData: '',
      alphaVantage: '',
      ortex: ''
    };
  });

  useEffect(() => {
    API_CONFIG.unusualWhales.key = apiKeys.unusualWhales;
    API_CONFIG.polygon.key = apiKeys.polygon;
    API_CONFIG.fmp.key = apiKeys.fmp;
    API_CONFIG.twelveData.key = apiKeys.twelveData;
    API_CONFIG.alphaVantage.key = apiKeys.alphaVantage;
    API_CONFIG.ortex.key = apiKeys.ortex;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('tradingCenterApiKeys', JSON.stringify(apiKeys));
    }
  }, [apiKeys]);

  const fetchMarketData = async (symbols) => {
    setIsLoading(true);
    try {
      const marketDataPromises = symbols.map(async (symbol) => {
        try {
          if (API_CONFIG.polygon.key) {
            const response = await fetch(
              `${API_CONFIG.polygon.baseUrl}/v2/aggs/ticker/${symbol}/prev?apiKey=${API_CONFIG.polygon.key}`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.results && data.results.length > 0) {
                const result = data.results[0];
                return {
                  symbol,
                  price: result.c,
                  change: result.c - result.o,
                  changePercent: ((result.c - result.o) / result.o) * 100,
                  volume: result.v,
                  high: result.h,
                  low: result.l,
                  open: result.o,
                  previousClose: result.c,
                  timestamp: new Date(result.t).toISOString()
                };
              }
            }
          }

          if (API_CONFIG.twelveData.key) {
            const response = await fetch(
              `${API_CONFIG.twelveData.baseUrl}/quote?symbol=${symbol}&apikey=${API_CONFIG.twelveData.key}`
            );
            if (response.ok) {
              const data = await response.json();
              return {
                symbol,
                price: parseFloat(data.close),
                change: parseFloat(data.change),
                changePercent: parseFloat(data.percent_change),
                volume: parseInt(data.volume),
                high: parseFloat(data.high),
                low: parseFloat(data.low),
                open: parseFloat(data.open),
                previousClose: parseFloat(data.previous_close),
                timestamp: data.datetime
              };
            }
          }

          if (API_CONFIG.alphaVantage.key) {
            const response = await fetch(
              `${API_CONFIG.alphaVantage.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_CONFIG.alphaVantage.key}`
            );
            if (response.ok) {
              const data = await response.json();
              const quote = data['Global Quote'];
              if (quote) {
                return {
                  symbol,
                  price: parseFloat(quote['05. price']),
                  change: parseFloat(quote['09. change']),
                  changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                  volume: parseInt(quote['06. volume']),
                  high: parseFloat(quote['03. high']),
                  low: parseFloat(quote['04. low']),
                  open: parseFloat(quote['02. open']),
                  previousClose: parseFloat(quote['08. previous close']),
                  timestamp: quote['07. latest trading day']
                };
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
        }

        return {
          symbol,
          price: 100,
          change: 0,
          changePercent: 0,
          volume: 0,
          high: 100,
          low: 100,
          open: 100,
          previousClose: 100,
          timestamp: new Date().toISOString()
        };
      });

      const results = await Promise.all(marketDataPromises);
      
      if (API_CONFIG.unusualWhales.key) {
        const ivPromises = symbols.map(async (symbol) => {
          try {
            const response = await fetch(
              `${API_CONFIG.unusualWhales.baseUrl}/stock/${symbol}/option-chain`,
              {
                headers: {
                  'Authorization': `Bearer ${API_CONFIG.unusualWhales.key}`
                }
              }
            );
            if (response.ok) {
              const data = await response.json();
              return { symbol, iv: data.impliedVolatility || 30 };
            }
          } catch (error) {
            console.error(`Error fetching IV for ${symbol}:`, error);
          }
          return { symbol, iv: 30 };
        });

        const ivResults = await Promise.all(ivPromises);
        const ivMap = ivResults.reduce((acc, { symbol, iv }) => {
          acc[symbol] = iv;
          return acc;
        }, {});

        const combinedData = {};
        results.forEach(data => {
          combinedData[data.symbol] = {
            ...data,
            iv: ivMap[data.symbol] || 30,
            bid: data.price - 0.01,
            ask: data.price + 0.01
          };
        });

        setMarketData(combinedData);
      } else {
        const combinedData = {};
        results.forEach(data => {
          combinedData[data.symbol] = {
            ...data,
            iv: 30,
            bid: data.price - 0.01,
            ask: data.price + 0.01
          };
        });
        setMarketData(combinedData);
      }

      setLastUpdate(new Date());
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptionData = async (symbol, strike, expiry, type) => {
    try {
      if (API_CONFIG.unusualWhales.key) {
        const response = await fetch(
          `${API_CONFIG.unusualWhales.baseUrl}/stock/${symbol}/option-chain`,
          {
            headers: {
              'Authorization': `Bearer ${API_CONFIG.unusualWhales.key}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const optionType = type.toLowerCase();
          const options = data[optionType + 's'] || [];
          
          const option = options.find(opt => 
            opt.strike === strike && 
            opt.expiration === expiry
          );
          
          if (option) {
            return {
              price: option.last || option.mid || 0,
              bid: option.bid || 0,
              ask: option.ask || 0,
              delta: option.delta || 0,
              gamma: option.gamma || 0,
              theta: option.theta || 0,
              vega: option.vega || 0,
              iv: option.iv || 30,
              volume: option.volume || 0,
              openInterest: option.openInterest || 0
            };
          }
        }
      }

      if (API_CONFIG.polygon.key) {
        const contractSymbol = `O:${symbol}${expiry.replace(/-/g, '')}${type.charAt(0)}${String(strike * 1000).padStart(8, '0')}`;
        const response = await fetch(
          `${API_CONFIG.polygon.baseUrl}/v2/last/trade/${contractSymbol}?apiKey=${API_CONFIG.polygon.key}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results) {
            const stockPrice = marketData[symbol]?.price || 100;
            const daysToExpiry = calculateDaysToExpiry(expiry);
            const timeValue = daysToExpiry / 365;
            const isCall = type === 'Call';
            const moneyness = isCall ? 
              (stockPrice - strike) / strike :
              (strike - stockPrice) / strike;
            
            return {
              price: data.results.price || 0,
              bid: data.results.price - 0.05,
              ask: data.results.price + 0.05,
              delta: isCall ? 0.5 + (moneyness * 0.3) : -0.5 + (moneyness * 0.3),
              gamma: 0.02 * Math.exp(-Math.pow(moneyness, 2)),
              theta: -(data.results.price * 0.01) * (365 / Math.max(1, daysToExpiry)),
              vega: stockPrice * 0.01 * Math.sqrt(timeValue),
              iv: 30,
              volume: data.results.size || 0,
              openInterest: 0
            };
          }
        }
      }

      const stockPrice = marketData[symbol]?.price || 100;
      const isCall = type === 'Call';
      const moneyness = isCall ? 
        (stockPrice - strike) / strike :
        (strike - stockPrice) / strike;
      
      const daysToExpiry = calculateDaysToExpiry(expiry);
      const timeValue = daysToExpiry / 365;
      const iv = marketData[symbol]?.iv || 30;
      
      const intrinsicValue = Math.max(0, isCall ? stockPrice - strike : strike - stockPrice);
      const timeValueComponent = stockPrice * (iv / 100) * Math.sqrt(timeValue) * 0.4;
      const optionPrice = intrinsicValue + timeValueComponent;
      
      const delta = isCall ? 
        0.5 + (moneyness * 0.3) : 
        -0.5 + (moneyness * 0.3);
      
      const gamma = 0.02 * Math.exp(-Math.pow(moneyness, 2));
      const theta = -(optionPrice * 0.01) * (365 / Math.max(1, daysToExpiry));
      const vega = stockPrice * 0.01 * Math.sqrt(timeValue);
      
      return {
        price: parseFloat(optionPrice.toFixed(2)),
        bid: parseFloat((optionPrice - 0.05).toFixed(2)),
        ask: parseFloat((optionPrice + 0.05).toFixed(2)),
        delta: parseFloat(delta.toFixed(4)),
        gamma: parseFloat(gamma.toFixed(6)),
        theta: parseFloat(theta.toFixed(4)),
        vega: parseFloat(vega.toFixed(4)),
        iv: parseFloat(iv.toFixed(1)),
        volume: 0,
        openInterest: 0
      };
    } catch (error) {
      console.error('Failed to fetch option data:', error);
      return null;
    }
  };

  useEffect(() => {
    if (autoRefresh && legs.length > 0) {
      const symbols = [...new Set(legs.map(leg => leg.symbol))];
      fetchMarketData(symbols);
      
      const interval = setInterval(() => {
        fetchMarketData(symbols);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, legs]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const symbols = [...new Set(legs.map(leg => leg.symbol))];
      fetchMarketData(symbols);
    }
  }, []);

  const addLeg = () => {
    const newLeg = {
      id: Date.now(),
      symbol: 'AAPL',
      type: 'Call',
      quantity: 1,
      entryPrice: 0,
      strike: 210,
      expiry: getDefaultExpiry()
    };
    setLegs([...legs, newLeg]);
  };

  const removeLeg = (id) => {
    if (legs.length > 1) {
      setLegs(legs.filter(leg => leg.id !== id));
    }
  };

  const updateLeg = async (id, field, value) => {
    const updatedLegs = legs.map(leg => 
      leg.id === id ? { ...leg, [field]: value } : leg
    );
    setLegs(updatedLegs);
    
    if (field === 'symbol' && value) {
      const symbols = [...new Set(updatedLegs.map(leg => leg.symbol))];
      await fetchMarketData(symbols);
    }
  };

  const getDefaultExpiry = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const calculateDaysToExpiry = (expiry) => {
    if (!expiry) return null;
    const today = new Date();
    const expiryDate = new Date(expiry);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const analyzeStrategy = async () => {
    setIsAnalyzing(true);
    
    const symbols = [...new Set(legs.map(leg => leg.symbol))];
    await fetchMarketData(symbols);
    
    setTimeout(async () => {
      let totalCost = 0;
      let totalValue = 0;
      let totalDelta = 0;
      let totalTheta = 0;
      let totalGamma = 0;
      let totalVega = 0;
      let hasOptions = false;
      let nearestExpiry = null;
      
      const legAnalysis = await Promise.all(legs.map(async leg => {
        const stockData = marketData[leg.symbol] || { price: 100, iv: 30, change: 0 };
        let currentValue = 0;
        let cost = 0;
        let delta = 0;
        let theta = 0;
        let gamma = 0;
        let vega = 0;
        let optionData = null;
        
        if (leg.type === 'Stock') {
          cost = leg.quantity * leg.entryPrice;
          currentValue = leg.quantity * stockData.price;
          delta = leg.quantity;
        } else {
          hasOptions = true;
          
          optionData = await fetchOptionData(leg.symbol, leg.strike, leg.expiry, leg.type);
          
          if (optionData) {
            cost = leg.quantity * leg.entryPrice * 100;
            currentValue = leg.quantity * optionData.price * 100;
            
            delta = leg.quantity * 100 * optionData.delta;
            theta = leg.quantity * 100 * optionData.theta;
            gamma = leg.quantity * 100 * optionData.gamma;
            vega = leg.quantity * 100 * optionData.vega;
          }
          
          const daysToExpiry = calculateDaysToExpiry(leg.expiry);
          if (!nearestExpiry || daysToExpiry < nearestExpiry) {
            nearestExpiry = daysToExpiry;
          }
        }
        
        totalCost += cost;
        totalValue += currentValue;
        totalDelta += delta;
        totalTheta += theta;
        totalGamma += gamma;
        totalVega += vega;
        
        return {
          ...leg,
          currentPrice: stockData.price,
          optionPrice: optionData?.price || 0,
          optionBid: optionData?.bid || 0,
          optionAsk: optionData?.ask || 0,
          impliedVolatility: optionData?.iv || stockData.iv,
          volume: leg.type === 'Stock' ? stockData.volume : optionData?.volume || 0,
          openInterest: optionData?.openInterest || 0,
          cost,
          currentValue,
          profitLoss: currentValue - cost,
          profitPercent: ((currentValue - cost) / Math.abs(cost) * 100),
          delta,
          theta,
          gamma,
          vega
        };
      }));
      
      const totalProfitLoss = totalValue - totalCost;
      const totalProfitPercent = (totalProfitLoss / Math.abs(totalCost)) * 100;
      
      const analysisResult = {
        legs: legAnalysis,
        totals: {
          cost: totalCost,
          currentValue: totalValue,
          profitLoss: totalProfitLoss,
          profitPercent: totalProfitPercent,
          delta: totalDelta,
          theta: totalTheta,
          gamma: totalGamma,
          vega: totalVega
        },
        daysToExpiry: nearestExpiry,
        hasOptions,
        deltaExposure: totalDelta,
        recommendation: null
      };
      
      analysisResult.recommendation = getRecommendation({
        profitLoss: totalProfitLoss,
        profitPercent: totalProfitPercent,
        daysToExpiry: nearestExpiry,
        deltaExposure: totalDelta
      });
      
      setAnalysis(analysisResult);
      setIsAnalyzing(false);
      setShowDetails(true);
    }, 1500);
  };

  const savePosition = () => {
    if (!analysis) {
      alert('Please analyze the position first');
      return;
    }
    
    const positionName = prompt('Enter a name for this position:');
    if (positionName) {
      const newPosition = {
        id: Date.now(),
        name: positionName,
        date: new Date().toISOString(),
        legs: legs,
        analysis: analysis
      };
      setSavedPositions([...savedPositions, newPosition]);
      alert('Position saved successfully!');
    }
  };

  const resetPosition = () => {
    if (typeof window !== 'undefined' && confirm('Are you sure you want to reset the position?')) {
      setLegs([
        { id: 1, symbol: 'AAPL', type: 'Stock', quantity: 100, entryPrice: 205.00, strike: null, expiry: null }
      ]);
      setAnalysis(null);
      setShowDetails(false);
      setShowWhatIf(false);
      setShowExitStrategy(false);
    }
  };

  const loadPosition = (position) => {
    setLegs(position.legs);
    setAnalysis(position.analysis);
    setShowDetails(true);
    setShowSavedPositions(false);
  };

  const calculateWhatIfScenarios = () => {
    if (!analysis) return;
    
    const scenarios = [];
    const basePrice = analysis.legs[0].currentPrice;
    
    [-20, -10, -5, 0, 5, 10, 20].forEach(percentChange => {
      const newPrice = basePrice * (1 + percentChange / 100);
      let scenarioValue = 0;
      
      analysis.legs.forEach(leg => {
        if (leg.type === 'Stock') {
          scenarioValue += leg.quantity * newPrice;
        } else {
          const isCall = leg.type === 'Call';
          const moneyness = isCall ? 
            (newPrice - leg.strike) / leg.strike :
            (leg.strike - newPrice) / leg.strike;
          
          const timeValue = leg.expiry ? calculateDaysToExpiry(leg.expiry) / 365 : 0;
          const intrinsicValue = Math.max(0, isCall ? newPrice - leg.strike : leg.strike - newPrice);
          const iv = leg.impliedVolatility || 30;
          const timeValueComponent = newPrice * (iv / 100) * Math.sqrt(timeValue) * 0.4;
          const optionPrice = intrinsicValue + timeValueComponent;
          
          scenarioValue += leg.quantity * optionPrice * 100;
        }
      });
      
      scenarios.push({
        priceChange: percentChange,
        newPrice: newPrice,
        value: scenarioValue,
        profitLoss: scenarioValue - analysis.totals.cost,
        profitPercent: ((scenarioValue - analysis.totals.cost) / Math.abs(analysis.totals.cost) * 100)
      });
    });
    
    setWhatIfScenarios(scenarios);
    setShowWhatIf(true);
  };

  const generateExitStrategy = () => {
    if (!analysis) return;
    
    const strategy = {
      targets: [],
      stopLoss: null,
      timeDecay: null,
      adjustments: []
    };
    
    const currentPrice = analysis.legs[0].currentPrice;
    const volatility = marketData[analysis.legs[0].symbol]?.iv || 30;
    
    if (analysis.totals.profitPercent > 0) {
      strategy.targets.push({
        level: analysis.totals.profitPercent * 1.5,
        action: 'Take 50% profits',
        price: currentPrice * (1 + (analysis.totals.profitPercent * 1.5 / 100))
      });
      strategy.targets.push({
        level: analysis.totals.profitPercent * 2,
        action: 'Close entire position',
        price: currentPrice * (1 + (analysis.totals.profitPercent * 2 / 100))
      });
    } else {
      const target1 = volatility * 0.5;
      const target2 = volatility * 1.0;
      strategy.targets.push({
        level: target1,
        action: 'Take 50% profits',
        price: currentPrice * (1 + target1 / 100)
      });
      strategy.targets.push({
        level: target2,
        action: 'Close entire position',
        price: currentPrice * (1 + target2 / 100)
      });
    }
    
    const stopLossLevel = Math.min(-30, -volatility * 0.75);
    strategy.stopLoss = {
      level: stopLossLevel,
      action: 'Close position or roll',
      price: currentPrice * (1 + stopLossLevel / 100)
    };
    
    if (analysis.daysToExpiry && analysis.daysToExpiry <= 21) {
      strategy.timeDecay = {
        warning: 'High theta decay approaching',
        action: 'Consider rolling or closing',
        daysLeft: analysis.daysToExpiry
      };
    }
    
    if (Math.abs(analysis.totals.delta) > 50) {
      strategy.adjustments.push({
        issue: 'High delta exposure',
        suggestion: 'Add opposing delta to neutralize'
      });
    }
    
    if (analysis.totals.gamma > 0.1) {
      strategy.adjustments.push({
        issue: 'High gamma risk',
        suggestion: 'Consider reducing position size'
      });
    }
    
    setExitStrategy(strategy);
    setShowExitStrategy(true);
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'CLOSE': return 'text-green-400';
      case 'ROLL': return 'text-yellow-400';
      case 'HEDGE': return 'text-orange-400';
      case 'HOLD': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch(urgency) {
      case 'high': return 'bg-red-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const SettingsModal = () => {
    const [tempKeys, setTempKeys] = useState(apiKeys);
    
    const handleSave = () => {
      setApiKeys(tempKeys);
      setShowSettings(false);
      const symbols = [...new Set(legs.map(leg => leg.symbol))];
      fetchMarketData(symbols);
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-500" />
              API Settings
            </h2>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Unusual Whales API Key</label>
              <input
                type="password"
                value={tempKeys.unusualWhales}
                onChange={(e) => setTempKeys({...tempKeys, unusualWhales: e.target.value})}
                className="w-full bg-gray-800 text-white px-3 py-2 rounded"
                placeholder="Enter your Unusual Whales API key"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Polygon API Key</label>
              <input
                type="password"
                value={tempKeys.polygon}
                onChange={(e) => setTempKeys({...tempKeys, polygon: e.target.value})}
                className="w-full bg-gray-800 text-white px-3 py-2 rounded"
                placeholder="Enter your Polygon API key"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Financial Modeling Prep API Key</label>
              <input
                type="password"
                value={tempKeys.fmp}
                onChange={(e) => setTempKeys({...tempKeys, fmp: e.target.value})}
                className="w-full bg-gray-800 text-white px-3 py-2 rounded"
                placeholder="Enter your FMP API key"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Twelve Data API Key</label>
              <input
                type="password"
                value={tempKeys.twelveData}
                onChange={(e) => setTempKeys({...tempKeys, twelveData: e.target.value})}
                className="w-full bg-gray-800 text-white px-3 py-2 rounded"
                placeholder="Enter your Twelve Data API key"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Alpha Vantage API Key</label>
              <input
                type="password"
                value={tempKeys.alphaVantage}
                onChange={(e) => setTempKeys({...tempKeys, alphaVantage: e.target.value})}
                className="w-full bg-gray-800 text-white px-3 py-2 rounded"
                placeholder="Enter your Alpha Vantage API key"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Ortex API Key</label>
              <input
                type="password"
                value={tempKeys.ortex}
                onChange={(e) => setTempKeys({...tempKeys, ortex: e.target.value})}
                className="w-full bg-gray-800 text-white px-3 py-2 rounded"
                placeholder="Enter your Ortex API key"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 transition-colors"
            >
              Save API Keys
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-gray-800 rounded">
            <p className="text-sm text-gray-400">
              Your API keys are stored locally in your browser and never sent to any server. 
              They are used directly to fetch market data from the respective services.
            </p>
          </div>
        </div>
      </div>
    );
  };// Continue from Part 1 - this is the return statement and JSX
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {showSettings && <SettingsModal />}
      
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LineChart className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-bold">Multi-Leg Position Analyzer</h1>
              <p className="text-sm text-gray-400">Track complex options strategies with real-time data</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">Disconnected</span>
                </>
              )}
              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  Updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoRefresh ? 'bg-purple-600' : 'bg-gray-700'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRefresh ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
              <span className="text-sm">Auto-refresh</span>
            </label>
            
            <button 
              onClick={() => setShowSavedPositions(!showSavedPositions)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Saved ({savedPositions.length})
            </button>
            <button 
              onClick={savePosition}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Position
            </button>
            <button 
              onClick={resetPosition}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Key className="w-4 h-4" />
              API Keys
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 py-6">
        {showSavedPositions && savedPositions.length > 0 && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 mb-6">
            <h3 className="font-bold mb-3">Saved Positions</h3>
            <div className="space-y-2">
              {savedPositions.map(pos => (
                <div 
                  key={pos.id}
                  className="flex justify-between items-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer"
                  onClick={() => loadPosition(pos)}
                >
                  <div>
                    <div className="font-medium">{pos.name}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(pos.date).toLocaleDateString()} - {pos.legs.length} legs
                    </div>
                  </div>
                  <div className={`font-medium ${pos.analysis.totals.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pos.analysis.totals.profitPercent.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Position Legs</h2>
            <button
              onClick={addLeg}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Leg
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Quick Select:</p>
            <div className="flex flex-wrap gap-2">
              {popularSymbols.map(symbol => (
                <button
                  key={symbol}
                  onClick={() => {
                    if (legs.length > 0) {
                      updateLeg(legs[legs.length - 1].id, 'symbol', symbol);
                    }
                  }}
                  className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700 text-sm transition-colors"
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          {legs.map((leg, index) => (
            <div key={leg.id} className="mb-4 p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">
                  Leg {index + 1}
                  {marketData[leg.symbol] && (
                    <span className="ml-2 text-sm text-gray-400">
                      ${marketData[leg.symbol].price} 
                      <span className={marketData[leg.symbol].change >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {' '}({marketData[leg.symbol].change >= 0 ? '+' : ''}{marketData[leg.symbol].changePercent.toFixed(2)}%)
                      </span>
                    </span>
                  )}
                </h3>
                {legs.length > 1 && (
                  <button
                    onClick={() => removeLeg(leg.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Symbol *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={leg.symbol}
                      onChange={(e) => updateLeg(leg.id, 'symbol', e.target.value.toUpperCase())}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                    />
                    <Search className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Type *</label>
                  <select
                    value={leg.type}
                    onChange={(e) => updateLeg(leg.id, 'type', e.target.value)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  >
                    {legTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Quantity * {leg.type !== 'Stock' && '(negative for short)'}
                  </label>
                  <input
                    type="number"
                    value={leg.quantity}
                    onChange={(e) => updateLeg(leg.id, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Entry Price *
                  </label>
                  <input
                    type="number"
                    value={leg.entryPrice}
                    onChange={(e) => updateLeg(leg.id, 'entryPrice', parseFloat(e.target.value) || 0)}
                    step="0.01"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  />
                </div>

                {leg.type !== 'Stock' && (
                  <>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Strike Price *</label>
                      <input
                        type="number"
                        value={leg.strike || ''}
                        onChange={(e) => updateLeg(leg.id, 'strike', parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Expiry Date *</label>
                      <input
                        type="date"
                        value={leg.expiry || ''}
                        onChange={(e) => updateLeg(leg.id, 'expiry', e.target.value)}
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                      />
                    </div>
                  </>
                )}
              </div>

              {marketData[leg.symbol] && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Bid/Ask:</span>
                      <span className="ml-2">${marketData[leg.symbol].bid} / ${marketData[leg.symbol].ask}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Volume:</span>
                      <span className="ml-2">{(marketData[leg.symbol].volume / 1000000).toFixed(2)}M</span>
                    </div>
                    <div>
                      <span className="text-gray-400">IV:</span>
                      <span className="ml-2">{marketData[leg.symbol].iv.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Day Range:</span>
                      <span className="ml-2">${marketData[leg.symbol].low} - ${marketData[leg.symbol].high}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={analyzeStrategy}
            disabled={isLoading}
            className="w-full mt-4 px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calculator className="w-5 h-5" />
            {isLoading ? 'Fetching Live Data...' : 'Analyze Strategy'}
          </button>
        </div>

        {isAnalyzing && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 text-center">
            <Calculator className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
            <p className="text-lg">Analyzing your position with live data...</p>
            <p className="text-sm text-gray-400 mt-2">Calculating Greeks, P&L, and recommendations</p>
          </div>
        )}

        {analysis && showDetails && !isAnalyzing && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-red-500" />
                Recommendation
              </h2>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl font-bold ${getActionColor(analysis.recommendation.action)}`}>
                      {analysis.recommendation.action}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyBadge(analysis.recommendation.urgency)}`}>
                      {analysis.recommendation.urgency.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  {analysis.recommendation.action === 'CLOSE' && <CheckCircle className="w-8 h-8 text-green-400" />}
                  {analysis.recommendation.action === 'ROLL' && <RefreshCw className="w-8 h-8 text-yellow-400" />}
                  {analysis.recommendation.action === 'HEDGE' && <Shield className="w-8 h-8 text-orange-400" />}
                  {analysis.recommendation.action === 'HOLD' && <Clock className="w-8 h-8 text-blue-400" />}
                </div>
                <p className="text-gray-300">{analysis.recommendation.reason}</p>
                
                {analysis.daysToExpiry && analysis.daysToExpiry <= 7 && (
                  <div className="mt-4 flex items-center gap-2 text-yellow-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Expires in {analysis.daysToExpiry} days</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Position Summary
                {autoRefresh && (
                  <span className="text-sm text-gray-400 ml-2">(Live)</span>
                )}
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Total Cost</div>
                  <div className="text-xl font-bold">${Math.abs(analysis.totals.cost).toFixed(2)}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Current Value</div>
                  <div className="text-xl font-bold">${analysis.totals.currentValue.toFixed(2)}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Profit/Loss</div>
                  <div className={`text-xl font-bold ${analysis.totals.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${analysis.totals.profitLoss.toFixed(2)}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Return</div>
                  <div className={`text-xl font-bold ${analysis.totals.profitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {analysis.totals.profitPercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                Greeks Exposure
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Delta</div>
                  <div className={`text-xl font-bold ${analysis.totals.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {analysis.totals.delta >= 0 ? '+' : ''}{analysis.totals.delta.toFixed(2)}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Theta</div>
                  <div className={`text-xl font-bold ${analysis.totals.theta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {analysis.totals.theta >= 0 ? '+' : ''}{analysis.totals.theta.toFixed(2)}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Gamma</div>
                  <div className="text-xl font-bold text-purple-400">
                    {analysis.totals.gamma >= 0 ? '+' : ''}{analysis.totals.gamma.toFixed(4)}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Vega</div>
                  <div className="text-xl font-bold text-blue-400">
                    {analysis.totals.vega >= 0 ? '+' : ''}{analysis.totals.vega.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-lg font-bold mb-4">Leg Details</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-sm border-b border-gray-800">
                      <th className="text-left p-3">Leg</th>
                      <th className="text-left p-3">Position</th>
                      <th className="text-right p-3">Entry</th>
                      <th className="text-right p-3">Current</th>
                      <th className="text-right p-3">P&L</th>
                      <th className="text-right p-3">Delta</th>
                      <th className="text-right p-3">Theta</th>
                      <th className="text-right p-3">IV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.legs.map((leg, index) => (
                      <tr key={leg.id} className="border-b border-gray-800">
                        <td className="p-3">Leg {index + 1}</td>
                        <td className="p-3">
                          {leg.quantity} {leg.symbol} {leg.type}
                          {leg.type !== 'Stock' && ` $${leg.strike}`}
                        </td>
                        <td className="p-3 text-right">${leg.entryPrice.toFixed(2)}</td>
                        <td className="p-3 text-right">
                          ${leg.type === 'Stock' ? leg.currentPrice.toFixed(2) : leg.optionPrice.toFixed(2)}
                          {leg.type !== 'Stock' && (
                            <div className="text-xs text-gray-400">
                              {leg.optionBid.toFixed(2)} / {leg.optionAsk.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className={`p-3 text-right font-medium ${leg.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${leg.profitLoss.toFixed(2)}
                        </td>
                        <td className="p-3 text-right">{leg.delta.toFixed(2)}</td>
                        <td className="p-3 text-right">{leg.theta.toFixed(2)}</td>
                        <td className="p-3 text-right">{leg.impliedVolatility.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button 
                onClick={savePosition}
                className="px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Save Analysis
              </button>
              <button 
                onClick={calculateWhatIfScenarios}
                className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                What-If Scenarios
              </button>
              <button 
                onClick={generateExitStrategy}
                className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Get Exit Strategy
              </button>
            </div>

            {showWhatIf && whatIfScenarios && (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-500" />
                  What-If Scenarios
                </h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-400 text-sm border-b border-gray-800">
                        <th className="text-left p-3">Price Change</th>
                        <th className="text-right p-3">New Price</th>
                        <th className="text-right p-3">Position Value</th>
                        <th className="text-right p-3">P&L</th>
                        <th className="text-right p-3">Return %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {whatIfScenarios.map((scenario, index) => (
                        <tr key={index} className={`border-b border-gray-800 ${scenario.priceChange === 0 ? 'bg-gray-800' : ''}`}>
                          <td className="p-3">
                            {scenario.priceChange > 0 ? '+' : ''}{scenario.priceChange}%
                          </td>
                          <td className="p-3 text-right">${scenario.newPrice.toFixed(2)}</td>
                          <td className="p-3 text-right">${scenario.value.toFixed(2)}</td>
                          <td className={`p-3 text-right font-medium ${scenario.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${scenario.profitLoss.toFixed(2)}
                          </td>
                          <td className={`p-3 text-right font-medium ${scenario.profitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {scenario.profitPercent.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <button 
                  onClick={() => setShowWhatIf(false)}
                  className="mt-4 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {showExitStrategy && exitStrategy && (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  Exit Strategy (Based on Live Data)
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-medium mb-3 text-green-400">Profit Targets</h3>
                    {exitStrategy.targets.map((target, index) => (
                      <div key={index} className="flex justify-between items-center mb-2">
                        <span className="text-sm">{target.action}</span>
                        <div className="text-right">
                          <span className="text-green-400 font-medium">+{target.level.toFixed(1)}%</span>
                          <span className="text-gray-400 ml-2">(${target.price.toFixed(2)})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-medium mb-3 text-red-400">Stop Loss</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{exitStrategy.stopLoss.action}</span>
                      <div className="text-right">
                        <span className="text-red-400 font-medium">{exitStrategy.stopLoss.level.toFixed(1)}%</span>
                        <span className="text-gray-400 ml-2">(${exitStrategy.stopLoss.price.toFixed(2)})</span>
                      </div>
                    </div>
                  </div>
                  
                  {exitStrategy.timeDecay && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="font-medium mb-3 text-yellow-400">Time Decay Alert</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">{exitStrategy.timeDecay.warning}</p>
                          <p className="text-xs text-gray-400 mt-1">{exitStrategy.timeDecay.action}</p>
                        </div>
                        <span className="text-yellow-400 font-medium">{exitStrategy.timeDecay.daysLeft} days</span>
                      </div>
                    </div>
                  )}
                  
                  {exitStrategy.adjustments.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="font-medium mb-3 text-orange-400">Recommended Adjustments</h3>
                      {exitStrategy.adjustments.map((adj, index) => (
                        <div key={index} className="mb-2">
                          <p className="text-sm font-medium">{adj.issue}</p>
                          <p className="text-xs text-gray-400">{adj.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => setShowExitStrategy(false)}
                  className="mt-4 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}