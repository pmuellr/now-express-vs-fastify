'use strict'

// Enable the usage of fastify, but without a real server, instead
// getting back a standard http req/res handle to be used however.
// Eg, as a @now/node lambda.

module.exports = {
  getServer,
  getHttpRequestHandler
}

const EventEmitter = require('events')

const Fastify = require('fastify')

// returns an instance of a fastify Server, ready to have things attached
function getServer (options) {
  options = Object.assign({}, options, { serverFactory })
  return Fastify(options)
}

// association of a server instance and whether initialiation is done
const ServerInitDoneMap = new WeakMap()

// return a function that uses fastify setup, but takes standard req/res
function getHttpRequestHandler (fastify) {
  let { initDone } = ServerInitDoneMap.get(fastify) || {}

  // if we've not initialized at all, initialize
  if (initDone == null) {
    initDone = rPromise()
    ServerInitDoneMap.set(fastify, { initDone })

    fastify.listen(3000, err => {
      if (err != null) return initDone.reject(err)
      initDone.resolve()
    })
  }

  return async function requestHandler (req, res) {
    try {
      await initDone
    } catch (err) {
      console.log(`error initializing server: ${err.message}`)
      res.statusCode = 500
      res.end('server error')
      return
    }

    fastify.server.handler(req, res)
  }
}

// smells like an http server enough to fool fastify, saves the handler
class NowServer extends EventEmitter {
  constructor (handler) {
    super()
    this.handler = handler
  }

  listen (options, cb) {
    setImmediate(cb)
  }

  address () {
    return {
      port: 666,
      family: 'IPv4',
      address: '127.0.0.1'
    }
  }
}

// fastify server factory, just to catch the req/res handler
function serverFactory (handler, opts) {
  return new NowServer(handler, opts)
}

// return a promise that has resolve() and reject() methods
function rPromise () {
  let methods

  const promise = new Promise((resolve, reject) => {
    methods = { resolve, reject }
  })

  return Object.assign(promise, methods)
}
