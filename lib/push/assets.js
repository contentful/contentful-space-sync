import Promise from 'bluebird'
import {filter, every, map} from 'lodash/collection'
import log from 'npmlog'
import getEntityName from './get-entity-name'

/**
 * Given a list of assets, initiates asset processing for each asset, on
 * each file attached to each locale
 */
export function makeAssetsProcessor (space) {
  return function processAssets (assets) {
    return Promise.map(assets, asset => {
      return Promise.all(map(asset.fields.file, (file, locale) => {
        return space.processAssetFile(asset, locale)
        .then(() => {
          log.info(`Started processing on Asset ${getEntityName(asset)} for ${locale}`)
          return asset
        })
      }))
      .then(
        () => asset,
        err => {
          console.log(asset.fields.file)
          throw err
        }
      )
    })
  }
}

/**
 * Given a list of assets, checks which assets have been processed, filters
 * out the ones that haven't and recursively calls the checkAssets method again
 * until all have been processed
 */
export function makeAssetsChecker (space) {
  return function checkAssets (pendingAssets, assets = pendingAssets) {
    return Promise.map(pendingAssets, asset => {
      return space.getAsset(asset.sys.id)
      .then(checkIfAssetHasProcessed(assets, asset))
    })
    // filters pending assets and if any exist, checks again
    .then(pendingAssets => {
      pendingAssets = filter(pendingAssets)
      return pendingAssets.length > 0
        ? checkAssets(pendingAssets, assets)
        : assets
    })
  }

  /**
   * Checks if an asset has been processed and removes it from the initial
   * assets list
   */
  function checkIfAssetHasProcessed (assets, asset) {
    return function (pendingAsset) {
      const stillProcessing = every(pendingAsset.fields.file, (file) => !file.url)
      if (!stillProcessing) {
        const index = assets.findIndex(asset => asset.sys.id === pendingAsset.sys.id)
        assets.splice(index, 1, pendingAsset)
      }
      return stillProcessing ? asset : null
    }
  }
}
