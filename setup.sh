#!/bin/bash

echo "🍽️  Restaurant Admin White-Label Setup"
echo "======================================="
echo ""

read -p "Restaurant Name: " RESTAURANT_NAME
read -p "Primary Color (hex, e.g. #F5C800): " PRIMARY_COLOR
read -p "Supabase URL: " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_KEY
read -p "New repo name (e.g. myrestaurant-admin): " REPO_NAME

echo ""
echo "Setting up $RESTAURANT_NAME admin..."

sed -i '' "s|Angie's Kebabs & Burgers|$RESTAURANT_NAME|g" restaurant.config.js
sed -i '' "s|#F5C800|$PRIMARY_COLOR|g" restaurant.config.js

cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_KEY
DISABLE_ESLINT_PLUGIN=true
EOF

echo "✅ Config updated!"
echo ""
echo "Next steps:"
echo "1. git init && git add . && git commit -m 'Initial setup for $RESTAURANT_NAME admin'"
echo "2. Create GitHub repo: $REPO_NAME"
echo "3. git remote add origin https://github.com/YOUR_USERNAME/$REPO_NAME.git"
echo "4. git push origin main"
echo "5. Connect to Vercel for auto-deploy"
echo ""
echo "🚀 Done!"
