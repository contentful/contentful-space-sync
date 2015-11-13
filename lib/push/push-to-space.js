import Promise from 'bluebird'
import {partial} from 'lodash/function'
import * as creation from './creation'
import * as publishing from './publishing'
import * as assets from './assets'
import * as deletion from './deletion'

/**
 * Pushes all updated content to the destination space
 */
export default function (responses, managementClient, spaceId, prePublishDelay, contentModelOnly) {
  const {source, destination} = responses

  return managementClient.getSpace(spaceId)
  .then(space => {
    let result = Promise.resolve()
    if (!contentModelOnly) {
      result = result
      .then(partial(publishing.unpublishEntities,
        space, 'Entry', source.deletedEntries))
      .delay(prePublishDelay)
      .then(partial(deletion.deleteEntities,
        space, 'Entry', source.deletedEntries))

      .then(partial(publishing.unpublishEntities,
        space, 'Asset', source.deletedAssets))
      .delay(prePublishDelay)
      .then(partial(deletion.deleteEntities,
        space, 'Asset', source.deletedAssets))
    }

    result = result
    .then(partial(deletion.deleteEntities,
      space, 'Locale', source.deletedLocales))

    .then(partial(publishing.unpublishEntities,
      space, 'ContentType', source.deletedContentTypes))
    .delay(prePublishDelay)
    .then(partial(deletion.deleteEntities,
      space, 'ContentType', source.deletedContentTypes))

    .then(partial(creation.createEntities,
      space, 'Locale', source.locales, destination.locales))

    .then(partial(creation.createEntities,
      space, 'ContentType', source.contentTypes, destination.contentTypes))
    .delay(prePublishDelay)
    .then(partial(publishing.publishEntities,
      space, 'ContentType'))

    if (!contentModelOnly) {
      result = result
      .then(partial(creation.createEntities,
        space, 'Asset', source.assets, destination.assets))
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
    }

    return result
  })
}
