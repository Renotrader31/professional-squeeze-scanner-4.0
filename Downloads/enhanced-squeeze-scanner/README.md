# 🚀 Ultimate Squeeze Scanner 4.0 - Enhanced Ortex Edition

The most advanced squeeze scanner featuring comprehensive Ortex API integration, real-time streaming, and professional-grade analytics.

## ✨ Features

### 🔥 Core Squeeze Detection
- **Enhanced Holy Grail Scoring** - Multi-dimensional scoring with 15+ data points
- **Real-time Short Interest** - Live estimates and official filing validation
- **Cost to Borrow Analysis** - Intraday CTB tracking with trend detection
- **Utilization Monitoring** - Real-time availability and pressure scoring
- **Multi-source Validation** - Cross-reference estimates with official filings

### 📊 Advanced Analytics
- **Squeeze Classification** - 6 different squeeze types identification
- **Timing Prediction** - IMMINENT, NEAR_TERM, SHORT_TERM analysis
- **Float Analysis** - Free float vs outstanding shares analysis
- **Fundamental Safety** - Bankruptcy risk and financial health screening
- **Options Flow Integration** - Unusual activity and sweep detection

### 🔴 Real-time Streaming
- **Live Updates** - 30-second interval real-time data
- **Smart Alerts** - Significance-based alert system
- **Multi-connection Support** - Scalable WebSocket architecture
- **Watchlist Management** - Custom symbol tracking

### 🎯 Professional Interface
- **Dark Theme** - Eye-friendly professional design
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Advanced Filtering** - 10+ filter criteria
- **Detailed Stock Analysis** - Comprehensive modal with all metrics
- **Export Capabilities** - Data export for further analysis

## 📋 Requirements

- Node.js 18+ 
- Ortex API Key (paid subscription)
- Unusual Whales API Key
- Financial Modeling Prep API Key (backup)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd enhanced-squeeze-scanner
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:
```env
ORTEX_API_KEY=your_ortex_api_key_here
UW_API_KEY=your_unusual_whales_api_key_here
FMP_API_KEY=your_fmp_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Open Your Browser
Navigate to `http://localhost:3000`

## 🏗️ Architecture

### API Endpoints

#### `/api/scan-single`
Scans a single stock with all enhanced Ortex endpoints:
- Short Interest Estimates
- Short Availability 
- Days to Cover
- Official Positions/Changes/Stats
- Cost to Borrow (New/All)
- Free Float & Shares Outstanding
- Stock Scores
- Financial Ratios
- Valuation Metrics

#### `/api/scan-bulk`
Bulk scanning with advanced filtering:
- Batch processing with rate limiting
- Progress streaming
- Advanced filtering
- Summary statistics

#### `/api/stream`
Real-time streaming service:
- Server-Sent Events (SSE)
- Watchlist management
- Significance-based alerts
- Auto-reconnection

### Data Flow

```
Frontend Request → API Route → Multiple Ortex Endpoints → Data Processing → Enhanced Scoring → Response
                                ↓
Real-time Stream → Significance Analysis → Alert Generation → WebSocket Broadcast
```

## 📊 Scoring Algorithm

### Enhanced Holy Grail Score (0-99)

```javascript
Weights:
- Short Interest: 18%
- Utilization: 15%
- Days to Cover: 12%
- Gamma Exposure: 10%
- CTB Acceleration: 10%
- Flow Sentiment: 8%
- Availability Pressure: 8%
- Unusual Activity: 8%
- Sweep Count: 4%
- SI Confidence: 3%
- Fundamental Safety: 2%
- Stock Score: 1%
- Float Quality: 1%
```

### Squeeze Classifications

1. **GAMMA_SHORT_COMBO** - High gamma + high short interest
2. **CLASSIC_SHORT_SQUEEZE** - Traditional squeeze setup
3. **BORROWING_CRISIS** - High CTB + high utilization
4. **GAMMA_SQUEEZE** - Options-driven squeeze
5. **LOW_FLOAT_SQUEEZE** - Low float + high utilization
6. **POTENTIAL_SETUP** - Developing conditions

### Timing Predictions

- **IMMINENT** - CTB exploding OR utilization >95%
- **NEAR_TERM** - DTC <3 AND CTB acceleration >1.5x
- **SHORT_TERM** - DTC <7 AND utilization >80%
- **MEDIUM_TERM** - Other conditions

## 🎛️ Configuration Options

### Scanner Settings
```javascript
// In .env.local
DEFAULT_SCAN_SYMBOLS=AAPL,TSLA,GME,AMC,BBBY
MAX_SYMBOLS_PER_SCAN=50
SCAN_BATCH_SIZE=10
SCAN_DELAY_MS=1000
```

### Alert Thresholds
```javascript
HOLY_GRAIL_LEGENDARY_THRESHOLD=90
HOLY_GRAIL_STRONG_THRESHOLD=85
CTB_EXPLOSION_THRESHOLD=50
HIGH_UTILIZATION_THRESHOLD=85
```

### Real-time Settings
```javascript
STREAM_INTERVAL=30000
MAX_CONNECTIONS=100
HEARTBEAT_INTERVAL=30000
```

## 🔧 Customization

### Adding New Metrics
1. Add new Ortex API endpoint in `scan-single.js`
2. Update scoring algorithm in `calculateEnhancedHolyGrailScore()`
3. Add UI display in `EnhancedSqueezeScanner.js`

### Custom Filters
```javascript
// In scan-bulk.js
function applyFilters(results, filters) {
  // Add your custom filter logic here
}
```

### Alert Customization
```javascript
// In stream.js
function calculateSignificance(data) {
  // Modify significance calculation
}
```

## 📈 Performance Optimizations

### API Rate Limiting
- Batch processing (10 symbols max per batch)
- 1-second delays between batches
- Automatic retry with exponential backoff

### Caching Strategy
- 30-second cache for repeated requests
- Smart cache invalidation
- Memory-efficient data structures

### Real-time Optimization
- Connection pooling
- Selective updates based on significance
- Automatic cleanup of dead connections

## 🚨 Troubleshooting

### Common Issues

#### API Key Issues
```bash
# Check your API keys are valid
curl -H "Authorization: Bearer YOUR_ORTEX_KEY" https://api.ortex.com/api/v2/data/short-interest-estimates/AAPL
```

#### Rate Limiting
- Reduce `SCAN_BATCH_SIZE` in environment variables
- Increase `SCAN_DELAY_MS` between batches
- Check API subscription limits

#### Memory Issues
- Limit `MAX_SYMBOLS_PER_SCAN`
- Reduce `STREAM_INTERVAL` 
- Monitor with `top` or Activity Monitor

#### Connection Issues
- Check CORS settings in `next.config.mjs`
- Verify WebSocket support in deployment environment
- Check firewall settings

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev
```

## 🛠️ Development

### Project Structure
```
/pages
  /api
    scan-single.js    # Single stock scanning
    scan-bulk.js      # Bulk scanning
    stream.js         # Real-time streaming
  index.js            # Main page
/components
  EnhancedSqueezeScanner.js  # Main component
/styles
  globals.css         # Custom styles
```

### Adding New Features

1. **New API Endpoint**
   - Create file in `/pages/api/`
   - Add CORS headers
   - Implement error handling

2. **New Component**
   - Create in `/components/`
   - Use Tailwind classes
   - Add to main scanner

3. **New Calculation**
   - Add to `scan-single.js`
   - Update scoring algorithm
   - Add UI display

### Testing
```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables for Production
```env
ORTEX_API_KEY=prod_key
UW_API_KEY=prod_key
FMP_API_KEY=prod_key
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### Performance Settings
```javascript
// next.config.mjs
api: {
  bodyParser: { sizeLimit: '10mb' },
  responseLimit: '50mb',
}
```

## 🔒 Security

### API Security
- All API keys stored in environment variables
- CORS configured for specific origins
- Rate limiting implemented
- Input validation on all endpoints

### Data Privacy
- No user data stored
- Real-time connections automatically cleaned up
- No persistent sessions

## 📊 Monitoring

### Key Metrics to Monitor
- API response times
- Rate limit usage
- Memory consumption
- Active WebSocket connections
- Error rates

### Logging
```javascript
// Enable comprehensive logging
ENABLE_REQUEST_LOGGING=true
LOG_LEVEL=info
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Ortex** - For providing comprehensive short interest data
- **Unusual Whales** - For options flow and dark pool data
- **Financial Modeling Prep** - For backup price data
- **Next.js** - For the amazing React framework
- **Tailwind CSS** - For the utility-first CSS framework

## 📞 Support

For support, email support@yourproject.com or create an issue in the repository.

---

**🔥 Built with precision for professional traders and analysts who demand the best squeeze detection technology available.**