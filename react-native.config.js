module.exports = {
  dependencies: {
    // Disable react-native-vector-icons autolinking to prevent iOS build issues
    'react-native-vector-icons': {
      platforms: {
        ios: null,
        android: null,
      },
    },
  },
  // Remove assets linking since we're using emoji-based icons
  assets: [],
};
