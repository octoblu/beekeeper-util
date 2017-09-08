_             = require 'lodash'
path          = require 'path'
fs            = require 'fs-extra'
findVersions  = require 'find-versions'
gitTopLevel   = require 'git-toplevel'
semver        = require 'semver'
walkBack      = require 'walk-back'
CONFIGURATION = require '../assets/configuration.json'
debug         = require('debug')('beekeeper-util:config')

class BeekeeperConfig
  get: (callback) =>
    @_getProjectRoot (error, projectRoot) =>
      return callback error if error?
      @_getBeekeperConfig projectRoot, (error, projectConfig) =>
        return callback error if error?
        @_getProjectInfo projectRoot, (error, projectInfo) =>
          return callback error if error?
          config = _.defaultsDeep {}, projectInfo, projectConfig
          debug 'project config', { config }
          callback null, config

  _getBeekeperConfig: (projectRoot, callback) =>
    projectConfigPath = path.join projectRoot, '.beekeeper.json'
    globalConfigPath = walkBack '.', '.beekeeper_global.json'
    @_readJSONFile globalConfigPath, (error, globalConfig) =>
      return callback error if error?
      @_readJSONFile projectConfigPath, (error, projectConfig) =>
        return callback error if error?
        callback null, @_mapBeekeeperConfig globalConfig, projectConfig

  _getProjectInfo: (projectRoot, callback) =>
    @_getProjectLanguage projectRoot, (error, language, versionFileName) =>
      return callback error if error?
      @_getProjectName projectRoot, language, (error, name) =>
        return callback error if error?
        @_getProjectVersion projectRoot, versionFileName, (error, version) =>
          return callback error if error?
          @_hasDockerFile projectRoot, (error, hasDockerFile) =>
            return callback error if error?
            callback null, {
              docker: { hasDockerFile }
              project: {
                name
                language
                versionFileName
                version
                root: projectRoot
              }
            }

  _hasDockerFile: (projectRoot, callback) =>
    @_checkAccess path.join(projectRoot, 'Dockerfile'), callback

  _getProjectName: (projectRoot, language, callback) =>
    return callback null, path.basename(projectRoot) unless language == 'node'
    filePath = path.join projectRoot, 'package.json'
    fs.readJson filePath, (error, contents) =>
      return callback error if error?
      callback null, @_parseName _.get contents, 'name'

  _getProjectRoot: (callback) =>
    gitTopLevel()
      .then (dir) =>
        callback null, dir
      .catch (error) =>
        callback error

  _getProjectVersion: (projectRoot, versionFileName, callback) =>
    @_findVersionInFile path.join(projectRoot, versionFileName), (error, version) =>
      return callback error if error?
      return callback null unless semver.valid version
      callback null, semver.clean version

  _getProjectLanguage: (projectRoot, callback) =>
    @_nodeProjectInfo projectRoot, (error, language, versionFileName) =>
      return callback error if error?
      return callback null, language, versionFileName if language?
      @_golangProjectInfo projectRoot, (error, language, versionFileName) =>
        return callback error if error?
        return callback null, language, versionFileName if language?
        @_genericProjectInfo projectRoot, (error, language, versionFileName) =>
          return callback error if error?
          callback null, language, versionFileName

  _nodeProjectInfo: (projectRoot, callback) =>
    @_checkAccess path.join(projectRoot, 'package.json'), (error, hasAccess) =>
      return callback error if error?
      return callback null unless hasAccess
      return callback null, 'node', 'package.json'

  _golangProjectInfo: (projectRoot, callback) =>
    @_checkAccess path.join(projectRoot, 'version.go'), (error, hasAccess) =>
      return callback error if error?
      return callback null, 'golang', 'version.go' if hasAccess
      @_checkAccess path.join(projectRoot, 'main.go'), (error, hasAccess) =>
        return callback error if error?
        return callback null unless hasAccess
        return callback null, 'golang', 'main.go'

  _checkAccess: (filePath, callback) =>
    fs.access filePath, fs.constants.F_OK | fs.constants.R_OK, (error) =>
      callback null, !error?

  _readJSONFile: (filePath, callback) =>
    return callback null unless filePath?
    @_checkAccess filePath, (error, hasAccess) =>
      return callback error if error?
      return callback null unless hasAccess
      fs.readJson filePath, callback

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

  _mapBeekeeperConfig: (globalConfig, projectConfig) =>
    result= {}
    _.each CONFIGURATION, (configItem) =>
      value = @_getConfigValue globalConfig, projectConfig, configItem
      _.set result, configItem.key, value
      return
    return result

  _getConfigValue: (globalConfig, projectConfig, configItem) =>
    envValue = process.env[configItem.env]
    value = _.get projectConfig, configItem.key
    globalValue = _.get globalConfig, configItem.key
    debug 'get config value', { configItem, envValue, value, globalValue }
    return @_ensureType(configItem.type, value ? envValue ? globalValue ? configItem.default)

  _ensureType: (type, value) =>
    if type == 'boolean'
      return value if _.isBoolean(value)
      return value.toLowerCase() == 'true'
    return value

  _getEnvValue: (configItem) =>
    return _.find _.castArray(configItem.env), (envStr) =>
      return process.env[envStr]

module.exports = BeekeeperConfig
