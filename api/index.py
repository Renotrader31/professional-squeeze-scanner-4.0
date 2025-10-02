from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import urllib.request
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_html()
        elif self.path == '/api/health':
            self.send_health()
        else:
            self.send_404()
    
    def do_POST(self):
        if self.path == '/api/squeeze/scan':
            self.handle_squeeze_scan()
        else:
            self.send_404()
    
    def send_html(self):
        html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔥 Ultimate Squeeze Scanner</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%);
            color: #e0e0e0;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 {
            color: #ff6b6b;
            font-size: 3rem;
            margin-bottom: 10px;
            text-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
        }
        .header p {
            color: #a0a0b0;
            font-size: 1.2rem;
        }
        .form-section {
            background: #1a1a2e;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            border: 1px solid #3a3a4e;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #a0a0b0;
            font-weight: bold;
        }
        input, textarea, select {
            width: 100%;
            padding: 12px;
            background: #2a2a3e;
            border: 2px solid #3a3a4e;
            border-radius: 8px;
            color: #e0e0e0;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input:focus, textarea:focus {
            outline: none;
            border-color: #ff6b6b;
        }
        .button-group {
            display: flex;
            gap: 15px;
            margin-top: 20px;
        }
        button {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            flex: 1;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
        }
        .results {
            background: #1a1a2e;
            padding: 30px;
            border-radius: 15px;
            border: 1px solid #3a3a4e;
            margin-top: 30px;
        }
        .result-item {
            padding: 20px;
            margin: 15px 0;
            background: #2a2a3e;
            border-radius: 10px;
            border-left: 5px solid #ff6b6b;
            transition: transform 0.3s;
        }
        .result-item:hover {
            transform: translateX(5px);
        }
        .score-extreme { border-left-color: #dc3545; }
        .score-high { border-left-color: #ffc107; }
        .score-medium { border-left-color: #17a2b8; }
        .score-low { border-left-color: #28a745; }
        .loading {
            text-align: center;
            color: #ff6b6b;
            font-size: 20px;
            padding: 40px;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
        }
        .status-healthy { background: #28a745; }
        .status-error { background: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔥 ULTIMATE SQUEEZE SCANNER</h1>
            <p>Professional short squeeze detection with live Ortex API + Yahoo Finance integration</p>
        </div>

        <div class="form-section">
            <h2>🔑 Configuration</h2>
            <div class="form-group">
                <label for="ortexKey">🔑 Ortex API Key (For Live Short Interest Data):</label>
                <input type="password" id="ortexKey" placeholder="Enter your Ortex API key for real-time short interest data">
                <div style="margin-top: 8px; font-size: 0.9rem; color: #a0a0b0;">
                    💡 <strong>Get Live Data:</strong> Sign up at <a href="https://www.ortex.com" target="_blank" style="color: #ff6b6b;">ortex.com</a> for API access
                    <br>📊 Without API key: Uses enhanced mock data with real-time prices from Yahoo Finance
                </div>
            </div>

            <div class="form-group">
                <label for="tickerPreset">🎯 Quick Select:</label>
                <select id="tickerPreset" onchange="loadTickerPreset()" style="margin-bottom: 10px;">
                    <option value="top_squeeze">🔥 Top Squeeze Plays (20)</option>
                    <option value="meme_legends">🚀 Meme Legends (3)</option>
                    <option value="high_si">📊 High Short Interest (10)</option>
                    <option value="biotech">🧬 Biotech Squeeze (4)</option>
                    <option value="ev_tech">⚡ EV & Tech (4)</option>
                    <option value="spac_plays">💫 SPAC Plays (4)</option>
                    <option value="penny_squeeze">💰 Penny Squeezes (5)</option>
                    <option value="all_tickers">🌍 All Available (30+)</option>
                    <option value="custom">✏️ Custom</option>
                </select>
                
                <label for="tickers">Squeeze Targets:</label>
                <textarea id="tickers" rows="4" placeholder="Enter tickers separated by commas">GME, AMC, BBBY, ATER, SPRT, DWAC, PHUN, SAVA, KOSS, APRN, UPST, NKLA, OPAD, BGFV, VXRT, BYND, CLOV, MRIN, PROG, IRNT</textarea>
            </div>

            <div class="button-group">
                <button onclick="runSqueezeScan()">🔥 RUN SQUEEZE SCAN</button>
                <button onclick="runHealthCheck()">🔍 API HEALTH CHECK</button>
            </div>
        </div>

        <div id="results"></div>
    </div>

    <script>
        // Auto-run health check on page load
        window.onload = function() {
            runHealthCheck();
        };

        function loadTickerPreset() {
            const preset = document.getElementById('tickerPreset').value;
            const tickerTextarea = document.getElementById('tickers');
            
            const presets = {
                'top_squeeze': 'GME, AMC, BBBY, ATER, SPRT, DWAC, PHUN, SAVA, KOSS, APRN, UPST, NKLA, OPAD, BGFV, VXRT, BYND, CLOV, MRIN, PROG, IRNT',
                'meme_legends': 'GME, AMC, BBBY',
                'high_si': 'BBBY, DWAC, SAVA, PHUN, ATER, SPRT, APRN, KOSS, BGFV, NKLA',
                'biotech': 'SAVA, VXRT, CLOV, BYND',
                'ev_tech': 'NKLA, RIDE, WKHS, GOEV',
                'spac_plays': 'DWAC, PHUN, BKKT, MARK',
                'penny_squeeze': 'BBBY, SNDL, NAKD, EXPR, WISH',
                'all_tickers': 'GME, AMC, BBBY, ATER, SPRT, IRNT, OPAD, MRIN, BGFV, PROG, NKLA, RIDE, WKHS, GOEV, SAVA, VXRT, CLOV, BYND, APRN, UPST, SKLZ, WISH, GEVO, KOSS, NAKD, EXPR, DWAC, PHUN, BKKT, MARK, SNDL, CCIV, PSTH'
            };
            
            if (preset !== 'custom' && presets[preset]) {
                tickerTextarea.value = presets[preset];
            }
        }

        async function runHealthCheck() {
            showLoading('Testing API connection...');
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                showHealthResult(data);
            } catch (error) {
                showError('❌ Health check failed: ' + error.message);
            }
        }

        async function runSqueezeScan() {
            const ortexKey = document.getElementById('ortexKey').value.trim();
            const tickerText = document.getElementById('tickers').value.trim();
            
            if (!tickerText) {
                showError('❌ Please enter at least one ticker symbol');
                return;
            }

            const tickers = tickerText.split(',').map(t => t.trim().toUpperCase()).filter(t => t);
            
            showLoading('🔥 Scanning ' + tickers.length + ' tickers for squeeze opportunities...');

            try {
                const response = await fetch('/api/squeeze/scan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ortex_key: ortexKey,
                        tickers: tickers
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    showSqueezeResults(data.results, data.message);
                } else {
                    showError('❌ ' + (data.message || 'Scan failed'));
                }
            } catch (error) {
                showError('❌ Network error: ' + error.message);
            }
        }

        function showLoading(message) {
            document.getElementById('results').innerHTML = `
                <div class="results">
                    <div class="loading">
                        <div style="font-size: 30px; margin-bottom: 10px;">⚡</div>
                        ${message}
                    </div>
                </div>`;
        }

        function showError(message) {
            document.getElementById('results').innerHTML = `
                <div class="results">
                    <h3>⚠️ Error</h3>
                    <div class="result-item status-error">
                        ${message}
                    </div>
                </div>`;
        }

        function showHealthResult(data) {
            const statusClass = data.status === 'healthy' ? 'status-healthy' : 'status-error';
            document.getElementById('results').innerHTML = `
                <div class="results">
                    <h3>🔍 API Health Check</h3>
                    <div class="result-item">
                        <strong>Status:</strong> <span class="status-badge ${statusClass}">${data.status.toUpperCase()}</span><br>
                        <strong>Message:</strong> ${data.message}<br>
                        <strong>Timestamp:</strong> ${new Date(data.timestamp).toLocaleString()}
                    </div>
                </div>`;
        }

        function showSqueezeResults(results, message) {
            if (!results || results.length === 0) {
                document.getElementById('results').innerHTML = `
                    <div class="results">
                        <h3>🎯 Squeeze Scan Results</h3>
                        <div class="result-item">No squeeze candidates found. Try different tickers or lower criteria.</div>
                    </div>`;
                return;
            }

            let html = `<div class="results">
                <h3>🎯 Squeeze Scan Results</h3>
                <p><strong>${message}</strong></p>
                <div style="margin-bottom: 20px; padding: 10px; background: #2a2a3e; border-radius: 8px; font-size: 0.9rem;">
                    <strong>📋 Legend:</strong>
                    <span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; margin: 0 5px;">🔴 LIVE</span> = Real Ortex + Yahoo Finance data
                    <span style="background: #ffc107; color: black; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; margin: 0 5px;">📊 LIVE PRICE</span> = Live prices + Demo short data
                    <span style="background: #6c757d; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; margin: 0 5px;">📝 DEMO</span> = Enhanced demo data
                </div>`;
            
            results.forEach((result, index) => {
                const score = result.squeeze_score || 0;
                let scoreClass = 'score-low';
                if (score >= 80) scoreClass = 'score-extreme';
                else if (score >= 60) scoreClass = 'score-high';
                else if (score >= 40) scoreClass = 'score-medium';
                
                const ortex = result.ortex_data || {};
                const priceChangeColor = (result.price_change || 0) >= 0 ? '#00ff88' : '#ff6b6b';
                const priceChangeIcon = (result.price_change || 0) >= 0 ? '↗' : '↘';
                const volumeM = result.volume ? (result.volume / 1000000).toFixed(1) : 'N/A';
                
                // Data source indicator
                let dataSourceBadge = '';
                if (result.data_source === 'live_api') {
                    dataSourceBadge = '<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; font-weight: bold;">🔴 LIVE</span>';
                } else if (result.data_source === 'mixed_live_price') {
                    dataSourceBadge = '<span style="background: #ffc107; color: black; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; font-weight: bold;">📊 LIVE PRICE</span>';
                } else {
                    dataSourceBadge = '<span style="background: #6c757d; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; font-weight: bold;">📝 DEMO</span>';
                }
                
                html += `
                    <div class="result-item ${scoreClass}">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <h4 style="margin: 0; color: #ff6b6b; font-size: 1.3rem;">#${index + 1} ${result.ticker}</h4>
                                ${dataSourceBadge}
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.4rem; font-weight: bold; color: #e0e0e0;">$${result.current_price || 'N/A'}</div>
                                <div style="color: ${priceChangeColor}; font-weight: bold;">
                                    ${priceChangeIcon} ${Math.abs(result.price_change || 0).toFixed(2)}%
                                </div>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; font-size: 0.9rem;">
                            <div>
                                <strong>🎯 Squeeze Score:</strong><br>
                                <span style="font-size: 1.2rem; color: #ff6b6b; font-weight: bold;">${score}/100</span><br><br>
                                <strong>⚠️ Risk Level:</strong><br>
                                ${result.squeeze_type || 'Unknown'}<br><br>
                                <strong>📊 Short Interest:</strong><br>
                                ${ortex.short_interest || 'N/A'}%
                            </div>
                            <div>
                                <strong>📅 Days to Cover:</strong><br>
                                ${ortex.days_to_cover || 'N/A'}<br><br>
                                <strong>📈 Utilization:</strong><br>
                                ${ortex.utilization || 'N/A'}%<br><br>
                                <strong>💰 Cost to Borrow:</strong><br>
                                ${ortex.cost_to_borrow || 'N/A'}%
                            </div>
                            <div>
                                <strong>📊 Volume:</strong><br>
                                ${volumeM}M shares<br><br>
                                <strong>🔥 Squeeze Factors:</strong><br>
                                ${ortex.short_interest > 20 ? '✅ High SI' : '❌ Low SI'}<br>
                                ${ortex.utilization > 80 ? '✅ High Util' : '❌ Low Util'}<br>
                                ${ortex.cost_to_borrow > 10 ? '✅ High CTB' : '❌ Low CTB'}
                            </div>
                        </div>
                    </div>`;
            });
            
            html += '</div>';
            document.getElementById('results').innerHTML = html;
        }
    </script>
</body>
</html>"""
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def send_health(self):
        response = {
            'status': 'healthy',
            'message': 'Ultimate Squeeze Scanner API with Live Ortex + Yahoo Finance Integration!',
            'timestamp': datetime.now().isoformat(),
            'version': '2.0.0-live-api'
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def get_ortex_data(self, ticker, ortex_key):
        """Get real Ortex data using API key"""
        if not ortex_key or len(ortex_key) < 10:
            return None
            
        try:
            # Ortex API endpoint (you'll need to replace with actual Ortex API URL)
            url = f"https://api.ortex.com/v1/short-interest/{ticker}"
            
            headers = {
                'Authorization': f'Bearer {ortex_key}',
                'Content-Type': 'application/json',
                'User-Agent': 'Ultimate-Squeeze-Scanner/1.0'
            }
            
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    
                    # Parse Ortex response format (adjust based on actual API)
                    return {
                        'short_interest': data.get('short_interest_percent', 0),
                        'days_to_cover': data.get('days_to_cover', 0),
                        'utilization': data.get('utilization', 0),
                        'cost_to_borrow': data.get('cost_to_borrow', 0),
                        'shares_on_loan': data.get('shares_on_loan', 0),
                        'exchange_reported_si': data.get('exchange_si', 0)
                    }
                    
        except Exception as e:
            print(f"Ortex API error for {ticker}: {e}")
            return None
            
        return None
    
    def get_stock_price_data(self, ticker):
        """Get current stock price from free APIs"""
        try:
            # Try Yahoo Finance API (free)
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
            
            headers = {
                'User-Agent': 'Ultimate-Squeeze-Scanner/1.0'
            }
            
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    
                    result = data.get('chart', {}).get('result', [])
                    if result:
                        meta = result[0].get('meta', {})
                        current_price = meta.get('regularMarketPrice', 0)
                        previous_close = meta.get('previousClose', current_price)
                        volume = meta.get('regularMarketVolume', 0)
                        
                        price_change_percent = 0
                        if previous_close > 0:
                            price_change_percent = ((current_price - previous_close) / previous_close) * 100
                        
                        return {
                            'current_price': round(current_price, 2),
                            'price_change': round(price_change_percent, 2),
                            'volume': volume,
                            'previous_close': previous_close
                        }
                        
        except Exception as e:
            print(f"Price API error for {ticker}: {e}")
            
        # Fallback to Alpha Vantage (free tier)
        try:
            # Note: You would need to register for a free API key
            # For now, we'll return None to fall back to mock data
            pass
            
        except Exception:
            pass
            
        return None
    
    def calculate_squeeze_score(self, ortex_data, price_data):
        """Calculate squeeze score based on Ortex metrics"""
        if not ortex_data:
            return 50  # Default score
            
        score = 0
        
        # Short Interest (0-35 points)
        si = ortex_data.get('short_interest', 0)
        if si >= 30:
            score += 35
        elif si >= 20:
            score += 25
        elif si >= 15:
            score += 15
        elif si >= 10:
            score += 8
            
        # Utilization (0-25 points)
        util = ortex_data.get('utilization', 0)
        if util >= 95:
            score += 25
        elif util >= 85:
            score += 20
        elif util >= 75:
            score += 12
        elif util >= 60:
            score += 6
            
        # Cost to Borrow (0-25 points)
        ctb = ortex_data.get('cost_to_borrow', 0)
        if ctb >= 20:
            score += 25
        elif ctb >= 10:
            score += 18
        elif ctb >= 5:
            score += 10
        elif ctb >= 2:
            score += 5
            
        # Days to Cover (0-15 points)
        dtc = ortex_data.get('days_to_cover', 0)
        if dtc >= 5:
            score += 15
        elif dtc >= 3:
            score += 10
        elif dtc >= 2:
            score += 5
            
        return min(100, score)
    
    def get_squeeze_type(self, score):
        """Determine squeeze risk level based on score"""
        if score >= 80:
            return "EXTREME SQUEEZE RISK"
        elif score >= 60:
            return "High Squeeze Risk"
        elif score >= 40:
            return "Moderate Squeeze Risk"
        else:
            return "Low Squeeze Risk"
    
    def handle_squeeze_scan(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode()) if post_data else {}
            
            ortex_key = data.get('ortex_key', '')
            tickers = data.get('tickers', ['GME', 'AMC'])
            
            # Check if we should use live data
            use_live_data = ortex_key and len(ortex_key.strip()) >= 10
            
            # Comprehensive squeeze data with enhanced metrics
            mock_data = {
                # Meme Stock Legends
                'GME': {'score': 78, 'type': 'High Squeeze Risk', 'si': 22.5, 'dtc': 4.1, 'util': 89.2, 'ctb': 12.8, 'price': 18.75, 'change': 2.3, 'volume': 15420000},
                'AMC': {'score': 65, 'type': 'High Squeeze Risk', 'si': 18.7, 'dtc': 3.8, 'util': 82.1, 'ctb': 8.9, 'price': 4.82, 'change': -1.2, 'volume': 28750000},
                'BBBY': {'score': 85, 'type': 'EXTREME SQUEEZE RISK', 'si': 35.2, 'dtc': 6.2, 'util': 95.7, 'ctb': 28.4, 'price': 0.35, 'change': 8.7, 'volume': 45820000},
                
                # High Short Interest Plays
                'ATER': {'score': 72, 'type': 'High Squeeze Risk', 'si': 28.3, 'dtc': 4.7, 'util': 87.4, 'ctb': 18.2, 'price': 2.15, 'change': 3.4, 'volume': 8950000},
                'SPRT': {'score': 71, 'type': 'High Squeeze Risk', 'si': 28.1, 'dtc': 5.1, 'util': 88.9, 'ctb': 15.7, 'price': 1.85, 'change': -2.1, 'volume': 12340000},
                'IRNT': {'score': 58, 'type': 'Moderate Squeeze Risk', 'si': 19.8, 'dtc': 3.2, 'util': 79.3, 'ctb': 7.1, 'price': 12.40, 'change': 1.8, 'volume': 6780000},
                'OPAD': {'score': 63, 'type': 'High Squeeze Risk', 'si': 24.1, 'dtc': 4.0, 'util': 84.2, 'ctb': 11.5, 'price': 8.32, 'change': 4.2, 'volume': 3450000},
                'MRIN': {'score': 55, 'type': 'Moderate Squeeze Risk', 'si': 16.7, 'dtc': 2.8, 'util': 73.5, 'ctb': 6.8, 'price': 3.75, 'change': -0.8, 'volume': 2150000},
                'BGFV': {'score': 68, 'type': 'High Squeeze Risk', 'si': 25.4, 'dtc': 4.3, 'util': 86.1, 'ctb': 13.2, 'price': 15.67, 'change': 2.1, 'volume': 1890000},
                'PROG': {'score': 52, 'type': 'Moderate Squeeze Risk', 'si': 14.9, 'dtc': 2.5, 'util': 71.2, 'ctb': 5.4, 'price': 1.23, 'change': 1.7, 'volume': 7820000},
                
                # EV & Tech Squeeze Plays
                'NKLA': {'score': 61, 'type': 'High Squeeze Risk', 'si': 21.3, 'dtc': 3.9, 'util': 81.7, 'ctb': 9.8, 'price': 2.34, 'change': -3.2, 'volume': 9340000},
                'RIDE': {'score': 59, 'type': 'Moderate Squeeze Risk', 'si': 18.9, 'dtc': 3.4, 'util': 78.6, 'ctb': 8.1, 'price': 1.87, 'change': 1.9, 'volume': 4560000},
                'WKHS': {'score': 57, 'type': 'Moderate Squeeze Risk', 'si': 17.2, 'dtc': 3.1, 'util': 75.8, 'ctb': 7.3, 'price': 3.42, 'change': 0.6, 'volume': 3280000},
                'GOEV': {'score': 48, 'type': 'Low Squeeze Risk', 'si': 13.8, 'dtc': 2.2, 'util': 68.4, 'ctb': 4.7, 'price': 0.89, 'change': -1.1, 'volume': 2750000},
                
                # Biotech & Healthcare
                'SAVA': {'score': 74, 'type': 'High Squeeze Risk', 'si': 29.7, 'dtc': 5.3, 'util': 89.8, 'ctb': 19.4, 'price': 8.45, 'change': 3.8, 'volume': 5670000},
                'VXRT': {'score': 66, 'type': 'High Squeeze Risk', 'si': 23.6, 'dtc': 4.2, 'util': 83.9, 'ctb': 12.1, 'price': 2.78, 'change': 2.4, 'volume': 4320000},
                'CLOV': {'score': 54, 'type': 'Moderate Squeeze Risk', 'si': 15.8, 'dtc': 2.7, 'util': 72.6, 'ctb': 6.2, 'price': 1.95, 'change': 1.3, 'volume': 8950000},
                'BYND': {'score': 62, 'type': 'High Squeeze Risk', 'si': 22.4, 'dtc': 4.1, 'util': 82.7, 'ctb': 10.6, 'price': 7.89, 'change': -2.7, 'volume': 3180000},
                
                # Retail & Consumer
                'APRN': {'score': 69, 'type': 'High Squeeze Risk', 'si': 26.8, 'dtc': 4.6, 'util': 87.3, 'ctb': 14.9, 'price': 12.34, 'change': 4.7, 'volume': 2890000},
                'UPST': {'score': 64, 'type': 'High Squeeze Risk', 'si': 24.7, 'dtc': 4.4, 'util': 85.1, 'ctb': 12.8, 'price': 28.56, 'change': 1.9, 'volume': 4560000},
                'SKLZ': {'score': 51, 'type': 'Moderate Squeeze Risk', 'si': 14.2, 'dtc': 2.4, 'util': 69.7, 'ctb': 5.1, 'price': 1.45, 'change': -0.7, 'volume': 6780000},
                'WISH': {'score': 49, 'type': 'Low Squeeze Risk', 'si': 13.1, 'dtc': 2.1, 'util': 66.8, 'ctb': 4.3, 'price': 0.67, 'change': 2.1, 'volume': 12450000},
                
                # Energy & Resources
                'GEVO': {'score': 58, 'type': 'Moderate Squeeze Risk', 'si': 18.4, 'dtc': 3.3, 'util': 77.2, 'ctb': 7.9, 'price': 1.89, 'change': 1.6, 'volume': 5230000},
                'KOSS': {'score': 67, 'type': 'High Squeeze Risk', 'si': 25.1, 'dtc': 4.5, 'util': 86.4, 'ctb': 13.7, 'price': 4.23, 'change': 5.8, 'volume': 2840000},
                'NAKD': {'score': 45, 'type': 'Low Squeeze Risk', 'si': 11.9, 'dtc': 1.8, 'util': 63.2, 'ctb': 3.7, 'price': 0.34, 'change': -1.4, 'volume': 18900000},
                'EXPR': {'score': 53, 'type': 'Moderate Squeeze Risk', 'si': 15.6, 'dtc': 2.6, 'util': 71.9, 'ctb': 5.8, 'price': 1.76, 'change': 0.9, 'volume': 4670000},
                
                # SPACs & New Plays
                'DWAC': {'score': 76, 'type': 'High Squeeze Risk', 'si': 31.2, 'dtc': 5.7, 'util': 91.4, 'ctb': 21.3, 'price': 16.89, 'change': 6.2, 'volume': 15670000},
                'PHUN': {'score': 70, 'type': 'High Squeeze Risk', 'si': 27.8, 'dtc': 4.9, 'util': 88.6, 'ctb': 16.4, 'price': 0.89, 'change': 12.7, 'volume': 35670000},
                'BKKT': {'score': 56, 'type': 'Moderate Squeeze Risk', 'si': 17.5, 'dtc': 3.0, 'util': 74.8, 'ctb': 6.9, 'price': 2.45, 'change': 2.8, 'volume': 6780000},
                'MARK': {'score': 60, 'type': 'High Squeeze Risk', 'si': 20.3, 'dtc': 3.7, 'util': 80.1, 'ctb': 9.2, 'price': 1.67, 'change': 3.4, 'volume': 8920000},
                
                # Penny Squeeze Plays
                'SNDL': {'score': 47, 'type': 'Low Squeeze Risk', 'si': 12.7, 'dtc': 1.9, 'util': 65.3, 'ctb': 4.1, 'price': 0.78, 'change': 1.2, 'volume': 45670000},
                'CCIV': {'score': 54, 'type': 'Moderate Squeeze Risk', 'si': 16.1, 'dtc': 2.8, 'util': 73.1, 'ctb': 6.4, 'price': 3.89, 'change': -1.8, 'volume': 7890000},
                'PSTH': {'score': 42, 'type': 'Low Squeeze Risk', 'si': 10.8, 'dtc': 1.6, 'util': 59.7, 'ctb': 3.2, 'price': 19.23, 'change': 0.4, 'volume': 2340000}
            }
            
            results = []
            live_data_count = 0
            
            for ticker in tickers:
                ticker = ticker.upper()
                
                # Try to get live data first
                ortex_data = None
                price_data = None
                
                if use_live_data:
                    ortex_data = self.get_ortex_data(ticker, ortex_key)
                    price_data = self.get_stock_price_data(ticker)
                    
                    if ortex_data or price_data:
                        live_data_count += 1
                
                # Use live data if available, otherwise fall back to mock data
                if ortex_data and price_data:
                    # Calculate squeeze score from live data
                    squeeze_score = self.calculate_squeeze_score(ortex_data, price_data)
                    squeeze_type = self.get_squeeze_type(squeeze_score)
                    
                    results.append({
                        'ticker': ticker,
                        'squeeze_score': squeeze_score,
                        'squeeze_type': squeeze_type,
                        'current_price': price_data['current_price'],
                        'price_change': price_data['price_change'],
                        'volume': price_data['volume'],
                        'ortex_data': ortex_data,
                        'timestamp': datetime.now().isoformat(),
                        'data_source': 'live_api'
                    })
                    
                elif price_data and ticker in mock_data:
                    # Mix live price data with mock Ortex data
                    mock = mock_data[ticker]
                    results.append({
                        'ticker': ticker,
                        'squeeze_score': mock['score'],
                        'squeeze_type': mock['type'],
                        'current_price': price_data['current_price'],
                        'price_change': price_data['price_change'],
                        'volume': price_data['volume'],
                        'ortex_data': {
                            'short_interest': mock['si'],
                            'days_to_cover': mock['dtc'],
                            'utilization': mock['util'],
                            'cost_to_borrow': mock['ctb']
                        },
                        'timestamp': datetime.now().isoformat(),
                        'data_source': 'mixed_live_price'
                    })
                    
                elif ticker in mock_data:
                    # Use pure mock data as fallback
                    mock = mock_data[ticker]
                    results.append({
                        'ticker': ticker,
                        'squeeze_score': mock['score'],
                        'squeeze_type': mock['type'],
                        'current_price': mock['price'],
                        'price_change': mock['change'],
                        'volume': mock['volume'],
                        'ortex_data': {
                            'short_interest': mock['si'],
                            'days_to_cover': mock['dtc'],
                            'utilization': mock['util'],
                            'cost_to_borrow': mock['ctb']
                        },
                        'timestamp': datetime.now().isoformat(),
                        'data_source': 'mock_data'
                    })
            
            # Sort by squeeze score descending
            results.sort(key=lambda x: x['squeeze_score'], reverse=True)
            
            # Generate appropriate message
            if use_live_data and live_data_count > 0:
                data_message = f"Using live data for {live_data_count} tickers, mock data for others"
            elif use_live_data:
                data_message = "Ortex API key provided but no live data retrieved - using enhanced mock data"
            else:
                data_message = "Using enhanced mock data (provide Ortex API key for live data)"
            
            response = {
                'success': True,
                'results': results,
                'count': len(results),
                'live_data_count': live_data_count,
                'message': f'Found {len(results)} squeeze candidates - {data_message}'
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            error_response = {
                'success': False,
                'error': str(e),
                'message': 'Error during squeeze scan'
            }
            
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode())
    
    def send_404(self):
        self.send_response(404)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        error = {'error': 'Not Found'}
        self.wfile.write(json.dumps(error).encode())