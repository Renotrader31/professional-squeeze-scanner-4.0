import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, DollarSign, AlertCircle, Zap, ChevronRight } from 'lucide-react';

function AITradeRecommendations({ stockData, symbol }) {
  const [trades, setTrades] = useState([]);
  
  useEffect(() => {
    if (stockData && symbol) {
      generateTradeIdeas(stockData, symbol);
    }
  }, [stockData, symbol]);
  
  const generateTradeIdeas = (data, sym) => {
    const price = data.price || 100;
    const volatility = data.iv || 30;
    const momentum = data.momentumScore || 50;
    const squeeze = data.squeezeScore || 40;
    
    const tradeIdeas = [];
    
    // High Squeeze Score = Call Options
    if (squeeze > 70) {
      const strike = Math.ceil(price / 5) * 5;
      tradeIdeas.push({
        type: 'CALL_OPTION',
        urgency: 'HIGH',
        symbol: sym,
        setup: `Buy ${sym} ${strike}C`,
        entry: price,
        strike: strike,
        expiry: getNextFriday(14), // 2 weeks out
        premium: (price * 0.03).toFixed(2),
        target1: strike + 5,
        target2: strike + 10,
        stopLoss: price * 0.97,
        riskReward: '1:3',
        confidence: 85,
        reasoning: `High squeeze score (${squeeze}/100) with increasing momentum. Gamma squeeze potential.`,
        maxRisk: 500,
        expectedReturn: 1500,
        probability: 68
      });
    }
    
    // High Momentum = Bull Call Spread
    if (momentum > 75) {
      const lowerStrike = Math.floor(price / 5) * 5;
      const upperStrike = lowerStrike + 10;
      tradeIdeas.push({
        type: 'BULL_CALL_SPREAD',
        urgency: 'MEDIUM',
        symbol: sym,
        setup: `Buy ${sym} ${lowerStrike}C / Sell ${upperStrike}C`,
        entry: price,
        lowerStrike: lowerStrike,
        upperStrike: upperStrike,
        expiry: getNextFriday(21),
        netDebit: ((upperStrike - lowerStrike) * 0.4).toFixed(2),
        maxGain: (upperStrike - lowerStrike) * 100,
        maxLoss: ((upperStrike - lowerStrike) * 0.4 * 100).toFixed(0),
        breakeven: lowerStrike + ((upperStrike - lowerStrike) * 0.4),
        confidence: 72,
        reasoning: `Strong momentum (${momentum}/100) suggests continued upside with defined risk.`,
        probability: 65
      });
    }
    
    // High IV = Iron Condor
    if (volatility > 60) {
      const putSpread = Math.floor(price * 0.9 / 5) * 5;
      const callSpread = Math.ceil(price * 1.1 / 5) * 5;
      tradeIdeas.push({
        type: 'IRON_CONDOR',
        urgency: 'LOW',
        symbol: sym,
        setup: `Sell ${putSpread}/${putSpread-5}P - ${callSpread}/${callSpread+5}C`,
        entry: price,
        putShort: putSpread,
        putLong: putSpread - 5,
        callShort: callSpread,
        callLong: callSpread + 5,
        expiry: getNextFriday(30),
        netCredit: 1.25,
        maxGain: 125,
        maxLoss: 375,
        upperBreakeven: callSpread + 1.25,
        lowerBreakeven: putSpread - 1.25,
        confidence: 70,
        reasoning: `High IV (${volatility}%) creates premium selling opportunity. Profit from theta decay.`,
        probability: 70
      });
    }
    
    // Neutral Market = Straddle for breakout
    if (momentum > 40 && momentum < 60 && volatility < 40) {
      const strike = Math.round(price / 5) * 5;
      tradeIdeas.push({
        type: 'LONG_STRADDLE',
        urgency: 'MEDIUM',
        symbol: sym,
        setup: `Buy ${sym} ${strike}C + ${strike}P`,
        entry: price,
        strike: strike,
        expiry: getNextFriday(7),
        totalPremium: (price * 0.05).toFixed(2),
        upperBreakeven: strike + (price * 0.05),
        lowerBreakeven: strike - (price * 0.05),
        targetUp: strike + (price * 0.10),
        targetDown: strike - (price * 0.10),
        confidence: 68,
        reasoning: 'Low IV with consolidation pattern. Expecting breakout in either direction.',
        maxRisk: (price * 0.05 * 200).toFixed(0),
        probability: 60
      });
    }
    
    // Bearish Divergence = Put Options
    if (momentum < 30 && data.change < 0) {
      const strike = Math.floor(price / 5) * 5;
      tradeIdeas.push({
        type: 'PUT_OPTION',
        urgency: 'MEDIUM',
        symbol: sym,
        setup: `Buy ${sym} ${strike}P`,
        entry: price,
        strike: strike,
        expiry: getNextFriday(14),
        premium: (price * 0.025).toFixed(2),
        target1: strike - 5,
        target2: strike - 10,
        stopLoss: price * 1.03,
        riskReward: '1:2.5',
        confidence: 65,
        reasoning: `Weak momentum (${momentum}/100) with bearish price action. Downside protection play.`,
        maxRisk: (price * 0.025 * 100).toFixed(0),
        expectedReturn: (price * 0.025 * 250).toFixed(0),
        probability: 55
      });
    }
    
    // Day Trade Scalp
    if (data.volume > 50000000) {
      tradeIdeas.push({
        type: 'DAY_TRADE_SCALP',
        urgency: 'HIGH',
        symbol: sym,
        setup: `Scalp ${sym} on breakout above ${(price * 1.005).toFixed(2)}`,
        entry: (price * 1.005).toFixed(2),
        target1: (price * 1.01).toFixed(2),
        target2: (price * 1.02).toFixed(2),
        stopLoss: (price * 0.995).toFixed(2),
        shares: Math.floor(10000 / price),
        riskReward: '1:2',
        timeframe: '5-15 minutes',
        confidence: 75,
        reasoning: 'High volume breakout setup with tight risk management.',
        maxRisk: 100,
        expectedReturn: 200,
        indicators: ['VWAP Support', 'RSI > 50', 'MACD Bullish']
      });
    }
    
    setTrades(tradeIdeas);
  };
  
  const getNextFriday = (daysOut) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOut);
    const day = date.getDay();
    const diff = 5 - day; // 5 is Friday
    if (diff < 0) {
      date.setDate(date.getDate() + 7 + diff);
    } else {
      date.setDate(date.getDate() + diff);
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const getTypeColor = (type) => {
    const colors = {
      'CALL_OPTION': 'bg-green-500/20 text-green-400 border-green-500/30',
      'PUT_OPTION': 'bg-red-500/20 text-red-400 border-red-500/30',
      'BULL_CALL_SPREAD': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'IRON_CONDOR': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'LONG_STRADDLE': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'DAY_TRADE_SCALP': 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };
  
  const getTypeIcon = (type) => {
    if (type.includes('CALL')) return <TrendingUp className="w-5 h-5" />;
    if (type.includes('PUT')) return <TrendingDown className="w-5 h-5" />;
    if (type.includes('DAY_TRADE')) return <Zap className="w-5 h-5" />;
    return <Target className="w-5 h-5" />;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          🎯 Actionable Trade Setups
        </h3>
        <span className="text-sm text-gray-400">
          {trades.length} opportunities found
        </span>
      </div>
      
      {trades.map((trade, index) => (
        <div
          key={index}
          className={`p-5 rounded-xl border ${getTypeColor(trade.type)} backdrop-blur transition-all hover:scale-[1.01]`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getTypeColor(trade.type)}`}>
                {getTypeIcon(trade.type)}
              </div>
              <div>
                <h4 className="font-bold text-white text-lg">{trade.setup}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(trade.type)}`}>
                    {trade.type.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    trade.urgency === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                    trade.urgency === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {trade.urgency} PRIORITY
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{trade.confidence}%</p>
              <p className="text-xs text-gray-400">confidence</p>
            </div>
          </div>
          
          <div className="bg-black/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-300 mb-2">{trade.reasoning}</p>
            
            {/* Trade Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
              {trade.entry && (
                <div className="text-sm">
                  <span className="text-gray-500">Entry:</span>
<span className="text-white ml-1">${typeof trade.entry === 'number' ? trade.entry.toFixed(2) : trade.entry}</span>
                </div>
              )}
              {trade.strike && (
                <div className="text-sm">
                  <span className="text-gray-500">Strike:</span>
                  <span className="text-white ml-1">${trade.strike}</span>
                </div>
              )}
              {trade.expiry && (
                <div className="text-sm">
                  <span className="text-gray-500">Expiry:</span>
                  <span className="text-white ml-1">{trade.expiry}</span>
                </div>
              )}
              {trade.target1 && (
                <div className="text-sm">
                  <span className="text-gray-500">Target 1:</span>
                  <span className="text-green-400 ml-1">${trade.target1}</span>
                </div>
              )}
              {trade.target2 && (
                <div className="text-sm">
                  <span className="text-gray-500">Target 2:</span>
                  <span className="text-green-400 ml-1">${trade.target2}</span>
                </div>
              )}
              {trade.stopLoss && (
                <div className="text-sm">
                  <span className="text-gray-500">Stop:</span>
<span className="text-red-400 ml-1">${trade.stopLoss}</span>
                </div>
              )}
              {trade.premium && (
                <div className="text-sm">
                  <span className="text-gray-500">Premium:</span>
                  <span className="text-white ml-1">${trade.premium}</span>
                </div>
              )}
              {trade.netDebit && (
                <div className="text-sm">
                  <span className="text-gray-500">Net Debit:</span>
                  <span className="text-white ml-1">${trade.netDebit}</span>
                </div>
              )}
              {trade.netCredit && (
                <div className="text-sm">
                  <span className="text-gray-500">Net Credit:</span>
                  <span className="text-white ml-1">${trade.netCredit}</span>
                </div>
              )}
              {trade.maxGain && (
                <div className="text-sm">
                  <span className="text-gray-500">Max Gain:</span>
                  <span className="text-green-400 ml-1">${trade.maxGain}</span>
                </div>
              )}
              {trade.maxLoss && (
                <div className="text-sm">
                  <span className="text-gray-500">Max Loss:</span>
                  <span className="text-red-400 ml-1">${trade.maxLoss}</span>
                </div>
              )}
              {trade.riskReward && (
                <div className="text-sm">
                  <span className="text-gray-500">R:R:</span>
                  <span className="text-white ml-1">{trade.riskReward}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Risk/Reward Bar */}
          {trade.maxRisk && trade.expectedReturn && (
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-red-400">Risk: ${trade.maxRisk}</span>
                  <span className="text-green-400">Reward: ${trade.expectedReturn}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-red-500 h-full" 
                    style={{ width: `${(trade.maxRisk / (trade.maxRisk + trade.expectedReturn)) * 100}%` }}
                  />
                  <div 
                    className="bg-green-500 h-full" 
                    style={{ width: `${(trade.expectedReturn / (trade.maxRisk + trade.expectedReturn)) * 100}%` }}
                  />
                </div>
              </div>
              {trade.probability && (
                <div className="text-center">
                  <p className="text-xs text-gray-400">Win Rate</p>
                  <p className="text-lg font-bold text-white">{trade.probability}%</p>
                </div>
              )}
            </div>
          )}
          
          {/* Indicators */}
          {trade.indicators && (
            <div className="flex flex-wrap gap-2">
              {trade.indicators.map((indicator, i) => (
                <span key={i} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                  {indicator}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
      
      {trades.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No specific trade setups available for current conditions.</p>
          <p className="text-sm mt-2">Try selecting a different symbol or wait for better setups.</p>
        </div>
      )}
    </div>
  );
}

export default AITradeRecommendations;
