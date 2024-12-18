import { SignJWT } from 'jose'

// See seed.sql
// In real life you would of course authenticate the user however you like.
const userIDs = [
  '6z7dkeVLNm',
  'ycD76wW4R2',
  'IoQSaxeVO5',
  'WndZWmGkO4',
  'ENzoNm7g4E',
  'dLKecN3ntd',
  '7VoEoJWEwn',
  'enVvyDlBul',
  '9ogaDuDNFx',
]

function randomInt(max: number) {
  return Math.floor(Math.random() * max)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const jwtPayload = {
    sub: userIDs[randomInt(userIDs.length)],
    iat: Math.floor(Date.now() / 1000),
  }

  const jwt = await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30days')
    .sign(new TextEncoder().encode(must(config.zero.jwtSecret)))

  setCookie(event, 'jwt', jwt, {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  return 'ok'
})

function must<T>(val: T) {
  if (!val) {
    throw new Error('Expected value to be defined')
  }
  return val
}
