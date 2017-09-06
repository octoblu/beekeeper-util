_      = require 'lodash'
path   = require 'path'
url    = require 'url'
yaml   = require 'node-yaml'
colors = require 'colors'
fs     = require 'fs-extra'
semver = require 'semver'
semverRegex = require 'semver-regex'
debug  = require('debug')('beekeeper-util:project-service')

class ProjectService
  constructor: ({ config }) ->
    throw new Error 'Missing config argument' unless config?
    { beekeeperUri, projectRoot, @type, @versionFile } = config
    throw new Error 'Missing beekeeperUri in config' unless beekeeperUri?
    throw new Error 'Missing projectRoot in config' unless projectRoot?
    throw new Error 'Missing type in config' unless @type?
    throw new Error 'Missing versionFile in config' unless @versionFile?
    @travisYml = path.join projectRoot, '.travis.yml'
    @packagePath = path.join projectRoot, 'package.json'
    @dockerFilePath = path.join projectRoot, 'Dockerfile'
    @dockerignorePath = path.join projectRoot, '.dockerignore'
    urlParts = url.parse beekeeperUri
    _.set urlParts, 'slashes', true
    delete urlParts.auth
    delete urlParts.password
    delete urlParts.username
    _.set urlParts, 'pathname', '/webhooks/travis:ci'
    @webhookUrl = url.format urlParts

  configure: ({ isPrivate }, callback) =>
    @_modifyTravis { isPrivate }, (error) =>
      return callback error if error?
      @_modifyDockerignore (error) =>
        return callback error if error?
        @_modifyDockerfile (error) =>
          return callback error if error?
          @_modifyPackage callback

  initVersionFile: (callback) =>
    versionFileName = path.basename @versionFile
    return callback null unless versionFileName == 'VERSION'
    fs.access @versionFile, fs.constants.F_OK, (error) =>
      return callback null unless error?
      @_modifyVersionFile { tag: '1.0.0' }, callback

  modifyVersion: ({ tag }, callback) =>
    debug 'modifyVersion', { tag }
    versionFileName = path.basename @versionFile
    return @_modifyGoVersionFile { tag }, callback if versionFileName == 'version.go'
    return @_modifyPackageVersion { tag }, callback if versionFileName == 'package.json'
    return @_modifyVersionFile { tag }, callback

  _modifyPackageVersion: ({ tag }, callback) =>
    packageJSON = fs.readJsonSync @packagePath
    packageJSON.version = semver.clean tag
    fs.writeJson @packagePath, packageJSON, { spaces: 2 }, callback

  _modifyVersionFile: ({ tag }, callback) =>
    fs.writeFile @versionFile, tag, callback

  _modifyGoVersionFile: ({ tag }, callback) =>
    fs.readFile @versionFile, 'utf8', (error, contents) =>
      return callback error if error?
      contents = _.replace(contents, semverRegex(), tag)
      fs.writeFile @versionFile, contents, callback

  _modifyPackage: (callback) =>
    return callback() unless @type == 'node'
    packageJSON = fs.readJsonSync @packagePath
    orgPackage = _.cloneDeep packageJSON
    packageJSON.scripts ?= {}
    packageJSON.scripts['test'] ?= 'mocha'
    packageJSON.scripts['coverage'] ?= 'nyc npm test'
    packageJSON.scripts['mocha:json'] ?= 'env NPM_ENV=test mocha --reporter json > coverage/mocha.json'
    packageJSON.scripts['test:watch'] ?= 'mocha -w -R mocha-multi --reporter-options spec=-,mocha-osx-reporter=-'
    packageJSON.devDependencies ?= {}
    packageJSON.devDependencies['nyc'] ?= '^10.1.2'
    packageJSON.devDependencies['mocha-osx-reporter'] ?= '^0.1.2'
    packageJSON.devDependencies['mocha-multi'] ?= '^0.10.0'
    packageJSON.devDependencies['mocha'] ?= '^3.2.0'
    packageJSON.nyc ?= {
      cache: true
      reporter: [
        'text-summary'
        'lcov'
        'json'
      ]
      extension: [
        '.coffee'
      ]
    }
    return callback null if _.isEqual packageJSON, orgPackage
    console.log colors.magenta('NOTICE'), colors.white('modifying package.json - make sure you run npm install')
    fs.writeJson @packagePath, packageJSON, { spaces: 2 }, callback

  _defaultTravisFile: () =>
    if @type == 'node'
      return {
        language: 'node_js'
        node_js: ['8']
        branches:
          only: ["/^v[0-9]/"]
      }
    if @type == 'golang'
      return {
        language: 'go'
        go: ['1.9']
        branches:
          only: ["/^v[0-9]/"]
      }
    return { }

  _initTravisIfNeed: (callback) =>
    fs.access @travisYml, fs.constants.F_OK | fs.constants.W_OK, (error) =>
      return callback null unless error?
      console.log colors.magenta('NOTICE'), colors.white('creating .travis.yml')
      yaml.write @travisYml, @_defaultTravisFile(), callback

  _modifyTravis: ({ isPrivate }, callback) =>
    @_initTravisIfNeed (error) =>
      return callback error if error?
      yaml.read @travisYml, (error, data) =>
        return callback error if error?
        return callback new Error('Missing .travis.yml') unless data?
        orgData = _.cloneDeep data
        type = 'pro' if isPrivate
        type ?= 'org'
        _.set data, 'notifications.webhooks', [@webhookUrl]
        data.after_success ?= []
        after_success = []
        if @type == 'node'
          after_success = [
            'bash <(curl -s https://codecov.io/bash)'
            'bash <(curl -s https://codecov.octoblu.com/bash)'
          ]
        _.pullAll data.after_success, after_success
        data.after_success = _.concat data.after_success, after_success
        delete data.after_success if _.isEmpty data.after_success
        return callback null if _.isEqual orgData, data
        console.log colors.magenta('NOTICE'), colors.white('modifying .travis.yml')
        yaml.write @travisYml, data, callback

  _modifyDockerfile: (callback) =>
    return callback null unless @type == 'node'
    console.log colors.magenta('NOTICE'), colors.white('use an octoblu base image in your Dockerfile')
    console.log '  ', colors.cyan('Web Service:'), colors.white('`FROM octoblu/node:8-webservice-onbuild`')
    console.log '  ', colors.cyan('Worker:     '), colors.white('`FROM octoblu/node:8-worker-onbuild`')
    console.log '  ', colors.cyan('Static Site:'), colors.white('`FROM octoblu/node:8-staticsite-onbuild`')
    console.log '  ', colors.cyan('Other:      '), colors.white('`FROM octoblu/node:8-alpine-gyp`')
    callback null

  _modifyDockerignore: (callback) =>
    @_getFile @dockerignorePath, (error, contents) =>
      return callback error if error?
      newContents = contents.replace('test\n', '')
      return callback null if contents == newContents
      console.log colors.magenta('NOTICE'), colors.white('modifying .dockerignore')
      fs.writeFile @dockerignorePath, "#{newContents}\n", callback

  _getFile: (filePath, callback) =>
    fs.access filePath, fs.constants.R_OK, (error) =>
      return callback null, '' if _.get(error, 'code') == 'ENOENT'
      return callback error if error?
      fs.readFile filePath, 'utf8', (error, contents='') =>
        return callback error if error?
        callback null, contents.toString()

module.exports = ProjectService
