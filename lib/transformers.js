import Promise from 'bluebird'
import {omit, pick} from 'lodash/object'
import {reduce} from 'lodash/collection'

export function contentTypes (contentType) {
  const transformedContentType = omit(contentType, 'sys')
  transformedContentType.sys = pick(contentType.sys, 'id')
  return Promise.resolve({
    original: contentType,
    transformed: transformedContentType
  })
}

export function entries (entry) {
  const transformedEntry = omit(entry, 'sys')
  transformedEntry.sys = pick(entry.sys, 'id')
  return Promise.resolve({
    original: entry,
    transformed: transformedEntry
  })
}

export function assets (asset) {
  const transformedAsset = omit(asset, 'sys')
  transformedAsset.sys = pick(asset.sys, 'id')
  transformedAsset.fields = pick(asset.fields, 'title', 'description')
  transformedAsset.fields.file = reduce(
    asset.fields.file,
    (newFile, file, locale) => {
      newFile[locale] = omit(file, 'url', 'details')
      newFile[locale].upload = 'http:' + file.url
      return newFile
    },
    {}
  )
  return Promise.resolve({
    original: asset,
    transformed: transformedAsset
  })
}
