import Promise from 'bluebird'
import log from 'npmlog'
import fs from 'fs'
Promise.promisifyAll(fs)

import { find, filter } from 'lodash/collection'
import createClients from 'contentful-batch-libs/utils/create-clients'
import getSourceSpaceViaSync from 'contentful-batch-libs/get/get-source-space-via-sync'
import transformSpace from 'contentful-batch-libs/transform/transform-space'
import pushToSpace from 'contentful-batch-libs/push/push-to-space'

import dumpErrorBuffer from './dump-error-buffer'
import getTransformedDestinationResponse from './get-transformed-destination-response'

export default function runSpaceSync (usageParams) {
  const {optst} , errorLogFile} = usageParams
  opts.sourceManagementToken = opts.sourceManagementToken || opts.managementToken
  opts.destinationManagementToken = opts.destinationManagementToken || opts.managementToken
  const tokenDir = opts.syncTokenDir || process.cwd()
  opts.errorLogFile = tokenDir + '/contentful-space-sync-' + Date.now() + '.log'
  opts.syncTokenFile = tokenDir + '/contentful-space-sync-token-' + opts.sourceSpace + '-to-' + opts.destinationSpace

  if (opts.proxyHost && opts.proxyPort) {
    opts.proxy = {host: opts.proxyHost, port: opts.proxyPort}
  }
  const clients = createClients(opts)
  return getSourceSpaceViaSync({
    deliveryClient: clients.source.delivery,
    managementClient: clients.source.management,
    sourceSpaceId: clients.source.spaceId,
    nextSyncTokenFile: opts.syncTokenFile
  })

    // Prepare object with both source and destination existing content
    .then((sourceResponse) => {
      return Promise.props({
        source: sourceResponse,
        destination: getTransformedDestinationResponse({
          managementClient: clients.destination.management,
          spaceId: clients.destination.spaceId,
          sourceResponse: sourceResponse,
          skipLocales: opts.skipLocales,
          skipContentModel: opts.skipContentModel
        })
      })
    })
    .then((responses) => {
      return Promise.props({
        source: transformSpace(responses.source, responses.destination),
        destination: responses.destination
      })
    })

    // Get deleted content types
    .then((responses) => {
      responses.source.deletedContentTypes = filter(responses.destination.contentTypes, (contentType) => {
        return !find(responses.source.contentTypes, {original: {sys: {id: contentType.sys.id}}})
      })
      responses.source.deletedLocales = filter(responses.destination.locales, (locale) => {
        return !find(responses.source.locales, {original: {code: locale.code}})
      })
      return responses
    })

    // push source space content to destination space
    .then((responses) => {
      return pushToSpace({
        sourceContent: responses.source,
        destinationContent: responses.destination,
        managementClient: clients.destination.management,
        spaceId: clients.destination.spaceId,
        prePublishDelay: opts.prePublishDelay,
        contentModelOnly: opts.contentModelOnly,
        skipLocales: opts.skipLocales,
        skipContentModel: opts.skipContentModel
      })
        .then(() => {
          const nextSyncToken = responses.source.nextSyncToken
          if (!opts.contentModelOnly && nextSyncToken) {
            try {
              fs.writeFileSync(opts.syncTokenFile, nextSyncToken)
            } catch (e) {
              log.info('Cannot write synckToen to fileSystem, ', e)
            }
            log.info('Successfully sychronized the content and saved the sync token to:\n ', opts.syncTokenFile)
          } else {
            log.info('Successfully sychronized the content model')
          }
          dumpErrorBuffer({
            destinationSpace: opts.destinationSpace,
            sourceSpace: opts.sourceSpace,
            errorLogFile: opts.errorLogFile
          }, 'However, additional errors were found')

          return {
            nextSyncToken: nextSyncToken
          }
        })
    })

    // Output any errors caught along the way
    .catch((err) => {
      dumpErrorBuffer({
        destinationSpace: opts.destinationSpace,
        sourceSpace: opts.sourceSpace,
        errorLogFile: errorLogFile
      })
      throw err
    })
}
