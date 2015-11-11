import test from 'tape'
import sinon from 'sinon'
import Promise from 'bluebird'

import runSpaceSync from '../lib/run-space-sync'
import errorBuffer from '../lib/error-buffer'

const sourceResponse = {
  nextSyncToken: 'nextsynctoken',
  contentTypes: [
    {original: {sys: {id: 'exists'}}}
  ],
  locales: [{original: {code: 'en-US'}}]
}
const destinationResponse = {
  contentTypes: [
    {sys: {id: 'exists'}},
    {sys: {id: 'doesntexist'}}
  ],
  locales: [{code: 'en-US'}, {code: 'en-GB'}]
}

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
    source: {
      deletedContentTypes: [{sys: {id: 'doesntexist'}}],
      deletedLocales: [{code: 'en-GB'}],
      contentTypes: [{original: {sys: {id: 'exists'}}}],
      locales: [{original: {code: 'en-US'}}],
      nextSyncToken: 'nextsynctoken'
    },
    destination: Object.assign({}, destinationResponse)
  }

  errorBuffer.push({
    request: {
      uri: 'erroruri'
    }
  })

  runSpaceSync({
    opts: {},
    syncTokenFile: 'synctokenfile',
    errorLogFile: 'errorlogfile'
  })
  .then(() => {
    t.ok(createClientsStub.called, 'creates clients')
    t.ok(getSourceSpaceStub.called, 'gets source space')
    t.ok(getDestinationContentForUpdateStub.called, 'gets destination space')
    t.ok(transformSpaceStub.called, 'transforms space')
    t.deepLooseEqual(pushToSpaceStub.args[0][0], preparedResponses, 'pushes to destination space')
    t.ok(fsMock.writeFileSync.calledWith('synctokenfile', 'nextsynctoken'), 'token file created')
    t.ok(fsMock.writeFileSync.calledWith('errorlogfile'), 'error log file created')
    t.ok(/erroruri/.test(fsMock.writeFileSync.secondCall.args[1]), 'error objects are logged')
    t.end()
  }, err => {
    t.end(err)
  })
})
