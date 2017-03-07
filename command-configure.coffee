async         = require 'async'
colors        = require 'colors'
program       = require 'commander'
debug         = require('debug')('beekeeper-util:command-configure')

Config           = require './src/config.coffee'
QuayService      = require './src/quay-service.coffee'
DockerHubService = require './src/docker-hub-service.coffee'
ProjectService   = require './src/project-service.coffee'
CodefreshService = require './src/codefresh-service.coffee'

packageJSON   = require './package.json'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '-o, --owner <octoblu>', 'Project owner'
  .option '-p, --private', 'Add this flag if the project is private'
  .option '--docker-hub-token <docker-hub-token>', 'Docker Hub login token. (env: DOCKER_HUB_LOGIN_TOKEN)'
  .option '--quay-token <quay-token>', 'Quay API Token. (env: QUAY_TOKEN)'
  .option '--codefresh-token <codefresh-token>', 'Codefresh API Token. (env: CODEFRESH_TOKEN)'

class Command
  constructor: ->
    process.on 'uncaughtException', @die
    @config = new Config()
    {
      @repo
      @owner
      @isPrivate
      dockerHubToken
      quayToken
      codefreshToken
    } = @parseOptions()
    debug 'quayToken', quayToken
    @projectService = new ProjectService { config: @config.get() }
    @quayService = new QuayService { config: @config.get(), quayToken }
    @dockerHubService = new DockerHubService { config: @config.get(), dockerHubToken }
    @codefreshService = new CodefreshService { config: @config.get(), codefreshToken }

  parseOptions: =>
    program.parse process.argv

    repo = @config.getName(program.args[0])

    { owner, quayToken, dockerHubToken, codefreshToken } = program

    owner ?= 'octoblu'
    quayToken ?= process.env.QUAY_TOKEN
    dockerHubToken ?= process.env.DOCKER_HUB_LOGIN_TOKEN
    codefreshToken ?= process.env.CODEFRESH_TOKEN

    @dieHelp new Error 'Missing QUAY_TOKEN' unless quayToken?
    @dieHelp new Error 'Missing DOCKER_HUB_LOGIN_TOKEN' unless dockerHubToken?
    @dieHelp new Error 'Missing CODEFRESH_TOKEN' unless codefreshToken?

    isPrivate = program.private?

    return { repo, owner, isPrivate, quayToken, dockerHubToken, codefreshToken }

  run: =>
    async.parallel [
      async.apply @projectService.configure, { @isPrivate }
      async.apply @quayService.configure, { @repo, @owner, @isPrivate }
      async.apply @dockerHubService.configure, { @repo, @owner, @isPrivate }
      async.apply @codefreshService.configure, { @repo, @owner, @isPrivate }
    ], (error) =>
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
