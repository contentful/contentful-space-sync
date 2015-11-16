import test from 'tape'
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
  creation.createEntities({space: space, type: 'Asset'}, [
    { original: { sys: {} }, transformed: { sys: {id: '123'} } },
    { original: { sys: {} }, transformed: { sys: {id: '456'} } }
  ], [
    {sys: {id: '123', version: 6}}
  ])
  .then(response => {
    t.equals(space.createAsset.callCount, 1, 'create assets')
    t.equals(space.updateAsset.callCount, 1, 'update assets')
    t.equals(space.updateAsset.args[0][0].sys.version, 6, 'updates asset version')
    t.equals(logMock.info.callCount, 2, 'logs creation of two assets')
    teardown()
    t.end()
  })
})

test('Create entries', t => {
  setup()
  const space = {
    createEntry: sinon.stub().returns(Promise.resolve({sys: {type: 'Entry'}})),
    updateEntry: sinon.stub().returns(Promise.resolve({sys: {type: 'Entry'}}))
  }
  const entries = [
    { original: { sys: {contentType: {}} }, transformed: { sys: {id: '123'} } },
    { original: { sys: {contentType: {}} }, transformed: { sys: {id: '456'} } }
  ]
  const destinationEntries = [
    {sys: {id: '123', version: 6}}
  ]
  creation.createEntries({space: space, skipContentModel: false}, entries, destinationEntries)
  .then(response => {
    t.equals(space.createEntry.callCount, 1, 'create entries')
    t.equals(space.updateEntry.callCount, 1, 'update entries')
    t.equals(space.updateEntry.args[0][0].sys.version, 6, 'updates entry version')
    t.equals(logMock.info.callCount, 2, 'logs creation of two entries')
    teardown()
    t.end()
  })
})

test('Create entries and remove unknown fields', t => {
  setup()
  const space = { updateEntry: sinon.stub() }
  space.updateEntry.onFirstCall().returns(Promise.reject({
    name: 'UnknownField',
    error: {
      details: {
        errors: [{
          name: 'unknown',
          path: ['fields', 'gonefield']
        }]
      }
    }
  }))
  space.updateEntry.onSecondCall().returns(Promise.resolve({
    sys: {type: 'Entry'},
    fields: {}
  }))
  const entries = [
    { original: { sys: {contentType: {}} }, transformed: { sys: {id: '123'}, fields: {gonefield: ''} } }
  ]
  const destinationEntries = [
    {sys: {id: '123', version: 6}}
  ]
  creation.createEntries({space: space, skipContentModel: true}, entries, destinationEntries)
  .then(response => {
    t.equals(space.updateEntry.callCount, 2, 'update entries')
    t.notOk('gonefield' in space.updateEntry.args[1][0].fields, 'removes unknown field')
    t.equals(logMock.info.callCount, 1, 'logs creation of one entry')
    teardown()
    t.end()
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
  creation.createEntities({space: space, type: 'Asset'}, [entity], [{sys: {}}])
  .then(entities => {
    t.equals(entities[0], entity)
    t.end()
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
  creation.createEntities({space: space, type: 'Asset'}, [entity], [{sys: {}}])
  .catch(err => {
    t.equals(err.error.sys.id, 'VersionMismatch')
    teardown()
    t.end()
  })
})
