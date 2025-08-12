// Comprehensive stock universe for scanning
export const STOCK_UNIVERSE = {
  // Mega Caps & Blue Chips
  megaCaps: [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'JPM', 'JNJ',
    'V', 'PG', 'UNH', 'MA', 'HD', 'DIS', 'BAC', 'XOM', 'CVX', 'ABBV',
    'KO', 'PFE', 'WMT', 'MRK', 'PEP', 'AVGO', 'CSCO', 'TMO', 'VZ', 'ABT'
  ],
  
  // High Volume Day Trading Favorites  
  dayTrading: [
    'SPY', 'QQQ', 'IWM', 'DIA', 'SQQQ', 'TQQQ', 'UVXY', 'VXX', 'AMC', 'GME',
    'BBBY', 'BB', 'NOK', 'PLTR', 'SOFI', 'NIO', 'LCID', 'RIVN', 'RIDE', 'NKLA',
    'SPCE', 'WISH', 'CLOV', 'SDC', 'ATER', 'PROG', 'XELA', 'CEI', 'GNUS', 'SNDL'
  ],
  
  // Tech & Growth
  technology: [
    'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL', 'NFLX', 'SQ', 'SHOP', 'ROKU',
    'SNAP', 'PINS', 'TWTR', 'UBER', 'LYFT', 'DASH', 'ABNB', 'COIN', 'HOOD', 'RBLX',
    'U', 'NET', 'DDOG', 'SNOW', 'PATH', 'DOCN', 'MDB', 'OKTA', 'CRWD', 'ZS',
    'PANW', 'FTNT', 'ZM', 'DOCU', 'TWLO', 'TEAM', 'ATLZ', 'WDAY', 'NOW', 'SPLK'
  ],
  
  // Biotech & Healthcare
  healthcare: [
    'MRNA', 'BNTX', 'PFE', 'JNJ', 'LLY', 'GILD', 'AMGN', 'BIIB', 'REGN', 'VRTX',
    'ILMN', 'ISRG', 'ALNY', 'BMRN', 'INCY', 'SGEN', 'EXAS', 'NBIX', 'SAGE', 'SRPT',
    'RARE', 'BHVN', 'ARVN', 'BEAM', 'CRSP', 'EDIT', 'NTLA', 'PACB', 'TWST', 'NVAX'
  ],
  
  // Financial Sector
  financial: [
    'GS', 'MS', 'WFC', 'C', 'SCHW', 'AXP', 'SPGI', 'BLK', 'CME', 'ICE',
    'COF', 'PNC', 'USB', 'TFC', 'BK', 'STT', 'TROW', 'NTRS', 'FITB', 'KEY',
    'RF', 'CFG', 'HBAN', 'MTB', 'ALLY', 'ZION', 'CMA', 'FRC', 'SIVB', 'SBNY'
  ],
  
  // Energy & Commodities
  energy: [
    'CVX', 'COP', 'EOG', 'SLB', 'MPC', 'PSX', 'VLO', 'PXD', 'OXY', 'HAL',
    'DVN', 'HES', 'FANG', 'MRO', 'APA', 'BKR', 'OVV', 'CTRA', 'RRC', 'AR',
    'CHK', 'SM', 'MTDR', 'PDCE', 'CRC', 'MGY', 'CPE', 'GPOR', 'REI', 'TELL'
  ],
  
  // EV & Clean Energy
  cleanEnergy: [
    'TSLA', 'RIVN', 'LCID', 'NIO', 'XPEV', 'LI', 'FSR', 'GOEV', 'RIDE', 'NKLA',
    'CHPT', 'BLNK', 'EVGO', 'LEV', 'PTRA', 'ARVL', 'REE', 'MULN', 'FFIE', 'GGPI',
    'ENPH', 'SEDG', 'RUN', 'NOVA', 'SPWR', 'FSLR', 'CSIQ', 'MAXN', 'ARRY', 'VSLR'
  ],
  
  // Retail & Consumer
  consumer: [
    'AMZN', 'WMT', 'HD', 'TGT', 'COST', 'LOW', 'CVS', 'WBA', 'KR', 'DLTR',
    'DG', 'ROST', 'TJX', 'BBY', 'ORLY', 'AZO', 'EBAY', 'ETSY', 'W', 'BABA',
    'JD', 'PDD', 'MELI', 'SE', 'CPNG', 'FTCH', 'REAL', 'WISH', 'BIGC', 'OZON'
  ],
  
  // Cannabis Stocks
  cannabis: [
    'TLRY', 'CGC', 'CRON', 'ACB', 'SNDL', 'OGI', 'HEXO', 'VFF', 'CURLF', 'GTBIF',
    'TCNNF', 'CRLBF', 'HRVSF', 'AYRWF', 'VRNOF', 'ITHUF', 'CLVR', 'KERN', 'GNLN', 'MAPS'
  ],
  
  // Mining & Materials
  materials: [
    'FCX', 'NEM', 'GOLD', 'SCCO', 'TECK', 'AA', 'CLF', 'X', 'NUE', 'STLD',
    'RS', 'CMC', 'ATI', 'CRS', 'TMST', 'ZEUS', 'MP', 'LAC', 'LTHM', 'ALB',
    'SQM', 'PLL', 'SGML', 'GATO', 'HL', 'CDE', 'PAAS', 'AG', 'FSM', 'EXK'
  ],
  
  // Airlines & Travel
  travel: [
    'AAL', 'UAL', 'DAL', 'LUV', 'JBLU', 'ALK', 'SAVE', 'HA', 'MESA', 'RJET',
    'MAR', 'HLT', 'H', 'WYNN', 'LVS', 'MGM', 'CZR', 'PENN', 'DKNG', 'GNOG',
    'CCL', 'RCL', 'NCLH', 'EXPE', 'BKNG', 'TRIP', 'ABNB', 'TCOM', 'HTHT', 'MMYT'
  ],
  
  // REITs
  reits: [
    'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'SPG', 'WELL', 'AVB', 'EQR', 'DLR',
    'O', 'VICI', 'WY', 'ARE', 'PEAK', 'EXR', 'MAA', 'ESS', 'UDR', 'CPT',
    'HST', 'REXR', 'FR', 'STAG', 'COLD', 'CUBE', 'KRC', 'BXP', 'VTR', 'OHI'
  ],
  
  // Crypto-Related
  crypto: [
    'COIN', 'MARA', 'RIOT', 'HIVE', 'BITF', 'HUT', 'BTBT', 'MSTR', 'SQ', 'PYPL',
    'CAN', 'NCTY', 'BTCM', 'CIFR', 'ARBK', 'DMGI', 'GREE', 'XNET', 'CLSK', 'DGHI',
    'EBON', 'LGHL', 'SOS', 'WULF', 'ANY', 'BBAI', 'BKKT', 'CUBI', 'SI', 'HOOD'
  ],
  
  // Chinese ADRs
  chinese: [
    'BABA', 'JD', 'PDD', 'BIDU', 'NIO', 'XPEV', 'LI', 'NTES', 'TME', 'BILI',
    'IQ', 'WB', 'VIPS', 'YMM', 'FUTU', 'TIGR', 'RLX', 'TUYA', 'GOTU', 'TAL',
    'EDU', 'DIDI', 'BZUN', 'QFIN', 'FINV', 'LX', 'RERE', 'DQ', 'JKS', 'CSIQ'
  ],
  
  // SPACs & Recent IPOs
  spacs: [
    'DWAC', 'CFVI', 'GGPI', 'LCID', 'GRAB', 'SOFI', 'CLOV', 'OPEN', 'WISH', 'OPAD',
    'IRNT', 'TMC', 'BODY', 'BARK', 'MVST', 'GOEV', 'RIDE', 'NKLA', 'HYLN', 'LAZR',
    'VLDR', 'AEVA', 'OUST', 'INVZ', 'MVIS', 'KOPN', 'INDI', 'REE', 'ARVL', 'PTRA'
  ],
  
  // Squeeze Candidates (High Short Interest)
  shortSqueeze: [
    'GME', 'AMC', 'BBBY', 'BYND', 'CVNA', 'W', 'DASH', 'NKLA', 'RIDE', 'WKHS',
    'GOEV', 'CLOV', 'WISH', 'SDC', 'ATER', 'PROG', 'BGFV', 'BEEM', 'VIEW', 'ICPT',
    'PUBM', 'BLNK', 'FUBO', 'GOGO', 'FIZZ', 'PET', 'BBIG', 'XELA', 'CEI', 'GNUS'
  ],
  
  // Penny Stocks & Small Caps (High Risk)
  pennyStocks: [
    'SNDL', 'GNUS', 'XELA', 'CEI', 'PROG', 'ATER', 'BBIG', 'OCGN', 'SENS', 'IDEX',
    'ZOM', 'SHIP', 'TOPS', 'NAKD', 'CTRM', 'CASTOR', 'GLBS', 'SINO', 'LKCO', 'PHUN',
    'MARK', 'HTGM', 'BOXL', 'MRIN', 'XERS', 'OPGN', 'TTOO', 'BNGO', 'JAGX', 'ONTX'
  ],
  
  // Defense & Aerospace
  defense: [
    'BA', 'LMT', 'RTX', 'NOC', 'GD', 'LHX', 'TDG', 'HWM', 'TXT', 'HII',
    'AXON', 'KTOS', 'AVAV', 'RKLB', 'SPCE', 'ASTR', 'RDW', 'ASTS', 'MNTS', 'VORB'
  ],
  
  // Food & Beverage
  foodBeverage: [
    'KO', 'PEP', 'MDLZ', 'MCD', 'SBUX', 'CMG', 'YUM', 'DPZ', 'QSR', 'WEN',
    'SHAK', 'WING', 'DNUT', 'BROS', 'CAVA', 'SG', 'BYND', 'TTCF', 'OTLY', 'VFF'
  ]
};

// Combine all stocks into one array for scanning
export const ALL_STOCKS = [
  ...new Set([
    ...STOCK_UNIVERSE.megaCaps,
    ...STOCK_UNIVERSE.dayTrading,
    ...STOCK_UNIVERSE.technology,
    ...STOCK_UNIVERSE.healthcare,
    ...STOCK_UNIVERSE.financial,
    ...STOCK_UNIVERSE.energy,
    ...STOCK_UNIVERSE.cleanEnergy,
    ...STOCK_UNIVERSE.consumer,
    ...STOCK_UNIVERSE.cannabis,
    ...STOCK_UNIVERSE.materials,
    ...STOCK_UNIVERSE.travel,
    ...STOCK_UNIVERSE.reits,
    ...STOCK_UNIVERSE.crypto,
    ...STOCK_UNIVERSE.chinese,
    ...STOCK_UNIVERSE.spacs,
    ...STOCK_UNIVERSE.shortSqueeze,
    ...STOCK_UNIVERSE.pennyStocks,
    ...STOCK_UNIVERSE.defense,
    ...STOCK_UNIVERSE.foodBeverage
  ])
];

// Quick access lists
export const TOP_MOVERS = ['GME', 'AMC', 'TSLA', 'NVDA', 'SPY', 'QQQ', 'AAPL', 'META', 'GOOGL', 'MSFT'];
export const HIGH_VOLUME = ['SPY', 'QQQ', 'TSLA', 'AAPL', 'AMD', 'NVDA', 'META', 'AMZN', 'MSFT', 'TQQQ'];
export const SQUEEZE_WATCH = ['GME', 'AMC', 'BBBY', 'CVNA', 'W', 'BYND', 'DASH', 'CLOV', 'WKHS', 'NKLA'];

export default {
  STOCK_UNIVERSE,
  ALL_STOCKS,
  TOP_MOVERS,
  HIGH_VOLUME,
  SQUEEZE_WATCH
};
