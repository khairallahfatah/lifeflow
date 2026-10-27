import { defineConfig } from 'vite';

export default defineConfig({
  // Support relative paths so the app works on any domain or subdirectory
  base: './',

  server: {
    port: 8000,
    host: true,
    open: true
  },

  preview: {
    port: 4173,
    host: true,
    open: true
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    target: 'esnext',
    cssMinify: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Normalize path for Windows / POSIX consistency
          const normalized = id.replace(/\\/g, '/');

          // 1. Heavy Cryptography Engine (AES-GCM & PBKDF2)
          if (normalized.includes('/src/core/crypto.js')) {
            return 'core-crypto';
          }

          // 2. Arabic Natural Language Processing (NLP) Engine
          if (normalized.includes('/src/core/nlp-parser.js')) {
            return 'core-nlp';
          }

          // 3. Document Vault & Encrypted Storage Module
          if (normalized.includes('/src/modules/vault/')) {
            return 'module-vault';
          }

          // 4. Analytics, Insights & AI Advisor Engine
          if (normalized.includes('/src/modules/analytics/')) {
            return 'module-analytics';
          }

          // 5. Restored 15 Original Views & Legacy Engine
          if (normalized.includes('/src/legacy/')) {
            return 'core-legacy-views';
          }

          // 6. Vendor dependencies (if any external npm packages are used)
          if (normalized.includes('/node_modules/')) {
            return 'vendor';
          }
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },

  publicDir: 'public'
});
