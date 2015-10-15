import Promise from 'bluebird'
import log from 'npmlog'
import opts from './usage'
import * as contentfulManagement from 'contentful-management'

const client = contentfulManagement.createClient({accessToken: opts.destinationSpaceManagementToken})

// TODO confirmation and stuff probably
client.getSpace(opts.destinationSpace)
.then(space => {
  log.info(`Deleting all content from ${space.name}`)
  return deleteEntitiesOfType(space, 'Asset')
  .then(deleteEntitiesOfType(space, 'Entry'))
  .then(deleteEntitiesOfType(space, 'ContentType'))
  .catch(err => log.error('Failed because reasons', err))
})

function deleteEntitiesOfType (space, type) {
  return space[`get${pluralize(type)}`]()
  .then(entities => {
    return Promise.map(entities, entity => {
      return space[`unpublish${type}`](entity)
      .then(entity => {
        log.info(`Unpublished ${type} ${entity.sys.id}`)
        return entity
      }, () => {
        log.info(`No need to unpublish ${type} ${entity.sys.id}`)
        return entity
      })
    })
    .then(() => Promise.map(entities, entity => {
      return space[`delete${type}`](entity)
      .then(() => {
        log.info(`Deleted ${type} ${entity.sys.id}`)
        return entity
      }, (err) => {
        log.warn(`Couldn't delete ${type} ${entity.sys.id}`, err)
        return entity
      })
    }))
  })
}

function pluralize (type) {
  if (type === 'Entry') return 'Entries'
  else return type + 's'
}
