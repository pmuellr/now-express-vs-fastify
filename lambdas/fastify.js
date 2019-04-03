'use strict'

const fastifyNS = require('../lib/fastify-ns')
const helmet = require('helmet')

const getProfilingMiddleware = require('../lib/profiling')

const fastify = fastifyNS.getServer()

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

module.exports = fastifyNS.getHttpRequestHandler(fastify)

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
