import {pluck} from 'lodash/collection'
import Promise from 'bluebird'

const BATCH_CHAR_LIMIT = 1990

/**
 * Gets the content already existent on the destination space that needs
 * updating, based on the response retrieved from the source space
 */
export default function getOutdatedDestinationContent (managementClient, spaceId, sourceResponse) {
  const entryIds = pluck(sourceResponse.entries, 'sys.id')
  const assetIds = pluck(sourceResponse.assets, 'sys.id')

  return managementClient.getSpace(spaceId)
  .then(space => {
    return Promise.props({
      contentTypes: space.getContentTypes(),
      entries: batchedIdQuery(space, 'getEntries', entryIds),
      assets: batchedIdQuery(space, 'getAssets', assetIds),
      locales: space.getLocales()
    })
  })
}

function batchedIdQuery (space, method, ids) {
  return Promise.reduce(getIdBatches(ids), (fullResponse, batch) => {
    return space[method]({'sys.id[in]': batch})
    .then(response => {
      fullResponse = fullResponse.concat(response)
      return fullResponse
    })
  }, [])
}

function getIdBatches (ids) {
  const batches = []
  let currentBatch = ''
  while (ids.length > 0) {
    let id = ids.splice(0, 1)
    currentBatch += id
    if (currentBatch.length > BATCH_CHAR_LIMIT || ids.length === 0) {
      batches.push(currentBatch)
      currentBatch = ''
    } else {
      currentBatch += ','
    }
  }
  return batches
}
