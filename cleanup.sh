#!/bin/bash

# ====================================
# REACT NATIVE CLEAN & RESTART GUIDE
# ====================================

echo "🧹 Starting complete React Native cleanup..."

# 1. STOP ALL RUNNING PROCESSES
echo "🛑 Stopping all processes..."

# Stop Metro bundler
pkill -f "react-native start" || echo "Metro not running"
pkill -f "node.*metro" || echo "Metro node process not found"

# Stop Android emulator
adb emu kill || echo "No Android emulator running"

# Stop iOS Simulator
xcrun simctl shutdown all 2>/dev/null || echo "No iOS simulators running"

# Kill any remaining Node processes related to React Native
pkill -f "node.*react-native" || echo "No React Native node processes"

# 2. CLEAN REACT NATIVE CACHE
echo "🧼 Cleaning React Native caches..."

# Reset Metro cache
npx react-native start --reset-cache --port 8081 &
sleep 2
pkill -f "react-native start"

# Clear watchman watches
watchman watch-del-all 2>/dev/null || echo "Watchman not available"

# Clear React Native temp files
rm -rf /tmp/metro-* 2>/dev/null || echo "No Metro temp files"
rm -rf /tmp/react-* 2>/dev/null || echo "No React temp files"

# 3. CLEAN NODE MODULES
echo "📦 Cleaning Node modules..."
rm -rf node_modules
npm cache clean --force
npm install

# 4. CLEAN ANDROID BUILD
echo "🤖 Cleaning Android build..."
cd android
./gradlew clean
cd ..

# Clear Android build cache
rm -rf android/app/build
rm -rf android/.gradle

# 5. CLEAN iOS BUILD  
echo "🍎 Cleaning iOS build..."
cd ios
rm -rf build
rm -rf Pods
rm -rf Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData/*kindergarten* 2>/dev/null || echo "No Xcode derived data"

# Reinstall pods
bundle install
bundle exec pod install
cd ..

# 6. CLEAN SYSTEM CACHES
echo "🧹 Cleaning system caches..."

# Clear npm cache
npm cache clean --force

# Clear yarn cache if using yarn
yarn cache clean 2>/dev/null || echo "Yarn not available"

# 7. VERIFY CLEANUP
echo "✅ Cleanup complete! Running verification..."

# Check if processes are stopped
if pgrep -f "react-native start" > /dev/null; then
    echo "⚠️  Metro is still running"
else
    echo "✅ Metro stopped"
fi

if pgrep -f "qemu-system" > /dev/null; then
    echo "⚠️  Android emulator still running"
else
    echo "✅ Android emulator stopped"
fi

echo ""
echo "🚀 Ready to restart! Use these commands:"
echo ""
echo "To start Metro:"
echo "  npm start"
echo "  # OR"
echo "  npx react-native start"
echo ""
echo "To run on Android:"
echo "  npm run android"
echo "  # OR"
echo "  npx react-native run-android"
echo ""
echo "To run on iOS:"
echo "  npm run ios" 
echo "  # OR"
echo "  npx react-native run-ios"
echo ""

# ====================================
# QUICK INDIVIDUAL COMMANDS
# ====================================

# Stop Metro only:
# pkill -f "react-native start"

# Stop Android emulator only:
# adb emu kill

# Stop iOS Simulator only:
# xcrun simctl shutdown all

# Reset Metro cache only:
# npx react-native start --reset-cache

# Clean Android only:
# cd android && ./gradlew clean && cd ..

# Clean iOS only:
# cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Clean node_modules only:
# rm -rf node_modules && npm install

# ====================================
# RESTART COMMANDS
# ====================================

# Option 1: Start Metro first, then run app
start_metro() {
    echo "🚀 Starting Metro bundler..."
    npx react-native start
}

# Option 2: Run Android directly (starts Metro automatically)
run_android() {
    echo "🤖 Starting Android app..."
    npx react-native run-android
}

# Option 3: Run iOS directly (starts Metro automatically)  
run_ios() {
    echo "🍎 Starting iOS app..."
    npx react-native run-ios
}

# Option 4: Open Android Studio
open_android_studio() {
    echo "📱 Opening Android Studio..."
    open -a "Android Studio" android/ 2>/dev/null || echo "Android Studio not found"
}

# Option 5: Open Xcode
open_xcode() {
    echo "🔨 Opening Xcode..."
    open ios/kindergartenChildstatusApp.xcworkspace 2>/dev/null || echo "Xcode workspace not found"
}

echo "Run any of these functions to restart specific services:"
echo "  start_metro"
echo "  run_android" 
echo "  run_ios"
echo "  open_android_studio"
echo "  open_xcode"