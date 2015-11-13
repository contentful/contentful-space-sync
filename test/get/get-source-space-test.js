import test from 'tape'
import sinon from 'sinon'
import Promise from 'bluebird'

import getSourceSpace from '../../lib/get/get-source-space'

const fsMock = {
  readFileAsync: sinon.stub()
}

function setup () {
  getSourceSpace.__Rewire__('fs', fsMock)
}

function teardown () {
  getSourceSpace.__ResetDependency__('fs')
}

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
  space: sinon.stub().returns(Promise.resolve({
    locales: ['en-US']
  }))
}

const managementClientMock = {
  getSpace: sinon.stub().returns(Promise.resolve({
    getContentTypes: sinon.stub().returns(Promise.resolve([
      {sys: {type: 'ContentType'}}
    ]))
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
  setup()
  fsMock.readFileAsync.returns(Promise.reject('file not found'))
  getSourceSpace(deliveryClientMock, managementClientMock, 'spaceid')
  .then(response => {
    const newResponse = Object.assign({}, preparedResponse)
    newResponse.isInitialSync = true
    t.deepLooseEqual(response, newResponse)
    teardown()
    t.end()
  })
})

test('Get source space with file token', t => {
  setup()
  fsMock.readFileAsync.withArgs('tokenfile').returns(Promise.resolve('newtoken'))
  getSourceSpace(deliveryClientMock, managementClientMock, 'spaceid', 'tokenfile')
  .then(response => {
    t.equals(deliveryClientMock.sync.secondCall.args[0].nextSyncToken, 'newtoken', 'syncs with provided token')
    t.deepLooseEqual(response, Object.assign({}, preparedResponse))
    teardown()
    t.end()
  })
})

test('Get source space with forced sync from scratch', t => {
  setup()
  fsMock.readFileAsync.withArgs('tokenfile').returns(Promise.resolve('newtoken'))
  getSourceSpace(deliveryClientMock, managementClientMock, 'spaceid', 'tokenfile', true)
  .then(response => {
    const newResponse = Object.assign({}, preparedResponse)
    newResponse.isInitialSync = true
    t.deepLooseEqual(response, newResponse)
    teardown()
    t.end()
  })
})
