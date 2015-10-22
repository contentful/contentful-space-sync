import Promise from 'bluebird'
import log from 'npmlog'
import getEntityName from './get-entity-name'

export function publishEntities (space, type, entities) {
  return Promise.map(entities, entity => {
    return space[`publish${type}`](entity)
    .then(entity => {
      log.info(`Published ${entity.sys.type} ${getEntityName(entity)}`)
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
      if (err.name === 'BadRequest') return entity
      throw err
    })
  })
}
