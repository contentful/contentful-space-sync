import log from 'npmlog'
import {pluck} from 'lodash/collection'
import getOutdatedDestinationContent from 'contentful-batch-libs/get/get-outdated-destination-content'

/**
 * Gets the response from the destination space with the content that needs
 * to be updated. If it's the initial sync, and content exists, we abort
 * and tell the user why.
 */
export default function getTransformedDestinationResponse ({
  managementClient,
  spaceId,
  sourceResponse,
  forceOverwrite,
  skipContentModel
}) {
  return getOutdatedDestinationContent({
    managementClient: managementClient,
    spaceId: spaceId,
    entryIds: pluck(sourceResponse.entries, 'sys.id'),
    assetIds: pluck(sourceResponse.assets, 'sys.id')
  })
  .then(destinationResponse => {
    if (skipContentModel) {
      destinationResponse.contentTypes = []
      destinationResponse.locales = []
    }

    if (sourceResponse.isInitialSync &&
      (destinationResponse.contentTypes.length > 0 || destinationResponse.assets.length > 0) &&
      !forceOverwrite
    ) {
      log.error(`Your destination space already has some content.
If this is a fresh sync, please clear the content before synchronizing, otherwise
conflicts can occur. If it's not a fresh sync, make sure you provide the tool
with a sync token for the last sync (see the README to understand how).

If you know what you're doing, you can use the parameter --force-overwrite
which will overwite any entities with the same ID on the destination space.

Be aware that any existing content types on the destination space that do not
exist on the source space with the same ID will be deleted on future syncs.

See the README file for a more thorough explanation of this.`)
      throw new Error('EXISTING_CONTENT')
    }
    return destinationResponse
  })
}
