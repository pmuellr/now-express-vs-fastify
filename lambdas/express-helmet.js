const express = require('express')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const getProfilingMiddleware = require('../lib/profiling')

const app = express()

app.use(getProfilingMiddleware())

app.use(helmet())

app.get('*', (req, res) => {
  res.set('Content-Type', 'text/html')
  res.status(200).send(`<h1>hello from ${__filename}</h1>`)
})

app.post('*', bodyParser.json(), (req, res) => {
  res.set('Content-Type', 'application/json')
  res.status(200).send({ ok: true })
})

module.exports = app

if (require.main === module) {
  const port = process.env.PORT || '3000'
  app.listen(port, () => {
    console.log(`server listening on http://localhost:${port}`)
  })
}
