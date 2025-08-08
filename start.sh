#!/bin/bash

echo "🚀 Starting Real-time Dashboard Application..."

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check if required ports are available
echo "📋 Checking port availability..."
if ! check_port 8000; then
    echo "❌ Port 8000 (Python API) is already in use"
    exit 1
fi

if ! check_port 3001; then
    echo "❌ Port 3001 (Node.js API) is already in use"
    exit 1
fi

if ! check_port 5173; then
    echo "❌ Port 5173 (React Frontend) is already in use"
    exit 1
fi

echo "✅ All ports are available"

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
cd backend/python-api
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt
cd ../..

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd backend/node-data-pipeline
npm install
cd ../..

# Install frontend dependencies
echo "🎨 Installing frontend dependencies..."
npm install

# Start all services
echo "🚀 Starting all services..."

# Start Python backend
echo "🐍 Starting Python FastAPI server..."
cd backend/python-api
source venv/bin/activate
python main.py &
PYTHON_PID=$!
cd ../..

# Start Node.js backend
echo "📡 Starting Node.js server..."
cd backend/node-data-pipeline
npm start &
NODE_PID=$!
cd ../..

# Start React frontend
echo "⚛️  Starting React development server..."
npm run dev &
REACT_PID=$!

# Wait a moment for services to start
sleep 5

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🐍 Python API: http://localhost:8000"
echo "📡 Node.js API: http://localhost:3001"
echo ""
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $PYTHON_PID 2>/dev/null
    kill $NODE_PID 2>/dev/null
    kill $REACT_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for all background processes
wait