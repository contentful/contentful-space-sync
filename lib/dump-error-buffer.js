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
    const errorOutput = {
      additionalInfo: {}
    }
    errorOutput.errors = loggedErrors.map(partialRight(logErrorsWithAppLinks, sourceSpace, destinationSpace))
    const unresolvedLinks = additionalInfoForUnresolvedLinks(errorOutput.errors)
    if (unresolvedLinks) {
      errorOutput.additionalInfo.unresolvedLinks = unresolvedLinks
    }
    fs.writeFileSync(errorLogFile, JSON.stringify(errorOutput, null, '  '))
    log.warn(message)
    log.warn(`Check ${errorLogFile} for details.`)
  }
}

function logErrorsWithAppLinks (err, idx, loggedErrors, sourceSpace, destinationSpace) {
  const parsedError = JSON.parse(err.message)
  const requestUri = get(parsedError, 'request.url')
  if (requestUri) {
    parsedError.webAppUrl = parseEntityUrl(sourceSpace, destinationSpace, requestUri)
  }
  return parsedError
}

function parseEntityUrl (sourceSpace, destinationSpace, url) {
  return url.replace(/api.contentful/, 'app.contentful')
            .replace(/:443/, '')
            .replace(destinationSpace, sourceSpace)
            .split('/').splice(0, 7).join('/')
}

function additionalInfoForUnresolvedLinks (errors) {
  if (find(errors, {name: 'UnresolvedLinks'})) {
    return 'Unresolved links were found in your entries. See the errors list for more details. ' +
           'Look at https://github.com/contentful/contentful-link-cleaner if you\'d like ' +
           'a quicker way to fix all unresolved links in your space.'
  }
}
