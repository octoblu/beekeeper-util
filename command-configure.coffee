async             = require 'async'
colors            = require 'colors'
program           = require 'commander'

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

class Command
  constructor: (@config) ->
    process.on 'uncaughtException', @die
    { @repo, @owner } = @parseOptions()
    @projectService = new ProjectService { @config }
    @quayService = new QuayService { @config }
    @dockerHubService = new DockerHubService { @config }
    @codefreshService = new CodefreshService { @config }
    @travisService = new TravisService { @config }
    @codecovService = new CodecovService { @config, @travisService }
    @githubService = new GithubService { @config }

  parseOptions: =>
    program.parse process.argv

    repo = program.args[0] || @config.name
    owner = program.owner || @config.owner

    return {
      repo,
      owner
    }

  run: =>
    @githubService.getRepo { @repo, @owner }, (error, githubRepo) =>
      return @die error if error?
      @isPrivate = githubRepo.private
      async.series [
        async.apply @travisService.configure, { @repo, @owner, @isPrivate }
        async.apply @codecovService.configure, { @repo, @owner, @isPrivate }
        async.apply @codecovService.configureEnv, { @repo, @owner, @isPrivate }
        async.apply @projectService.configure, { @isPrivate }
        async.apply @projectService.initVersionFile
        async.apply @quayService.configure, { @repo, @owner, @isPrivate }
        async.apply @dockerHubService.configure, { @repo, @owner, @isPrivate }
        async.apply @codefreshService.configure, { @repo, @owner, @isPrivate }
      ], (error) =>
        return @die error if error?
        console.log colors.green('SUCCESS'), colors.white('it has been done. Gump it when ready.')
        process.exit 0

  dieHelp: (error) =>
    console.error error.toString()
    program.outputHelp()
    process.exit 1

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.stack
    process.exit 1

module.exports = Command
