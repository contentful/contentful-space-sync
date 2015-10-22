import Promise from 'bluebird'
import fs from 'fs'
Promise.promisifyAll(fs)
import log from 'npmlog'
import {find, filter} from 'lodash/collection'

import opts from './usage'

import createClients from './create-clients'
import getSourceSpace from './get/get-source-space'
import getDestinationContentForUpdate from './get/get-destination-content-for-update'
import transformSpace from './transform/transform-space'
import pushToSpace from './push/push-to-space'

const clients = createClients(opts)
const nextSyncTokenFile = process.cwd() + '/next-sync-token'

log.addLevel('show', 10000, {}, '>')

log.show(`Contentful Space Sync:
  Let\'s sync some content across spaces!

  Synchronizing content from ${opts.sourceSpace} to ${opts.destinationSpace}
  `)

// TODO ask the user when check is true

getSourceSpace(clients.source.delivery, nextSyncTokenFile, opts.fresh)

// Prepare object with both source and destination existing content
.then(sourceResponse => {
  return Promise.props({
    source: transformSpace(sourceResponse),
    destination: getUpdatedDestinationResponse(sourceResponse)
  })
})

// Get deleted content types
.then(responses => {
  responses.source.deletedContentTypes = filter(responses.destination.contentTypes, contentType => {
    return !find(responses.source.contentTypes, 'original.sys.id', contentType.sys.id)
  })
  return responses
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
  // TODO somehow store and retrieve nextSyncToken anyway in case of failure
  fs.writeFileSync(nextSyncTokenFile, nextSyncToken)
  log.info('Successfully sychronized the content and saved the sync token to:\n ', nextSyncTokenFile)
})

// Output any errors caught along the way
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
    return getDestinationContentForUpdate(
      clients.destination.management,
      clients.destination.spaceId,
      sourceResponse
    )
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
