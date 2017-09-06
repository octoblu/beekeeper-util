_            = require 'lodash'
path         = require 'path'
fs           = require 'fs-extra'
findVersions = require 'find-versions'
gitTopLevel  = require 'git-toplevel'
os           = require 'os'
semver       = require 'semver'
debug        = require('debug')('beekeeper-util:config')

VERSION_FILE_NAMES={
  golang: 'version.go'
  node: 'package.json'
  generic: 'VERSION'
}

class Config
  constructor: ->

  get: (callback) =>
    @getProjectRootAndType (error, { projectRoot, type, versionFile }={}) =>
      return callback error if error?
      @getProjectInfo { projectRoot, type, versionFile }, (error, { name, version, authors }={}) =>
        return callback error if error?
        owner = @_getEnv('GITHUB_OWNER', 'octoblu')
        config = {
          projectRoot,
          type,
          name,
          owner,
          authors,
          version,
          versionFile,
          repo: "#{owner}/#{name}",
          beekeeperUri: @_getEnv 'BEEKEEPER_URI'
          codecovToken: @_getEnv 'CODECOV_TOKEN'
          githubToken: @_getEnv 'GITHUB_TOKEN'
          codefreshToken: @_getEnv 'CODEFRESH_TOKEN'
          quayToken: @_getEnv 'QUAY_TOKEN'
          dockerHubToken: @_getEnv 'DOCKER_HUB_LOGIN_TOKEN'
        }
        debug 'project config', { config }
        callback null, config

  getAuthors: (callback) =>
    filePath = path.join os.homedir(), '.beekeeper-authors.json'
    @_checkAccess filePath, (error, hasAccess) =>
      return callback error if error?
      return callback null, {} unless hasAccess
      fs.readJson filePath, callback

  getProjectInfo: ({ type, projectRoot, versionFile }, callback) =>
    @getName { projectRoot, type }, (error, name) =>
      return callback error if error?
      @getVersion { versionFile }, (error, version) =>
        return callback error if error?
        @getAuthors (error, authors) =>
          return callback error if error?
          callback null, { name, version, authors }

  getName: ({ type, projectRoot }, callback) =>
    return callback null, path.basename(projectRoot) unless type == 'node'
    filePath = path.join(projectRoot, 'package.json')
    fs.readJson filePath, (error, contents) =>
      return callback error if error?
      callback null, @_parseName _.get contents, 'name'

  getVersion: ({ versionFile }, callback) =>
    @_findVersionInFile versionFile, (error, version) =>
      return callback error if error?
      return callback null, '1.0.0' unless semver.valid version
      callback null, semver.clean version

  getProjectRoot: (callback) =>
    gitTopLevel()
      .then (dir) =>
        callback null, dir
      .catch (error) =>
        callback error

  getProjectRootAndType: (callback) =>
    @getProjectRoot (error, projectRoot) =>
      return callback error if error?
      @getProjectType projectRoot, (error, { versionFile, type }={}) =>
        return callback error if error?
        callback null, { projectRoot, versionFile, type }

  getProjectType: (projectRoot, callback) =>
    @_nodeProjectInfo projectRoot, (error, info) =>
      return callback error if error?
      return callback null, info if info?
      @_golangProjectInfo projectRoot, (error, info) =>
        return callback error if error?
        return callback null, info if info?
        @_genericProjectInfo projectRoot, callback

  _getVersionFile: (projectRoot, type) =>
    return path.join(projectRoot, 'package.json') if type == 'node'
    return path.join(projectRoot, 'version.go') if type == 'golang'
    return path.join(projectRoot, 'VERSION')

  _nodeProjectInfo: (projectRoot, callback) =>
    @_checkAccess @_getVersionFile(projectRoot, 'node'), (error, hasAccess) =>
      return callback error if error?
      return callback null unless hasAccess
      return callback null, {
        type: 'node',
        versionFile:  path.join(projectRoot, VERSION_FILE_NAMES['node'])
      }

  _genericProjectInfo: (projectRoot, callback) =>
    return callback null, {
      type: 'generic',
      versionFile:  path.join(projectRoot, VERSION_FILE_NAMES['generic'])
    }

  _golangProjectInfo: (projectRoot, callback) =>
    @_checkAccess path.join(projectRoot, 'version.go'), (error, hasAccess) =>
      return callback error if error?
      if hasAccess
        return callback null, {
          type: 'golang',
          versionFile: path.join(projectRoot, VERSION_FILE_NAMES['golang'])
        }
      @_checkAccess path.join(projectRoot, 'main.go'), (error, hasAccess) =>
        return callback error if error?
        return callback null unless hasAccess
        return callback null, {
          type: 'golang',
          versionFile: path.join(projectRoot, VERSION_FILE_NAMES['generic'])
        }

  _checkAccess: (filePath, callback) =>
    fs.access filePath, fs.constants.R_OK, (error) =>
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

  _getEnv: (envStr, defaultValue) =>
    envStr = _.toUpper envStr
    envStr = "BEEKEEPER_#{envStr}" if process.env["BEEKEEPER_#{envStr}"]?
    debug { envStr, defaultValue }
    return process.env[envStr] if process.env[envStr]?
    return defaultValue


module.exports = Config
