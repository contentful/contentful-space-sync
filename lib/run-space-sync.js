import Promise from 'bluebird'
import log from 'npmlog'
import fs from 'fs'
Promise.promisifyAll(fs)

import {find, filter} from 'lodash/collection'
import {get} from 'lodash/object'

import getDestinationContentForUpdate from './get/get-destination-content-for-update'
import transformSpace from './transform/transform-space'
import getSourceSpace from './get/get-source-space'
import pushToSpace from './push/push-to-space'
import errorBuffer from './error-buffer'
import createClients from './create-clients'

export default function runSpaceSync (usage) {
  const {opts, syncTokenFile} = usage
  const clients = createClients(opts)
  return getSourceSpace(clients.source.delivery, syncTokenFile, opts.fresh)

  // Prepare object with both source and destination existing content
  .then(sourceResponse => {
    return Promise.props({
      source: sourceResponse,
      destination: getUpdatedDestinationResponse(
        clients.destination.management,
        clients.destination.spaceId,
        sourceResponse,
        opts.forceOverwrite
      )
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
      clients.destination.spaceId,
      opts.prePublishDelay
    )
    .then(() => {
      const nextSyncToken = responses.source.nextSyncToken
      fs.writeFileSync(syncTokenFile, nextSyncToken)
      log.show('Successfully sychronized the content and saved the sync token to:\n ', syncTokenFile)
      dumpAndWarnAboutErrorBuffer(usage, 'However, additional errors were found')
    })
  })

  // Output any errors caught along the way
  .catch(err => {
    dumpAndWarnAboutErrorBuffer(usage)
    throw err
  })
}

function dumpAndWarnAboutErrorBuffer (usage, message = 'Additional errors were found') {
  const {opts, errorLogFile} = usage
  const loggedErrors = errorBuffer.drain()
  if (loggedErrors.length > 0) {
    const errors = loggedErrors.reduce((errors, err, idx) => {
      return errors +
        `Error ${idx + 1}:\n` +
        'in ' + parseEntityUrl(opts.destinationSpace, opts.sourceSpace, get(err, 'request.uri')) + '\n' +
        JSON.stringify(err, null, '  ') +
        '\n\n'
    }, '')
    fs.writeFileSync(errorLogFile, errors)
    log.warn(message)
    log.warn(`Check ${errorLogFile} for details.`)
  }
}

function parseEntityUrl (destinationSpace, sourceSpace, url) {
  return url.replace(/api.contentful/, 'app.contentful')
            .replace(/:443/, '')
            .replace(destinationSpace, sourceSpace)
            .split('/').splice(0, 7).join('/')
}

/**
 * Gets the response from the destination space with the content that needs
 * to be updated. If it's the initial sync, and content exists, we abort
 * and tell the user why.
 */
function getUpdatedDestinationResponse (managementClient, spaceId, sourceResponse, forceOverwrite) {
  return getDestinationContentForUpdate(managementClient, spaceId, sourceResponse)
  .then(destinationResponse => {
    if (sourceResponse.isInitialSync &&
      (destinationResponse.contentTypes.length > 0 || destinationResponse.assets.length > 0) &&
      !forceOverwrite
    ) {
      log.error(`Your destination space already has some content.
If this is a fresh sync, please clear the content before synchronizing, otherwise
conflicts can occur. If it's not a fresh sync, make sure you provide the tool
with a sync token for the last sync (see the README to understand how).

If you know what you're doing, you can use the parameter --force-overwrite
which will overwite any entities with the same ID on the destination space.

Be aware that any existing content types on the destination space that do not
exist on the source space with the same ID will be deleted on future syncs.

See the README file for a more thorough explanation of this.`)
      return new Error('EXISTING_CONTENT')
    }
    return destinationResponse
  })
}
