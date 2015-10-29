import Promise from 'bluebird'
import log from 'npmlog'
import getEntityName from './get-entity-name'
import errorBuffer from '../error-buffer'

export function publishEntities (space, type, entities) {
  return Promise.map(entities, entity => {
    return space[`publish${type}`](entity)
    .then(entity => {
      log.info(`Published ${entity.sys.type} ${getEntityName(entity)}`)
      return entity
    }, err => {
      errorBuffer.push(err)
      return entity
    })
  })
}

export function unpublishEntities (space, entities, type) {
  return Promise.map(entities, entity => {
    return space[`unpublish${type}`](entity)
    .then(entity => {
      log.info(`Unpublished ${entity.sys.type} ${getEntityName(entity)}`)
      return entity
    }, err => {
      // In case the entry has already been unpublished
      if (err.name === 'BadRequest') return entity
      throw err
    })
  })
}
