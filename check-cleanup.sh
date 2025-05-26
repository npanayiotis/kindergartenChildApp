#!/bin/bash

echo "🔍 Verifying React Native Vector Icons Cleanup..."
echo "=================================================="

# Check package.json
echo "📦 Checking package.json..."
if grep -q "react-native-vector-icons" package.json; then
    echo "❌ Found react-native-vector-icons in package.json"
    echo "   → Update package.json to remove the dependency"
else
    echo "✅ react-native-vector-icons not found in package.json"
fi

# Check for font assets manifest
echo "📱 Checking for font assets manifest..."
if [ -f "android/link-assets-manifest.json" ]; then
    echo "❌ Found android/link-assets-manifest.json"
    echo "   → Run: rm android/link-assets-manifest.json"
else
    echo "✅ No font assets manifest found"
fi

# Check source files for imports
echo "📄 Checking source files for vector icon imports..."
vector_icon_files=$(find src/ -name "*.tsx" -o -name "*.ts" | xargs grep -l "react-native-vector-icons" 2>/dev/null | wc -l)
if [ $vector_icon_files -gt 0 ]; then
    echo "❌ Found vector icon imports in source files:"
    find src/ -name "*.tsx" -o -name "*.ts" | xargs grep -l "react-native-vector-icons" 2>/dev/null
    echo "   → Update these files to use IconProvider instead"
else
    echo "✅ No vector icon imports found in source files"
fi

# Check for direct Ionicons imports
echo "🔧 Checking for direct Ionicons imports..."
ionicon_files=$(find src/ -name "*.tsx" -o -name "*.ts" | xargs grep -l "from 'react-native-vector-icons" 2>/dev/null | wc -l)
if [ $ionicon_files -gt 0 ]; then
    echo "❌ Found direct vector icon imports:"
    find src/ -name "*.tsx" -o -name "*.ts" | xargs grep -l "from 'react-native-vector-icons" 2>/dev/null
    echo "   → Replace with: import {Ionicon as Icon} from '../utils/IconProvider';"
else
    echo "✅ No direct vector icon imports found"
fi

# Check IconProvider
echo "🎨 Checking IconProvider setup..."
if [ -f "src/utils/IconProvider.tsx" ]; then
    echo "✅ IconProvider.tsx exists"
    if grep -q "ICON_MAP" src/utils/IconProvider.tsx; then
        echo "✅ IconProvider has emoji mappings"
    else
        echo "⚠️  IconProvider may need emoji mappings"
    fi
else
    echo "❌ IconProvider.tsx not found"
fi

# Check react-native.config.js
echo "⚙️  Checking react-native.config.js..."
if [ -f "react-native.config.js" ]; then
    if grep -q "react-native-vector-icons" react-native.config.js; then
        if grep -q "ios: null" react-native.config.js; then
            echo "✅ react-native.config.js properly disables vector icons"
        else
            echo "❌ react-native.config.js needs to disable vector icons properly"
        fi
    else
        echo "✅ react-native.config.js clean"
    fi
else
    echo "⚠️  react-native.config.js not found"
fi

# Check node_modules
echo "📦 Checking if vector icons package is installed..."
if [ -d "node_modules/react-native-vector-icons" ]; then
    echo "❌ react-native-vector-icons still installed in node_modules"
    echo "   → Run: npm uninstall react-native-vector-icons"
else
    echo "✅ react-native-vector-icons not in node_modules"
fi

# Check iOS Pods
echo "🍎 Checking iOS Pods..."
if [ -f "ios/Podfile.lock" ]; then
    if grep -q "RNVectorIcons" ios/Podfile.lock; then
        echo "❌ Found RNVectorIcons in Podfile.lock"
        echo "   → Run: cd ios && rm -rf Pods Podfile.lock && pod install"
    else
        echo "✅ No RNVectorIcons in Podfile.lock"
    fi
else
    echo "⚠️  Podfile.lock not found (run pod install)"
fi

echo ""
echo "=================================================="

# Count issues
issues=0
if grep -q "react-native-vector-icons" package.json 2>/dev/null; then issues=$((issues+1)); fi
if [ -f "android/link-assets-manifest.json" ]; then issues=$((issues+1)); fi
if [ $vector_icon_files -gt 0 ]; then issues=$((issues+1)); fi
if [ $ionicon_files -gt 0 ]; then issues=$((issues+1)); fi
if [ -d "node_modules/react-native-vector-icons" ]; then issues=$((issues+1)); fi

if [ $issues -eq 0 ]; then
    echo "🎉 All checks passed! Your cleanup is complete."
    echo ""
    echo "Ready to build:"
    echo "• npx react-native run-ios"
    echo "• npx react-native run-android"
else
    echo "⚠️  Found $issues issue(s) that need attention."
    echo "Follow the suggestions above to fix them."
fi