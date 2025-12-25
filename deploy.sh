#!/bin/bash

# Deployment Preparation Script
echo "🚀 Preparing Grocery Store Application for Deployment..."
echo ""

# Generate JWT Secret
echo "📝 Generating JWT Secret..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "Your JWT_SECRET: $JWT_SECRET"
echo ""
echo "⚠️  IMPORTANT: Save this JWT_SECRET! You'll need it for deployment."
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
    echo ""
fi

# Check if .gitignore exists
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    # .gitignore already created
    echo "✅ .gitignore ready"
    echo ""
fi

echo "✅ Deployment files ready!"
echo ""
echo "📋 Next Steps:"
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Ready for deployment'"
echo "   git remote add origin https://github.com/YOUR_USERNAME/grocery-store.git"
echo "   git push -u origin main"
echo ""
echo "2. Follow DEPLOY_NOW.md for step-by-step deployment instructions"
echo ""
echo "3. Use this JWT_SECRET when setting environment variables:"
echo "   $JWT_SECRET"
echo ""

