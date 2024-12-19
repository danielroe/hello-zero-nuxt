// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/fonts'],
  devtools: { enabled: true },
  app: {
    head: {
      title: 'When??',
      htmlAttrs: { lang: 'en' },
    },
  },
  css: ['~/assets/index.css'],
  runtimeConfig: {
    zero: {
      jwtSecret: process.env.ZERO_JWT_SECRET || '',
    },
    public: {
      zero: {
        server: '',
      },
    },
  },
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2024-04-03',
  nitro: {
    typescript: {
      tsConfig: {
        compilerOptions: {
          skipLibCheck: true,
        },
        exclude: ['../app/**/*', '../nuxt.config.ts'],
      },
    },
  },
  vite: {
    optimizeDeps: {
      esbuildOptions: {
        target: 'es2022',
      },
      include: ['@rocicorp/zero'],
    },
  },
  eslint: {
    config: {
      stylistic: true,
    },
  },
})
