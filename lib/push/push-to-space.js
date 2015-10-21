import * as creation from './creation'
import * as publishing from './publishing'
import * as assets from './assets'
import * as deletion from './deletion'

// Delay to account for delay after creating entities, due to internal database
// indexing
const PRE_PUBLISH_DELAY = 5000

/**
 * Pushes all updated content to the destination space
 */
export default function (responses, managementClient, spaceId) {
  const {source, destination} = responses

  return managementClient.getSpace(spaceId)
  .then(space => {
    return publishing.makeEntitiesUnpublisher(space, source.deletedEntries, 'Entry')()
    .delay(PRE_PUBLISH_DELAY)
    .then(deletion.makeEntitiesDeleter(space, source.deletedEntries, 'Entry'))
    .then(publishing.makeEntitiesUnpublisher(space, source.deletedAssets, 'Asset'))
    .delay(PRE_PUBLISH_DELAY)
    .then(deletion.makeEntitiesDeleter(space, source.deletedAssets, 'Asset'))
    .then(creation.makeEntitiesCreator(space, source.contentTypes, destination.contentTypes, 'ContentType'))
    .then(publishing.makeEntitiesPublisher(space, 'ContentType'))
    .then(creation.makeEntitiesCreator(space, source.assets, destination.assets, 'Asset'))
    .delay(PRE_PUBLISH_DELAY)
    .then(assets.makeAssetsProcessor(space))
    .then(assets.makeAssetsChecker(space))
    .delay(PRE_PUBLISH_DELAY)
    .then(publishing.makeEntitiesPublisher(space, 'Asset'))
    .then(creation.makeEntriesCreator(space, source.entries, destination.entries))
    .delay(PRE_PUBLISH_DELAY)
    .then(publishing.makeEntitiesPublisher(space, 'Entry'))
  })
}
