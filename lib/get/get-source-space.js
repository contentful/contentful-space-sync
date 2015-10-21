import fs from 'fs'
import sortEntries from './sort-entries'

/**
 * Gets all existing content types, in source space, as well as entries and
 * assets created since last sync, or all of them if it's the first sync
 */
export default function (clients, nextSyncTokenFile, syncFromScratch) {
  return generateSyncConfig(nextSyncTokenFile, syncFromScratch)
  // get entries and assets
  .then(syncConfig => {
    return clients.source.delivery.sync(syncConfig)
    .then(
      response => ({
        entries: sortEntries(filterType(response.items, 'Entry')),
        assets: filterType(response.items, 'Asset'),
        deletedEntries: filterType(response.items, 'DeletedEntry'),
        deletedAssets: filterType(response.items, 'DeletedAsset'),
        nextSyncToken: response.nextSyncToken,
        isInitialSync: !!syncConfig.initial
      }),
      err => console.log('Failed to retrieve sync content', err)
    )
  })
  // get content types
  .then(response => {
    return clients.source.delivery.contentTypes()
    .then(contentTypes => {
      response.contentTypes = contentTypes
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
