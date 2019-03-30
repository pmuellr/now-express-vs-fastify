#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')

const ngrok = require('ngrok')
const express = require('express')

const NO_PRO_KEY = process.env.NO_PRO_KEY

if (process.env.NO_PRO_KEY == null) {
  console.log('env var NO_PRO_KEY not set')
  process.exit(1)
}

const tmpDir = 'tmp'
try {
  fs.mkdirSync(tmpDir)
} catch (err) {
  if (err.code !== 'EEXIST') {
    console.error(`error creating tmp dir: ${err.message}`)
    process.exit(1)
  }
}

console.log(`writing files to ${path.resolve(tmpDir)}`)

const app = express()

app.put('*', (req, res) => {
  const { password } = getUserPass(req)
  if (password !== NO_PRO_KEY) {
    console.log('request made with invalid password')
    return sendResponse(res, 403, { error: 'forbidden' })
  }

  const fileName = `${tmpDir}/${path.basename(req.path)}`
  console.log(`writing file ${fileName}`)
  console.log(`headers:`, req.headers)

  const oStream = fs.createWriteStream(fileName)
  req.pipe(oStream)

  oStream.once('close', () => {
    if (res == null) return

    console.log(`finished writing file ${fileName}`)
    sendResponse(res, 200, { ok: true })
    res = null
  })

  oStream.once('error', (err) => {
    if (res == null) return

    console.log(`error writing file ${fileName}: ${err.message}`)
    sendResponse(res, 500, { error: err.message })
    res = null
  })
})

app.all('*', (req, res) => {
  sendResponse(res, 400, { error: 'this is a PUT-only server' })
})

function sendResponse (res, status, object) {
  res.set('Content-Type', 'application/json')
  res.status(status).send(object)
}

function getUserPass (req) {
  // from:  https://stackoverflow.com/questions/23616371/basic-http-authentication-with-node-and-express-4
  const auth = req.headers.authorization || ''
  const b64auth = auth.split(' ')[1] || ''
  const [ user, password ] = Buffer.from(b64auth, 'base64').toString().split(':')

  return { user, password }
}

if (require.main === module) main()

async function main () {
  const port = process.env.PORT || '3000'
  app.listen(port, async () => {
    const remoteUrl = await ngrok.connect(port)

    console.log(`local  server listening on http://localhost:${port}`)
    console.log(`remote server listening on ${remoteUrl}`)
  })
}
