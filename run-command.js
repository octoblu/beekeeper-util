require('coffee-script/register')
module.exports = function(commandFile) {
  var Command = require(commandFile)
  var BeekeeperConfig = require('./src/beekeeper-config.coffee')
  new BeekeeperConfig().get(function(error, config) {
    if (error) {
      console.error('get config error', error)
    }
    new Command(config).run()
  })
}
