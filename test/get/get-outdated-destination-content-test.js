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

const destinationEntries = mockSourceResponse.entries.map(entry => {
  return { sys: { id: entry.sys.id, version: 1 } }
})

const destinationAssets = mockSourceResponse.assets.map(asset => {
  return { sys: { id: asset.sys.id, version: 1 } }
})

const mockSpace = {
  getContentTypes: sinon.stub().returns(Promise.resolve([])),
  getEntries: sinon.stub().returns(Promise.resolve(destinationEntries)),
  getAssets: sinon.stub().returns(Promise.resolve(destinationAssets)),
  getLocales: sinon.stub().returns(Promise.resolve([]))
}
mockSpace.getEntries.onFirstCall().returns(Promise.resolve(destinationEntries.slice(0, 1000)))
mockSpace.getEntries.onSecondCall().returns(Promise.resolve(destinationEntries.slice(1000, destinationEntries.length)))
mockSpace.getAssets.onFirstCall().returns(Promise.resolve(destinationAssets.slice(0, 1000)))
mockSpace.getAssets.onSecondCall().returns(Promise.resolve(destinationAssets.slice(1000, destinationAssets.length)))

const mockClient = {
  getSpace: sinon.stub().returns(Promise.resolve(mockSpace))
}

test('Gets destination content', t => {
  getOutdatedDestinationContent(mockClient, 'spaceid', mockSourceResponse)
  .then(response => {
    t.equals(mockSpace.getEntries.callCount, 2)
    t.equals(mockSpace.getAssets.callCount, 2)
    t.deepLooseEqual(response, {
      contentTypes: [],
      entries: destinationEntries,
      assets: destinationAssets,
      locales: []
    })
    t.end()
  })
})
