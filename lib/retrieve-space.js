import fs from 'fs'
import * as contentful from 'contentful'

export default function ({
  space,
  accessToken,
  nextSyncTokenFile,
  fresh
}) {
  const client = contentful.createClient({
    space: space,
    accessToken: accessToken
  })

  return fs.readFileAsync(nextSyncTokenFile, 'utf-8')
  .then(nextSyncToken => {
    return nextSyncToken && !fresh
      ? { nextSyncToken: nextSyncToken }
      : { initial: true }
  }, () => ({ initial: true }))
  .then(cdaConfig => {
    return client.sync(cdaConfig)
    .then(
      response => ({
        entries: filterType(response.items, 'Entry'),
        assets: filterType(response.items, 'Asset'),
        nextSyncToken: response.nextSyncToken
      }),
      err => console.log('Failed to retrieve sync content', err)
    )
  })
  .then(response => {
    return client.contentTypes()
    .then(contentTypes => {
      response.contentTypes = contentTypes
      return response
    })
  })
}

function filterType (items, type) {
  return Array.filter(items, item => item.sys.type === type)
}
