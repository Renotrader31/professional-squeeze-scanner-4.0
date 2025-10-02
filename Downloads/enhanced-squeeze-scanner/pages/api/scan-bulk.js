export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Mock multiple stocks data
    const mockStocks = [
      {
        symbol: 'AAPL',
        price: 150.25,
        change: 2.5,
        holyGrail: 85,
        holyGrailStatus: 'STRONG',
        squeeze: { overall_score: 80, classification: 'GAMMA_SHORT_COMBO', timing: 'NEAR_TERM' },
        shortInterest: { estimated: 18.5, official: 17.8, confidence: 90 },
        costToBorrow: { current: 45.5, trend: 'EXPLODING', acceleration: 2.1 },
        availability: { utilization: 85.5, squeeze_pressure: 88 },
        daysToCover: { ortex: 7.2 },
        flow: 75,
        alerts: [{ type: 'CTB_SPIKE', message: 'Cost to borrow spiking!', priority: 'HIGH' }]
      },
      {
        symbol: 'TSLA',
        price: 245.80,
        change: -1.2,
        holyGrail: 78,
        holyGrailStatus: 'MODERATE',
        squeeze: { overall_score: 70, classification: 'CLASSIC_SHORT_SQUEEZE', timing: 'SHORT_TERM' },
        shortInterest: { estimated: 22.3, official: 21.5, confidence: 85 },
        costToBorrow: { current: 32.1, trend: 'RISING', acceleration: 1.5 },
        availability: { utilization: 78.2, squeeze_pressure: 75 },
        daysToCover: { ortex: 5.8 },
        flow: 45,
        alerts: []
      },
      {
        symbol: 'GME',
        price: 18.45,
        change: 5.8,
        holyGrail: 92,
        holyGrailStatus: 'LEGENDARY',
        squeeze: { overall_score: 95, classification: 'GAMMA_SHORT_COMBO', timing: 'IMMINENT' },
        shortInterest: { estimated: 35.2, official: 33.8, confidence: 88 },
        costToBorrow: { current: 125.5, trend: 'EXPLODING', acceleration: 3.2 },
        availability: { utilization: 96.5, squeeze_pressure: 98 },
        daysToCover: { ortex: 12.3 },
        flow: 85,
        alerts: [
          { type: 'LEGENDARY_SETUP', message: 'LEGENDARY Holy Grail setup!', priority: 'CRITICAL' },
          { type: 'CTB_EXPLOSION', message: 'CTB exploding: 125.5%', priority: 'CRITICAL' }
        ]
      },
      {
        symbol: 'AMC',
        price: 4.23,
        change: 3.2,
        holyGrail: 76,
        holyGrailStatus: 'MODERATE',
        squeeze: { overall_score: 72, classification: 'LOW_FLOAT_SQUEEZE', timing: 'NEAR_TERM' },
        shortInterest: { estimated: 28.7, official: 27.2, confidence: 82 },
        costToBorrow: { current: 68.3, trend: 'RISING_FAST', acceleration: 1.8 },
        availability: { utilization: 82.1, squeeze_pressure: 85 },
        daysToCover: { ortex: 8.9 },
        flow: 62,
        alerts: [{ type: 'HIGH_UTILIZATION', message: 'High utilization: 82.1%', priority: 'MEDIUM' }]
      }
    ];

    // Generate summary
    const summary = {
      total: mockStocks.length,
      legendary: mockStocks.filter(s => s.holyGrail >= 90).length,
      strong: mockStocks.filter(s => s.holyGrail >= 85 && s.holyGrail < 90).length,
      moderate: mockStocks.filter(s => s.holyGrail >= 75 && s.holyGrail < 85).length,
      weak: mockStocks.filter(s => s.holyGrail >= 60 && s.holyGrail < 75).length,
      avoid: mockStocks.filter(s => s.holyGrail < 60).length,
      averageHolyGrail: Math.round(mockStocks.reduce((sum, s) => sum + s.holyGrail, 0) / mockStocks.length),
      alertCount: mockStocks.reduce((sum, s) => sum + (s.alerts?.length || 0), 0),
      ctbExplosions: mockStocks.filter(s => s.costToBorrow?.trend === 'EXPLODING').length,
      imminentSqueezes: mockStocks.filter(s => s.squeeze?.timing === 'IMMINENT').length
    };
    
    res.status(200).json({
      success: true,
      summary,
      results: mockStocks,
      timestamp: new Date().toISOString(),
      processed_count: mockStocks.length,
      filtered_count: mockStocks.length
    });
    
  } catch (error) {
    console.error('Bulk scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
