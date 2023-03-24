const path = require('path');
const { getLoader, loaderByName } = require('@craco/craco');

const packages = [];
packages.push(path.join(__dirname, '../../packages/lib_video'));

module.exports = {
  webpack: {
    alias: {
      '@lib-video': path.resolve(__dirname, '../../packages/lib_video/src/'),
    },
    configure: (webpackConfig) => {
      const { isFound, match } = getLoader(
        webpackConfig,
        loaderByName('babel-loader'),
      );
      if (isFound) {
        const include = Array.isArray(match.loader.include)
          ? match.loader.include
          : [match.loader.include];

        match.loader.include = include.concat(packages);
      }
      return webpackConfig;
    },
  },
  jest: {
    configure: {
      moduleNameMapper: {
        '@lib-video/(.*)': '<rootDir>../../packages/lib_video/src/$1',
      },
    },
  },
};
