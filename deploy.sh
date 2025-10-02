#!/bin/bash

# Ultimate Squeeze Scanner - Vercel Deployment Script
# Run this script to deploy your squeeze scanner to Vercel

echo "🔥 Ultimate Squeeze Scanner - Vercel Deployment"
echo "================================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
echo "🔑 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "📝 Please login to Vercel..."
    vercel login
fi

# Deploy the application
echo "🚀 Deploying Ultimate Squeeze Scanner to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🔧 IMPORTANT: Set your environment variables in Vercel dashboard:"
echo "   - POLYGON_API_KEY: Your Polygon.io API key"
echo "   - UNUSUAL_WHALES_API_KEY: Your Unusual Whales API key" 
echo "   - ORTEX_API_KEY: Your Ortex API key (for squeeze detection)"
echo ""
echo "🌐 Access your deployed squeeze scanner at the URL shown above!"
echo ""
echo "🔥 Happy squeeze hunting! 📈"