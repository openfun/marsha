import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import external from 'rollup-plugin-peer-deps-external';

import pkg from './package.json';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: 'es',
      exports: 'named',
      sourcemap: true,
    },
  ],
  external: [
    'grommet',
    'react',
    'reactDom',
    'react-router-dom',
    'styled-components',
    'styled-reboot',
    'lib-common',
    'lib-tests',
    'uuid',
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
      clean: true,
      useTsconfigDeclarationDir: true,
    }),
    babel({
      babelrc: false,
      babelHelpers: 'runtime',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      exclude: [/node_modules/],
    }),
  ],
};
