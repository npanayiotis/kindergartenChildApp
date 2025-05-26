#!/bin/bash

echo "🧹 Starting React Native Vector Icons Cleanup..."
echo "================================================="

# Step 1: Remove react-native-vector-icons package
echo "📦 Removing react-native-vector-icons package..."
npm uninstall react-native-vector-icons 2>/dev/null || echo "Package was not installed"

# Step 2: Remove font assets manifest
echo "🗑️  Removing font assets manifest..."
rm -f android/link-assets-manifest.json

# Step 3: Clean node_modules and reinstall
echo "🔄 Cleaning node_modules and reinstalling..."
rm -rf node_modules
npm install

# Step 4: Clean iOS build cache
echo "🍎 Cleaning iOS build cache..."
cd ios
rm -rf Pods Podfile.lock build
echo "📱 Installing iOS pods..."
pod install
cd ..

# Step 5: Clean Android build
echo "🤖 Cleaning Android build..."
cd android
./gradlew clean
cd ..

# Step 6: Reset React Native cache
echo "⚡ Resetting React Native cache..."
npx react-native start --reset-cache &
sleep 2
pkill -f "react-native start" 2>/dev/null || true

# Step 7: Clear watchman
echo "👀 Clearing watchman..."
watchman watch-del-all 2>/dev/null || echo "Watchman not installed, skipping..."

echo ""
echo "✅ Cleanup completed!"
echo "================================================="
echo "🚀 Next steps:"
echo "1. npx react-native run-ios (for iOS)"
echo "2. npx react-native run-android (for Android)"
echo ""
echo "If you encounter any issues, run:"
echo "npx react-native doctor"