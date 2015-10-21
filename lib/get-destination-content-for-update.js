import {pluck} from 'lodash/collection'
import Promise from 'bluebird'

/**
 * Gets the content already existent on the destination space that needs
 * updating, based on the response retrieved from the source space
 */
export default function getDestinationContentForUpdate (clients, sourceResponse) {
  const entryIds = pluck(sourceResponse.entries, 'sys.id')
  const assetIds = pluck(sourceResponse.assets, 'sys.id')

  return clients.destination.management.getSpace(clients.destination.spaceId)
  .then(space => {
    return Promise.props({
      contentTypes: space.getContentTypes(),
      entries: space.getEntries({'sys.id[in]': entryIds.join(',')}),
      assets: space.getAssets({'sys.id[in]': assetIds.join(',')})
    })
  })
}
