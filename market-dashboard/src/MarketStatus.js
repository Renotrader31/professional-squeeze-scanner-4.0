import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';

function MarketStatus() {
  const [marketTime, setMarketTime] = useState(new Date());
  const [marketStatus, setMarketStatus] = useState('CLOSED');
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setMarketTime(now);
      
      // Check if market is open (9:30 AM - 4:00 PM ET, weekdays)
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const day = now.getDay();
      
      if (day >= 1 && day <= 5) {
        const currentTime = hours * 60 + minutes;
        const marketOpen = 9 * 60 + 30; // 9:30 AM
        const marketClose = 16 * 60; // 4:00 PM
        
        if (currentTime >= marketOpen && currentTime < marketClose) {
          setMarketStatus('OPEN');
        } else if (currentTime < marketOpen) {
          setMarketStatus('PRE-MARKET');
        } else {
          setMarketStatus('AFTER-HOURS');
        }
      } else {
        setMarketStatus('CLOSED');
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const getStatusColor = () => {
    switch(marketStatus) {
      case 'OPEN': return 'text-green-400';
      case 'PRE-MARKET': return 'text-yellow-400';
      case 'AFTER-HOURS': return 'text-orange-400';
      default: return 'text-red-400';
    }
  };
  
  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="text-gray-300">{marketTime.toLocaleTimeString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <Activity className={`w-4 h-4 ${getStatusColor()}`} />
        <span className={`font-semibold ${getStatusColor()}`}>
          MARKET {marketStatus}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-gray-400">SPY</span>
          <span className="text-green-400 flex items-center">
            <TrendingUp className="w-3 h-3" />
            +1.2%
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400">VIX</span>
          <span className="text-red-400 flex items-center">
            <TrendingDown className="w-3 h-3" />
            -3.5%
          </span>
        </div>
      </div>
    </div>
  );
}

export default MarketStatus;
