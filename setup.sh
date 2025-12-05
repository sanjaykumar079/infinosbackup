#!/bin/bash

echo "🚀 Setting up INFINOS Project..."

# Backend setup
echo "📦 Installing backend dependencies..."
cd infinosbackend
npm install
cd ..

# Frontend setup
echo "📦 Installing frontend dependencies..."
cd infinosfrontend
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your actual credentials"
fi

cd ..

echo "✅ Setup complete!"
echo ""
echo "To start the project:"
echo "  Backend:  cd infinosbackend && npm start"
echo "  Frontend: cd infinosfrontend && npm start"
echo "  Simulator: cd infinosbackend && node simulator.js"