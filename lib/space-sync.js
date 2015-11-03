import Promise from 'bluebird'
import fs from 'fs'
Promise.promisifyAll(fs)
import log from 'npmlog'

import {opts, syncToken} from './usage'
import runSpaceSync from './run-space-sync'

log.addLevel('show', 10000, {}, '>')

log.show(`Contentful Space Sync:
Let\'s sync some content across spaces!
`)

prepareBootupMessage()
.then(() => {
  log.show(`Synchronizing content from ${opts.sourceSpace} to ${opts.destinationSpace}
  with existing token from ${syncToken.filePath}
  `)
}, () => {
  log.show(`No previous sync token found or fresh sync requested.
  Synchronizing fresh content from ${opts.sourceSpace} to ${opts.destinationSpace}
  `)
})
.delay(3000)
.then(runSpaceSync)

function prepareBootupMessage () {
  return opts.fresh
  ? Promise.reject('fresh')
  : fs.statAsync(syncToken.filePath)
}
