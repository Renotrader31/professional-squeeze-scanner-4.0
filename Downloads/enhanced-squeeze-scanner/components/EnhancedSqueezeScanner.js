import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Zap,
  DollarSign,
  BarChart3,
  Activity,
  Eye,
  Clock,
  Shield,
  Flame
} from 'lucide-react';

const EnhancedSqueezeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [filters, setFilters] = useState({
    activeTab: 'all',
    minHolyGrail: 0,
    minShortInterest: 0,
    minUtilization: 0,
    minCTB: 0,
    maxFloat: 1000000000,
    squeezeTypes: [],
    ctbTrends: [],
    showOnlyAlerts: false
  });
  const [summary, setSummary] = useState({
    total: 0,
    legendary: 0,
    strong: 0,
    moderate: 0,
    weak: 0,
    alertCount: 0,
    ctbExplosions: 0,
    imminentSqueezes: 0
  });
  const [streamConnection, setStreamConnection] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [watchlist, setWatchlist] = useState(['AAPL', 'TSLA', 'GME', 'AMC', 'BBBY']);
  const [alerts, setAlerts] = useState([]);
  
  // Symbol list for scanning
  const DEFAULT_SYMBOLS = [
    'AAPL', 'TSLA', 'GME', 'AMC', 'BBBY', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META',
    'SPCE', 'PLTR', 'NIO', 'BABA', 'NFLX', 'CRM', 'SHOP', 'SQ', 'ROKU', 'ZOOM',
    'PELOTON', 'RBLX', 'COIN', 'HOOD', 'RIVN', 'LCID', 'DWAC', 'PHUN', 'PROG', 'ATER'
  ];

  // Start/stop scanning
  const toggleScanning = useCallback(async () => {
    if (isScanning) {
      // Stop scanning
      if (streamConnection) {
        streamConnection.close();
        setStreamConnection(null);
      }
      setIsScanning(false);
    } else {
      // Start scanning
      setIsScanning(true);
      await startBulkScan();
      startRealTimeStream();
    }
  }, [isScanning, streamConnection]);

  // Bulk scan function
  const startBulkScan = async () => {
    try {
      const response = await fetch('/api/scan-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbols: DEFAULT_SYMBOLS,
          filters: filters
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStocks(data.results);
        setSummary(data.summary);
        
        // Extract alerts
        const allAlerts = data.results.flatMap(stock => 
          (stock.alerts || []).map(alert => ({
            ...alert,
            symbol: stock.symbol,
            timestamp: new Date().toISOString()
          }))
        );
        setAlerts(prev => [...allAlerts, ...prev].slice(0, 100)); // Keep last 100 alerts
      }
    } catch (error) {
      console.error('Bulk scan error:', error);
    }
  };

  // Real-time streaming
  const startRealTimeStream = () => {
    const eventSource = new EventSource(
      `/api/stream?symbols=${watchlist.join(',')}&interval=30000`
    );
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'connected':
          console.log('Stream connected:', data.connectionId);
          break;
          
        case 'update':
          handleStockUpdate(data);
          break;
          
        case 'broadcast':
          handleBroadcastAlert(data);
          break;
          
        case 'heartbeat':
          // Connection alive
          break;
          
        default:
          console.log('Unknown stream event:', data);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('Stream error:', error);
      // Attempt to reconnect after delay
      setTimeout(() => {
        if (isScanning) {
          startRealTimeStream();
        }
      }, 5000);
    };
    
    setStreamConnection(eventSource);
  };

  // Handle real-time stock updates
  const handleStockUpdate = (updateData) => {
    const { symbol, data, significance } = updateData;
    
    setStocks(prev => prev.map(stock => 
      stock.symbol === symbol ? data : stock
    ));
    
    // Add alerts for significant updates
    if (significance.shouldAlert && data.alerts) {
      const newAlerts = data.alerts.map(alert => ({
        ...alert,
        symbol,
        timestamp: new Date().toISOString(),
        significance: significance.level
      }));
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 100));
    }
  };

  // Handle broadcast alerts
  const handleBroadcastAlert = (broadcastData) => {
    const { symbol, data, significance } = broadcastData;
    
    const alert = {
      type: 'BROADCAST',
      message: `🚨 ${symbol}: ${significance.reasons.join(', ')}`,
      priority: significance.level,
      symbol,
      timestamp: new Date().toISOString(),
      data: {
        holyGrail: data.holyGrail,
        price: data.price,
        change: data.change
      }
    };
    
    setAlerts(prev => [alert, ...prev].slice(0, 100));
  };

  // Apply filters
  useEffect(() => {
    let filtered = stocks;
    
    // Tab filtering
    switch (filters.activeTab) {
      case 'legendary':
        filtered = filtered.filter(s => s.holyGrail >= 90);
        break;
      case 'strong':
        filtered = filtered.filter(s => s.holyGrail >= 85 && s.holyGrail < 90);
        break;
      case 'alerts':
        filtered = filtered.filter(s => s.alerts && s.alerts.length > 0);
        break;
      case 'imminent':
        filtered = filtered.filter(s => s.squeeze?.timing === 'IMMINENT');
        break;
    }
    
    // Additional filters
    if (filters.minHolyGrail > 0) {
      filtered = filtered.filter(s => s.holyGrail >= filters.minHolyGrail);
    }
    
    if (filters.minShortInterest > 0) {
      filtered = filtered.filter(s => 
        s.shortInterest?.estimated >= filters.minShortInterest
      );
    }
    
    if (filters.minUtilization > 0) {
      filtered = filtered.filter(s => 
        s.availability?.utilization >= filters.minUtilization
      );
    }
    
    if (filters.showOnlyAlerts) {
      filtered = filtered.filter(s => s.alerts && s.alerts.length > 0);
    }
    
    setFilteredStocks(filtered);
  }, [stocks, filters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamConnection) {
        streamConnection.close();
      }
    };
  }, [streamConnection]);

  const getHolyGrailColor = (score) => {
    if (score >= 90) return 'text-purple-400 bg-purple-900/20';
    if (score >= 85) return 'text-green-400 bg-green-900/20';
    if (score >= 75) return 'text-blue-400 bg-blue-900/20';
    if (score >= 60) return 'text-yellow-400 bg-yellow-900/20';
    return 'text-red-400 bg-red-900/20';
  };

  const getSqueezeTypeIcon = (type) => {
    switch (type) {
      case 'GAMMA_SHORT_COMBO': return <Flame className="w-4 h-4 text-purple-400" />;
      case 'CLASSIC_SHORT_SQUEEZE': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'BORROWING_CRISIS': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'GAMMA_SQUEEZE': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'LOW_FLOAT_SQUEEZE': return <Target className="w-4 h-4 text-blue-400" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value?.toFixed(2) || '0.00'}`;
  };

  const formatPercent = (value) => `${(value || 0).toFixed(1)}%`;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Professional Squeeze Scanner 4.0
            </h1>
            <p className="text-gray-400 text-sm">
              ULTIMATE EDITION - Enhanced Ortex Integration
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isScanning ? 'bg-green-400 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="text-sm">
                {isScanning ? 'Stream Connected' : 'Stream Disconnected'}
              </span>
            </div>
            
            <button
              onClick={toggleScanning}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
                isScanning 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isScanning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Stop Scan</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start Scan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">{summary.total}</div>
            <div className="text-xs text-gray-400">Scanned</div>
          </div>
          
          <div className="bg-purple-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{summary.legendary}</div>
            <div className="text-xs text-gray-400">Legendary 90+</div>
          </div>
          
          <div className="bg-green-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{summary.strong}</div>
            <div className="text-xs text-gray-400">Strong 85+</div>
          </div>
          
          <div className="bg-blue-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{summary.moderate}</div>
            <div className="text-xs text-gray-400">Moderate 75+</div>
          </div>
          
          <div className="bg-red-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{summary.ctbExplosions || 0}</div>
            <div className="text-xs text-gray-400">CTB Explosions</div>
          </div>
          
          <div className="bg-orange-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{summary.imminentSqueezes || 0}</div>
            <div className="text-xs text-gray-400">Imminent</div>
          </div>
          
          <div className="bg-yellow-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{summary.alertCount || 0}</div>
            <div className="text-xs text-gray-400">Active Alerts</div>
          </div>
          
          <div className="bg-indigo-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-indigo-400">{filteredStocks.length}</div>
            <div className="text-xs text-gray-400">Filtered</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex space-x-2 overflow-x-auto">
          {[
            { key: 'all', label: 'All Stocks', count: stocks.length },
            { key: 'legendary', label: 'Legendary 90+', count: summary.legendary },
            { key: 'strong', label: 'Strong 85+', count: summary.strong },
            { key: 'alerts', label: 'Active Alerts', count: summary.alertCount },
            { key: 'imminent', label: 'Imminent', count: summary.imminentSqueezes }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilters(prev => ({ ...prev, activeTab: tab.key }))}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                filters.activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span>{tab.label}</span>
              <span className="bg-gray-600 px-2 py-1 rounded text-xs">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Stock List */}
        <div className="flex-1 p-6">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr className="text-left text-xs text-gray-300 uppercase tracking-wider">
                    <th className="px-4 py-3">Symbol</th>
                    <th className="px-4 py-3">Holy Grail</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">SI%</th>
                    <th className="px-4 py-3">Util%</th>
                    <th className="px-4 py-3">CTB%</th>
                    <th className="px-4 py-3">DTC</th>
                    <th className="px-4 py-3">Squeeze Type</th>
                    <th className="px-4 py-3">Timing</th>
                    <th className="px-4 py-3">Alerts</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredStocks.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="px-4 py-8 text-center text-gray-400">
                        No stocks match current filters
                      </td>
                    </tr>
                  ) : (
                    filteredStocks.map((stock) => (
                      <tr 
                        key={stock.symbol} 
                        className="hover:bg-gray-700 cursor-pointer"
                        onClick={() => setSelectedStock(stock)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white">{stock.symbol}</span>
                            {stock.alerts && stock.alerts.length > 0 && (
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
                            getHolyGrailColor(stock.holyGrail)
                          }`}>
                            {stock.holyGrail}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="text-white">{formatCurrency(stock.price)}</div>
                          <div className={`text-xs ${
                            stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {stock.change >= 0 ? '+' : ''}{formatPercent(stock.change)}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="text-white">
                            {formatPercent(stock.shortInterest?.estimated)}
                          </div>
                          {stock.shortInterest?.discrepancy > 5 && (
                            <div className="text-xs text-yellow-400">⚠️ Discrepancy</div>
                          )}
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className={`text-sm ${
                            (stock.availability?.utilization || 0) > 90 ? 'text-red-400' :
                            (stock.availability?.utilization || 0) > 80 ? 'text-yellow-400' :
                            'text-gray-300'
                          }`}>
                            {formatPercent(stock.availability?.utilization)}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className={`text-sm ${
                            (stock.costToBorrow?.current || 0) > 50 ? 'text-red-400' :
                            (stock.costToBorrow?.current || 0) > 25 ? 'text-yellow-400' :
                            'text-gray-300'
                          }`}>
                            {formatPercent(stock.costToBorrow?.current)}
                          </div>
                          {stock.costToBorrow?.trend === 'EXPLODING' && (
                            <div className="text-xs text-red-400">🔥 EXPLODING</div>
                          )}
                        </td>
                        
                        <td className="px-4 py-3 text-gray-300">
                          {(stock.daysToCover?.ortex || 0).toFixed(1)}
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-1">
                            {getSqueezeTypeIcon(stock.squeeze?.classification)}
                            <span className="text-xs text-gray-300">
                              {stock.squeeze?.classification?.replace(/_/g, ' ') || 'N/A'}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className={`text-xs px-2 py-1 rounded ${
                            stock.squeeze?.timing === 'IMMINENT' ? 'bg-red-900/50 text-red-300' :
                            stock.squeeze?.timing === 'NEAR_TERM' ? 'bg-orange-900/50 text-orange-300' :
                            stock.squeeze?.timing === 'SHORT_TERM' ? 'bg-yellow-900/50 text-yellow-300' :
                            'bg-gray-700 text-gray-400'
                          }`}>
                            {stock.squeeze?.timing || 'N/A'}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          {stock.alerts && stock.alerts.length > 0 ? (
                            <div className="flex items-center space-x-1">
                              <span className="text-red-400 text-sm">{stock.alerts.length}</span>
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStock(stock);
                            }}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side Panel - Alerts */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Live Alerts
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-gray-400 text-sm">No active alerts</p>
            ) : (
              alerts.slice(0, 20).map((alert, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.priority === 'CRITICAL' ? 'bg-red-900/20 border-red-400' :
                    alert.priority === 'HIGH' ? 'bg-orange-900/20 border-orange-400' :
                    'bg-yellow-900/20 border-yellow-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{alert.symbol}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{alert.message}</p>
                  {alert.data && (
                    <div className="mt-2 text-xs text-gray-400">
                      HG: {alert.data.holyGrail} | 
                      Price: {formatCurrency(alert.data.price)} | 
                      Change: {formatPercent(alert.data.change)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Stock Detail Modal */}
      {selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedStock.symbol} - Detailed Analysis</h2>
              <button 
                onClick={() => setSelectedStock(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Holy Grail Breakdown */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Holy Grail Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Overall Score:</span>
                    <span className={getHolyGrailColor(selectedStock.holyGrail).split(' ')[0]}>
                      {selectedStock.holyGrail}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Status:</span>
                    <span className="text-white">{selectedStock.holyGrailStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Short Interest:</span>
                    <span className="text-white">{formatPercent(selectedStock.shortInterest?.estimated)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Utilization:</span>
                    <span className="text-white">{formatPercent(selectedStock.availability?.utilization)}</span>
                  </div>
                </div>
              </div>
              
              {/* Cost to Borrow Analysis */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Cost to Borrow</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Current:</span>
                    <span className="text-white">{formatPercent(selectedStock.costToBorrow?.current)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Trend:</span>
                    <span className={`${
                      selectedStock.costToBorrow?.trend === 'EXPLODING' ? 'text-red-400' :
                      selectedStock.costToBorrow?.trend === 'RISING_FAST' ? 'text-orange-400' :
                      selectedStock.costToBorrow?.trend === 'RISING' ? 'text-yellow-400' :
                      'text-gray-300'
                    }`}>
                      {selectedStock.costToBorrow?.trend || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Min Today:</span>
                    <span className="text-white">{formatPercent(selectedStock.costToBorrow?.min)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Max Today:</span>
                    <span className="text-white">{formatPercent(selectedStock.costToBorrow?.max)}</span>
                  </div>
                </div>
              </div>
              
              {/* Squeeze Analysis */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Squeeze Analysis</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Type:</span>
                    <div className="flex items-center space-x-1">
                      {getSqueezeTypeIcon(selectedStock.squeeze?.classification)}
                      <span className="text-white text-sm">
                        {selectedStock.squeeze?.classification?.replace(/_/g, ' ') || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Timing:</span>
                    <span className={`${
                      selectedStock.squeeze?.timing === 'IMMINENT' ? 'text-red-400' :
                      selectedStock.squeeze?.timing === 'NEAR_TERM' ? 'text-orange-400' :
                      'text-gray-300'
                    }`}>
                      {selectedStock.squeeze?.timing || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Pressure Score:</span>
                    <span className="text-white">{selectedStock.availability?.squeeze_pressure || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Days to Cover:</span>
                    <span className="text-white">{(selectedStock.daysToCover?.ortex || 0).toFixed(1)}</span>
                  </div>
                </div>
              </div>
              
              {/* Float Analysis */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Float Analysis</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Free Float:</span>
                    <span className="text-white">{(selectedStock.floatAnalysis?.free_float / 1e6 || 0).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Outstanding:</span>
                    <span className="text-white">{(selectedStock.floatAnalysis?.shares_outstanding / 1e6 || 0).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Float Ratio:</span>
                    <span className="text-white">{formatPercent(selectedStock.floatAnalysis?.float_ratio * 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">SI % of Float:</span>
                    <span className="text-white">{formatPercent(selectedStock.floatAnalysis?.si_percent_of_float)}</span>
                  </div>
                </div>
              </div>
              
              {/* Options Flow */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Options Flow</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Flow Sentiment:</span>
                    <span className={`${
                      selectedStock.flow > 60 ? 'text-green-400' :
                      selectedStock.flow < 40 ? 'text-red-400' :
                      'text-gray-300'
                    }`}>
                      {selectedStock.flow}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Unusual Multiplier:</span>
                    <span className="text-white">{(selectedStock.flowAnalysis?.unusual?.multiplier || 1).toFixed(1)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Sweep Count:</span>
                    <span className="text-white">{selectedStock.flowAnalysis?.sweeps?.count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Premium:</span>
                    <span className="text-white">{formatCurrency(selectedStock.optionsMetrics?.netPremium)}</span>
                  </div>
                </div>
              </div>
              
              {/* Fundamental Safety */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Fundamental Safety</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Overall Safety:</span>
                    <span className={`${
                      (selectedStock.fundamentalSafety?.overall_safety || 0) > 70 ? 'text-green-400' :
                      (selectedStock.fundamentalSafety?.overall_safety || 0) > 40 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {selectedStock.fundamentalSafety?.overall_safety || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Financial Health:</span>
                    <span className="text-white">{selectedStock.fundamentalSafety?.financial_health || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Bankruptcy Risk:</span>
                    <span className={`${
                      (selectedStock.fundamentalSafety?.bankruptcy_risk || 0) > 60 ? 'text-red-400' :
                      (selectedStock.fundamentalSafety?.bankruptcy_risk || 0) > 30 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {selectedStock.fundamentalSafety?.bankruptcy_risk || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Ortex Score:</span>
                    <span className="text-white">{selectedStock.stockScores?.ortex_score || 0}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Active Alerts */}
            {selectedStock.alerts && selectedStock.alerts.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-white mb-3">Active Alerts</h3>
                <div className="space-y-2">
                  {selectedStock.alerts.map((alert, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg ${
                        alert.priority === 'CRITICAL' ? 'bg-red-900/20 border border-red-400' :
                        alert.priority === 'HIGH' ? 'bg-orange-900/20 border border-orange-400' :
                        'bg-yellow-900/20 border border-yellow-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">{alert.type}</span>
                        <span className="text-xs text-gray-400">{alert.priority}</span>
                      </div>
                      <p className="text-sm text-gray-300 mt-1">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSqueezeScanner;