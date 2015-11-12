import Promise from 'bluebird'
import {omit, pick} from 'lodash/object'
import {find, reduce} from 'lodash/collection'

/**
 * Default transformer methods for each kind of entity.
 * For most cases these just remove information that is specific to the content
 * existing in a space (date created, version, etc), which the new space will
 * generate by itself.
 *
 * In the case of assets it also changes the asset url to the upload property
 * as the whole upload process needs to be followed again.
 */

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

export function locales (locale, destinationLocales) {
  const transformedLocale = pick(locale, 'code', 'name', 'contentManagementApi', 'contentDeliveryApi')
  const destinationLocale = find(destinationLocales, 'code', locale.code)
  if (destinationLocale) {
    transformedLocale.sys = pick(destinationLocale.sys, 'id')
  }

  return Promise.resolve({
    original: locale,
    transformed: transformedLocale
  })
}
