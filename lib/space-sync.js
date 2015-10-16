import Promise from 'bluebird'
import fs from 'fs'
Promise.promisifyAll(fs)
import log from 'npmlog'

import opts from './usage'

import retrieveSpace from './retrieve-space'
import transformSpace from './transform-space'
import pushToSpace from './push-to-space'

const nextSyncTokenFile = process.cwd() + '/next-sync-token'

log.addLevel('show', 10000, {}, '>')

log.show(`Contentful Space Sync:
  Let\'s sync some content across spaces!

  Synchronizing content from ${opts.sourceSpace} to ${opts.destinationSpace}
  `)

// handle error case
retrieveSpace({
  space: opts.sourceSpace,
  deliveryAccessToken: opts.sourceSpaceDeliveryToken,
  managementAccessToken: opts.sourceSpaceManagementToken,
  nextSyncTokenFile: nextSyncTokenFile,
  fresh: opts.fresh
})
.then(response => transformSpace(response))
/*
.then(response => {
  response.assets.forEach(asset => console.log(asset.fields.file))
  console.log('----------------------')
  return response
})
*/
.then(response => {
  return pushToSpace({
    response: response,
    space: opts.destinationSpace,
    accessToken: opts.destinationSpaceManagementToken
  })
  .then(() => response.nextSyncToken)
})
.then(nextSyncToken => {
  fs.writeFileSync(nextSyncTokenFile, nextSyncToken)
  log.info('Successfully sychronized the content and saved the sync token to', nextSyncTokenFile)
})
.catch(err => log.error('Failed with ', err))
