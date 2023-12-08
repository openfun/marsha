import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  let build = {
    emptyOutDir: true,
    sourcemap: true,
    outDir: './dist',
  };

  if (process.env.NODE_ENV === 'production') {
    build = {
      ...build,
      outDir: process.env.VITE_DIR_PROD as string,
    };
  }

  return {
    preview: {
      port: 3015,
    },
    plugins: [react(), tsconfigPaths(), splitVendorChunkPlugin()],
    server: {
      port: 3000,
    },
    define: {
      // By default, Vite doesn't include shims for NodeJS/
      // necessary for segment analytics lib to work
      global: {},
    },
    build,
  };
});
