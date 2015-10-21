import Promise from 'bluebird'
import log from 'npmlog'
import {find, filter, every, map} from 'lodash/collection'
import sortEntries from './sort-entries'

// Delay to account for delay after creating entities, due to internal database
// indexing
const PRE_PUBLISH_DELAY = 5000

/**
 * Pushes all updated content to the destination space
 */
export default function (responses, managementClient, spaceId) {
  const {source, destination} = responses

  return managementClient.getSpace(spaceId)
  .then(space => {
    return createEntitiesInSpace(space, source.contentTypes, destination.contentTypes, 'ContentType')
    .then(makeEntitiesPublisher(space, 'ContentType'))
    .then(makeEntitiesCreator(space, source.assets, destination.assets, 'Asset'))
    .delay(PRE_PUBLISH_DELAY)
    .then(makeAssetsProcessor(space))
    .then(makeAssetsChecker(space))
    .delay(PRE_PUBLISH_DELAY)
    .then(makeEntitiesPublisher(space, 'Asset'))
    .then(makeEntriesCreator(space, sortEntries(source.entries), destination.entries))
    .delay(PRE_PUBLISH_DELAY)
    .then(makeEntitiesPublisher(space, 'Entry'))
  })
}

function makeEntitiesCreator (...args) {
  return () => createEntitiesInSpace(...args)
}

function createEntitiesInSpace (space, entities, destinationEntities, type) {
  return Promise.map(entities, entity => {
    const updatedParams = prepareUpdateParams(entity.transformed, destinationEntities)
    return space[`${updatedParams.method}${type}`](updatedParams.entity)
    .then(makeCreationSuccessNotifier(updatedParams.method), err => {
      throw err
    })
  })
}

function makeEntriesCreator (space, entries, destinationEntries) {
  return function createEntriesInSpace () {
    return Promise.map(entries, entry => {
      let args = []
      const contentType = entry.original.sys.contentType
      const updatedParams = prepareUpdateParams(entry.transformed, destinationEntries)
      if (updatedParams.method === 'create') args.push(contentType)
      args.push(updatedParams.entity)
      return space[`${updatedParams.method}Entry`].apply(space, args)
      .then(makeCreationSuccessNotifier(updatedParams.method), err => {
        console.log('Failed creating entry', entry, err)
      })
    })
  }
}

function prepareUpdateParams (transformedEntity, destinationEntities) {
  const destinationEntity = find(
    destinationEntities, 'sys.id', transformedEntity.sys.id
  )
  let method
  if (destinationEntity) {
    method = 'update'
    transformedEntity.sys.version = destinationEntity.sys.version
  } else {
    method = 'create'
  }
  return {
    method: method,
    entity: transformedEntity
  }
}

function makeCreationSuccessNotifier (method) {
  return function entityCreationSuccess (createdEntity) {
    const verb = method[0].toUpperCase() + method.substr(1, method.length) + 'd'
    log.info(`${verb} ${createdEntity.sys.type} ${getEntityName(createdEntity)}`)
    return createdEntity
  }
}

function makeEntitiesPublisher (space, type) {
  return function publishEntities (entities) {
    return Promise.map(entities, entity => {
      return space[`publish${type}`](entity)
      .then(entity => {
        log.info(`Published ${entity.sys.type} ${getEntityName(entity)}`)
        return entity
      })
    })
  }
}

/**
 * Given a list of assets, initiates asset processing for each asset, on
 * each file attached to each locale
 */
function makeAssetsProcessor (space) {
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
function makeAssetsChecker (space) {
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

function getEntityName (entity) {
  return entity.name || entity.sys.id
}
