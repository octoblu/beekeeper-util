_            = require 'lodash'
path         = require 'path'
fs           = require 'fs-extra'
findVersions = require 'find-versions'
gitTopLevel  = require 'git-toplevel'
semver       = require 'semver'
walkBack     = require 'walk-back'
debug        = require('debug')('beekeeper-util:config')

class Config
  constructor: () ->
    @initConfig()

  initConfig: =>
    beekeeperConfigPath = walkBack '.', '.beekeeper_global.json'
    return unless beekeeperConfigPath?
    @beekeeperConfig = fs.readJsonSync beekeeperConfigPath

  get: (callback) =>
    @getCoreProjectInfo (error, coreProjectInfo) =>
      return callback error if error?
      @getProjectInfo coreProjectInfo, (error, config) =>
        return callback error if error?
        debug 'project config', { config }
        callback null, config

  getProjectInfo: (coreProjectInfo, callback) =>
    { type, projectRoot, owner } = coreProjectInfo
    @getProjectName { projectRoot, type }, (error, name) =>
      return callback error if error?
      callback null, _.assign coreProjectInfo, {
        repo: "#{owner}/#{name}"
        name
      }

  getProjectName: ({ type, projectRoot }, callback) =>
    return callback null, path.basename(projectRoot) unless type == 'node'
    filePath = path.join(projectRoot, 'package.json')
    fs.readJson filePath, (error, contents) =>
      return callback error if error?
      callback null, @_parseName _.get contents, 'name'

  getVersion: ({ versionFileName, projectRoot }, callback) =>
    @_findVersionInFile path.join(projectRoot, versionFileName), (error, version) =>
      return callback error if error?
      return callback null unless semver.valid version
      callback null, semver.clean version

  getProjectRoot: (callback) =>
    gitTopLevel()
      .then (dir) =>
        callback null, dir
      .catch (error) =>
        callback error

  getCoreProjectInfo: (callback) =>
    @getProjectRoot (error, projectRoot) =>
      return callback error if error?
      @getProjectConfig projectRoot, (error, projectConfig) =>
        return callback error if error?
        @getProjectType projectRoot, (error, projectType) =>
          return callback error if error?
          { versionFileName, type } = projectType
          @getVersion { versionFileName, projectRoot }, (error, version) =>
            return callback error if error?
            coreInfo = {
              authors: @_getConfigValue projectConfig, 'authors'
              beekeeperUri:  @_getConfigValue projectConfig, 'beekeeper.uri'
              codecovEnabled:  @_getConfigValue projectConfig, 'codecov.enabled'
              codecovToken:  @_getConfigValue projectConfig, 'codecov.token'
              githubToken:  @_getConfigValue projectConfig, 'beekeeper.github.token'
              githubRelease:  @_getConfigValue projectConfig, 'github.release.enabled', false
              githubReleaseDraft:  @_getConfigValue projectConfig, 'github.release.draft', false
              githubReleasePre:  @_getConfigValue projectConfig, 'github.release.prerelease', false
              codefreshEnabled:  @_getConfigValue projectConfig, 'codefresh.enabled'
              codefreshToken:  @_getConfigValue projectConfig, 'codefresh.token'
              quayEnabled:  @_getConfigValue projectConfig, 'quay.enabled'
              quayToken:  @_getConfigValue projectConfig, 'quay.token'
              travisEnabled:  @_getConfigValue projectConfig, 'travis.enabled'
              dockerHubEnabled:  @_getConfigValue projectConfig, 'dockerHub.enabled'
              dockerHubToken:  @_getConfigValue projectConfig, 'dockerHub.loginToken'
              dockerHubUsername:  @_getConfigValue projectConfig, 'dockerHub.username'
              dockerHubPassword:  @_getConfigValue projectConfig, 'dockerHub.password'
              projectRoot: @_getProjectConfigValue projectConfig, 'beekeeper.projectRoot', projectRoot
              repo: @_getProjectConfigValue projectConfig, 'beekeeper.repo'
              name: @_getProjectConfigValue projectConfig, 'beekeeper.name'
              owner:  @_getConfigValue projectConfig, 'beekeeper.owner'
              type:  @_getConfigValue projectConfig, 'beekeeper.type', type || 'generic'
              versionFileName: @_getConfigValue projectConfig, 'beekeeper.versionFileName', versionFileName || 'VERSION'
              version: @_getConfigValue projectConfig, 'beekeeper.version', version || '1.0.0'
            }
            callback null, coreInfo

  getProjectConfig: (projectRoot, callback) =>
    configFile = path.join(projectRoot, '.beekeeper.json')
    @_checkAccess configFile, (error, hasAccess) =>
      return callback error if error?
      return callback null unless hasAccess
      fs.readJson configFile, callback

  getProjectType: (projectRoot, callback) =>
    @_nodeProjectInfo projectRoot, (error, info) =>
      return callback error if error?
      return callback null, info if info?
      @_golangProjectInfo projectRoot, (error, info) =>
        return callback error if error?
        return callback null, info if info?
        @_genericProjectInfo projectRoot, callback

  _nodeProjectInfo: (projectRoot, callback) =>
    @_checkAccess path.join(projectRoot, 'package.json'), (error, hasAccess) =>
      return callback error if error?
      return callback null unless hasAccess
      return callback null, {
        type: 'node',
        versionFileName: 'package.json'
      }

  _golangProjectInfo: (projectRoot, callback) =>
    @_checkAccess path.join(projectRoot, 'version.go'), (error, hasAccess) =>
      return callback error if error?
      if hasAccess
        return callback null, {
          type: 'golang',
          versionFileName: 'version.go'
        }
      @_checkAccess path.join(projectRoot, 'main.go'), (error, hasAccess) =>
        return callback error if error?
        return callback null unless hasAccess
        return callback null, {
          type: 'golang',
          versionFileName: 'VERSION'
        }

  _checkAccess: (filePath, callback) =>
    fs.access filePath, fs.constants.F_OK | fs.constants.R_OK, (error) =>
      callback null, !error?

  _findVersionInFile: (filePath, callback) =>
    @_checkAccess filePath, (error, hasAccess) =>
      return callback error if error?
      return callback null unless hasAccess
      fs.readFile filePath, 'utf8', (error, contents) =>
        return callback error if error?
        try
          version = JSON.parse(contents).version
        catch
          version = _.first findVersions contents
        callback null, version

  _parseName: (name) => _.last _.split(name, '/')

  _getConfigValue: (projectConfig, key, defaultValue) =>
    envStr = _.toUpper _.snakeCase key
    envStr = "BEEKEEPER_#{envStr}" if process.env["BEEKEEPER_#{key}"]?
    envValue = process.env[envStr]
    configKey = _.trimStart key, 'beekeeper.'
    configValue = _.get projectConfig, configKey
    globalConfigValue = _.get @beekeeperConfig, _.trimStart('beekeeper.', configKey)
    debug { envStr, defaultValue, envValue, configKey, configValue, globalConfigValue }
    return globalConfigValue ? configValue ? envValue ? defaultValue

  _getProjectConfigValue: (projectConfig, configKey, defaultValue) =>
    configValue = _.get projectConfig, configKey
    return configValue ? defaultValue

module.exports = Config
