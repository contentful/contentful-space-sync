import * as contentful from 'contentful'
import * as contentfulManagement from 'contentful-management'

/**
 * Generates object with delivery and management clients for both
 * source and destination spaces, as well as the space ids being used
 */
export default function createClients (opts) {
  return {
    source: {
      delivery: contentful.createClient({
        space: opts.sourceSpace,
        accessToken: opts.sourceDeliveryToken
      })
    },
    destination: {
      spaceId: opts.destinationSpace,
      management: contentfulManagement.createClient({
        accessToken: opts.destinationManagementToken
      })
    }
  }
}
