import Promise from 'bluebird'
import log from 'npmlog'
import {find} from 'lodash/collection'
import getEntityName from './get-entity-name'

export function makeEntitiesCreator (space, entities, destinationEntities, type) {
  return function createEntitiesInSpace () {
    return Promise.map(entities, entity => {
      const updatedParams = prepareUpdateParams(entity.transformed, destinationEntities)
      return space[`${updatedParams.method}${type}`](updatedParams.entity)
      .then(makeCreationSuccessNotifier(updatedParams.method), err => {
        throw err
      })
    })
  }
}

export function makeEntriesCreator (space, entries, destinationEntries) {
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
