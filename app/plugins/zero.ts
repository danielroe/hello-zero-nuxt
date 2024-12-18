import { Zero } from '@rocicorp/zero'
import { decodeJwt } from 'jose'

import { schema } from '../db/schema'

export default defineNuxtPlugin(() => {
  const encodedJWT = useCookie('jwt')
  const decodedJWT = encodedJWT.value && decodeJwt(encodedJWT.value)
  const userID = decodedJWT?.sub ? (decodedJWT.sub as string) : 'anon'

  const config = useRuntimeConfig()

  const z = new Zero({
    userID,
    auth: () => encodedJWT.value || undefined,
    server: config.public.zero.server,
    schema,
    // This is often easier to develop with if you're frequently changing
    // the schema. Switch to 'idb' for local-persistence.
    kvStore: 'mem',
  })

  return {
    provide: {
      z,
    },
  }
})
