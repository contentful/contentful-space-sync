import Promise from 'bluebird'
import log from 'npmlog'
import {partial} from 'lodash/function'
import {find} from 'lodash/collection'
import {get} from 'lodash/object'
import getEntityName from './get-entity-name'
import errorBuffer from '../error-buffer'

export function createEntities (space, entities, destinationEntities, type) {
  return Promise.map(entities, entity => {
    const updatedParams = prepareUpdateParams(entity.transformed, destinationEntities)
    return space[`${updatedParams.method}${type}`](updatedParams.entity)
    .then(
      partial(creationSuccessNotifier, updatedParams.method),
      partial(handleCreationErrors, entity)
    )
  })
}

function handleCreationErrors (entity, err) {
  if (get(err, 'error.sys.id') === 'ValidationFailed') {
    const errors = get(err, 'error.details.errors')
    if (errors && errors.length > 0 && errors[0].name === 'taken') {
      return entity
    }
  }
  if (get(err, 'error.sys.id') === 'VersionMismatch') {
    log.error('Content update error:')
    log.error('Error', err.error)
    log.error('Request', err.request)
    log.error(`
This probably means you are synchronizing over a space with previously existing
content, or that you don't have the sync token for the last sync you performed
to this space.
    `)
  }
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
      err.originalEntry = entry.original
      err.transformedEntry = entry.transformed
      errorBuffer.push(err)
      return entry
    })
  })
}

function prepareUpdateParams (transformedEntity, destinationEntities) {
  // Default value for getting a possible existing entity is null
  // because of find's weird behavior with undefineds and paths in objects
  const destinationEntity = find(
    destinationEntities, 'sys.id', get(transformedEntity, 'sys.id', null)
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
