import test from 'blue-tape'
import sinon from 'sinon'
import Promise from 'bluebird'

import getSourceSpace from '../../lib/get/get-source-space'

const fsMock = {
  readFileAsync: sinon.stub()
}
getSourceSpace.__Rewire__('fs', fsMock)

const deliveryClientMock = {
  sync: sinon.stub().returns(Promise.resolve({
    items: [
      {sys: {type: 'Entry'}},
      {sys: {type: 'Asset'}},
      {sys: {type: 'DeletedEntry'}},
      {sys: {type: 'DeletedAsset'}}
    ],
    nextSyncToken: 'token'
  })),
  contentTypes: sinon.stub().returns(Promise.resolve([
    {sys: {type: 'ContentType'}}
  ])),
  space: sinon.stub().returns(Promise.resolve({
    locales: ['en-US']
  }))
}

const preparedResponse = {
  entries: [{sys: {type: 'Entry'}}],
  assets: [{sys: {type: 'Asset'}}],
  deletedEntries: [{sys: {type: 'DeletedEntry'}}],
  deletedAssets: [{sys: {type: 'DeletedAsset'}}],
  contentTypes: [{sys: {type: 'ContentType'}}],
  locales: ['en-US'],
  nextSyncToken: 'token',
  isInitialSync: false
}

test('Get source space with no file token', t => {
  fsMock.readFileAsync.returns(Promise.reject('file not found'))
  return getSourceSpace(deliveryClientMock)
  .then(response => {
    const newResponse = Object.assign({}, preparedResponse)
    newResponse.isInitialSync = true
    t.deepLooseEqual(response, newResponse)
  })
})

test('Get source space with file token', t => {
  fsMock.readFileAsync.withArgs('tokenfile').returns(Promise.resolve('newtoken'))
  return getSourceSpace(deliveryClientMock, 'tokenfile')
  .then(response => {
    t.equals(deliveryClientMock.sync.secondCall.args[0].nextSyncToken, 'newtoken', 'syncs with provided token')
    t.deepLooseEqual(response, Object.assign({}, preparedResponse))
  })
})

test('Get source space with forced sync from scratch', t => {
  fsMock.readFileAsync.withArgs('tokenfile').returns(Promise.resolve('newtoken'))
  return getSourceSpace(deliveryClientMock, 'tokenfile', true)
  .then(response => {
    const newResponse = Object.assign({}, preparedResponse)
    newResponse.isInitialSync = true
    t.deepLooseEqual(response, newResponse)
  })
})
