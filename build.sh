#!/bin/bash

# Create public directory
mkdir -p public

# Copy marketing site files to public
cp index.html public/
cp styles.css public/
cp script.js public/
cp policies.html public/
cp logo.jpg public/
cp "Generated Image January 09, 2026 - 11_19AM.jpeg" public/ 2>/dev/null || true

# Build React app
cd app
npm install
npm run build

echo "Build complete!"
