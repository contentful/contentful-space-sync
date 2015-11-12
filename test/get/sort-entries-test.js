import test from 'tape'

import sortEntries from '../../lib/get/sort-entries'

const entries = [
  {
    sys: {id: '456'},
    fields: {}
  },
  {
    sys: {id: '123'},
    fields: {
      links: [
        {
          sys: {
            type: 'Link',
            linkType: 'Entry',
            id: '456'
          }
        }
      ]
    }
  }
]

test('Sorts entries by link order', t => {
  const sortedEntries = sortEntries(entries)
  t.equals(sortedEntries[0].sys.id, '123')
  t.equals(sortedEntries[1].sys.id, '456')
  t.end()
})
