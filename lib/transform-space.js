import Promise from 'bluebird'
import {omit} from 'lodash/object'
import * as transformers from './transformers'

export default function (space) {
  const newSpace = omit(space, 'contentTypes', 'entries', 'assets')
  return Promise.reduce(['contentTypes', 'entries', 'assets'], (newSpace, type) => {
    return Promise.map(space[type], entity => transformers[type](entity))
    .then(entities => {
      newSpace[type] = entities
      return newSpace
    })
  }, newSpace)
}
