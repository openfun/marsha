import { createRequire } from 'node:module';

import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import del from 'rollup-plugin-delete';
import typescript from 'rollup-plugin-typescript2';
import external from 'rollup-plugin-peer-deps-external';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
      esModule: true,
      generatedCode: {
        reservedNamesAsProps: false,
      },
      interop: 'compat',
      systemNullSetters: false,
    },
    {
      file: pkg.module,
      format: 'es',
      exports: 'named',
      sourcemap: true,
    },
  ],
  makeAbsoluteExternalsRelative: true,
  preserveEntrySignatures: 'strict',
  external: [
    'react',
    'reactDom',
    'react-router-dom',
    'lib-common',
    'styled-reboot',
    /jest/,
  ],
  plugins: [
    external([
      'grommet',
      'react',
      'reactDom',
      'react-router-dom',
      'styled-components',
      /@babel\/runtime/,
    ]),
    json(),
    commonjs({
      include: /node_modules/,
    }),
    // nodePolyfills(),
    resolve({
      browser: true,
    }),
    typescript({
      tsconfigOverride: {
        exclude: ['**/*.spec.*'],
      },
    }),
    babel({
      babelrc: false,
      babelHelpers: 'runtime',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      exclude: [/node_modules/],
    }),
    del({ targets: pkg.directories.lib + '/*', runOnce: true }),
  ],
};
