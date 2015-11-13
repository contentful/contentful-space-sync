import fs from 'fs'
import log from 'npmlog'
import sortEntries from './sort-entries'

/**
 * Gets all existing content types, in source space, as well as entries and
 * assets created since last sync, or all of them if it's the first sync
 */
export default function (deliveryClient, managementClient, sourceSpaceId, nextSyncTokenFile, syncFromScratch) {
  return generateSyncConfig(nextSyncTokenFile, syncFromScratch)
  // get entries and assets
  .then(syncConfig => {
    log.show('Getting content from source space')
    return deliveryClient.sync(syncConfig)
    .then(response => {
      return {
        entries: sortEntries(filterType(response.items, 'Entry')),
        assets: filterType(response.items, 'Asset'),
        deletedEntries: filterType(response.items, 'DeletedEntry'),
        deletedAssets: filterType(response.items, 'DeletedAsset'),
        nextSyncToken: response.nextSyncToken,
        isInitialSync: !!syncConfig.initial
      }
    })
  })
  // get content types
  .then(response => {
    return managementClient.getSpace(sourceSpaceId)
    .then(space => {
      return space.getContentTypes()
      .then(contentTypes => {
        response.contentTypes = contentTypes
        return response
      })
    })
  })
  // get locales
  .then(response => {
    return deliveryClient.space()
    .then(space => {
      response.locales = space.locales
      return response
    })
  })
}

function generateSyncConfig (nextSyncTokenFile, syncFromScratch) {
  return fs.readFileAsync(nextSyncTokenFile, 'utf-8')
  .then(nextSyncToken => {
    return nextSyncToken && !syncFromScratch
      ? { nextSyncToken: nextSyncToken }
      : { initial: true }
  }, () => ({ initial: true }))
}

function filterType (items, type) {
  return Array.filter(items, item => item.sys.type === type)
}
