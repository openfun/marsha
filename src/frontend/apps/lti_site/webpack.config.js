const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const { alias } = require('marsha-config');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const outputDir =
  __dirname + '/../../../backend/marsha/static/js/build/lti_site';

module.exports = (_, argv) => {
  process.env.NODE_ENV = argv.mode || 'development';

  const config = {
    // Disable production-specific optimizations by default
    // They can be re-enabled by running the cli with `--mode=production` or making a separate
    // webpack config for production.
    mode: 'development',

    // Currently, @babel/preset-env is unaware that using import() with Webpack relies on Promise internally.
    // Environments which do not have builtin support for Promise, like Internet Explorer, will require both
    // the promise and iterator polyfills be added manually.
    entry: [
      './public-path.js',
      'core-js',
      'regenerator-runtime/runtime',
      'whatwg-fetch',
      './index.tsx',
    ],

    // chunkFilename must have a unique and different name on each build
    // this will prevent to replace existing chunk if backend static storage
    // is on AWS.
    output: {
      filename: 'index.js',
      path: outputDir,
      chunkFilename: '[id].[fullhash].index.js',
      clean: true,
    },

    // Enable eval source map for debugging webpack's output.
    devtool: 'eval',

    resolve: {
      // Add '.ts' and '.tsx' as resolvable extensions.
      extensions: ['.ts', '.tsx', '.js', '.json'],
      modules: [__dirname, 'node_modules'],
      fallback: {
        buffer: require.resolve('buffer/'),
        stream: require.resolve('stream-browserify'),
      },
      alias: alias['lti'],
    },

    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                publicPath: outputDir,
              },
            },
            'css-loader',
          ],
          sideEffects: true,
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
        {
          test: /(public-path\.js|\.tsx?$|(memoize-one|react-intl|zustand).*\.(jsx?))/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                babelrc: true,
              },
            },
          ],
        },
        {
          test: /\.(js|mjs)$/,
          exclude: /@babel(?:\/|\\{1,2})runtime/,
          loader: require.resolve('babel-loader'),
          options: {
            babelrc: false,
            configFile: false,
            compact: false,
            presets: [
              [require.resolve('babel-preset-react'), { helpers: true }],
            ],
            cacheDirectory: true,
            cacheCompression: false,
            sourceMaps: true,
            inputSourceMap: true,
          },
        },
        // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
        {
          enforce: 'pre',
          test: /\.js$/,
          use: ['source-map-loader'],
        },
      ],
    },
    ignoreWarnings: [/Failed to parse source map/],
    watchOptions: {
      ignored: '**/node_modules',
      aggregateTimeout: 1000,
    },
    plugins: [
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser.js',
      }),
      new MiniCssExtractPlugin(),
    ],
  };

  if (argv.mode === 'production') {
    config.output.chunkFilename = '[name].[contenthash].js';

    config.optimization = {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
          parallel: process.env.CI ? 4 : true,
        }),
      ],
    };

    config.devtool = 'source-map';
  }

  return config;
};
