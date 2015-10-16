import yargs from 'yargs'

const opts = yargs
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
  .option('source-space-management-token', {
    describe: 'Management API token for source space',
    type: 'string',
    demand: true
  })
  .option('destination-space', {
    describe: 'ID of Space data will be copied to',
    type: 'string',
    demand: true
  })
  .option('destination-space-management-token', {
    describe: `Management API token for destination space.
    If the user of the token for the source space also has access to this space
    there is no need to specify it again.`,
    type: 'string'
  })
  .option('fresh', {
    describe: 'Ignores an existing sync token and syncs from the start',
    type: 'boolean'
  })
  .config('config', 'Configuration file with required values')
  .argv

if(!opts.destinationSpaceManagementToken) {
  opts.destinationSpaceManagementToken = opts.sourceSpaceManagementToken
}

export default opts
