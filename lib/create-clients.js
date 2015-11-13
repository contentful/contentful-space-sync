import * as contentful from 'contentful'
import * as contentfulManagement from 'contentful-management'

/**
 * Generates object with delivery and management clients for both
 * source and destination spaces, as well as the space ids being used
 */
export default function createClients (opts) {
  return {
    source: {
      spaceId: opts.sourceSpace,
      delivery: contentful.createClient({
        space: opts.sourceSpace,
        accessToken: opts.sourceDeliveryToken
      }),
      management: contentfulManagement.createClient({
        accessToken: opts.sourceManagementToken
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
