_             = require 'lodash'
path          = require 'path'
colors        = require 'colors'
program       = require 'commander'
debug         = require('debug')('beekeeper-util:command-configure')

Config           = require './src/config.coffee'
QuayService      = require './src/quay-service.coffee'
DockerHubService = require './src/docker-hub-service.coffee'
ProjectService    = require './src/project-service.coffee'

packageJSON   = require './package.json'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '-o, --owner <octoblu>', 'Project owner'
  .option '-p, --private', 'Add this flag if the project is private'
  .option '--docker-hub-token <docker-hub-token>', 'Docker Hub login token. (env: DOCKER_HUB_LOGIN_TOKEN)'
  .option '--quay-token <quay-token>', 'Quay API Token. (env: QUAY_TOKEN)'

class Command
  constructor: ->
    process.on 'uncaughtException', @die
    @config = new Config()
    { @repo, @owner, @isPrivate, dockerHubToken, quayToken } = @parseOptions()
    debug 'quayToken', quayToken
    @projectService = new ProjectService { config: @config.get() }
    @quayService = new QuayService { config: @config.get(), quayToken }
    @dockerHubService = new DockerHubService { config: @config.get(), dockerHubToken }

  parseOptions: =>
    program.parse process.argv

    repo = @config.getName(program.args[0])

    { owner, quayToken, dockerHubToken } = program

    owner ?= 'octoblu'
    quayToken ?= process.env.QUAY_TOKEN
    dockerHubToken ?= process.env.DOCKER_HUB_LOGIN_TOKEN

    @dieHelp new Error 'Missing QUAY_TOKEN' unless quayToken?
    @dieHelp new Error 'Missing DOCKER_HUB_LOGIN_TOKEN' unless dockerHubToken?

    isPrivate = program.private?

    return { repo, owner, isPrivate, quayToken, dockerHubToken }

  run: =>
    @projectService.configure { @isPrivate }, (error) =>
      return @die error if error?
      @quayService.configure { @repo, @owner, @isPrivate }, (error) =>
        return @die error if error?
        @dockerHubService.configure { @repo, @owner, @isPrivate }, (error) =>
          return @die error if error?
          console.log colors.green('SUCCESS'), colors.white('it has been done. Gump it when ready.')
          process.exit 0

  dieHelp: (error) =>
    program.outputHelp()
    return @die error

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.stack
    process.exit 1

module.exports = Command
