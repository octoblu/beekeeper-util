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
    @travisYml = path.join process.cwd(), '.travis.yml'
    @packagePath = path.join process.cwd(), 'package.json'
    @dockerFilePath = path.join process.cwd(), 'Dockerfile'
    @dockerignorePath = path.join process.cwd(), '.dockerignore'
    @webhookUrl = url.format {
      hostname: config['beekeeper'].hostname,
      protocol: 'https',
      slashes: true,
      pathname: '/webhooks/travis:ci'
    }

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
    packageJSON = @_getPackage()
    return callback null unless packageJSON?
    fs.readFile @dockerFilePath, (error, contents) =>
      return callback error if error?
      contents = contents.toString()
      if _.some packageJSON.dependencies, 'express' and !_.includes contents, 'HEALTHCHECK'
        console.log colors.magenta('NOTICE'), colors.white('make sure you add a HEALTHCHECK to your Dockerfile')
        console.log '  ', colors.cyan('Example'), colors.white('`HEALTHCHECK CMD curl --fail http://localhost:80/healthcheck || exit 1`')
      unless _.includes contents, 'node:7-apline'
        console.log colors.yellow('IMPORTANT!!!'), colors.white('Please use node:7-apline in your Dockerfile')
        console.log '  ', colors.cyan('Example'), colors.white('`FROM node:7-alpine`')
      callback null

  _modifyDockerignore: (callback) =>
    fs.readFile @dockerignorePath, (error, contents) =>
      console.error error if error?
      return callback null if error?
      contents = contents.toString()
      newContents = contents.replace('test\n', '')
      return callback null if contents == newContents
      console.log colors.magenta('NOTICE'), colors.white('modifying .dockerignore')
      fs.writeFile @dockerignorePath, "#{newContents}\n", callback

module.exports = ProjectService
