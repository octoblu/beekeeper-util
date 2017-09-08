async             = require 'async'
colors            = require 'colors'
program           = require 'commander'

Spinner          = require './src/spinner'
QuayService      = require './src/quay-service'
DockerHubService = require './src/docker-hub-service'
ProjectService   = require './src/project-service'
CodefreshService = require './src/codefresh-service'
TravisService    = require './src/travis-service'
CodecovService   = require './src/codecov-service'
GithubService    = require './src/github-service'

packageJSON       = require './package.json'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '-o, --owner <repo>', 'Project owner'

class Command
  constructor: (@config) ->
    @spinner = new Spinner()
    @spinner.start 'Starting Beekeeper'
    process.on 'uncaughtException', @die
    { @repo, @owner } = @parseOptions()
    @projectService = new ProjectService { @config, @spinner }
    @quayService = new QuayService { @config, @spinner }
    @dockerHubService = new DockerHubService { @config, @spinner }
    @codefreshService = new CodefreshService { @config, @spinner }
    @travisService = new TravisService { @config, @spinner }
    @codecovService = new CodecovService { @config, @travisService, @spinner }
    @githubService = new GithubService { @config, @spinner }

  parseOptions: =>
    program.parse process.argv

    repo = program.args[0] || @config.project.name
    owner = program.owner || @config.project.owner

    return {
      repo,
      owner
    }

  run: =>
    @githubService.getRepo { @repo, @owner }, (error, githubRepo) =>
      return @die error if error?
      @isPrivate = githubRepo.private
      @spinner.log("Configuring #{@owner}/#{@repo}", '🐝')
      @spinner.start("Configuring")
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
        @spinner.succeed 'Configured!'
        process.exit 0

  dieHelp: (error) =>
    console.error error.toString()
    program.outputHelp()
    process.exit 1

  die: (error) =>
    return process.exit(0) unless error?
    @spinner.warn()
    @spinner.fail error.toString()
    console.error error.stack
    process.exit 1

module.exports = Command
