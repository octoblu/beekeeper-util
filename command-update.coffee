colors      = require 'colors'
program     = require 'commander'
packageJSON = require './package.json'

Config           = require './src/config'
BeekeeperService = require './src/beekeeper-service'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '-d, --docker-url <docker-url>', '(required) Docker URL to update'
  .option '-t, --tag <tag>', 'Project tag. Defaults to package.version'
  .option '-o, --owner <octoblu>', 'Project owner'

class Command
  constructor: ->
    process.on 'uncaughtException', @die
    @config = new Config()
    @beekeeperService = new BeekeeperService { config: @config.get() }

  parseOptions: =>
    program.parse process.argv
    repo = @config.getName(program.args[0])

    { owner, tag } = program
    owner ?= 'octoblu'
    tag = @config.getVersion(tag)
    docker_url = program.dockerUrl

    @dieHelp new Error 'Missing repo argument' unless repo?
    @dieHelp new Error 'Missing docker-url argument' unless docker_url?

    return { repo, owner, tag, docker_url }

  run: =>
    {repo, owner, tag, docker_url } = @parseOptions()
    @beekeeperService.update { repo, owner, tag, docker_url }, (error) =>
      return @die error if error?
      process.exit 0

  dieHelp: (error) =>
    program.outputHelp()
    return @die error

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.stack
    process.exit 1

module.exports = Command