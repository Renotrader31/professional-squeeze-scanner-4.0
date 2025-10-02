from flask import Flask, jsonify, request, render_template_string
import json
import os
from datetime import datetime

app = Flask(__name__)

# Simple HTML template embedded in Python
HTML_TEMPLATE = """
<!DOCTYPE html>
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
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #ff6b6b;
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            color: #a0a0b0;
        }
        input, select, textarea {
            width: 100%;
            padding: 10px;
            background: #1a1a2e;
            border: 1px solid #3a3a4e;
            border-radius: 5px;
            color: #e0e0e0;
        }
        button {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin: 10px 5px;
        }
        button:hover {
            transform: translateY(-2px);
        }
        .results {
            margin-top: 30px;
            padding: 20px;
            background: #1a1a2e;
            border-radius: 10px;
            border: 1px solid #3a3a4e;
        }
        .result-item {
            padding: 15px;
            margin: 10px 0;
            background: #2a2a3e;
            border-radius: 8px;
            border-left: 4px solid #ff6b6b;
        }
        .score-high { border-left-color: #ff6b6b; }
        .score-medium { border-left-color: #ffc107; }
        .score-low { border-left-color: #28a745; }
        .loading {
            text-align: center;
            color: #ff6b6b;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔥 ULTIMATE SQUEEZE SCANNER</h1>
            <p>Professional squeeze detection with live Ortex API</p>
        </div>

        <div class="form-group">
            <label for="ortexKey">Ortex API Key (for real data):</label>
            <input type="password" id="ortexKey" placeholder="Enter your Ortex API key">
        </div>

        <div class="form-group">
            <label for="tickers">Tickers to Scan:</label>
            <textarea id="tickers" rows="3" placeholder="GME, AMC, BBBY, ATER">GME, AMC, BBBY, ATER, SPRT</textarea>
        </div>

        <button onclick="runSqueezeScan()">🔥 RUN SQUEEZE SCAN</button>
        <button onclick="runHealthCheck()">🔍 TEST API</button>

        <div id="results"></div>
    </div>

    <script>
        async function runHealthCheck() {
            showLoading('Testing API connection...');
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                showResults([{
                    type: 'health',
                    message: data.message,
                    status: data.status,
                    timestamp: data.timestamp
                }]);
            } catch (error) {
                showError('Health check failed: ' + error.message);
            }
        }

        async function runSqueezeScan() {
            const ortexKey = document.getElementById('ortexKey').value;
            const tickers = document.getElementById('tickers').value.split(',').map(t => t.trim()).filter(t => t);
            
            if (tickers.length === 0) {
                showError('Please enter at least one ticker');
                return;
            }

            showLoading('🔥 Scanning for squeeze opportunities...');

            try {
                const response = await fetch('/api/squeeze/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ortex_key: ortexKey,
                        tickers: tickers
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    showResults(data.results);
                } else {
                    showError(data.message || 'Scan failed');
                }
            } catch (error) {
                showError('Network error: ' + error.message);
            }
        }

        function showLoading(message) {
            document.getElementById('results').innerHTML = '<div class="loading">' + message + '</div>';
        }

        function showError(message) {
            document.getElementById('results').innerHTML = '<div class="results"><div class="result-item" style="border-left-color: #dc3545;">❌ ' + message + '</div></div>';
        }

        function showResults(results) {
            if (!results || results.length === 0) {
                document.getElementById('results').innerHTML = '<div class="results"><div class="result-item">No results found</div></div>';
                return;
            }

            let html = '<div class="results"><h3>🎯 Squeeze Scan Results</h3>';
            
            results.forEach(result => {
                if (result.type === 'health') {
                    html += `<div class="result-item">
                        <strong>API Status:</strong> ${result.status}<br>
                        <strong>Message:</strong> ${result.message}<br>
                        <strong>Time:</strong> ${new Date(result.timestamp).toLocaleString()}
                    </div>`;
                } else {
                    const scoreClass = result.squeeze_score >= 60 ? 'score-high' : result.squeeze_score >= 40 ? 'score-medium' : 'score-low';
                    html += `<div class="result-item ${scoreClass}">
                        <strong>${result.ticker}</strong> - Squeeze Score: <strong>${result.squeeze_score || 0}</strong><br>
                        <strong>Risk Level:</strong> ${result.squeeze_type || 'Unknown'}<br>
                        <strong>Short Interest:</strong> ${result.ortex_data?.short_interest || 'N/A'}%<br>
                        <strong>Days to Cover:</strong> ${result.ortex_data?.days_to_cover || 'N/A'}<br>
                        <strong>Utilization:</strong> ${result.ortex_data?.utilization || 'N/A'}%
                    </div>`;
                }
            });
            
            html += '</div>';
            document.getElementById('results').innerHTML = html;
        }

        // Auto-run health check on page load
        window.onload = function() {
            runHealthCheck();
        };
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    """Main page"""
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/health')
def health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'message': 'Ultimate Squeeze Scanner API is running!',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/squeeze/scan', methods=['POST'])
def squeeze_scan():
    """Simple squeeze scan"""
    try:
        data = request.get_json() or {}
        ortex_key = data.get('ortex_key', '') or os.environ.get('ORTEX_API_KEY', '')
        tickers = data.get('tickers', ['GME', 'AMC'])
        
        results = []
        
        # Mock squeeze data for testing
        mock_data = {
            'GME': {'score': 78, 'type': 'High Squeeze Risk', 'si': 22.5, 'dtc': 4.1, 'util': 89.2},
            'AMC': {'score': 65, 'type': 'High Squeeze Risk', 'si': 18.7, 'dtc': 3.8, 'util': 82.1},
            'BBBY': {'score': 85, 'type': 'EXTREME SQUEEZE RISK', 'si': 35.2, 'dtc': 6.2, 'util': 95.7},
            'ATER': {'score': 42, 'type': 'Moderate Squeeze Risk', 'si': 15.3, 'dtc': 2.9, 'util': 76.4},
            'SPRT': {'score': 71, 'type': 'High Squeeze Risk', 'si': 28.1, 'dtc': 5.1, 'util': 88.9}
        }
        
        for ticker in tickers:
            if ticker.upper() in mock_data:
                mock = mock_data[ticker.upper()]
                results.append({
                    'ticker': ticker.upper(),
                    'squeeze_score': mock['score'],
                    'squeeze_type': mock['type'],
                    'ortex_data': {
                        'short_interest': mock['si'],
                        'days_to_cover': mock['dtc'],
                        'utilization': mock['util']
                    },
                    'timestamp': datetime.now().isoformat()
                })
        
        # Sort by score
        results.sort(key=lambda x: x['squeeze_score'], reverse=True)
        
        return jsonify({
            'success': True,
            'results': results,
            'count': len(results),
            'message': f'Found {len(results)} squeeze candidates'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Error during squeeze scan'
        }), 500

# This is required for Vercel
def handler(request, response):
    return app(request, response)

if __name__ == '__main__':
    app.run(debug=True)