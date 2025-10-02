export default async function handler(req, res) {
  const { symbol } = req.query;
  
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol required' });
  }
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const data = await scanSingleStock(symbol);
    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error scanning ${symbol}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      symbol
    });
  }
}

async function scanSingleStock(symbol) {
  try {
    console.log(`Scanning ${symbol} with real APIs...`);
    
    // Fetch all data in parallel from real APIs
    const [
      ortexShortEstimates,
      ortexShortAvailability,
      ortexDaysToCover,
      ortexCTBNew,
      ortexFreeFloat,
      ortexSharesOutstanding,
      uwOptionsFlow,
      uwMarketData,
      uwGreeks,
      uwDarkPool,
      fmpData
    ] = await Promise.all([
      fetchOrtexShortEstimates(symbol).catch(e => { console.log('Ortex Short Estimates error:', e.message); return null; }),
      fetchOrtexShortAvailability(symbol).catch(e => { console.log('Ortex Availability error:', e.message); return null; }),
      fetchOrtexDaysToCover(symbol).catch(e => { console.log('Ortex DTC error:', e.message); return null; }),
      fetchOrtexCTBNew(symbol).catch(e => { console.log('Ortex CTB error:', e.message); return null; }),
      fetchOrtexFreeFloat(symbol).catch(e => { console.log('Ortex Float error:', e.message); return null; }),
      fetchOrtexSharesOutstanding(symbol).catch(e => { console.log('Ortex Shares error:', e.message); return null; }),
      fetchUWOptionsFlow(symbol).catch(e => { console.log('UW Options error:', e.message); return null; }),
      fetchUWMarketData(symbol).catch(e => { console.log('UW Market error:', e.message); return null; }),
      fetchUWGreeks(symbol).catch(e => { console.log('UW Greeks error:', e.message); return null; }),
      fetchUWDarkPool(symbol).catch(e => { console.log('UW Dark Pool error:', e.message); return null; }),
      fetchFMPQuote(symbol).catch(e => { console.log('FMP error:', e.message); return null; })
    ]);

    // Process the real data
    const price = uwMarketData?.price || fmpData?.[0]?.price || 0;
    const change = uwMarketData?.change_percent || fmpData?.[0]?.changesPercentage || 0;
    
    // Calculate metrics from real data
    const totalCallVolume = uwOptionsFlow?.call_volume || 0;
    const totalPutVolume = uwOptionsFlow?.put_volume || 0;
    const totalVolume = totalCallVolume + totalPutVolume;
    const flowSentiment = totalVolume > 0 ? Math.round((totalCallVolume / totalVolume) * 100) : 50;
    
    // Enhanced short interest data from Ortex
    const shortInterestData = {
      estimated: ortexShortEstimates?.si_percent || 0,
      confidence: ortexShortEstimates?.confidence || 50,
      utilization: ortexShortAvailability?.utilization || 0,
      available_shares: ortexShortAvailability?.available_shares || 0
    };
    
    // Cost to borrow data from Ortex
    const ctbData = {
      current: ortexCTBNew?.current_ctb || 0,
      min: ortexCTBNew?.min_ctb || 0,
      max: ortexCTBNew?.max_ctb || 0,
      average: ortexCTBNew?.avg_ctb || 0,
      trend: calculateCTBTrend(ortexCTBNew)
    };
    
    // Float data from Ortex
    const freeFloat = ortexFreeFloat?.free_float || 0;
    const sharesOutstanding = ortexSharesOutstanding?.shares_outstanding || 0;
    
    // Days to cover from Ortex
    const dtcData = {
      ortex: ortexDaysToCover?.days_to_cover || 0,
      confidence: ortexDaysToCover?.confidence || 'medium'
    };
    
    // Calculate enhanced Holy Grail score with real data
    const enhancedHolyGrailInputs = {
      shortInterest: shortInterestData.estimated,
      utilization: shortInterestData.utilization,
      daysToClose: dtcData.ortex,
      gammaExposure: uwGreeks?.total_gamma || 0,
      unusualActivity: uwOptionsFlow?.unusual_volume_ratio || 1,
      flowSentiment,
      sweepCount: uwOptionsFlow?.sweep_count || 0,
      darkPoolRatio: uwDarkPool?.dark_pool_ratio || 0,
      ctbLevel: ctbData.current,
      availabilityPressure: calculateAvailabilityPressure(shortInterestData),
      floatQuality: calculateFloatQuality(freeFloat, sharesOutstanding)
    };
    
    const enhancedHolyGrail = calculateEnhancedHolyGrailScore(enhancedHolyGrailInputs);
    
    // Classify squeeze type based on real data
    const squeezeClassification = classifySqueezeType({
      shortInterest: shortInterestData.estimated,
      utilization: shortInterestData.utilization,
      ctb: ctbData.current,
      dtc: dtcData.ortex,
      gamma: uwGreeks?.total_gamma || 0,
      flow: flowSentiment
    });
    
    // Generate alerts based on real data
    const alerts = generateRealTimeAlerts({
      holyGrail: enhancedHolyGrail,
      ctb: ctbData,
      shortInterest: shortInterestData,
      squeeze: squeezeClassification,
      symbol
    });
    
    return {
      symbol,
      price,
      change,
      holyGrail: enhancedHolyGrail,
      holyGrailStatus: enhancedHolyGrail >= 90 ? 'LEGENDARY' : 
                     enhancedHolyGrail >= 85 ? 'STRONG' : 
                     enhancedHolyGrail >= 75 ? 'MODERATE' : 
                     enhancedHolyGrail >= 60 ? 'WEAK' : 'AVOID',
      
      squeeze: {
        overall_score: Math.round((shortInterestData.estimated + shortInterestData.utilization) / 2),
        classification: squeezeClassification,
        timing: calculateSqueezeTiming(dtcData, ctbData, shortInterestData)
      },
      
      shortInterest: shortInterestData,
      costToBorrow: ctbData,
      daysToCover: dtcData,
      
      availability: {
        utilization: shortInterestData.utilization,
        available_shares: shortInterestData.available_shares,
        squeeze_pressure: calculateAvailabilityPressure(shortInterestData)
      },
      
      floatAnalysis: {
        free_float: freeFloat,
        shares_outstanding: sharesOutstanding,
        float_ratio: sharesOutstanding > 0 ? freeFloat / sharesOutstanding : 1,
        si_percent_of_float: freeFloat > 0 ? (shortInterestData.estimated * sharesOutstanding / freeFloat) : 0
      },
      
      flow: flowSentiment,
      gamma: uwGreeks?.total_gamma || 0,
      gex: uwGreeks?.gex || 0,
      pinRisk: calculatePinRisk(price, uwGreeks),
      
      optionsMetrics: {
        totalVolume,
        callVolume: totalCallVolume,
        putVolume: totalPutVolume,
        totalOI: uwOptionsFlow?.total_oi || 0,
        putCallRatio: totalCallVolume > 0 ? totalPutVolume / totalCallVolume : 0,
        ivRank: uwOptionsFlow?.iv_rank || 0
      },
      
      flowAnalysis: {
        unusual: {
          multiplier: uwOptionsFlow?.unusual_volume_ratio || 1,
          zscore: uwOptionsFlow?.volume_zscore || 0
        },
        sweeps: {
          count: uwOptionsFlow?.sweep_count || 0,
          totalPremium: uwOptionsFlow?.sweep_premium || 0
        },
        sentiment: {
          overall: flowSentiment > 60 ? 'BULLISH' : flowSentiment < 40 ? 'BEARISH' : 'NEUTRAL',
          score: flowSentiment
        }
      },
      
      darkPool: {
        ratio: uwDarkPool?.dark_pool_ratio || 0,
        volume: uwDarkPool?.dark_pool_volume || 0
      },
      
      alerts,
      
      dataQuality: {
        ortex_coverage: calculateDataCoverage([ortexShortEstimates, ortexCTBNew, ortexFreeFloat]),
        uw_coverage: calculateDataCoverage([uwOptionsFlow, uwMarketData, uwGreeks]),
        last_updated: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error in scanSingleStock:', error);
    throw error;
  }
}

// ORTEX API Functions
async function fetchOrtexShortEstimates(symbol) {
  const response = await fetch(
    `https://api.ortex.com/v2/equities/${symbol}/short-interest/estimates`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.ORTEX_API_KEY}`,
        'Accept': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Ortex Short Estimates API error: ${response.status}`);
  }
  
  return response.json();
}

async function fetchOrtexShortAvailability(symbol) {
  const response = await fetch(
    `https://api.ortex.com/v2/equities/${symbol}/short-availability`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.ORTEX_API_KEY}`,
        'Accept': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Ortex Availability API error: ${response.status}`);
  }
  
  return response.json();
}

async function fetchOrtexDaysToCover(symbol) {
  const response = await fetch(
    `https://api.ortex.com/v2/equities/${symbol}/days-to-cover`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.ORTEX_API_KEY}`,
        'Accept': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Ortex DTC API error: ${response.status}`);
  }
  
  return response.json();
}

async function fetchOrtexCTBNew(symbol) {
  const response = await fetch(
    `https://api.ortex.com/v2/equities/${symbol}/cost-to-borrow`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.ORTEX_API_KEY}`,
        'Accept': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Ortex CTB API error: ${response.status}`);
  }
  
  return response.json();
}

async function fetchOrtexFreeFloat(symbol) {
  const response = await fetch(
    `https://api.ortex.com/v2/equities/${symbol}/free-float`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.ORTEX_API_KEY}`,
        'Accept': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Ortex Float API error: ${response.status}`);
  }
  
  return response.json();
}

async function fetchOrtexSharesOutstanding(symbol) {
  const response = await fetch(
    `https://api.ortex.com/v2/equities/${symbol}/shares-outstanding`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.ORTEX_API_KEY}`,
        'Accept': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Ortex Shares API error: ${response.status}`);
  }
  
  return response.json();
}

// Unusual Whales API Functions
async function fetchUWOptionsFlow(symbol) {
  const response = await fetch(
    `https://api.unusualwhales.com/api/stock/${symbol}/options-flow`,
    {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.UW_API_KEY}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`UW Options Flow API error: ${response.status}`);
  }
  
  return response.json();
}

async function fetchUWMarketData(symbol) {
  const response = await fetch(
    `https://api.unusualwhales.com/api/stock/${symbol}/quote`,
    {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.UW_API_KEY}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`UW Market Data API error: ${response.status}`);
  }
  
  return response.json();
}

async function fetchUWGreeks(symbol) {
  const response = await fetch(
    `https://api.unusualwhales.com/api/stock/${symbol}/greeks`,
    {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.UW_API_KEY}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`UW Greeks API error: ${response.status}`);
  }
  
  return response.json();
}

async function fetchUWDarkPool(symbol) {
  const response = await fetch(
    `https://api.unusualwhales.com/api/stock/${symbol}/dark-pool`,
    {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.UW_API_KEY}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`UW Dark Pool API error: ${response.status}`);
  }
  
  return response.json();
}

// FMP API (backup for price data)
async function fetchFMPQuote(symbol) {
  const response = await fetch(
    `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${process.env.FMP_API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error(`FMP API error: ${response.status}`);
  }
  
  return response.json();
}

// Calculation Functions
function calculateEnhancedHolyGrailScore(inputs) {
  const weights = {
    shortInterest: 0.20,
    utilization: 0.18,
    daysToClose: 0.15,
    gammaExposure: 0.12,
    ctbLevel: 0.12,
    flowSentiment: 0.10,
    unusualActivity: 0.08,
    availabilityPressure: 0.03,
    floatQuality: 0.02
  };
  
  let score = 0;
  score += Math.min((inputs.shortInterest / 30) * 100, 100) * weights.shortInterest;
  score += inputs.utilization * weights.utilization;
  score += Math.max(0, (15 - inputs.daysToClose) * 6.67) * weights.daysToClose;
  score += Math.min((inputs.gammaExposure / 10) * 100, 100) * weights.gammaExposure;
  score += Math.min(inputs.ctbLevel * 2, 100) * weights.ctbLevel;
  score += inputs.flowSentiment * weights.flowSentiment;
  score += Math.min(inputs.unusualActivity * 20, 100) * weights.unusualActivity;
  score += inputs.availabilityPressure * weights.availabilityPressure;
  score += inputs.floatQuality * weights.floatQuality;
  
  return Math.round(Math.min(Math.max(score, 0), 99));
}

function calculateCTBTrend(ctbData) {
  if (!ctbData) return 'UNKNOWN';
  
  const current = ctbData.current_ctb || 0;
  if (current > 100) return 'EXPLODING';
  if (current > 50) return 'RISING_FAST';
  if (current > 25) return 'RISING';
  return 'NORMAL';
}

function calculateAvailabilityPressure(shortData) {
  const utilization = shortData.utilization || 0;
  if (utilization > 95) return 98;
  if (utilization > 85) return 85;
  if (utilization > 70) return 70;
  return 50;
}

function calculateFloatQuality(freeFloat, sharesOutstanding) {
  if (!freeFloat || !sharesOutstanding) return 50;
  const ratio = freeFloat / sharesOutstanding;
  if (ratio < 0.3) return 90; // Low float is good for squeezes
  if (ratio < 0.5) return 70;
  return 50;
}

function classifySqueezeType(data) {
  const { shortInterest, utilization, ctb, dtc, gamma, flow } = data;
  
  if (gamma > 5 && flow > 70 && shortInterest > 15) {
    return 'GAMMA_SHORT_COMBO';
  }
  
  if (shortInterest > 20 && utilization > 85 && dtc > 7) {
    return 'CLASSIC_SHORT_SQUEEZE';
  }
  
  if (ctb > 50 && utilization > 80) {
    return 'BORROWING_CRISIS';
  }
  
  if (gamma > 8 && flow > 75) {
    return 'GAMMA_SQUEEZE';
  }
  
  return 'POTENTIAL_SETUP';
}

function calculateSqueezeTiming(dtc, ctb, shortData) {
  if (ctb.trend === 'EXPLODING' || shortData.utilization > 95) {
    return 'IMMINENT';
  }
  
  if (dtc.ortex < 3 && ctb.current > 25) {
    return 'NEAR_TERM';
  }
  
  if (dtc.ortex < 7 && shortData.utilization > 80) {
    return 'SHORT_TERM';
  }
  
  return 'MEDIUM_TERM';
}

function generateRealTimeAlerts(data) {
  const alerts = [];
  
  if (data.holyGrail >= 90) {
    alerts.push({
      type: 'LEGENDARY_SETUP',
      message: `🔥 LEGENDARY Holy Grail setup: ${data.holyGrail}!`,
      priority: 'CRITICAL'
    });
  }
  
  if (data.ctb.trend === 'EXPLODING') {
    alerts.push({
      type: 'CTB_EXPLOSION',
      message: `🚀 Cost to borrow exploding: ${data.ctb.current}%`,
      priority: 'CRITICAL'
    });
  }
  
  if (data.shortInterest.utilization > 95) {
    alerts.push({
      type: 'EXTREME_UTILIZATION',
      message: `⚡ Extreme utilization: ${data.shortInterest.utilization}%`,
      priority: 'HIGH'
    });
  }
  
  if (data.squeeze.classification === 'GAMMA_SHORT_COMBO') {
    alerts.push({
      type: 'COMBO_SQUEEZE',
      message: '💥 Gamma + Short squeeze combo detected!',
      priority: 'CRITICAL'
    });
  }
  
  return alerts;
}

function calculatePinRisk(price, greeksData) {
  if (!greeksData || !greeksData.max_pain) return 50;
  
  const maxPain = greeksData.max_pain;
  const distance = Math.abs(price - maxPain) / price;
  
  if (distance < 0.02) return 90;
  if (distance < 0.05) return 70;
  return 30;
}

function calculateDataCoverage(dataArray) {
  const validSources = dataArray.filter(data => data !== null).length;
  return Math.round((validSources / dataArray.length) * 100);
}
