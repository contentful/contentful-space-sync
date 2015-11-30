import {get} from 'lodash/object'
import {partialRight} from 'lodash/function'
import log from 'npmlog'
import fs from 'fs'
import errorBuffer from 'contentful-batch-libs/utils/error-buffer'

export default function dumpErrorBuffer (params, message = 'Additional errors were found') {
  const {destinationSpace, sourceSpace, errorLogFile} = params
  const loggedErrors = errorBuffer.drain()
  if (loggedErrors.length > 0) {
    const errors = loggedErrors.reduce(partialRight(logErrorsWithAppLinks, sourceSpace, destinationSpace), '')
    fs.writeFileSync(errorLogFile, errors)
    log.warn(message)
    log.warn(`Check ${errorLogFile} for details.`)
  }
}

function logErrorsWithAppLinks (accumulatedErrorStr, err, idx, loggedErrors, sourceSpace, destinationSpace) {
  const requestUri = get(err, 'request.uri')
  if (requestUri) {
    return accumulatedErrorStr +
      `Error ${idx + 1}:\n` +
      'in ' + parseEntityUrl(sourceSpace, destinationSpace, requestUri) +
      '\n' +
      JSON.stringify(err, null, '  ') +
      '\n\n'
  } else {
    return accumulatedErrorStr +
      `Error ${idx + 1}:\n` +
      JSON.stringify(err, null, '  ') +
      '\n\n'
  }
}

function parseEntityUrl (sourceSpace, destinationSpace, url) {
  return url.replace(/api.contentful/, 'app.contentful')
            .replace(/:443/, '')
            .replace(destinationSpace, sourceSpace)
            .split('/').splice(0, 7).join('/')
}
