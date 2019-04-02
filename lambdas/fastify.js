'use strict'

const EventEmitter = require('events')

const Fastify = require('fastify')
const helmet = require('helmet')

const rPromise = require('../lib/r-promise')
const getProfilingMiddleware = require('../lib/profiling')

// this will be function fastify passes the factor as the req/res handler
let FastifyReqResHandler = null

// promise that resolves when the server is ready
const isReady = rPromise()

module.exports = async function handleRequest (req, res) {
  try {
    await isReady
  } catch (err) {
    res.statusCode = 500
    res.end('server error')
    return
  }

  FastifyReqResHandler(req, res)
}

class NowServer extends EventEmitter {
  listen (options, cb) {
    cb()
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
const serverFactory = (handler, opts) => {
  FastifyReqResHandler = handler

  return new NowServer()
}

// create a fastify instance with our server factory
const fastify = Fastify({ serverFactory, modifyCoreObjects: false })

// add the routes
addRoutes(fastify)

// get things started, need to wait for things?  prolly?
fastify.listen(3000, function (err, address) {
  if (err) {
    console.log(`error initializing server: ${err.message}`)
    isReady.reject(err)
  }

  isReady.resolve()
  console.log(`server initialized`)
})

// add the routes
function addRoutes (fastify) {
  fastify.use(getProfilingMiddleware())

  fastify.use(helmet())

  fastify.get('*', (request, reply) => {
    reply.type('text/html')
    reply.status(200)
    reply.send(`<h1>hello from ${__filename}</h1>`)
  })

  fastify.post('*', (request, reply) => {
    reply.type('application/json')
    reply.status(200)
    reply.send({ ok: true })
  })
}

if (require.main === module) {
  const http = require('http')
  const port = process.env.PORT || '3000'
  const server = http.createServer((req, res) => {
    module.exports(req, res)
  })
  server.listen(port, () => {
    console.log(`server listening on http://localhost:${port}`)
  })
}
