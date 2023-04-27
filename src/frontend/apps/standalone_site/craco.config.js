const { getLoader, loaderByName } = require('@craco/craco');
const {
  appPackages: packages,
  alias,
  appModuleNameMapper,
} = require('marsha-config');

/**
 * Craco (Create React App Configuration Override) helps us to configure the webpack of our CRA without ejecting.
 * It is used to add the marsha packages to the babel-loader, @see packages
 * It is also used to add the packages alias to the webpack alias list, @see alias
 * It is also used to add the marsha moduleNameMapper to the jest config, @see appModuleNameMapper
 */
module.exports = {
  webpack: {
    alias: alias['website'],
    configure: (webpackConfig) => {
      const { isFound, match } = getLoader(
        webpackConfig,
        loaderByName('babel-loader'),
      );
      if (isFound) {
        const include = Array.isArray(match.loader.include)
          ? match.loader.include
          : [match.loader.include];

        match.loader.include = include.concat(packages['website']);
      }
      return webpackConfig;
    },
  },
  jest: {
    configure: {
      moduleNameMapper: {
        ...appModuleNameMapper['website'],
        'react-markdown': '<rootDir>/src/__mock__/react-markdown.tsx',
      },
    },
  },
};
