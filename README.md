# 🔥 Ultimate Squeeze Scanner

**Professional squeeze detection platform with live Ortex API integration**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Renotrader31/professional-squeeze-scanner-4.0)

## 🎯 Overview

The **Ultimate Squeeze Scanner** is a professional-grade web application that combines multiple data sources to detect potential short squeezes and gamma squeezes in real-time. Built with Flask for serverless deployment on Vercel.

## 🚀 Key Features

### **Squeeze Detection Engine**
- ✅ **Short Interest Analysis** via Ortex API
- ✅ **Gamma Exposure Calculations** via Unusual Whales
- ✅ **Options Flow Analysis** for unusual activity
- ✅ **Comprehensive Squeeze Scoring** (0-100 scale)
- ✅ **Real-time Alerts** for high-risk candidates

### **Professional Interface**
- 🎨 **Dark Gradient Theme** with modern UI/UX
- 📱 **Responsive Design** for mobile and desktop
- 📊 **Interactive Charts** with Plotly.js
- ⚡ **Real-time Data** with live updates
- 🔥 **Squeeze-specific Metrics** and visualizations

### **Multi-Source Data Integration**
- 🔴 **Ortex API**: Short interest, utilization, cost to borrow
- 🐋 **Unusual Whales**: Options flow, Greeks, gamma exposure
- 🔺 **Polygon.io**: Market data and options chains
- 📈 **Combined Analysis**: Proprietary squeeze algorithms

## 📊 Squeeze Analysis Metrics

### **Primary Factors (Weighted)**
1. **Short Interest %** (0-30 points)
2. **Days to Cover** (0-20 points)  
3. **Utilization Rate** (0-15 points)
4. **Cost to Borrow** (0-15 points)
5. **Net Gamma Exposure** (0-10 points)
6. **Unusual Options Flow** (0-10 points)

### **Risk Levels**
- 🔴 **EXTREME SQUEEZE RISK** (80-100): Immediate attention required
- 🟡 **High Squeeze Risk** (60-79): Monitor closely
- 🔵 **Moderate Squeeze Risk** (40-59): Watch for developments
- ⚪ **Low Squeeze Risk** (20-39): Background monitoring

## 🛠️ Quick Deployment

### **Option 1: One-Click Deploy**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Renotrader31/professional-squeeze-scanner-4.0)

### **Option 2: Manual Deployment**
```bash
# Clone the repository
git clone https://github.com/Renotrader31/professional-squeeze-scanner-4.0.git
cd professional-squeeze-scanner-4.0

# Install Vercel CLI
npm install -g vercel

# Deploy
./deploy.sh
```

### **Option 3: GitHub Integration**
1. Fork this repository
2. Connect to Vercel via GitHub
3. Set environment variables
4. Deploy automatically

## 🔧 Environment Variables

Set these in your Vercel dashboard:

```bash
POLYGON_API_KEY=your_polygon_key_here
UNUSUAL_WHALES_API_KEY=your_uw_key_here
ORTEX_API_KEY=your_ortex_key_here
```

## 🎮 Usage Guide

### **Basic Workflow**
1. **Enter API Keys**: Ortex (required), Unusual Whales (recommended), Polygon (optional)
2. **Select Tickers**: Use "Squeeze Targets" preset or custom list
3. **Run Squeeze Scan**: Click the red "SQUEEZE SCAN" button
4. **Analyze Results**: Review scores, risk levels, and key metrics
5. **Monitor Alerts**: Track high-scoring candidates

### **Preset Ticker Lists**
- **🔥 Squeeze Targets**: GME, AMC, BBBY, ATER, SPRT, IRNT, OPAD, MRIN, BGFV, PROG
- **📈 Mega Tech**: AAPL, MSFT, NVDA, GOOGL, AMZN, META, TSLA
- **📊 ETFs**: SPY, QQQ, IWM, DIA, XLF, XLE, GLD  
- **🚀 Meme Stocks**: GME, AMC, BBBY, BB, NOK

### **Advanced Features**
- **Real-time Scoring**: Live squeeze risk calculations
- **Comparative Analysis**: Side-by-side ticker comparison
- **Historical Tracking**: Monitor score changes over time
- **Export Options**: CSV download for further analysis

## 📊 API Endpoints

### **Core Endpoints**
- `GET /` - Main dashboard interface
- `POST /api/squeeze/scan` - Run comprehensive squeeze scan
- `GET /api/squeeze/alerts` - Get high-priority alerts
- `GET /api/squeeze/score/{ticker}` - Individual ticker analysis
- `POST /api/scan` - Traditional options scanning
- `GET /api/greeks/{ticker}` - Greeks and IV analysis

### **Data Sources**
- **Ortex Integration**: `/api/squeeze/scan` with `ortex_key`
- **Unusual Whales**: Greeks, flow, and gamma exposure
- **Polygon.io**: Market data and options chains

## 🔬 Technical Architecture

### **Backend (Flask + Serverless)**
- ⚡ **Serverless Functions** optimized for Vercel
- 🔄 **RESTful API** with proper error handling
- 📊 **Multi-source Integration** with fallback logic
- 🔒 **Secure Key Management** via environment variables

### **Frontend (Modern Web)**
- 🎨 **Vanilla JavaScript** with modern ES6+
- 📊 **Plotly.js Charts** for data visualization  
- 🎯 **Bootstrap 5** for responsive UI
- ⚡ **Real-time Updates** with async/await

### **Squeeze Algorithm**
- 🧮 **Weighted Scoring System** based on proven metrics
- 📈 **Multi-factor Analysis** combining technical and fundamental data
- 🔍 **Pattern Recognition** for squeeze precursors
- ⏰ **Real-time Processing** with efficient API calls

## 🎯 Squeeze Detection Logic

### **Short Squeeze Indicators**
```python
# High short interest (>20%)
if short_interest > 20:
    score += min(30, short_interest)

# High days to cover (>3 days)  
if days_to_cover > 3:
    score += min(20, days_to_cover * 3)

# High utilization (>80%)
if utilization > 80:
    score += min(15, (utilization - 80) * 0.75)
```

### **Gamma Squeeze Indicators**
```python
# Net gamma exposure analysis
if net_gamma > 1_000_000:
    score += min(10, net_gamma / 500_000)

# Unusual options flow
if bullish_flow and mega_trades:
    score += 5 + min(5, mega_trades * 2)
```

## 📈 Performance Optimization

### **API Efficiency**
- 🔄 **Batch Processing** for multiple tickers
- ⚡ **Async Requests** to minimize latency
- 📦 **Response Caching** for frequently requested data
- 🛡️ **Rate Limit Handling** with graceful fallbacks

### **Frontend Optimization**
- 📱 **Mobile-first Design** with responsive breakpoints
- 🎨 **CSS Animations** with hardware acceleration
- 📊 **Chart Optimization** with efficient rendering
- ⚡ **Lazy Loading** for large datasets

## 🔐 Security Features

### **API Security**
- 🔒 **Environment Variables** for sensitive keys
- 🛡️ **Input Validation** and sanitization
- 🔐 **CORS Configuration** for cross-origin requests
- ⚡ **Error Handling** without data leakage

### **Data Privacy**
- 🚫 **No Data Storage** - all processing is real-time
- 🔒 **Client-side Key Entry** - keys never logged
- 🛡️ **Secure API Calls** with proper headers
- 📊 **Anonymous Analytics** (optional)

## 🚨 Troubleshooting

### **Common Issues**
1. **API Key Errors**: Verify keys in Vercel environment variables
2. **Rate Limits**: Reduce ticker count or add delays
3. **Timeout Issues**: Check API response times
4. **Missing Data**: Verify API subscriptions and permissions

### **Performance Tips**
1. **Use Squeeze Targets preset** for optimal results
2. **Monitor during market hours** for best data quality
3. **Combine multiple APIs** for comprehensive analysis
4. **Set up alerts** for continuous monitoring

## 📞 Support & Updates

### **Getting Help**
- 📖 **Documentation**: Comprehensive guides included
- 🐛 **Issue Tracking**: GitHub issues for bug reports
- 💬 **Community**: Trading discord servers
- 📧 **Contact**: Via GitHub repository

### **Roadmap**
- 🔔 **Push Notifications** for critical alerts
- 📊 **Historical Analysis** and backtesting
- 🤖 **Machine Learning** predictions
- 📱 **Mobile App** version
- 🔌 **Broker Integration** for direct trading

---

## ⚡ Quick Start

1. **Deploy**: Click the Vercel button above
2. **Configure**: Add your API keys in Vercel dashboard  
3. **Scan**: Use "Squeeze Targets" preset with red scan button
4. **Profit**: Monitor high-scoring candidates 🚀

**Built for professional traders who demand real-time squeeze detection** 🔥

---

*Happy squeeze hunting! Remember to manage risk appropriately.* 📈🚀# Force redeploy Thu Oct  2 18:46:34 UTC 2025
# Deployment trigger Thu Oct  2 19:05:06 UTC 2025
