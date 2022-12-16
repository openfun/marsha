import { createRequire } from 'node:module';

import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import external from 'rollup-plugin-peer-deps-external';
import dts from 'rollup-plugin-dts';
import { replaceTscAliasPaths } from 'tsc-alias';
import copy from 'rollup-plugin-copy';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const tsconfig = require('./tsconfig.json');

const pluginImportAbsoluteToRelative = () => ({
  name: 'tsc-alias',
  closeBundle() {
    replaceTscAliasPaths({
      tsconfigPath: './tsconfig.json',
    });
  },
});

export default [
  {
    input: 'src/types/libs/converse/index.d.ts',
    output: [{ file: 'lib/declaration/converse.d.ts', format: 'es' }],
    plugins: [dts({ compilerOptions: tsconfig.compilerOptions })],
  },
  {
    input: 'src/types/libs/JitsiMeetExternalAPI/index.d.ts',
    output: [
      { file: 'lib/declaration/JitsiMeetExternalAPI.d.ts', format: 'es' },
    ],
    plugins: [dts()],
  },
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
      'react-dom',
      'react-router',
      'react-router-dom',
      'styled-components',
      'styled-reboot',
      'lib-common',
      'lib-tests',
      'uuid',
      /jest/,
      'zustand',
      'react-intl',
    ],
    plugins: [
      external([
        'grommet',
        'react',
        'react-dom',
        'react-router',
        'react-router-dom',
        'styled-components',
        /@babel\/runtime/,
        'zustand',
        'react-intl',
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
      pluginImportAbsoluteToRelative(),
      copy({
        targets: [
          {
            src: './root-declaration.txt',
            dest: './lib',
            rename: 'index.d.ts',
          },
        ],
      }),
    ],
  },
];
