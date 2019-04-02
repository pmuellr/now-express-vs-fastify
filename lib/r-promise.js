'use strict'

// creates Promises that have resolve() and reject() methods

module.exports = createRPromise

function createRPromise () {
  let methods

  const promise = new Promise((resolve, reject) => {
    methods = { resolve, reject }
  })

  return Object.assign(promise, methods)
}

if (require.main === module) main()

async function main () {
  console.log('waiting')
  const value = await delayResolve(1)
  console.log(`value: ${value}`)

  console.log('waiting')
  try {
    await delayReject(1)
  } catch (err) {
    console.log(`error: ${err}`)
  }
}

async function delayResolve (seconds) {
  const delayDone = createRPromise()

  setTimeout(() => delayDone.resolve(42), seconds * 1000)

  return delayDone
}

async function delayReject (seconds) {
  const delayDone = createRPromise()

  setTimeout(() => delayDone.reject(-1), seconds * 1000)

  return delayDone
}
