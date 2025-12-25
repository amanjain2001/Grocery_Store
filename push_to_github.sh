#!/bin/bash
echo "🚀 Ready to push to GitHub!"
echo ""
echo "Do you have a GitHub repository? (y/n)"
read -r has_repo

if [ "$has_repo" = "y" ]; then
    echo "Enter your GitHub repository URL:"
    read -r repo_url
    git remote add origin "$repo_url" 2>/dev/null || git remote set-url origin "$repo_url"
    git branch -M main
    echo "Pushing to GitHub..."
    git push -u origin main
    echo "✅ Pushed to GitHub!"
else
    echo ""
    echo "📝 Create a GitHub repository first:"
    echo "1. Go to: https://github.com/new"
    echo "2. Name: grocery-store"
    echo "3. Don't initialize with README"
    echo "4. Click Create"
    echo "5. Copy the repository URL"
    echo ""
    echo "Then run this script again or:"
    echo "git remote add origin YOUR_REPO_URL"
    echo "git push -u origin main"
fi
