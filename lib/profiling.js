'use strict'

module.exports = getProfilingMiddleware

const URL = require('url')

const got = require('got')
const { startProfiling } = require('@no-pro/runtime')

let enabled = true

const { NO_PRO_KEY } = process.env

if (NO_PRO_KEY == null) {
  enabled = false
  console.log('NO_PRO_KEY env var not set; profiling disabled')
}

function noopMiddleware (req, res, next) { next() }

function getProfilingMiddleware () {
  if (!enabled) return noopMiddleware

  const profilingKey = NO_PRO_KEY

  return async (req, res, next) => {
    const reqProfilingKey = req.get('x-no-pro-profiling-key')
    if (reqProfilingKey == null) {
      console.log('x-no-pro-profiling-key header not used, profiling disabled')
      return next()
    }

    if (reqProfilingKey !== profilingKey) {
      console.log('x-no-pro-profiling-key value incorrect, profiling disabled')
      return next()
    }

    res.locals.putURL = req.get('x-no-pro-http-put')
    if (res.locals.putURL == null) {
      console.log('x-no-pro-http-put header not used, profiling disabled')
      return next()
    }

    const stopProfiling = await startProfiling()

    const resEnd = res.end
    res.end = async (...args) => {
      const profile = await stopProfiling()
      await writeProfile(req, res, profile)
      resEnd.call(res, ...args)
    }

    next()
  }
}

async function writeProfile (req, res, profile) {
  console.log('profile obtained')

  const name = getSuggestedFileName(req)

  const { putURL } = res.locals
  const fullURL = `${putURL}/${name}`
  const authURL = urlWithAuth(fullURL, {
    user: 'user',
    password: NO_PRO_KEY
  })

  console.log(`PUTing profile to url: ${fullURL}`)

  try {
    await got.put(authURL, {
      body: JSON.stringify(profile)
    })
  } catch (err) {
    console.log(`error writing profile ${name}: ${err.message}`)
    return
  }

  console.log(`PUT profile to url: ${fullURL}`)
}

function urlWithAuth (url, { user, password }) {
  const parsed = URL.parse(url)
  parsed.auth = `${user}:${password}`
  return parsed.format()
}

function getSuggestedFileName (req) {
  const method = req.method.toLowerCase()
  const date = new Date().toISOString()
    .substr(0, 23)
    .replace('T', '@')
    .replace(/:/g, '-')
    .replace('.', '-')

  const { pathname } = URL.parse(req.originalUrl)
  const urlPath = pathname
    .replace(/\//g, ' ')
    .trim()
    .replace(/ /g, '-')
    .padStart(1, '_')

  return `${date}.${method}.${urlPath}.cpuprofile`
}
