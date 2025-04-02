import react from '@vitejs/plugin-react';
import {
  UserConfig,
  defineConfig,
  loadEnv,
  splitVendorChunkPlugin,
} from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  let userConfig: UserConfig = {
    build: {
      emptyOutDir: true,
      sourcemap: true,
      outDir: './dist',
    },
    preview: {
      port: 3015,
    },
    plugins: [
      nodePolyfills({
        include: ['util'],
      }),
      react(),
      tsconfigPaths(),
      splitVendorChunkPlugin(),
      svgr(),
    ],
    define: {
      // By default, Vite doesn't include shims for NodeJS/
      // necessary for segment analytics lib to work
      global: {},
    },
  };

  /**
   * Setup for production:
   *  - CDN
   *  - output directory
   */
  if (mode === 'production') {
    userConfig = {
      ...userConfig,
      build: {
        ...userConfig.build,
        outDir: process.env.VITE_DIR_PROD as string,
      },
      base: process.env.VITE_CDN_REPLACE_KEYWORD as string,
      experimental: {
        renderBuiltUrl(
          filename: string,
          { hostType }: { hostType: 'js' | 'css' | 'html' },
        ) {
          if (hostType === 'js') {
            return {
              runtime: `window.__toCdnUrl(${JSON.stringify(filename)})`,
            };
          } else {
            return { relative: true };
          }
        },
      },
    };
  }

  /**
   * Setup proxy for dev environment
   */
  if (mode !== 'production') {
    userConfig = {
      ...userConfig,
      server: {
        port: 3000,
        cors: {
          preflightContinue: true,
        },
        proxy: {
          '/api': {
            target: process.env.VITE_BACKEND_API_BASE_URL as string,
          },
          '/account/api': {
            target: process.env.VITE_BACKEND_API_BASE_URL as string,
          },
          '/data/files/': {
            target: process.env.VITE_BACKEND_API_BASE_URL as string,
          },
          '/ws/': {
            target: process.env.VITE_BACKEND_WS_BASE_URL as string,
            ws: true,
          },
          '/xapi': {
            target: process.env.VITE_BACKEND_API_BASE_URL as string,
          },
        },
      },
    };
  }

  return userConfig;
});
