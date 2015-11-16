import Promise from 'bluebird'
import {partial} from 'lodash/function'
import * as creation from './creation'
import * as publishing from './publishing'
import * as assets from './assets'
import * as deletion from './deletion'

/**
 * Pushes all updated content to the destination space
 * Options:
 * - prePublishDelay: milliseconds wait before publishing
 * - contentModelOnly: synchronizes only content types and locales
 * - skipContentModel: synchronizes only entries and assets
 */
export default function (responses, managementClient, spaceId, opts) {
  const {source, destination} = responses

  if (opts.contentModelOnly && opts.skipContentModel) {
    throw new Error('contentModelOnly and skipContentModel cannot be used together')
  }

  return managementClient.getSpace(spaceId)
  .then(space => {
    let result = Promise.resolve()
    if (!opts.contentModelOnly) {
      result = result
      .then(partial(publishing.unpublishEntities,
        {space: space, type: 'Entry'}, source.deletedEntries))
      .delay(opts.prePublishDelay)
      .then(partial(deletion.deleteEntities,
        {space: space, type: 'Entry'}, source.deletedEntries))

      .then(partial(publishing.unpublishEntities,
        {space: space, type: 'Asset'}, source.deletedAssets))
      .delay(opts.prePublishDelay)
      .then(partial(deletion.deleteEntities,
        {space: space, type: 'Asset'}, source.deletedAssets))
    }

    if (!opts.skipContentModel) {
      result = result
      .then(partial(deletion.deleteEntities,
        {space: space, type: 'Locale'}, source.deletedLocales))

      .then(partial(publishing.unpublishEntities,
        {space: space, type: 'ContentType'}, source.deletedContentTypes))
      .delay(opts.prePublishDelay)
      .then(partial(deletion.deleteEntities,
        {space: space, type: 'ContentType'}, source.deletedContentTypes))

      .then(partial(creation.createEntities,
        {space: space, type: 'Locale'}, source.locales, destination.locales))

      .then(partial(creation.createEntities,
        {space: space, type: 'ContentType'}, source.contentTypes, destination.contentTypes))
      .delay(opts.prePublishDelay)
      .then(partial(publishing.publishEntities,
        {space: space, type: 'ContentType'}))
    }

    if (!opts.contentModelOnly) {
      result = result
      .then(partial(creation.createEntities,
        {space: space, type: 'Asset'}, source.assets, destination.assets))
      .delay(opts.prePublishDelay)
      .then(partial(assets.processAssets,
        {space: space}))
      .then(partial(assets.checkAssets,
        {space: space}))
      .delay(opts.prePublishDelay)
      .then(partial(publishing.publishEntities,
        {space: space, type: 'Asset'}))

      .then(partial(creation.createEntries,
        {space: space, skipContentModel: opts.skipContentModel}, source.entries, destination.entries))
      .delay(opts.prePublishDelay)
      .then(partial(publishing.publishEntities,
        {space: space, type: 'Entry'}))
    }

    return result
  })
}
