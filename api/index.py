"""
Flask API for Options Scanner - Vercel Compatible
Main entry point for Vercel serverless functions
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from options_scanner import OptionsScanner
    from squeeze_analyzer import SqueezeAnalyzer
except ImportError:
    # Fallback if import fails
    OptionsScanner = None
    SqueezeAnalyzer = None

app = Flask(__name__, 
           template_folder='../templates',
           static_folder='../static')
CORS(app)

# Global instances
scanner_instance = None
squeeze_analyzer_instance = None

@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('index.html')

@app.route('/api/scan', methods=['POST'])
def scan_options():
    """API endpoint to scan for options opportunities"""
    try:
        data = request.get_json()
        
        # Extract parameters
        polygon_key = data.get('polygon_key', '')
        uw_key = data.get('uw_key', '')
        tickers = data.get('tickers', ['AAPL', 'MSFT', 'NVDA'])
        days_to_exp = data.get('days_to_exp', 30)
        min_return = data.get('min_return', 20)
        strategies = data.get('strategies', ['Long Calls', 'Long Puts'])
        
        # Validate inputs
        if not polygon_key and not uw_key:
            return jsonify({'error': 'At least one API key is required'}), 400
        
        if not tickers:
            return jsonify({'error': 'At least one ticker is required'}), 400
        
        # Initialize scanner
        global scanner_instance
        scanner_instance = OptionsScanner(polygon_key or None, uw_key or None)
        
        # Run scan
        results = scanner_instance.scan_all_strategies(
            tickers=tickers,
            days=days_to_exp,
            min_return=min_return
        )
        
        # Convert DataFrame to JSON-serializable format
        if not results.empty:
            # Handle NaN values and convert to dict
            results_dict = results.fillna('').to_dict('records')
            
            # Convert any numpy types to Python types
            for record in results_dict:
                for key, value in record.items():
                    if hasattr(value, 'item'):  # numpy scalar
                        record[key] = value.item()
                    elif str(type(value)).startswith('<class \'numpy'):
                        record[key] = float(value) if 'float' in str(type(value)) else int(value)
            
            return jsonify({
                'success': True,
                'results': results_dict,
                'count': len(results_dict),
                'message': f'Found {len(results_dict)} opportunities'
            })
        else:
            return jsonify({
                'success': True,
                'results': [],
                'count': 0,
                'message': 'No opportunities found'
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Error during scan'
        }), 500

@app.route('/api/greeks/<ticker>')
def get_greeks(ticker):
    """Get Greeks data for a specific ticker"""
    try:
        global scanner_instance
        if not scanner_instance or not scanner_instance.uw_key:
            return jsonify({'error': 'Unusual Whales API key required for Greeks data'}), 400
        
        exposure_data = scanner_instance.get_greek_exposure(ticker.upper())
        flow_data = scanner_instance.get_greek_flow(ticker.upper())
        
        return jsonify({
            'success': True,
            'ticker': ticker.upper(),
            'exposure': exposure_data,
            'flow': flow_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/squeeze/scan', methods=['POST'])
def squeeze_scan():
    """Scan for squeeze opportunities using Ortex data"""
    try:
        data = request.get_json()
        
        # Extract parameters
        ortex_key = data.get('ortex_key', '')
        polygon_key = data.get('polygon_key', '')
        uw_key = data.get('uw_key', '')
        tickers = data.get('tickers', ['GME', 'AMC', 'BBBY', 'ATER'])
        min_score = data.get('min_score', 20)
        
        # Validate inputs
        if not ortex_key and not uw_key and not polygon_key:
            return jsonify({'error': 'At least one API key is required'}), 400
        
        # Initialize squeeze analyzer
        global squeeze_analyzer_instance
        squeeze_analyzer_instance = SqueezeAnalyzer(ortex_key, polygon_key, uw_key)
        
        # Run squeeze scan
        results = squeeze_analyzer_instance.scan_squeeze_candidates(tickers)
        
        if not results.empty:
            # Convert DataFrame to JSON-serializable format
            results_dict = results.fillna('').to_dict('records')
            
            # Convert numpy types to Python types
            for record in results_dict:
                for key, value in record.items():
                    if hasattr(value, 'item'):
                        record[key] = value.item()
                    elif str(type(value)).startswith('<class \'numpy'):
                        record[key] = float(value) if 'float' in str(type(value)) else int(value)
            
            return jsonify({
                'success': True,
                'results': results_dict,
                'count': len(results_dict),
                'message': f'Found {len(results_dict)} squeeze candidates'
            })
        else:
            return jsonify({
                'success': True,
                'results': [],
                'count': 0,
                'message': 'No squeeze candidates found'
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Error during squeeze scan'
        }), 500

@app.route('/api/squeeze/alerts')
def squeeze_alerts():
    """Get high-priority squeeze alerts"""
    try:
        min_score = request.args.get('min_score', 60, type=float)
        
        global squeeze_analyzer_instance
        if not squeeze_analyzer_instance:
            return jsonify({'error': 'Squeeze analyzer not initialized'}), 400
        
        alerts = squeeze_analyzer_instance.get_squeeze_alerts(min_score)
        
        return jsonify({
            'success': True,
            'alerts': alerts,
            'count': len(alerts)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/squeeze/score/<ticker>')
def get_squeeze_score(ticker):
    """Get detailed squeeze analysis for specific ticker"""
    try:
        global squeeze_analyzer_instance
        if not squeeze_analyzer_instance:
            return jsonify({'error': 'Squeeze analyzer not initialized'}), 400
        
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
        'scanner_available': OptionsScanner is not None,
        'squeeze_analyzer_available': SqueezeAnalyzer is not None,
        'message': 'Ultimate Squeeze Scanner API is running'
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

# For Vercel
def handler(request, context):
    return app(request, context)