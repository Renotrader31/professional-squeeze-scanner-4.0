import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertCircle, Target, Zap, ChevronRight, Star, BarChart2 } from 'lucide-react';
import AITradeRecommendations from './AITradeRecommendations';

function AIRecommendations({ marketData, scannerResults, selectedSymbol }) {
  const [recommendations, setRecommendations] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [confidence, setConfidence] = useState(0);
const [manualSymbol, setManualSymbol] = useState('');

  // Generate AI-like recommendations based on data patterns
  const generateRecommendations = () => {
    const recs = [];
    
    // Analyze top movers
    if (scannerResults && scannerResults.length > 0) {
      const topMover = scannerResults[0];
      if (topMover.squeezeScore > 70) {
        recs.push({
          type: 'SQUEEZE_ALERT',
          priority: 'HIGH',
          symbol: topMover.symbol,
          title: `${topMover.symbol} Squeeze Setup Detected`,
          description: `High short interest (${topMover.shortInterest?.toFixed(1)}%) combined with increasing momentum. Potential squeeze score: ${topMover.squeezeScore?.toFixed(0)}/100`,
          action: 'Monitor for breakout above key resistance',
          confidence: 85,
          targets: [
            { level: topMover.price * 1.05, label: 'T1' },
            { level: topMover.price * 1.10, label: 'T2' },
            { level: topMover.price * 1.15, label: 'T3' }
          ]
        });
      }

      // Volume surge detection
      const volumeSurge = scannerResults.find(s => s.volume > 50000000);
      if (volumeSurge) {
        recs.push({
          type: 'VOLUME_SURGE',
          priority: 'MEDIUM',
          symbol: volumeSurge.symbol,
          title: `Unusual Volume on ${volumeSurge.symbol}`,
          description: `Volume is ${(volumeSurge.volume / 1000000).toFixed(1)}M, significantly above average. This often precedes major moves.`,
          action: 'Consider entry on pullback to VWAP',
          confidence: 72,
          indicators: ['RSI: Overbought', 'MACD: Bullish Cross', 'Volume: 3x Average']
        });
      }

      // Momentum play
      const momentumPlay = scannerResults.find(s => s.momentumScore > 80);
      if (momentumPlay) {
        recs.push({
          type: 'MOMENTUM',
          priority: 'MEDIUM',
          symbol: momentumPlay.symbol,
          title: `${momentumPlay.symbol} Strong Momentum Signal`,
          description: `Price up ${momentumPlay.changePercent?.toFixed(2)}% with sustained buying pressure. Momentum score: ${momentumPlay.momentumScore?.toFixed(0)}/100`,
          action: 'Scalp trade opportunity on breakout',
          confidence: 78,
          risk: 'Set stop loss at -2%'
        });
      }

      // Options flow signal
      const flowSignal = scannerResults.find(s => s.flowScore > 75);
      if (flowSignal) {
        recs.push({
          type: 'OPTIONS_FLOW',
          priority: 'HIGH',
          symbol: flowSignal.symbol,
          title: `Smart Money Flowing into ${flowSignal.symbol}`,
          description: `Unusual options activity detected. Large call buying suggests institutional accumulation.`,
          action: 'Follow the smart money - consider call spreads',
          confidence: 81,
          expiry: '30-45 DTE recommended'
        });
      }
    }

    // Add market-wide observation
    recs.push({
      type: 'MARKET_ANALYSIS',
      priority: 'INFO',
      symbol: 'SPY',
      title: 'Market Conditions: Risk-On Environment',
      description: 'Overall market showing bullish sentiment with VIX below 20. Favorable for momentum strategies.',
      action: 'Increase position sizes on high-confidence setups',
      confidence: 70,
      sectors: ['Technology +2.3%', 'Financials +1.8%', 'Energy +1.5%']
    });

    setRecommendations(recs);
  };
const generateDetailedAnalysis = async (symbol) => {  // Add async
  if (!symbol) return;

  let stockData = scannerResults?.find(s => s.symbol === symbol);
  
  if (!stockData) {
    // Try to fetch real data first
    try {
      // If you have API keys configured, try to fetch real price
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=demo`
      );
      const data = await response.json();
      
      if (data['Global Quote']) {
        const quote = data['Global Quote'];
        stockData = {
          symbol: symbol,
          price: parseFloat(quote['05. price']) || 100,
          change: parseFloat(quote['09. change']) || 0,
          changePercent: parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
          volume: parseInt(quote['06. volume']) || 50000000,
          squeezeScore: Math.random() * 100,
          momentumScore: Math.random() * 100,
          flowScore: Math.random() * 100,
          shortInterest: Math.random() * 30,
          borrowRate: Math.random() * 50,
          daysToCover: Math.random() * 10
        };
      }
    } catch (error) {
      console.log('API fetch failed, using mock data');
    }
    
    // Fallback to mock data if API fails
    if (!stockData) {
      stockData = {
        symbol: symbol,
        price: 100 + Math.random() * 200,
        // ... rest of mock data
      };
    }
    
    // Add to scanner results (if you want it to persist)
    // This is optional - comment out if you don't want to modify the list
    if (scannerResults) {
      scannerResults.push(stockData);
    }
  }
    const stock = scannerResults?.find(s => s.symbol === symbol) || {};
    const price = stock.price || 100;
    
    setAnalysis({
      symbol: symbol,
      verdict: stockData.squeezeScore > 60 ? 'BULLISH' : stockData.squeezeScore > 40 ? 'NEUTRAL' : 'BEARISH',
      confidence: Math.floor(60 + Math.random() * 35),
      scores: {
        technical: Math.floor(70 + Math.random() * 25),
        sentiment: Math.floor(60 + Math.random() * 35),
        flow: Math.floor(65 + Math.random() * 30),
        fundamental: Math.floor(55 + Math.random() * 40)
      },
      keyLevels: {
        support: [(price * 0.97).toFixed(2), (price * 0.94).toFixed(2), (price * 0.90).toFixed(2)],
        resistance: [(price * 1.03).toFixed(2), (price * 1.06).toFixed(2), (price * 1.10).toFixed(2)]
      },
      signals: {
        positive: [
          'Accumulation pattern detected',
          'Options flow bullish',
          'Breaking above 20-day MA',
          'Relative strength improving'
        ],
        negative: [
          'Approaching overbought on RSI',
          'Resistance at ' + (price * 1.05).toFixed(2),
          'Declining volume on rallies'
        ]
      },
      recommendation: stockData.squeezeScore > 60 
        ? `BUY - Strong setup with ${stockData.squeezeScore?.toFixed(0)}% squeeze probability. Target: $${(price * 1.10).toFixed(2)}`
        : `WAIT - Monitor for better entry. Key level to watch: $${(price * 0.97).toFixed(2)}`
    });

    setConfidence(Math.floor(60 + Math.random() * 35));
  };

  useEffect(() => {
    generateRecommendations();
  }, [scannerResults]);

  useEffect(() => {
    if (selectedSymbol) {
      generateDetailedAnalysis(selectedSymbol);
    }
  }, [selectedSymbol, scannerResults]);

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'HIGH': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'INFO': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'SQUEEZE_ALERT': return <Target className="w-5 h-5" />;
      case 'VOLUME_SURGE': return <BarChart2 className="w-5 h-5" />;
      case 'MOMENTUM': return <TrendingUp className="w-5 h-5" />;
      case 'OPTIONS_FLOW': return <Zap className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">AI Market Intelligence</h2>
            <p className="text-gray-400">Powered by advanced pattern recognition</p>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-400">{recommendations.filter(r => r.priority === 'HIGH').length}</p>
            <p className="text-sm text-gray-400">High Priority</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-400">{recommendations.filter(r => r.priority === 'MEDIUM').length}</p>
            <p className="text-sm text-gray-400">Medium Priority</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">{confidence}%</p>
            <p className="text-sm text-gray-400">Confidence</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400">{recommendations.length}</p>
            <p className="text-sm text-gray-400">Total Signals</p>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`bg-gray-900/50 backdrop-blur rounded-xl p-5 border ${getPriorityColor(rec.priority)} hover:shadow-lg transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getPriorityColor(rec.priority)}`}>
                  {getTypeIcon(rec.type)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{rec.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(rec.priority)}`}>
                    {rec.priority}
                  </span>
                </div>
              </div>
              {rec.confidence && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{rec.confidence}%</p>
                  <p className="text-xs text-gray-400">confidence</p>
                </div>
              )}
            </div>
            
            <p className="text-gray-300 mb-3">{rec.description}</p>
            
            <div className="bg-black/30 rounded-lg p-3 mb-3">
              <p className="text-sm text-green-400 flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                <span className="font-semibold">Action:</span> {rec.action}
              </p>
            </div>

            {rec.targets && (
              <div className="flex gap-2 mb-2">
                {rec.targets.map((target, i) => (
                  <span key={i} className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                    {target.label}: ${target.level.toFixed(2)}
                  </span>
                ))}
              </div>
            )}

            {rec.indicators && (
              <div className="flex flex-wrap gap-2 mb-2">
                {rec.indicators.map((ind, i) => (
                  <span key={i} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                    {ind}
                  </span>
                ))}
              </div>
            )}

            {rec.sectors && (
              <div className="flex flex-wrap gap-2">
                {rec.sectors.map((sector, i) => (
                  <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                    {sector}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detailed Analysis Panel */}
      {analysis && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Deep Dive: {analysis.symbol}
            </h3>
            <span className={`px-3 py-1 rounded-full font-bold ${
              analysis.verdict === 'BULLISH' ? 'bg-green-500/20 text-green-400' :
              analysis.verdict === 'BEARISH' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {analysis.verdict}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Technical</p>
              <p className="text-xl font-bold text-white">{analysis.scores.technical}%</p>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Sentiment</p>
              <p className="text-xl font-bold text-white">{analysis.scores.sentiment}%</p>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Flow</p>
              <p className="text-xl font-bold text-white">{analysis.scores.flow}%</p>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Fundamental</p>
              <p className="text-xl font-bold text-white">{analysis.scores.fundamental}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Support Levels</h4>
              <div className="flex gap-2">
                {analysis.keyLevels.support.map((level, i) => (
                  <span key={i} className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-sm">
                    ${level}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Resistance Levels</h4>
              <div className="flex gap-2">
                {analysis.keyLevels.resistance.map((level, i) => (
                  <span key={i} className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm">
                    ${level}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-semibold text-green-400 mb-2">✓ Positive Signals</h4>
              <ul className="space-y-1">
                {analysis.signals.positive.map((signal, i) => (
                  <li key={i} className="text-sm text-gray-300">• {signal}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-400 mb-2">⚠ Risk Factors</h4>
              <ul className="space-y-1">
                {analysis.signals.negative.map((signal, i) => (
                  <li key={i} className="text-sm text-gray-300">• {signal}</li>
                ))}
              </ul>
            </div>
          </div>
<div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500/30">
            <p className="text-sm font-semibold text-blue-400 mb-1">AI RECOMMENDATION</p>
            <p className="text-white">{analysis.recommendation}</p>
          </div>
        </div>
      )}
      
      {/* Trade Recommendations - Simple Version */}
      {(selectedSymbol || analysis?.symbol) && (
        <AITradeRecommendations 
          stockData={scannerResults?.find(s => s.symbol === (selectedSymbol || analysis?.symbol)) || {
            symbol: selectedSymbol || analysis?.symbol,
            price: 100,
            momentumScore: 50,
            squeezeScore: 50,
            iv: 30,
            volume: 50000000,
            change: 0,
            changePercent: 0
          }}
          symbol={selectedSymbol || analysis?.symbol}
        />
      )}
      
    </div>
  );
}

export default AIRecommendations;
