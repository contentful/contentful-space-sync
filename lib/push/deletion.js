import Promise from 'bluebird'
import log from 'npmlog'
import getEntityName from './get-entity-name'

export function makeEntitiesDeleter (space, entities, type) {
  return function deleteEntities () {
    return Promise.map(entities, entity => {
      return space[`delete${type}`](entity)
      .then(() => {
        log.info(`Deleted ${entity.sys.type} ${getEntityName(entity)}`)
        return entity
      })
    })
  }
}
