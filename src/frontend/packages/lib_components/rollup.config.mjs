import { createRequire } from 'node:module';

import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import fs from 'fs';
import path from 'path';
import del from 'rollup-plugin-delete';
import typescript from 'rollup-plugin-typescript2';
import external from 'rollup-plugin-peer-deps-external';
import dts from 'rollup-plugin-dts';
import { replaceTscAliasPaths } from 'tsc-alias';

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

/**
 * Append a string injection to a file.
 * This is used to append the typescript declaration files to the main types file.
 * @param {string} file
 * @param {string} injection
 */
const pluginModuleInjection = (file, injection) => ({
  name: 'module-injection',
  closeBundle() {
    fs.appendFile(path.join(process.cwd(), file), '\n' + injection, (err) => {
      if (err) throw err;
    });

    return null;
  },
});

export default [
  {
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
      /@babel\/runtime/,
      '@sentry/browser',
      'clipboard',
      'faker',
      'grommet',
      'grommet-icons',
      'grommet-styles',
      'jwt-decode',
      'react',
      'react-dom',
      'react-dropzone',
      'react-intl',
      'react-router',
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
        'react-dom',
        'react-intl',
        'react-router',
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
  },
  {
    input: 'src/types/libs/converse/index.d.ts',
    output: [
      { file: path.dirname(pkg.types) + '/converse.d.ts', format: 'es' },
    ],
    plugins: [
      dts({ compilerOptions: {
        baseUrl: tsconfig.compilerOptions.baseUrl
      }}),
      pluginModuleInjection(pkg.types, "export * from './converse'"),
    ],
  },
  {
    input: 'src/types/libs/JitsiMeetExternalAPI/index.d.ts',
    output: [
      {
        file: path.dirname(pkg.types) + '/JitsiMeetExternalAPI.d.ts',
        format: 'es',
      },
    ],
    plugins: [
      dts({ compilerOptions: {
        baseUrl: tsconfig.compilerOptions.baseUrl
      }}),
      pluginModuleInjection(
        pkg.types,
        "export * from './JitsiMeetExternalAPI'",
      ),
    ],
  },
];
