_            = require 'lodash'
path         = require 'path'
fs           = require 'fs-extra'
findVersions = require 'find-versions'
gitTopLevel  = require 'git-toplevel'
debug        = require('debug')('beekeeper-util:config')

TYPE_VERSION_FILE={
  golang: 'version.go'
  node: 'package.json'
  generic: 'VERSION'
}

class Config
  constructor: ->

  get: (callback) =>
    @getProjectRootAndType (error, { projectRoot, type }={}) =>
      return callback error if error?
      @getNameAndVersion { projectRoot, type }, (error, { name, version }={}) =>
        return callback error if error?
        owner = @_getEnv('GITHUB_OWNER', 'octoblu')
        config = {
          projectRoot,
          type,
          name,
          owner,
          version: "v#{version}",
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

  getNameAndVersion: ({ type, projectRoot }, callback) =>
    @getName { projectRoot, type }, (error, name) =>
      return callback error if error?
      @getVersion { projectRoot, type }, (error, version) =>
        return callback error if error?
        callback null, { name, version }

  getName: ({ type, projectRoot }, callback) =>
    return callback null, path.basename(projectRoot) unless type == 'node'
    fs.readJSON path.join(projectRoot, 'package.json'), (error, contents) =>
      return callback error if error?
      callback null, @_parseName _.get contents, 'name'

  getVersion: ({ projectRoot, type }, callback) =>
    fileName = _.get TYPE_VERSION_FILE, type
    @_findVersionInFile path.join(projectRoot, fileName), (error, version) =>
      return callback error if error?
      callback null, _.trimStart version, 'v'

  getProjectRoot: (callback) =>
    gitTopLevel()
      .then (dir) =>
        callback null, dir
      .catch (error) =>
        callback error

  getProjectRootAndType: (callback) =>
    @getProjectRoot (error, projectRoot) =>
      return callback error if error?
      @getProjectType projectRoot, (error, type) =>
        return callback error if error?
        callback null, { projectRoot, type }

  getProjectType: (projectRoot, callback) =>
    @_checkAccess path.join(projectRoot, 'package.json'), (error, hasAccess) =>
      return callback error if error?
      return callback null, 'node' if hasAccess
      @_checkAccess path.join(projectRoot, 'version.go'), (error, hasAccess) =>
        return callback error if error?
        return callback null, 'golang' if hasAccess
        @_checkAccess path.join(projectRoot, 'main.go'), (error, hasAccess) =>
          return callback error if error?
          return callback null, 'golang' if hasAccess
          callback null, 'generic'

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
