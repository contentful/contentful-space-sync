import * as contentful from 'contentful'
import * as contentfulManagement from 'contentful-management'

export default function createClients (opts) {
  return {
    source: {
      spaceId: opts.sourceSpace,
      delivery: contentful.createClient({
        space: opts.sourceSpace,
        accessToken: opts.sourceSpaceDeliveryToken
      }),
      management: contentfulManagement.createClient({
        accessToken: opts.sourceSpaceManagementToken
      })
    },
    destination: {
      spaceId: opts.destinationSpace,
      delivery: contentful.createClient({
        space: opts.destinationSpace,
        accessToken: opts.destinationSpaceDeliveryToken
      }),
      management: contentfulManagement.createClient({
        accessToken: opts.destinationSpaceManagementToken
      })
    }
  }
}
