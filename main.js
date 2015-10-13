import * as yargs from 'yargs';

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
      .option('destination-space', {
        describe: 'ID of Space data will be copied to',
        type: 'string',
        demand: true
      })
      .option('destination-space-management-token', {
        describe: 'Management API token for destination space',
        type: 'string',
        demand: true
      })
      .config('config', 'Configuration file with required values')
      .argv;
