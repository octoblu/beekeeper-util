require('coffee-script/register')
module.exports = function(commandFile) {
  var Command = require(commandFile)
  var Config = require('./src/config.coffee')
  new Config().get(function(error, config) {
    if (error) {
      console.error('get config error', error)
    }
    new Command(config).run()
  })
}
