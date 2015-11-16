import test from 'tape'
import sinon from 'sinon'
import Promise from 'bluebird'
import {each} from 'lodash/collection'

import pushToSpace from '../../lib/push/push-to-space'

const creationMock = {
  createEntities: sinon.stub(),
  createEntries: sinon.stub()
}

const publishingMock = {
  publishEntities: sinon.stub().returns(Promise.resolve()),
  unpublishEntities: sinon.stub().returns(Promise.resolve())
}

const deletionMock = {
  deleteEntities: sinon.stub().returns(Promise.resolve())
}

const assetsMock = {
  processAssets: sinon.stub().returns(Promise.resolve()),
  checkAssets: sinon.stub().returns(Promise.resolve())
}

const responses = {
  source: {
    deletedEntries: [],
    deletedAssets: [],
    deletedLocales: [],
    deletedContentTypes: [],
    locales: [],
    contentTypes: [],
    assets: [],
    entries: []
  },
  destination: {}
}

const clientMock = {
  getSpace: sinon.stub().returns(Promise.resolve({}))
}

function setup () {
  each(creationMock, fn => fn.reset())
  each(publishingMock, fn => fn.reset())
  each(deletionMock, fn => fn.reset())
  each(assetsMock, fn => fn.reset())
  pushToSpace.__Rewire__('creation', creationMock)
  pushToSpace.__Rewire__('publishing', publishingMock)
  pushToSpace.__Rewire__('deletion', deletionMock)
  pushToSpace.__Rewire__('assets', assetsMock)
}

function teardown () {
  pushToSpace.__ResetDependency__('creation')
  pushToSpace.__ResetDependency__('publishing')
  pushToSpace.__ResetDependency__('deletion')
  pushToSpace.__ResetDependency__('assets')
}

test('Push content to destination space', t => {
  setup()
  pushToSpace(responses, clientMock, 'spaceid', {
    prePublishDelay: 0
  })
  .then(() => {
    t.equals(deletionMock.deleteEntities.callCount, 4, 'delete entities')
    t.equals(publishingMock.unpublishEntities.callCount, 3, 'unpublish entities')
    t.equals(creationMock.createEntities.callCount, 3, 'create entities')
    t.equals(creationMock.createEntries.callCount, 1, 'create entries')
    t.equals(publishingMock.publishEntities.callCount, 3, 'publish entities')
    t.equals(assetsMock.processAssets.callCount, 1, 'process assets')
    t.equals(assetsMock.checkAssets.callCount, 1, 'check assets')
    teardown()
    t.end()
  })
})

test('Push only content types and locales to destination space', t => {
  setup()
  pushToSpace(responses, clientMock, 'spaceid', {
    prePublishDelay: 0,
    contentModelOnly: true
  })
  .then(() => {
    t.equals(deletionMock.deleteEntities.callCount, 2, 'delete entities')
    t.equals(publishingMock.unpublishEntities.callCount, 1, 'unpublish entities')
    t.equals(creationMock.createEntities.callCount, 2, 'create entities')
    t.equals(creationMock.createEntries.callCount, 0, 'create entries')
    t.equals(publishingMock.publishEntities.callCount, 1, 'publish entities')
    t.equals(assetsMock.processAssets.callCount, 0, 'process assets')
    t.equals(assetsMock.checkAssets.callCount, 0, 'check assets')
    teardown()
    t.end()
  })
})

test('Push only entries and assets to destination space', t => {
  setup()
  pushToSpace(responses, clientMock, 'spaceid', {
    prePublishDelay: 0,
    skipContentModel: true
  })
  .then(() => {
    t.equals(deletionMock.deleteEntities.callCount, 2, 'delete entities')
    t.equals(publishingMock.unpublishEntities.callCount, 2, 'unpublish entities')
    t.equals(creationMock.createEntities.callCount, 1, 'create entities')
    t.equals(creationMock.createEntries.callCount, 1, 'create entries')
    t.equals(publishingMock.publishEntities.callCount, 2, 'publish entities')
    t.equals(assetsMock.processAssets.callCount, 1, 'process assets')
    t.equals(assetsMock.checkAssets.callCount, 1, 'check assets')
    teardown()
    t.end()
  })
})
