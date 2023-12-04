/**
 * Helper based on `config.json` to configure the Marsha's apps and libs:
 *  - craco.config.js
 *  - jest.config.js
 *  - webpack.config.js
 */

const path = require('path');

const { packages: packagesConfig } = require('./config.json');

const appPackages = {};
const alias = {};
const appModuleNameMapper = {};
const libModuleNameMapper = {};

for (const packageConfig of packagesConfig) {
  // This is needed for webpack to transpile the packages on the fly
  for (const app of packageConfig.apps) {
    if (!appPackages[app]) {
      appPackages[app] = [];
      alias[app] = {};
      appModuleNameMapper[app] = {};
    }

    appPackages[app].push(
      path.join(__dirname, `../../packages/${packageConfig.folder}`),
    );

    // This is needed for webpack to work with the alias
    alias[app][packageConfig.alias] = path.resolve(
      __dirname,
      `../../packages/${packageConfig.folder}/src/`,
    );

    // This is needed for jest to work with the alias
    appModuleNameMapper[app][`${packageConfig.alias}/(.*)`] =
      `<rootDir>../../packages/${packageConfig.folder}/src/$1`;

    // ESM not supported - this is necessary for jest to work with packages exports
    appModuleNameMapper[app][`${packageConfig.name}/tests`] =
      `<rootDir>../../packages/${packageConfig.folder}/src/tests/`;
  }

  if (!libModuleNameMapper[packageConfig.name]) {
    libModuleNameMapper[packageConfig.name] = {};
    libModuleNameMapper[packageConfig.name][`${packageConfig.alias}/(.*)`] =
      `<rootDir>/src/$1`;
  }

  for (const dependency of packageConfig.dependencies) {
    for (const depConf of packagesConfig) {
      if (depConf.name === dependency) {
        libModuleNameMapper[packageConfig.name][`${depConf.alias}/(.*)`] =
          `<rootDir>/../${depConf.folder}/src/$1`;
      }
    }
  }
}

module.exports = {
  appPackages,
  alias,
  appModuleNameMapper,
  libModuleNameMapper,
};
