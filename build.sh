#!/bin/bash

# Create Vercel Build Output API structure
mkdir -p .vercel/output/static

# Copy all static files to output directory
cp index.html .vercel/output/static/
cp policies.html .vercel/output/static/
cp logo.jpg .vercel/output/static/
cp robots.txt .vercel/output/static/
cp sitemap.xml .vercel/output/static/
cp -r public .vercel/output/static/

# Create config.json for Build Output API
cat > .vercel/output/config.json << 'EOF'
{
  "version": 3
}
EOF

echo "Static site prepared for Vercel Build Output API"
