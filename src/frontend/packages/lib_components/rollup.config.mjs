import { createRequire } from 'node:module';

import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import external from 'rollup-plugin-peer-deps-external';
import dts from 'rollup-plugin-dts';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

export default [
  {
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
        inlineDynamicImports: true,
      },
      {
        file: pkg.module,
        format: 'es',
        exports: 'named',
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    makeAbsoluteExternalsRelative: true,
    preserveEntrySignatures: 'strict',
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
  },
  {
    input: 'src/types/libs/converse/index.d.ts',
    output: [{ file: 'lib/types/libs/converse/index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
  {
    input: 'src/types/libs/JitsiMeetExternalAPI/index.d.ts',
    output: [
      { file: 'lib/types/libs/JitsiMeetExternalAPI/index.d.ts', format: 'es' },
    ],
    plugins: [dts()],
  },
];
