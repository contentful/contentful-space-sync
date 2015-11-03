import test from 'tape'

import runSpaceSync from '../lib/run-space-sync'

test('Runs space sync', t => {
  t.plan(1)
  runSpaceSync()
  .then(response => {
    console.log(response)
    t.ok(response)
  }, err => {
    t.end(err)
  })
})
