try {
  module.exports = require('./dist/run-space-sync').default
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    require('babel-register')
    module.exports = require('./lib/run-space-sync').default
  } else {
    console.log(err)
    process.exit(1)
  }
}
