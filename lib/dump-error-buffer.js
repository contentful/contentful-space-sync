import {get} from 'lodash/object'
import {partialRight} from 'lodash/function'
import {find} from 'lodash/collection'
import log from 'npmlog'
import fs from 'fs'
import errorBuffer from 'contentful-batch-libs/utils/error-buffer'

export default function dumpErrorBuffer (params, message = 'Additional errors were found') {
  const {destinationSpace, sourceSpace, errorLogFile} = params
  const loggedErrors = errorBuffer.drain()
  if (loggedErrors.length > 0) {
    const errorOutputPrefix = additionalInfoForUnresolvedLinks(loggedErrors)
    const errors = loggedErrors.reduce(
      partialRight(logErrorsWithAppLinks, sourceSpace, destinationSpace),
      errorOutputPrefix || '')
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

function additionalInfoForUnresolvedLinks (errors) {
  if (find(errors, {name: 'UnresolvedLinks'})) {
    return 'Unresolved links were found in your entries. See below for more details.\n' +
           'Look at https://github.com/contentful/contentful-link-cleaner if you\'d like ' +
           'a quicker way to fix all unresolved links in your space.\n\n'
  }
}
