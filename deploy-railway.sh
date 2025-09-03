#!/bin/bash

# Hot Wheels Velocity - Railway Deployment Script

echo "🚂 Preparing Hot Wheels Velocity for Railway deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "🚀 Ready for Railway deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Push these changes to GitHub:"
    echo "   git add ."
    echo "   git commit -m 'Add Railway deployment configuration'"
    echo "   git push origin master"
    echo ""
    echo "2. Connect to Railway:"
    echo "   - Go to https://railway.app"
    echo "   - Connect your GitHub repository"
    echo "   - Railway will automatically detect and deploy"
    echo ""
    echo "3. Your site will be available at the Railway URL"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi
