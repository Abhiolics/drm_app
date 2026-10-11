const { withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins');

module.exports = function withSplitApk(config) {
  // 1. Enable Proguard / R8 code shrinking and resource shrinking
  config = withGradleProperties(config, (config) => {
    // Enable Proguard in release builds
    const proguardIndex = config.modResults.findIndex(
      (item) => item.type === 'property' && item.key === 'enableProguardInReleaseBuilds'
    );
    if (proguardIndex >= 0) {
      config.modResults[proguardIndex].value = 'true';
    } else {
      config.modResults.push({
        type: 'property',
        key: 'enableProguardInReleaseBuilds',
        value: 'true',
      });
    }

    // Enable R8 full mode for maximum bytecode optimization
    const r8Index = config.modResults.findIndex(
      (item) => item.type === 'property' && item.key === 'android.enableR8.fullMode'
    );
    if (r8Index >= 0) {
      config.modResults[r8Index].value = 'true';
    } else {
      config.modResults.push({
        type: 'property',
        key: 'android.enableR8.fullMode',
        value: 'true',
      });
    }

    return config;
  });

  // 2. Inject abiFilters into defaultConfig to force single arm64-v8a architecture (drops ~60MB of unused .so libraries)
  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('abiFilters "arm64-v8a"')) {
      config.modResults.contents = config.modResults.contents.replace(
        /defaultConfig\s*\{/,
        'defaultConfig {\n        ndk {\n            abiFilters "arm64-v8a"\n        }'
      );
    }
    return config;
  });

  return config;
};
