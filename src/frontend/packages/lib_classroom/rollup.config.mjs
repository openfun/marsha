import { createRequire } from 'node:module';

import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import path from 'path';
import del from 'rollup-plugin-delete';
import typescript from 'rollup-plugin-typescript2';
import external from 'rollup-plugin-peer-deps-external';
import { replaceTscAliasPaths } from 'tsc-alias';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const pluginImportAbsoluteToRelative = () => ({
  name: 'tsc-alias',
  closeBundle() {
    replaceTscAliasPaths({
      tsconfigPath: './tsconfig.json',
    });
  },
});

export default {
  input: 'src/index.ts',
  output: [
    {
      format: 'cjs',
      dir: path.dirname(pkg.main),
      exports: 'named',
      sourcemap: true,
      esModule: true,
      generatedCode: {
        reservedNamesAsProps: false,
      },
      interop: 'compat',
      systemNullSetters: false,
      inlineDynamicImports: true,
    },
    {
      format: 'es',
      dir: path.dirname(pkg.module),
      exports: 'named',
      preserveModules: true,
      preserveModulesRoot: 'src',
      sourcemap: true,
    },
  ],
  makeAbsoluteExternalsRelative: true,
  preserveEntrySignatures: 'strict',
  external: [
    'faker',
    'grommet',
    'react',
    'reactDom',
    'react-dropzone',
    'react-router-dom',
    'styled-components',
    'styled-reboot',
    'lib-common',
    'lib-components',
    'lib-tests',
    'uuid',
    /jest/,
    'zustand',
  ],
  plugins: [
    external([
      'grommet',
      'react',
      'reactDom',
      'react-router-dom',
      'styled-components',
      /@babel\/runtime/,
      'zustand',
    ]),
    json(),
    commonjs({
      include: /node_modules/,
    }),
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
    pluginImportAbsoluteToRelative(),
    del({ targets: pkg.directories.lib + '/*', runOnce: true }),
  ],
};
