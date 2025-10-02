# Options Scanner Pro - Vercel Deployment Guide

## Overview

Your Streamlit app has been converted to a Flask-based web application that's compatible with Vercel deployment. This will allow you to use your live Ortex API with a professional web interface.

## 🚀 What's Been Created

### 1. **Flask API Backend** (`/api/index.py`)
- RESTful API endpoints for options scanning
- Compatible with Vercel serverless functions
- Supports both Polygon and Unusual Whales APIs
- Greeks and flow analysis endpoints

### 2. **Modern Web Interface**
- **HTML Template** (`/templates/index.html`): Professional dashboard
- **CSS Styling** (`/static/css/style.css`): Dark theme with gradients
- **JavaScript** (`/static/js/app.js`): Interactive frontend with charts

### 3. **Vercel Configuration** (`vercel.json`)
- Optimized for Python serverless functions
- Environment variable configuration
- Proper routing setup

## 📁 File Structure

```
webapp/
├── api/
│   └── index.py          # Flask app (Vercel entry point)
├── static/
│   ├── css/
│   │   └── style.css     # Modern dark theme
│   └── js/
│       └── app.js        # Frontend JavaScript
├── templates/
│   └── index.html        # Main dashboard
├── options_scanner.py    # Your existing scanner (updated)
├── requirements.txt      # Vercel-compatible dependencies
├── vercel.json          # Deployment configuration
└── DEPLOYMENT_GUIDE.md  # This guide
```

## 🛠️ Deployment Steps

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Set Environment Variables
In your Vercel dashboard or via CLI:
```bash
vercel env add POLYGON_API_KEY
vercel env add UNUSUAL_WHALES_API_KEY
```

### Step 4: Deploy
```bash
cd /path/to/your/webapp
vercel
```

Follow the prompts:
- **Set up and deploy?** `Y`
- **Which scope?** Select your account
- **Link to existing project?** `N` (for first deployment)
- **Project name?** `options-scanner-pro` (or your preferred name)
- **Directory?** `./` (current directory)

### Step 5: Environment Variables Setup
After deployment, add your API keys in Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add:
   - `POLYGON_API_KEY`: Your Polygon.io API key
   - `UNUSUAL_WHALES_API_KEY`: Your Unusual Whales API key

## 🔧 Features

### Core Functionality
- ✅ **Multi-API Support**: Polygon.io and Unusual Whales
- ✅ **Strategy Scanning**: 12+ options strategies
- ✅ **Real-time Data**: Live price and Greeks data
- ✅ **Interactive Charts**: Plotly.js visualizations
- ✅ **Responsive Design**: Works on mobile and desktop

### API Endpoints
- `GET /` - Main dashboard
- `POST /api/scan` - Run options scan
- `GET /api/greeks/{ticker}` - Get Greeks data
- `GET /api/health` - Health check

### Scanner Features
- Bull/Bear spreads
- Cash-secured puts
- Covered calls
- Straddles & Strangles
- Iron Condors
- Greeks analysis
- IV analysis
- P&L calculations

## 🎨 Interface Features

### Configuration Panel
- API key inputs (masked)
- Ticker selection with presets
- Parameter sliders (DTE, min return)
- One-click scanning

### Results Display
- Summary metrics with gradient cards
- Interactive data table
- Return distribution charts
- Strategy breakdown charts
- Greeks heat maps
- Market flow analysis

### Professional Styling
- Dark theme with gradients
- Hover effects and animations
- Responsive design
- Modern UI components

## 🔍 Troubleshooting

### Common Issues

1. **API Key Errors**
   - Ensure environment variables are set in Vercel
   - Check API key validity
   - Verify API rate limits

2. **Import Errors**
   - Check that `requirements.txt` includes all dependencies
   - Verify Python version compatibility (3.9+)

3. **Timeout Issues**
   - Reduce number of tickers per scan
   - Implement proper error handling
   - Consider caching for frequently requested data

4. **CORS Issues**
   - Flask-CORS is configured for all origins
   - Check browser developer tools for specific errors

### Performance Tips

1. **Optimize API Calls**
   - Batch similar requests
   - Implement request caching
   - Use UW API as primary (better coverage)

2. **Frontend Performance**
   - Limit table results display
   - Use pagination for large datasets
   - Implement loading states

## 📊 Usage Guide

### Basic Workflow
1. Enter your API keys (Polygon and/or Unusual Whales)
2. Select tickers to scan (presets available)
3. Adjust parameters (DTE, minimum return)
4. Click "Run Scan"
5. View results in interactive tables and charts
6. Analyze Greeks and market flow data

### Advanced Features
- **Greeks Analysis**: Available with Unusual Whales API
- **Custom Ticker Lists**: Type comma-separated symbols
- **Real-time Updates**: Data refreshed on each scan
- **Export Options**: CSV export capability

## 🚀 Next Steps

1. **Deploy to Vercel** using the steps above
2. **Test with your Ortex API** keys
3. **Customize strategies** in `options_scanner.py`
4. **Add custom indicators** or filters
5. **Implement user authentication** if needed
6. **Add data persistence** with a database

## 📞 Support

If you encounter any issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test API keys directly
4. Check network connectivity

Your professional options scanner is now ready for deployment! 🎯