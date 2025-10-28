#!/bin/bash

# NBA Stats - Quick Setup Script
# This script helps you set up the environment for running the NBA Stats application

echo "🏀 NBA Stats - Quick Setup"
echo "=========================="
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file already exists"
    
    # Check if NBA_API_KEY is set
    if grep -q "NBA_API_KEY=$" .env || grep -q "NBA_API_KEY=your_api_key_here" .env || grep -q "NBA_API_KEY=\"\"" .env; then
        echo "⚠️  NBA_API_KEY is not configured in .env"
        echo ""
        echo "Please add your BallDontLie API key to the .env file:"
        echo "  1. Get your API key from: https://www.balldontlie.io"
        echo "  2. Edit .env and set: NBA_API_KEY=your_actual_key_here"
        echo ""
    else
        echo "✅ NBA_API_KEY is configured"
    fi
else
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: You need to add your BallDontLie API key!"
    echo ""
    echo "Steps to complete setup:"
    echo "  1. Get your API key from: https://www.balldontlie.io"
    echo "  2. Edit .env and replace the NBA_API_KEY value with your actual key"
    echo "  3. Run: docker-compose up"
    echo ""
    
    # Open .env in default editor
    read -p "Would you like to edit .env now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    fi
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""

# Check if Docker is running
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "✅ Docker is running"
    echo ""
    echo "To start the application:"
    echo "  docker-compose up"
    echo ""
    echo "Or to run in background:"
    echo "  docker-compose up -d"
else
    echo "⚠️  Docker is not running or not installed"
    echo "Please start Docker Desktop and try again"
fi

echo ""
echo "Once running, access:"
echo "  • Frontend:  http://localhost:3001"
echo "  • API:       http://localhost:3000"
echo "  • PgAdmin:   http://localhost:5050"
echo ""
