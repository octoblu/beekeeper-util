async             = require 'async'
colors            = require 'colors'
program           = require 'commander'
debug             = require('debug')('beekeeper-util:command-configure')

Config            = require './src/config.coffee'
QuayService       = require './src/quay-service.coffee'
DockerHubService  = require './src/docker-hub-service.coffee'
ProjectService    = require './src/project-service.coffee'
CodefreshService  = require './src/codefresh-service.coffee'
TravisService     = require './src/travis-service.coffee'
CodecovService    = require './src/codecov-service.coffee'
GithubService     = require './src/github-service.coffee'

packageJSON       = require './package.json'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '-o, --owner <octoblu>', 'Project owner'
  .option '--docker-hub-token <docker-hub-token>', 'Docker Hub login token. (env: DOCKER_HUB_LOGIN_TOKEN)'
  .option '--quay-token <quay-token>', 'Quay API Token. (env: QUAY_TOKEN)'
  .option '--codefresh-token <codefresh-token>', 'Codefresh API Token. (env: CODEFRESH_TOKEN)'
  .option '--github-token <github-token>', 'Github API Token. (env: GITHUB_TOKEN)'
  .option '--codecov-token <codecov-token>', 'Codecov API Token. (env: CODECOV_TOKEN)'

class Command
  constructor: ->
    process.on 'uncaughtException', @die
    @config = new Config()
    {
      @repo
      @owner
      dockerHubToken
      quayToken
      codefreshToken
      githubToken
      codecovToken
    } = @parseOptions()
    @projectService = new ProjectService { config: @config.get() }
    @quayService = new QuayService { config: @config.get(), quayToken }
    @dockerHubService = new DockerHubService { config: @config.get(), dockerHubToken }
    @codefreshService = new CodefreshService { config: @config.get(), codefreshToken }
    @travisService = new TravisService { config: @config.get(), githubToken }
    @codecovService = new CodecovService { config: @config.get(), codecovToken, @travisService }
    @githubService = new GithubService { config: @config.get(), githubToken }

  parseOptions: =>
    program.parse process.argv

    repo = @config.getName(program.args[0])

    { owner, quayToken, dockerHubToken, codefreshToken, githubToken, codecovToken } = program

    owner ?= 'octoblu'
    quayToken ?= process.env.QUAY_TOKEN
    dockerHubToken ?= process.env.DOCKER_HUB_LOGIN_TOKEN
    codefreshToken ?= process.env.CODEFRESH_TOKEN
    githubToken ?= process.env.GITHUB_TOKEN
    codecovToken ?= process.env.CODECOV_TOKEN

    @dieHelp new Error 'Missing QUAY_TOKEN' unless quayToken?
    @dieHelp new Error 'Missing DOCKER_HUB_LOGIN_TOKEN' unless dockerHubToken?
    @dieHelp new Error 'Missing CODEFRESH_TOKEN' unless codefreshToken?
    @dieHelp new Error 'Missing GITHUB_TOKEN' unless githubToken?
    @dieHelp new Error 'Missing CODECOV_TOKEN' unless codecovToken?

    return {
      repo
      owner
      quayToken
      dockerHubToken
      codefreshToken
      githubToken
      codecovToken
    }

  run: =>
    @githubService.getRepo { @repo, @owner }, (error, githubRepo) =>
      return callback error if error?

      @isPrivate = githubRepo.private

      async.parallel [
        async.apply @travisService.configure, { @repo, @owner, @isPrivate }
        async.apply @codecovService.configure, { @repo, @owner, @isPrivate }
        async.apply @codecovService.configureEnv, { @repo, @owner, @isPrivate }
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
