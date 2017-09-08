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
    {
      @beekeeper,
      @project,
      @codecov,
      @travis,
    } = config
    if @beekeeper.enabled
      throw new Error 'Missing beekeeper.uri in config' unless @beekeeper.uri?
    throw new Error 'Missing project.root in config' unless @project.root?
    throw new Error 'Missing project.type in config' unless @project.type?
    throw new Error 'Missing project.versionFileName in config' unless @project.versionFileName?
    @travisYml = path.join @project.root, '.travis.yml'
    @packagePath = path.join @project.root, 'package.json'
    @dockerFilePath = path.join @project.root, 'Dockerfile'
    @dockerignorePath = path.join @project.root, '.dockerignore'
    @versionFile = path.join @project.root, @project.versionFileName

  configure: ({ isPrivate }, callback) =>
    @_modifyTravis { isPrivate }, (error) =>
      return callback error if error?
      @_modifyDockerignore (error) =>
        return callback error if error?
        @_modifyDockerfile (error) =>
          return callback error if error?
          @_modifyPackage callback

  initVersionFile: (callback) =>
    return callback null unless @project.versionFileName == 'VERSION'
    fs.access @versionFile, fs.constants.F_OK, (error) =>
      return callback null unless error?
      @modifyVersion { tag: '1.0.0' }, callback

  modifyVersion: ({ tag }, callback) =>
    version = semver.clean(tag)
    debug 'modifyVersion', { tag, version }
    fs.readFile @versionFile, 'utf8', (error, contents) =>
      return callback error if error?
      try
        jsonContents = JSON.parse contents
        _.set jsonContents, 'version', version
        newContents = JSON.stringify jsonContents, null, 2
      catch
        newContents = _.replace contents, semverRegex(), version
      fs.writeFile @versionFile, newContents, callback

  _modifyPackage: (callback) =>
    return callback() unless @project.type == 'node'
    return callback null unless @codecovEnabled
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
    if @project.type == 'node'
      return {
        language: 'node_js'
        node_js: ['8']
        branches:
          only: ["/^v[0-9]/"]
      }
    if @project.type == 'golang'
      return {
        language: 'go'
        go: ['1.9']
        branches:
          only: ["/^v[0-9]/"]
      }
    return { }

  _initTravisIfNeed: (callback) =>
    return callback null unless @travisEnabled
    fs.access @travisYml, fs.constants.F_OK | fs.constants.W_OK, (error) =>
      return callback null unless error?
      console.log colors.magenta('NOTICE'), colors.white('creating .travis.yml')
      yaml.write @travisYml, @_defaultTravisFile(), callback

  _modifyTravis: ({ isPrivate }, callback) =>
    return callback null unless @travisEnabled
    @_initTravisIfNeed (error) =>
      return callback error if error?
      yaml.read @travisYml, (error, data) =>
        return callback error if error?
        return callback new Error('Missing .travis.yml') unless data?
        orgData = _.cloneDeep data
        type = 'pro' if isPrivate
        type ?= 'org'
        if @beekeeper.enabled
          urlParts = url.parse @beekeeper.uri
          _.set urlParts, 'slashes', true
          delete urlParts.auth
          delete urlParts.password
          delete urlParts.username
          _.set urlParts, 'pathname', '/webhooks/travis:ci'
          webhookUrl = url.format urlParts
          _.set data, 'notifications.webhooks', [webhookUrl]
        data.after_success ?= []
        after_success = []
        if @project.type == 'node'
          after_success = [
            'npm run coverage'
            'npm run mocha:json'
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
    return callback null unless @project.type == 'node'
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
