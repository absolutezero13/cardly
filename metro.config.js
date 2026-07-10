const { getDefaultConfig } = require('expo/metro-config');

// SDK 57's CLI includes Expo Router transitively and otherwise blocks direct
// React Navigation imports even though this project does not use Expo Router.
process.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK = '1';

module.exports = getDefaultConfig(__dirname);
