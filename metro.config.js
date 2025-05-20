const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {makeMetroConfig} = require('@expo/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    unstable_enablePackageExports: true,
    sourceExts: ['js', 'jsx', 'json', 'ts', 'tsx'],
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'svg'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
