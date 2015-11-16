import Promise from 'bluebird'
import {filter, any, map} from 'lodash/collection'
import {partial} from 'lodash/function'
import log from 'npmlog'
import getEntityName from './get-entity-name'

/**
 * Given a list of assets, initiates asset processing for each asset, on
 * each file attached to each locale
 */
export function processAssets (context, assets) {
  return Promise.map(assets, asset => {
    return Promise.all(map(asset.fields.file, (file, locale) => {
      return context.space.processAssetFile(asset, locale)
      .then(() => {
        log.info(`Started processing on Asset ${getEntityName(asset)} for ${locale}`)
        return asset
      })
    }))
    .then(() => asset, err => {
      log.warn('Error processing', asset.fields.file)
      throw err
    })
  })
}

/**
 * Given a list of assets, checks which assets have been processed, filters
 * out the ones that haven't and recursively calls the checkAssets method again
 * until all have been processed
 */
export function checkAssets (context, pendingAssets, allAssets = pendingAssets) {
  return Promise.map(pendingAssets, pendingAsset => {
    return context.space.getAsset(pendingAsset.sys.id)
    .then(partial(checkIfAssetHasProcessed, allAssets, pendingAsset))
  })
  // filters pending assets and if any exist, checks again
  .then(pendingAssets => {
    pendingAssets = filter(pendingAssets)
    return pendingAssets.length > 0
      ? checkAssets({space: context.space}, pendingAssets, allAssets)
      : allAssets
  })
}

/**
 * Checks if an asset has been processed and removes it from the initial
 * assets list
 */
function checkIfAssetHasProcessed (allAssets, pendingAsset, processedAsset) {
  const stillProcessing = any(processedAsset.fields.file, (file) => !file.url)
  if (!stillProcessing) {
    const index = allAssets.findIndex(asset => asset.sys.id === processedAsset.sys.id)
    allAssets.splice(index, 1, processedAsset)
  }
  return stillProcessing ? pendingAsset : null
}
