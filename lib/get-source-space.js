import fs from 'fs'
import getContentTypes from './get-content-types'

export default function (clients, nextSyncTokenFile, syncFromScratch) {
  return getSyncConfig(nextSyncTokenFile, syncFromScratch)
  // get entries and assets
  .then(syncConfig => {
    return clients.source.delivery.sync(syncConfig)
    .then(
      response => ({
        entries: filterType(response.items, 'Entry'),
        assets: filterType(response.items, 'Asset'),
        nextSyncToken: response.nextSyncToken
      }),
      err => console.log('Failed to retrieve sync content', err)
    )
  })
  // get content types
  .then(response => {
    return getContentTypes(clients.source.management, clients.source.spaceId)
    .then(contentTypes => {
      response.contentTypes = contentTypes
      return response
    })
  })
}

function getSyncConfig (nextSyncTokenFile, syncFromScratch) {
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
