#!/bin/bash

# Simple script to launch the example demo

echo "🎆 Starting Firework Example Demo Server..."
echo ""
echo "Opening demo at: http://localhost:8000/example/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$(dirname "$0")/.." && python3 -m http.server 8000
