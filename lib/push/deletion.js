import Promise from 'bluebird'
import log from 'npmlog'
import getEntityName from './get-entity-name'

export function deleteEntities (space, type, entities) {
  return Promise.map(entities, entity => {
    return space[`delete${type}`](entity)
    .then(() => {
      log.info(`Deleted ${entity.sys.type} ${getEntityName(entity)}`)
      return entity
    })
  })
}
