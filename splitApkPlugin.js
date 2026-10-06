const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withSplitApk(config) {
  return withAppBuildGradle(config, (config) => {
    // Inject abiFilters into defaultConfig to force a single arm64-v8a APK
    config.modResults.contents = config.modResults.contents.replace(
      /defaultConfig\s*\{/,
      'defaultConfig {\n        ndk {\n            abiFilters "arm64-v8a"\n        }'
    );
    return config;
  });
};
