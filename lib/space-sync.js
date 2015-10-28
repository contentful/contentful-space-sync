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
const tokenDir = opts.tokenDir || process.cwd()
const nextSyncTokenFile = tokenDir + `/next-sync-token-${opts.sourceSpace}-to-${opts.destinationSpace}`

log.addLevel('show', 10000, {}, '>')

log.show(`Contentful Space Sync:
Let\'s sync some content across spaces!
`)

prepareBootupMessage()
.then(() => {
  log.show(`Synchronizing content from ${opts.sourceSpace} to ${opts.destinationSpace}
  with existing token from ${nextSyncTokenFile}
  `)
}, () => {
  log.show(`No previous sync token found or fresh sync requested.
  Synchronizing fresh content from ${opts.sourceSpace} to ${opts.destinationSpace}
  `)
})
.delay(3000)
.then(startSpaceSync)

function prepareBootupMessage () {
  return opts.fresh
  ? Promise.reject('fresh')
  : fs.statAsync(nextSyncTokenFile)
}

function startSpaceSync () {
  getSourceSpace(clients.source.delivery, nextSyncTokenFile, opts.fresh)

  // Prepare object with both source and destination existing content
  .then(sourceResponse => {
    return Promise.props({
      source: sourceResponse,
      destination: getUpdatedDestinationResponse(sourceResponse)
    })
  })
  .then(responses => {
    return Promise.props({
      source: transformSpace(responses.source, responses.destination),
      destination: responses.destination
    })
  })

  // Get deleted content types
  .then(responses => {
    responses.source.deletedContentTypes = filter(responses.destination.contentTypes, contentType => {
      return !find(responses.source.contentTypes, 'original.sys.id', contentType.sys.id)
    })
    responses.source.deletedLocales = filter(responses.destination.locales, locale => {
      return !find(responses.source.locales, 'original.code', locale.code)
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
    .then(() => {
      const nextSyncToken = responses.source.nextSyncToken
      fs.writeFileSync(nextSyncTokenFile, nextSyncToken)
      log.info('Successfully sychronized the content and saved the sync token to:\n ', nextSyncTokenFile)
    })
  })

  // Output any errors caught along the way
  .catch(err => {
    log.error('Failed with\n', err)
    process.exit(1)
  })
}

/**
 * Gets the response from the destination space with the content that needs
 * to be updated. If it's the initial sync, and content exists, we abort
 * and tell the user why.
 */
function getUpdatedDestinationResponse (sourceResponse) {
  return getDestinationContentForUpdate(
    clients.destination.management,
    clients.destination.spaceId,
    sourceResponse
  )
  .then(destinationResponse => {
    if (sourceResponse.isInitialSync &&
      (destinationResponse.contentTypes.length > 0 || destinationResponse.assets.length > 0)
    ) {
      log.error(`Your destination space already has some content.
If this is a fresh sync, please clear the content before synchronizing, otherwise
conflicts can occur. If it's not a fresh sync, make sure you provide the tool
with a sync token for the last sync (see the README to understand how).`)
      process.exit(1)
    }
    return destinationResponse
  })
}
