_      = require 'lodash'
path   = require 'path'
url    = require 'url'
yaml   = require 'node-yaml'
colors = require 'colors'
fs     = require 'fs'
debug  = require('debug')('beekeeper-util:project-service')

class ProjectService
  constructor: ({ config }) ->
    throw new Error 'Missing config argument' unless config?
    { beekeeperUri, projectRoot } = config
    throw new Error 'Missing beekeeperUri in config' unless @beekeeperUri?
    throw new Error 'Missing projectRoot in config' unless @projectRoot?
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

  _getPackage: =>
    try
      return _.cloneDeep require @packagePath
    catch error
      debug 'package.json require error', error

  _modifyPackage: (callback) =>
    packageJSON = @_getPackage()
    return callback() unless packageJSON?
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
    packageStr = JSON.stringify(packageJSON, null, 2)
    fs.writeFile @packagePath, "#{packageStr}\n", callback

  _modifyTravis: ({ isPrivate }, callback) =>
    yaml.read @travisYml, (error, data) =>
      return callback error if error?
      return callback new Error('Missing .travis.yml') unless data?
      orgData = _.cloneDeep data
      type = 'pro' if isPrivate
      type ?= 'org'
      _.set data, 'notifications.webhooks', [@webhookUrl]
      data.after_success ?= []
      after_success = [
        'npm run coverage'
        'npm run mocha:json'
        'bash <(curl -s https://codecov.io/bash)'
        'bash <(curl -s https://codecov.octoblu.com/bash)'
      ]
      _.pullAll data.after_success, after_success
      data.after_success = _.concat data.after_success, after_success
      return callback null if _.isEqual orgData, data
      console.log colors.magenta('NOTICE'), colors.white('modifying .travis.yml')
      yaml.write @travisYml, data, callback

  _modifyDockerfile: (callback) =>
    @_getFile @dockerFilePath, (error, contents) =>
      return callback error if error?
      if _.includes contents, 'FROM node'
        console.log colors.magenta('NOTICE'), colors.white('use an octoblu base image in your Dockerfile')
        console.log '  ', colors.cyan('Web Service:'), colors.white('`FROM octoblu/node:7-webservice-onbuild`')
        console.log '  ', colors.cyan('Worker:     '), colors.white('`FROM octoblu/node:7-worker-onbuild`')
        console.log '  ', colors.cyan('Static Site:'), colors.white('`FROM octoblu/node:7-staticsite-onbuild`')
        console.log '  ', colors.cyan('Other:      '), colors.white('`FROM octoblu/node:7-alpine-gyp`')
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
