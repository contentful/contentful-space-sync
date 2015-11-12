import test from 'blue-tape'
import sinon from 'sinon'
import Promise from 'bluebird'

import * as deletion from '../../lib/push/deletion'

const logMock = {
  info: sinon.stub()
}
deletion.__Rewire__('log', logMock)

test('Delete entities', t => {
  logMock.info.reset()
  const space = {
    deleteAsset: sinon.stub().returns(Promise.resolve())
  }
  return deletion.deleteEntities(space, [
    { sys: {id: '123'} },
    { sys: {id: '456'} }
  ], 'Asset')
  .then(response => {
    t.equals(space.deleteAsset.callCount, 2, 'delete assets')
    t.equals(logMock.info.callCount, 2, 'logs deletion of two assets')
    deletion.__ResetDependency__('log')
  })
})
