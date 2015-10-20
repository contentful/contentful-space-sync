import Promise from 'bluebird'
import fs from 'fs'
Promise.promisifyAll(fs)
import log from 'npmlog'

import opts from './usage'

import createClients from './create-clients'
import getSourceSpace from './get-source-space'
import getDestinationSpace from './get-destination-space'
import transformSpace from './transform-space'
import pushToSpace from './push-to-space'

const clients = createClients(opts)
const nextSyncTokenFile = process.cwd() + '/next-sync-token'

log.addLevel('show', 10000, {}, '>')

log.show(`Contentful Space Sync:
  Let\'s sync some content across spaces!

  Synchronizing content from ${opts.sourceSpace} to ${opts.destinationSpace}
  `)

getSourceSpace(clients, nextSyncTokenFile, opts.fresh)
.then(response => transformSpace(response))
.then(response => {
  return { source: response }
})
/*
.then(responses => {
  return getDestinationSpace(clients)
  .then(response => {
    responses.destination = response
    return responses
  })
})
*/
// push source space content to destination space
.then(responses => {
  return pushToSpace(
    responses,
    clients.destination.management,
    clients.destination.spaceId
  )
  .then(() => responses.source.nextSyncToken)
})
// store the sync token from the source space
.then(nextSyncToken => {
  fs.writeFileSync(nextSyncTokenFile, nextSyncToken)
  log.info('Successfully sychronized the content and saved the sync token to', nextSyncTokenFile)
})
.catch(err => log.error('Failed with ', err))

function logAndExit (response) {
  console.log(response)
  process.exit(0)
  return response
}

function logEachEntity (response) {
  response.assets.forEach(asset => console.log(asset.fields.file))
  console.log('----------------------')
  return response
}
