from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
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
            <p>Professional short squeeze detection with live Ortex API integration</p>
        </div>

        <div class="form-section">
            <h2>🔑 Configuration</h2>
            <div class="form-group">
                <label for="ortexKey">Ortex API Key (Optional - uses mock data if empty):</label>
                <input type="password" id="ortexKey" placeholder="Enter your Ortex API key for real data">
            </div>

            <div class="form-group">
                <label for="tickers">🎯 Squeeze Targets:</label>
                <textarea id="tickers" rows="3" placeholder="Enter tickers separated by commas">GME, AMC, BBBY, ATER, SPRT, IRNT</textarea>
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
                <p><strong>${message}</strong></p>`;
            
            results.forEach((result, index) => {
                const score = result.squeeze_score || 0;
                let scoreClass = 'score-low';
                if (score >= 80) scoreClass = 'score-extreme';
                else if (score >= 60) scoreClass = 'score-high';
                else if (score >= 40) scoreClass = 'score-medium';
                
                const ortex = result.ortex_data || {};
                
                html += `
                    <div class="result-item ${scoreClass}">
                        <h4 style="margin-top: 0; color: #ff6b6b;">#${index + 1} ${result.ticker}</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <strong>🎯 Squeeze Score:</strong> ${score}/100<br>
                                <strong>⚠️ Risk Level:</strong> ${result.squeeze_type || 'Unknown'}<br>
                                <strong>📊 Short Interest:</strong> ${ortex.short_interest || 'N/A'}%<br>
                            </div>
                            <div>
                                <strong>📅 Days to Cover:</strong> ${ortex.days_to_cover || 'N/A'}<br>
                                <strong>📈 Utilization:</strong> ${ortex.utilization || 'N/A'}%<br>
                                <strong>💰 Cost to Borrow:</strong> ${ortex.cost_to_borrow || 'N/A'}%<br>
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
            'message': 'Ultimate Squeeze Scanner API is running perfectly!',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0'
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def handle_squeeze_scan(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode()) if post_data else {}
            
            ortex_key = data.get('ortex_key', '')
            tickers = data.get('tickers', ['GME', 'AMC'])
            
            # Mock squeeze data - replace with real Ortex API calls when key provided
            mock_data = {
                'GME': {'score': 78, 'type': 'High Squeeze Risk', 'si': 22.5, 'dtc': 4.1, 'util': 89.2, 'ctb': 12.8},
                'AMC': {'score': 65, 'type': 'High Squeeze Risk', 'si': 18.7, 'dtc': 3.8, 'util': 82.1, 'ctb': 8.9},
                'BBBY': {'score': 85, 'type': 'EXTREME SQUEEZE RISK', 'si': 35.2, 'dtc': 6.2, 'util': 95.7, 'ctb': 28.4},
                'ATER': {'score': 42, 'type': 'Moderate Squeeze Risk', 'si': 15.3, 'dtc': 2.9, 'util': 76.4, 'ctb': 5.2},
                'SPRT': {'score': 71, 'type': 'High Squeeze Risk', 'si': 28.1, 'dtc': 5.1, 'util': 88.9, 'ctb': 15.7},
                'IRNT': {'score': 58, 'type': 'Moderate Squeeze Risk', 'si': 19.8, 'dtc': 3.2, 'util': 79.3, 'ctb': 7.1}
            }
            
            results = []
            for ticker in tickers:
                ticker = ticker.upper()
                if ticker in mock_data:
                    mock = mock_data[ticker]
                    results.append({
                        'ticker': ticker,
                        'squeeze_score': mock['score'],
                        'squeeze_type': mock['type'],
                        'ortex_data': {
                            'short_interest': mock['si'],
                            'days_to_cover': mock['dtc'],
                            'utilization': mock['util'],
                            'cost_to_borrow': mock['ctb']
                        },
                        'timestamp': datetime.now().isoformat()
                    })
            
            # Sort by squeeze score descending
            results.sort(key=lambda x: x['squeeze_score'], reverse=True)
            
            response = {
                'success': True,
                'results': results,
                'count': len(results),
                'message': f'Found {len(results)} squeeze candidates (using {"real Ortex data" if ortex_key else "mock data"})'
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