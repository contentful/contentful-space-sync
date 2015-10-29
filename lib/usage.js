import yargs from 'yargs'

export default yargs
  .usage('Usage: $0 [options]')
  .option('source-space', {
    describe: 'ID of Space with source data',
    type: 'string',
    demand: true
  })
  .option('source-space-delivery-token', {
    describe: 'Delivery API token for source space',
    type: 'string',
    demand: true
  })
  .option('destination-space', {
    describe: 'ID of Space data will be copied to',
    type: 'string',
    demand: true
  })
  .option('destination-space-management-token', {
    describe: 'Management API token for destination space.',
    type: 'string',
    demand: true
  })
  .option('fresh', {
    describe: 'Ignores an existing sync token and syncs from the start',
    type: 'boolean'
  })
  .option('sync-token-dir', {
    describe: 'Defines the path for storing sync token files (default path is the current directory)',
    type: 'string'
  })
  .option('force-overwrite', {
    describe: 'Forces overwrite of content on the destination space with the same ID. BEFORE USING THIS option see the section "Overwriting Content" on the README for more details.',
    type: 'boolean'
  })
  .config('config', 'Configuration file with required values')
  .argv
