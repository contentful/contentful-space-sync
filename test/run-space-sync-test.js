import test from 'tape'
import Promise from 'bluebird'
import sinon from 'sinon'

import runSpaceSync from '../lib/run-space-sync'

const sourceResponse = {
  nextSyncToken: 'nextsynctoken',
  contentTypes: [],
  locales: []
}
const destinationResponse = {}

const createClientsStub = rewireWithStub('createClients')
.returns({
  source: {delivery: {}},
  destination: {management: {}}
})

const getSourceSpaceStub = rewireWithStub('getSourceSpace')
.returns(Promise.resolve(sourceResponse))

const getDestinationContentForUpdateStub = rewireWithStub('getDestinationContentForUpdate')
.returns(Promise.resolve(destinationResponse))

const transformSpaceStub = rewireWithStub('transformSpace')
.returns(Promise.resolve(sourceResponse))

const pushToSpaceStub = rewireWithStub('pushToSpace')
.returns(Promise.resolve({}))

const fsMock = {
  writeFileSync: sinon.stub()
}
runSpaceSync.__Rewire__('fs', fsMock)

function rewireWithStub (methodName) {
  const stub = sinon.stub()
  runSpaceSync.__Rewire__(methodName, stub)
  return stub
}

test('Runs space sync', t => {
  const preparedResponses = {
    source: Object.assign(Object.create(sourceResponse), {
      deletedContentTypes: [],
      deletedLocales: [],
      contentTypes: [],
      locales: [],
      nextSyncToken: 'nextsynctoken'
    }),
    destination: destinationResponse
  }

  runSpaceSync({
    opts: {},
    syncTokenFile: 'synctokenfile'
  })
  .then(() => {
    t.ok(createClientsStub.called, 'creates clients')
    t.ok(getSourceSpaceStub.called, 'gets source space')
    t.ok(getDestinationContentForUpdateStub.called, 'gets destination space')
    t.ok(transformSpaceStub.called, 'transforms space')
    t.deepLooseEqual(pushToSpaceStub.args[0][0], preparedResponses, 'pushes to destination space')
    t.ok(fsMock.writeFileSync.calledWith('synctokenfile', 'nextsynctoken'), 'token file created')
    t.end()
  }, err => {
    t.end(err)
  })
})
