import test from 'blue-tape'
import sinon from 'sinon'
import Promise from 'bluebird'

import * as creation from '../../lib/push/creation'

const logMock = {
  info: sinon.stub(),
  error: sinon.stub()
}

function setup () {
  logMock.info.reset()
  creation.__Rewire__('log', logMock)
}

function teardown () {
  creation.__ResetDependency__('log')
}

test('Create entities', t => {
  setup()
  const space = {
    createAsset: sinon.stub().returns(Promise.resolve({sys: {type: 'Asset'}})),
    updateAsset: sinon.stub().returns(Promise.resolve({sys: {type: 'Asset'}}))
  }
  return creation.createEntities(space, [
    { original: { sys: {} }, transformed: { sys: {id: '123'} } },
    { original: { sys: {} }, transformed: { sys: {id: '456'} } }
  ], [
    {sys: {id: '123', version: 6}}
  ], 'Asset')
  .then(response => {
    t.equals(space.createAsset.callCount, 1, 'create assets')
    t.equals(space.updateAsset.callCount, 1, 'update assets')
    t.equals(space.updateAsset.args[0][0].sys.version, 6, 'updates asset version')
    t.equals(logMock.info.callCount, 2, 'logs creation of two assets')
    teardown()
  })
})

test('Create entries', t => {
  setup()
  const space = {
    createEntry: sinon.stub().returns(Promise.resolve({sys: {type: 'Entry'}})),
    updateEntry: sinon.stub().returns(Promise.resolve({sys: {type: 'Entry'}}))
  }
  return creation.createEntries(space, [
    { original: { sys: {contentType: {}} }, transformed: { sys: {id: '123'} } },
    { original: { sys: {contentType: {}} }, transformed: { sys: {id: '456'} } }
  ], [
    {sys: {id: '123', version: 6}}
  ], 'Asset')
  .then(response => {
    t.equals(space.createEntry.callCount, 1, 'create entries')
    t.equals(space.updateEntry.callCount, 1, 'update entries')
    t.equals(space.updateEntry.args[0][0].sys.version, 6, 'updates entry version')
    t.equals(logMock.info.callCount, 2, 'logs creation of two entries')
    teardown()
  })
})

test('Fails to create entities due to validation', t => {
  setup()
  const space = {
    createAsset: sinon.stub()
  }
  space.createAsset.returns(Promise.reject({
    error: {
      sys: {id: 'ValidationFailed'},
      details: {
        errors: [{name: 'taken'}]
      }
    }
  }))
  const entity = { original: { sys: {} }, transformed: { sys: {} } }
  return creation.createEntities(space, [entity], [{sys: {}}], 'Asset')
  .catch(responseEntity => {
    t.equals(entity, responseEntity)
    teardown()
  })
})

test('Fails to create entities due to version mismatch', t => {
  setup()
  const space = {
    createAsset: sinon.stub()
  }
  space.createAsset.returns(Promise.reject({error: {sys: {id: 'VersionMismatch'}}}))
  const entity = { original: { sys: {} }, transformed: { sys: {} } }
  return creation.createEntities(space, [entity], [{sys: {}}], 'Asset')
  .catch(err => {
    t.equals(err.error.sys.id, 'VersionMismatch')
    teardown()
  })
})
