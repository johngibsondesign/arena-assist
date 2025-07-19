import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart(options) {
          if (options.startup) {
            options.startup();
          }
        },
        vite: {
          build: {
            sourcemap: true,
            minify: false,
            outDir: 'dist',
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs'
              }
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            sourcemap: 'inline',
            minify: false,
            outDir: 'dist',
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs'
              }
            }
          }
        }
      }
    ]),
    renderer()
  ],
  server: {
    host: 'localhost',
    port: 5173
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true
  },
  base: './'
}); 