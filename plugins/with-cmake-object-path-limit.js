const { withAppBuildGradle } = require("expo/config-plugins");

const argument = "-DCMAKE_OBJECT_PATH_MAX=128";

module.exports = function withCmakeObjectPathLimit(config) {
  return withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.contents.includes(argument)) return modConfig;
    const defaultConfig = /(defaultConfig\s*\{)/;
    if (!defaultConfig.test(modConfig.modResults.contents)) {
      throw new Error("Could not find android.defaultConfig in app/build.gradle");
    }
    modConfig.modResults.contents = modConfig.modResults.contents.replace(
      defaultConfig,
      '$1\n        externalNativeBuild {\n            cmake {\n                arguments "-DCMAKE_OBJECT_PATH_MAX=128"\n            }\n        }',
    );
    return modConfig;
  });
};
