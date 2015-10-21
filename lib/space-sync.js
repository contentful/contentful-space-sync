import Promise from 'bluebird'
import fs from 'fs'
Promise.promisifyAll(fs)
import log from 'npmlog'

import opts from './usage'

import createClients from './create-clients'
import getSourceSpace from './get-source-space'
import getDestinationContentForUpdate from './get-destination-content-for-update'
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
// Prepare object with both source and destination existing content
.then(sourceResponse => {
  return Promise.props({
    source: transformSpace(sourceResponse),
    destination: getUpdatedDestinationResponse(sourceResponse)
  })
})
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

/**
 * Gets the response from the destination space with the content that needs
 * to be updated. If it's the initial sync, where no content will need
 * to be updated the response is empty.
 */
function getUpdatedDestinationResponse (sourceResponse) {
  if (sourceResponse.isInitialSync) {
    return Promise.resolve({})
  } else {
    return getDestinationContentForUpdate(clients, sourceResponse)
  }
}

function logAndExit (response) {
  console.log(response)
  process.exit(0)
  // return response
}

function logEachEntity (responses) {
  responses.source.entries.forEach(entity => console.log(entity))
  process.exit(0)
  // console.log('----------------------')
  // return response
}
