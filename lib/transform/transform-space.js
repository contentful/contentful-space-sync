import Promise from 'bluebird'
import {omit} from 'lodash/object'
import * as transformers from './transformers'

/**
 * Run transformer methods on each item for each kind of entity, in case there
 * is a need to transform data when copying it to the destination space
 */
export default function (space, destinationSpace) {
  const newSpace = omit(space, 'contentTypes', 'entries', 'assets', 'locales')
  return Promise.reduce(['contentTypes', 'entries', 'assets', 'locales'], (newSpace, type) => {
    return Promise.map(
      space[type],
      entity => transformers[type](entity, destinationSpace[type])
    )
    .then(entities => {
      newSpace[type] = entities
      return newSpace
    })
  }, newSpace)
}
