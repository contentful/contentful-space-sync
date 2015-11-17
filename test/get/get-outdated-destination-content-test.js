import test from 'tape'
import sinon from 'sinon'
import Promise from 'bluebird'
import {times} from 'lodash/utility'

import getOutdatedDestinationContent from '../../lib/get/get-outdated-destination-content'

const mockSourceResponse = {
  entries: [],
  assets: []
}

times(2000, n => mockSourceResponse.entries.push({sys: {id: `e${n}`, revision: 2}}))
times(2000, n => mockSourceResponse.assets.push({sys: {id: `a${n}`, revision: 2}}))

const mockSpace = {
  getContentTypes: sinon.stub().returns(Promise.resolve([])),
  getEntries: sinon.stub().returns(Promise.resolve([{}])),
  getAssets: sinon.stub().returns(Promise.resolve([{}])),
  getLocales: sinon.stub().returns(Promise.resolve([]))
}

const mockClient = {
  getSpace: sinon.stub().returns(Promise.resolve(mockSpace))
}

test('Gets destination content', t => {
  getOutdatedDestinationContent(mockClient, 'spaceid', mockSourceResponse)
  .then(response => {
    t.equals(mockSpace.getEntries.callCount, 6, 'getEntries is split into multiple calls')
    testQueryLength(t, 'getEntries')
    t.equals(mockSpace.getAssets.callCount, 6, 'getAssets is split into multiple calls')
    testQueryLength(t, 'getAssets')
    t.equals(response.entries.length, 6, 'number of entries matched (one per call)')
    t.equals(response.assets.length, 6, 'number of assets matched (one per call)')
    t.end()
  })
})

function testQueryLength (t, method) {
  const query = mockSpace[method].args[0][0]['sys.id[in]']
  const queryLength = query.length
  t.ok(
    queryLength < 2100,
    `${method} query length is under GET request length limit. Actual value: ${queryLength}`
  )
  t.notEqual(query[query.length - 1], ',', `${method} query last character is not a comma`)
}
