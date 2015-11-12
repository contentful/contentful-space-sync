import test from 'blue-tape'
import sinon from 'sinon'
import Promise from 'bluebird'

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

test('Push content to destination space', t => {
  pushToSpace.__Rewire__('creation', creationMock)
  pushToSpace.__Rewire__('publishing', publishingMock)
  pushToSpace.__Rewire__('deletion', deletionMock)
  pushToSpace.__Rewire__('assets', assetsMock)

  return pushToSpace(responses, clientMock, 'spaceid', 0)
  .then(() => {
    t.equals(deletionMock.deleteEntities.callCount, 4, 'delete entities')
    t.equals(publishingMock.unpublishEntities.callCount, 3, 'unpublish entities')
    t.equals(creationMock.createEntities.callCount, 3, 'create entities')
    t.equals(creationMock.createEntries.callCount, 1, 'create entries')
    t.equals(publishingMock.publishEntities.callCount, 3, 'publish entities')
    t.equals(assetsMock.processAssets.callCount, 1, 'process assets')
    t.equals(assetsMock.checkAssets.callCount, 1, 'check assets')

    pushToSpace.__ResetDependency__('creation')
    pushToSpace.__ResetDependency__('publishing')
    pushToSpace.__ResetDependency__('deletion')
    pushToSpace.__ResetDependency__('assets')
  })
})
