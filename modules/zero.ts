import { addImports, createResolver, defineNuxtModule } from 'nuxt/kit'

/** This aims to split out the Nuxt/Vue integration into a clear separation from the demo app. */
export default defineNuxtModule({
  meta: {
    name: 'zero',
  },
  setup() {
    const resolver = createResolver(import.meta.url)

    addImports({
      name: 'useQuery',
      from: resolver.resolve('./runtime/zero-vue/query'),
    })
  },
})
