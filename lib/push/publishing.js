import Promise from 'bluebird'
import log from 'npmlog'
import getEntityName from './get-entity-name'

export function makeEntitiesPublisher (space, type) {
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
export function makeEntitiesUnpublisher (space, entities, type) {
  return function unpublishEntities () {
    return Promise.map(entities, entity => {
      return space[`unpublish${type}`](entity)
      .then(entity => {
        log.info(`Unpublished ${entity.sys.type} ${getEntityName(entity)}`)
        return entity
      })
    })
  }
}
