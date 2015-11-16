import Promise from 'bluebird'
import log from 'npmlog'
import getEntityName from './get-entity-name'

export function deleteEntities (context, entities) {
  return Promise.map(entities, entity => {
    return context.space[`delete${context.type}`](entity)
    .then(() => {
      log.info(`Deleted ${entity.sys.type} ${getEntityName(entity)}`)
      return entity
    })
  })
}
