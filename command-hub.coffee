_             = require 'lodash'
path          = require 'path'
colors        = require 'colors'
program       = require 'commander'
debug         = require('debug')('beekeeper-util:command-hub')

Config           = require './src/config.coffee'
DockerHubService = require './src/docker-hub-service.coffee'
ProjectService    = require './src/project-service.coffee'

packageJSON   = require './package.json'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '-o, --owner <octoblu>', 'Project owner'
  .option '-p, --private', 'Add this flag if the project is private'
  .option '--docker-hub-token <docker-hub-token>', 'Docker Hub login token. (env: DOCKER_HUB_LOGIN_TOKEN)'

class Command
  constructor: ->
    process.on 'uncaughtException', @die
    @config = new Config()
    { @repo, @owner, @isPrivate, dockerHubToken } = @parseOptions()
    @projectService = new ProjectService { config: @config.get(), hubOnly: true }
    @dockerHubService = new DockerHubService { config: @config.get(), dockerHubToken, hubOnly: true }

  parseOptions: =>
    program.parse process.argv

    repo = program.args[0]
    repo ?= @config.getPackageName()

    { owner, dockerHubToken } = program

    owner ?= 'octoblu'
    dockerHubToken ?= process.env.DOCKER_HUB_LOGIN_TOKEN

    @dieHelp new Error 'Missing DOCKER_HUB_LOGIN_TOKEN' unless dockerHubToken?

    isPrivate = program.private?

    return { repo, owner, isPrivate, dockerHubToken }

  run: =>
    @projectService.configure { @isPrivate }, (error) =>
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
