import Promise from 'bluebird'
import log from 'npmlog'
import {some, filter, every, map} from 'lodash/collection'
import * as _o from 'lodash/object'
import {flatten} from 'lodash/array'
import mergeSort from './merge-sort'
import * as contentfulManagement from 'contentful-management'

export default function ({ response, space, accessToken }) {
  const client = contentfulManagement.createClient({accessToken: accessToken})
  const {contentTypes, assets} = response
  const entries = sortEntries(response.entries)

  return client.getSpace(space)
  .then(space => {
    return createEntitiesInSpace(space, contentTypes, 'ContentType')
    .then(makeEntitiesPublisher(space, 'ContentType'))
    .then(makeEntitiesCreator(space, assets, 'Asset'))
    .delay(2000)
    .then(makeAssetsProcessor(space))
    .then(makeAssetsChecker(space))
    .delay(2000)
    .then(makeEntitiesPublisher(space, 'Asset'))
    .then(makeEntriesCreator(space, entries))
    .delay(2000)
    .then(makeEntitiesPublisher(space, 'Entry'))
  })
}

function makeEntitiesCreator (...args) {
  return () => createEntitiesInSpace(...args)
}

function createEntitiesInSpace (space, entities, type) {
  return Promise.map(entities, entity => {
    return space[`create${type}`](entity)
    .then(entityCreationSuccess)
  })
}

function makeEntriesCreator (space, entries) {
  return function createEntriesInSpace () {
    return Promise.map(entries, entry => {
      return space.createEntry(entry.contentType, entry.data)
      .then(entityCreationSuccess, err => {
        console.log('Failed creating entry', entry, err)
      })
    })
  }
}

function entityCreationSuccess (createdEntity) {
  log.info(`Created ${createdEntity.sys.type} ${getEntityName(createdEntity)}`)
  return createdEntity
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

function makeAssetsChecker (space) {
  return function checkAssets (pendingAssets, assets = pendingAssets) {
    return Promise.map(pendingAssets, asset => {
      return space.getAsset(asset.sys.id)
      .then(pendingAsset => {
        const stillProcessing = every(pendingAsset.fields.file, (file) => !file.url)
        if (!stillProcessing) {
          const index = assets.findIndex(asset => asset.sys.id === pendingAsset.sys.id)
          assets.splice(index, 1, pendingAsset)
        }
        return stillProcessing ? asset : null
      })
    })
    .then(pendingAssets => {
      pendingAssets = filter(pendingAssets)
      return pendingAssets.length > 0
        ? checkAssets(pendingAssets, assets)
        : assets
    })
  }
}

function getEntityName (entity) {
  return entity.name || entity.sys.id
}

function sortEntries (entries) {
  const linkedEntries = getLinkedEntries(entries)

  const mergedLinkedEntries = mergeSort(linkedEntries, a => {
    var hli = hasLinkedIndexesInFront(a)
    if (hli) return -1
    if (!hli) return 1
    if (!hasLinkedIndexes(a)) return -1
  })

  return map(mergedLinkedEntries, linkInfo => entries[linkInfo.index])

  function hasLinkedIndexesInFront (item) {
    if (hasLinkedIndexes(item)) {
      return some(item.linkIndexes, index => index > item.index)
    }
  }

  function hasLinkedIndexes (item) {
    return item.linkIndexes.length > 0
  }
}

function getLinkedEntries (entries) {
  return map(entries, function (entry) {
    const entryIndex = entries.indexOf(entry)

    const rawLinks = map(entry.fields, field => {
      field = _o.values(field)[0]
      if (isEntryLink(field)) {
        return getFieldEntriesIndex(field, entries)
      } else if (isEntityArray(field) && isEntryLink(field[0])) {
        return map(field, item => getFieldEntriesIndex(item, entries))
      }
    })

    return {
      index: entryIndex,
      linkIndexes: filter(flatten(rawLinks), index => index >= 0)
    }
  })
}

function getFieldEntriesIndex (field, entries) {
  const id = _o.get(field, 'sys.id')
  return entries.findIndex(entry => entry.sys.id === id)
}

function isEntryLink (item) {
  return _o.get(item, 'sys.type') === 'Entry' ||
         _o.get(item, 'sys.linkType') === 'Entry'
}

function isEntityArray (item) {
  return Array.isArray(item) && item.length > 0 && _o.exists(item[0], 'sys')
}
