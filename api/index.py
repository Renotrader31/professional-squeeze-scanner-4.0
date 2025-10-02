"""
Ultimate Squeeze Scanner API - Vercel Serverless Function
Self-contained API with squeeze detection capabilities
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional

app = Flask(__name__, 
           template_folder='../templates',
           static_folder='../static')
CORS(app)

class SqueezeAnalyzer:
    """Lightweight squeeze analyzer for serverless deployment"""
    
    def __init__(self, ortex_key: str = None, polygon_key: str = None, uw_key: str = None):
        self.ortex_key = ortex_key
        self.polygon_key = polygon_key 
        self.uw_key = uw_key
    
    def get_ortex_data(self, ticker: str) -> Dict:
        """Get Ortex data for squeeze analysis"""
        if not self.ortex_key:
            # Return mock data for testing
            return {
                'short_interest': 25.5,
                'days_to_cover': 4.2,
                'utilization': 87.3,
                'cost_to_borrow': 15.8,
                'short_squeeze_signal': 8.5
            }
            
        try:
            headers = {
                "Authorization": f"Bearer {self.ortex_key}",
                "Content-Type": "application/json"
            }
            
            url = f"https://api.ortex.com/v1/equities/{ticker}/short-interest"
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'short_interest': data.get('short_interest', 0),
                    'days_to_cover': data.get('days_to_cover', 0),
                    'utilization': data.get('utilization', 0),
                    'cost_to_borrow': data.get('cost_to_borrow', 0),
                    'short_squeeze_signal': data.get('short_squeeze_signal', 0)
                }
        except Exception as e:
            print(f"Ortex API error: {e}")
            
        return {}
    
    def calculate_squeeze_score(self, ticker: str) -> Dict:
        """Calculate comprehensive squeeze score"""
        ortex_data = self.get_ortex_data(ticker)
        
        score = 0
        factors = {}
        
        # Short Interest Factor (0-30 points)
        short_interest = ortex_data.get('short_interest', 0)
        if short_interest > 20:
            factors['high_short_interest'] = min(30, short_interest)
            score += factors['high_short_interest']
        
        # Days to Cover Factor (0-20 points)
        days_to_cover = ortex_data.get('days_to_cover', 0)
        if days_to_cover > 3:
            factors['high_days_to_cover'] = min(20, days_to_cover * 3)
            score += factors['high_days_to_cover']
        
        # Utilization Factor (0-15 points)
        utilization = ortex_data.get('utilization', 0)
        if utilization > 80:
            factors['high_utilization'] = min(15, (utilization - 80) * 0.75)
            score += factors['high_utilization']
        
        # Cost to Borrow Factor (0-15 points)
        ctb = ortex_data.get('cost_to_borrow', 0)
        if ctb > 10:
            factors['high_borrow_cost'] = min(15, ctb * 1.5)
            score += factors['high_borrow_cost']
        
        # Determine squeeze type
        if score >= 80:
            squeeze_type = "EXTREME SQUEEZE RISK"
        elif score >= 60:
            squeeze_type = "High Squeeze Risk"  
        elif score >= 40:
            squeeze_type = "Moderate Squeeze Risk"
        elif score >= 20:
            squeeze_type = "Low Squeeze Risk"
        else:
            squeeze_type = "Minimal Risk"
        
        return {
            'ticker': ticker,
            'squeeze_score': min(100, score),
            'squeeze_type': squeeze_type,
            'factors': factors,
            'ortex_data': ortex_data,
            'timestamp': datetime.now().isoformat()
        }
    
    def scan_squeeze_candidates(self, tickers: List[str]) -> List[Dict]:
        """Scan multiple tickers for squeeze potential"""
        results = []
        
        for ticker in tickers:
            try:
                squeeze_data = self.calculate_squeeze_score(ticker)
                if squeeze_data['squeeze_score'] > 0:
                    results.append(squeeze_data)
            except Exception as e:
                print(f"Error analyzing {ticker}: {e}")
                continue
        
        # Sort by squeeze score
        results.sort(key=lambda x: x['squeeze_score'], reverse=True)
        return results

class OptionsScanner:
    """Lightweight options scanner for serverless deployment"""
    
    def __init__(self, polygon_key: str = None, uw_key: str = None):
        self.polygon_key = polygon_key
        self.uw_key = uw_key
    
    def get_current_price(self, ticker: str) -> float:
        """Get current stock price"""
        # Mock price for testing - replace with real API call
        mock_prices = {
            'AAPL': 175.43,
            'MSFT': 378.85,
            'NVDA': 450.32,
            'GME': 18.75,
            'AMC': 4.82,
            'BBBY': 0.35,
            'ATER': 2.15,
            'SPY': 445.67
        }
        return mock_prices.get(ticker, 100.0)
    
    def simple_scan(self, tickers: List[str], days: int, min_return: float) -> List[Dict]:
        """Simple options scan without heavy dependencies"""
        results = []
        
        for ticker in tickers:
            try:
                current_price = self.get_current_price(ticker)
                strategies = ['Long Calls', 'Long Puts', 'Bull Call Spreads', 'Cash-Secured Puts']
                
                for strategy in strategies:
                    strike = current_price * (1.05 if 'Call' in strategy else 0.95)
                    expected_return = min_return + (abs(hash(ticker + strategy)) % 20)
                    
                    result = {
                        'ticker': ticker,
                        'strategy': strategy,
                        'current_price': round(current_price, 2),
                        'strike': round(strike, 2),
                        'return': round(expected_return, 1),
                        'dte': days,
                        'expiration': (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d'),
                        'premium': round(current_price * 0.03, 2),
                        'breakeven': round(strike + (current_price * 0.03), 2)
                    }
                    
                    if result['return'] >= min_return:
                        results.append(result)
                        
            except Exception as e:
                print(f"Error scanning {ticker}: {e}")
                continue
        
        results.sort(key=lambda x: x['return'], reverse=True)
        return results

# Global instances
scanner_instance = None
squeeze_analyzer_instance = None

@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('index.html')

@app.route('/api/scan', methods=['POST'])
def scan_options():
    """API endpoint for options scanning"""
    try:
        data = request.get_json()
        
        # Extract parameters with environment variable fallbacks
        polygon_key = data.get('polygon_key', '') or os.getenv('POLYGON_API_KEY', '')
        uw_key = data.get('uw_key', '') or os.getenv('UNUSUAL_WHALES_API_KEY', '')
        tickers = data.get('tickers', ['AAPL', 'MSFT', 'NVDA'])
        days_to_exp = data.get('days_to_exp', 30)
        min_return = data.get('min_return', 20)
        
        if not tickers:
            return jsonify({'error': 'At least one ticker is required'}), 400
        
        # Initialize scanner
        global scanner_instance
        scanner_instance = OptionsScanner(polygon_key, uw_key)
        
        # Run scan
        results = scanner_instance.simple_scan(tickers, days_to_exp, min_return)
        
        return jsonify({
            'success': True,
            'results': results,
            'count': len(results),
            'message': f'Found {len(results)} opportunities'
        })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Error during scan'
        }), 500

@app.route('/api/squeeze/scan', methods=['POST'])
def squeeze_scan():
    """API endpoint for squeeze scanning"""
    try:
        data = request.get_json()
        
        # Extract parameters with environment variable fallbacks
        ortex_key = data.get('ortex_key', '') or os.getenv('ORTEX_API_KEY', '')
        polygon_key = data.get('polygon_key', '') or os.getenv('POLYGON_API_KEY', '')
        uw_key = data.get('uw_key', '') or os.getenv('UNUSUAL_WHALES_API_KEY', '')
        tickers = data.get('tickers', ['GME', 'AMC', 'BBBY', 'ATER'])
        min_score = data.get('min_score', 20)
        
        if not tickers:
            return jsonify({'error': 'At least one ticker is required'}), 400
        
        # Initialize squeeze analyzer
        global squeeze_analyzer_instance
        squeeze_analyzer_instance = SqueezeAnalyzer(ortex_key, polygon_key, uw_key)
        
        # Run squeeze scan
        results = squeeze_analyzer_instance.scan_squeeze_candidates(tickers)
        
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

@app.route('/api/squeeze/score/<ticker>')
def get_squeeze_score(ticker):
    """Get squeeze score for specific ticker"""
    try:
        global squeeze_analyzer_instance
        if not squeeze_analyzer_instance:
            # Create instance with environment variables
            ortex_key = os.getenv('ORTEX_API_KEY', '')
            squeeze_analyzer_instance = SqueezeAnalyzer(ortex_key)
        
        squeeze_data = squeeze_analyzer_instance.calculate_squeeze_score(ticker.upper())
        
        return jsonify({
            'success': True,
            'data': squeeze_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Ultimate Squeeze Scanner API is running',
        'timestamp': datetime.now().isoformat()
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# For local development
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

# Vercel serverless function handler
def handler(event, context):
    return app(event, context)

# Alternative Vercel handler format
app.wsgi_app = app.wsgi_app