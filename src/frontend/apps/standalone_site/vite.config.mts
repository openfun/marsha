import react from '@vitejs/plugin-react';
import {
  UserConfig,
  defineConfig,
  loadEnv,
  splitVendorChunkPlugin,
} from 'vite';
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
    plugins: [react(), tsconfigPaths(), splitVendorChunkPlugin()],
    define: {
      // By default, Vite doesn't include shims for NodeJS/
      // necessary for segment analytics lib to work
      global: {},
    },
  };

  if (process.env.NODE_ENV === 'production') {
    userConfig = {
      ...userConfig,
      build: {
        ...userConfig.build,
        outDir: process.env.VITE_DIR_PROD as string,
      },
    };
  }

  if (process.env.NODE_ENV !== 'production') {
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
          '/data/videos/': {
            target: process.env.VITE_BACKEND_API_BASE_URL as string,
          },
          '/ws/': {
            target: process.env.VITE_BACKEND_WS_BASE_URL as string,
            ws: true,
          },
        },
      },
    };
  }

  return userConfig;
});
