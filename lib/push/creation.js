import Promise from 'bluebird'
import log from 'npmlog'
import {partial} from 'lodash/function'
import {find} from 'lodash/collection'
import {get} from 'lodash/object'
import getEntityName from './get-entity-name'

export function createEntities (space, entities, destinationEntities, type) {
  return Promise.map(entities, entity => {
    const updatedParams = prepareUpdateParams(entity.transformed, destinationEntities)
    return space[`${updatedParams.method}${type}`](updatedParams.entity)
    .then(
      partial(creationSuccessNotifier, updatedParams.method),
      handleCreationErrors
    )
  })
}

function handleCreationErrors (err) {
  throw err
}

export function createEntries (space, entries, destinationEntries) {
  return Promise.map(entries, entry => {
    let args = []
    const contentType = entry.original.sys.contentType
    const updatedParams = prepareUpdateParams(entry.transformed, destinationEntries)
    if (updatedParams.method === 'create') args.push(contentType)
    args.push(updatedParams.entity)
    return space[`${updatedParams.method}Entry`].apply(space, args)
    .then(partial(creationSuccessNotifier, updatedParams.method), err => {
      console.log('Failed creating entry')
      console.log('Original entry\n', entry.original)
      console.log('Transformed entry\n', entry.transformed)
      console.log('Error\n', err)
    })
  })
}

function prepareUpdateParams (transformedEntity, destinationEntities) {
  const destinationEntity = find(
    destinationEntities, 'sys.id', get(transformedEntity, 'sys.id')
  )
  let method
  if (destinationEntity) {
    method = 'update'
    transformedEntity.sys.version = get(destinationEntity, 'sys.version')
  } else {
    method = 'create'
  }
  return {
    method: method,
    entity: transformedEntity
  }
}

function creationSuccessNotifier (method, createdEntity) {
  const verb = method[0].toUpperCase() + method.substr(1, method.length) + 'd'
  log.info(`${verb} ${createdEntity.sys.type} ${getEntityName(createdEntity)}`)
  return createdEntity
}
