_    = require 'lodash'
path = require 'path'

class Config
  constructor: ->
    @configPath = path.join process.env.HOME, '.octoblu', 'beekeeper.json'
    @pkgPath = path.join process.cwd(), 'package.json'

  get: =>
    config = @_getConfig()

    unless _.get(config, 'beekeeper')?
      console.error "Missing beekeeper in #{@configPath}. Are your dotfiles up to date?"
      process.exit 1

    return config

  getPackageName: =>
    try
      return require(@pkgPath).name

  getPackageVersion: =>
    try
      return "v#{require(@pkgPath).version}"

  _getConfig: =>
    try
      return require @configPath
    catch
      console.error "Missing beekeeper-util configuration", @configPath
      process.exit 1

module.exports = Config
