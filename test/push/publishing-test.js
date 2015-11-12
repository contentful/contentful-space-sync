import test from 'blue-tape'
import sinon from 'sinon'
import Promise from 'bluebird'

import * as publishing from '../../lib/push/publishing'

const logMock = {
  info: sinon.stub()
}

function setup () {
  logMock.info.reset()
  publishing.__Rewire__('log', logMock)
  publishing.__Rewire__('errorBuffer', {push: sinon.stub()})
}

function teardown () {
  publishing.__ResetDependency__('log')
  publishing.__ResetDependency__('errorBuffer')
}

test('Publish entities', t => {
  setup()
  t.plan(3)
  const space = {
    publishAsset: sinon.stub().returns(Promise.resolve({sys: {type: 'Asset', publishedVersion: 2}}))
  }
  return publishing.publishEntities(space, 'Asset', [
    { sys: {id: '123'} },
    { sys: {id: '456'} }
  ])
  .then(response => {
    t.equals(space.publishAsset.callCount, 2, 'publish assets')
    t.ok(response[0].sys.publishedVersion, 'has published version')
    t.equals(logMock.info.callCount, 2, 'logs publishing of two assets')
    teardown()
  })
})

test('Fails to publish entities', t => {
  setup()
  t.plan(1)
  const space = {
    publishAsset: sinon.stub().returns(Promise.reject({}))
  }
  return publishing.publishEntities(space, 'Asset', [
    { sys: {id: '123'} },
    { sys: {id: '456'} }
  ])
  .then(errors => {
    t.equals(space.publishAsset.callCount, 2, 'tries to publish assets')
    teardown()
  })
})

test('Unpublish entities', t => {
  setup()
  t.plan(2)
  const space = {
    unpublishAsset: sinon.stub().returns(Promise.resolve({sys: {type: 'Asset'}}))
  }
  return publishing.unpublishEntities(space, [
    { sys: {id: '123'} },
    { sys: {id: '456'} }
  ], 'Asset')
  .then(response => {
    t.equals(space.unpublishAsset.callCount, 2, 'unpublish assets')
    t.equals(logMock.info.callCount, 2, 'logs unpublishing of two assets')
    teardown()
  })
})

test('Fails to unpublish entities', t => {
  setup()
  t.plan(1)
  const space = {
    unpublishAsset: sinon.stub().returns(Promise.reject({}))
  }
  return publishing.unpublishEntities(space, [
    { sys: {id: '123'} },
    { sys: {id: '456'} }
  ], 'Asset')
  .catch(errors => {
    t.equals(space.unpublishAsset.callCount, 2, 'tries to unpublish assets')
    teardown()
  })
})

test('Fails to unpublish entities because theyre already unpublished', t => {
  setup()
  t.plan(2)
  const space = {
    unpublishAsset: sinon.stub().returns(Promise.reject({name: 'BadRequest'}))
  }
  return publishing.unpublishEntities(space, [
    { sys: {id: '123', type: 'Asset'} }
  ], 'Asset')
  .then(entities => {
    t.equals(space.unpublishAsset.callCount, 1, 'tries to unpublish assets')
    t.equals(entities[0].sys.type, 'Asset', 'is an entity')
    teardown()
  })
})
