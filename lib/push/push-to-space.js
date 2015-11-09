import {partial} from 'lodash/function'
import * as creation from './creation'
import * as publishing from './publishing'
import * as assets from './assets'
import * as deletion from './deletion'

/**
 * Pushes all updated content to the destination space
 */
export default function (responses, managementClient, spaceId, prePublishDelay) {
  const {source, destination} = responses

  return managementClient.getSpace(spaceId)
  .then(space => {
    return publishing.unpublishEntities(
      space, source.deletedEntries, 'Entry')
    .delay(prePublishDelay)
    .then(partial(deletion.deleteEntities,
      space, source.deletedEntries, 'Entry'))

    .then(partial(publishing.unpublishEntities,
      space, source.deletedAssets, 'Asset'))
    .delay(prePublishDelay)
    .then(partial(deletion.deleteEntities,
      space, source.deletedAssets, 'Asset'))

    .then(partial(deletion.deleteEntities,
      space, source.deletedLocales, 'Locale'))

    .then(partial(publishing.unpublishEntities,
      space, source.deletedContentTypes, 'ContentType'))
    .delay(prePublishDelay)
    .then(partial(deletion.deleteEntities,
      space, source.deletedContentTypes, 'ContentType'))

    .then(partial(creation.createEntities,
      space, source.locales, destination.locales, 'Locale'))

    .then(partial(creation.createEntities,
      space, source.contentTypes, destination.contentTypes, 'ContentType'))
    .delay(prePublishDelay)
    .then(partial(publishing.publishEntities,
      space, 'ContentType'))

    .then(partial(creation.createEntities,
      space, source.assets, destination.assets, 'Asset'))
    .delay(prePublishDelay)
    .then(partial(assets.processAssets,
      space))
    .then(partial(assets.checkAssets,
      space))
    .delay(prePublishDelay)
    .then(partial(publishing.publishEntities,
      space, 'Asset'))

    .then(partial(creation.createEntries,
      space, source.entries, destination.entries))
    .delay(prePublishDelay)
    .then(partial(publishing.publishEntities,
      space, 'Entry'))
  })
}
