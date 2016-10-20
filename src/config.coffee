_    = require 'lodash'
path = require 'path'

class Config
  constructor: ->
    @configPath = process.env.BEEKEEPER_CONFIG_PATH
    @configPath ?= path.join process.env.HOME, '.octoblu', 'beekeeper.json'
    @pkgPath = path.join process.cwd(), 'package.json'

  get: =>
    config = @_getConfig()

    unless _.get(config, 'beekeeper')?
      console.error "Missing beekeeper in #{@configPath}. Are your dotfiles up to date?"
      process.exit 1

    return config

  getName: (name) =>
    name ?= @getPackageName()
    return unless name?
    return _.last(name?.split('/'))

  getPackageName: =>
    try
      return require(@pkgPath).name

  getVersion: (version) =>
    return version ? @getPackageVersion()

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
