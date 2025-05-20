module.exports = {
  presets: ['module:@react-native/babel-preset', 'babel-preset-expo'],
  plugins: [
    // Support for package exports
    'expo-modules-core/babel-plugin',
  ],
};
