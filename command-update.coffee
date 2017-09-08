program     = require 'commander'
semver      = require 'semver'
packageJSON = require './package.json'

BeekeeperService = require './src/beekeeper-service'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '-d, --docker-url <docker-url>', '(required) Docker URL to update'
  .option '-t, --tag <tag>', 'Project version (not the tag on the deployment). Defaults to package.version'
  .option '-o, --owner <repo>', 'Project owner'

class Command
  constructor: (@config) ->
    process.on 'uncaughtException', @die
    @beekeeperService = new BeekeeperService { @config }

  parseOptions: =>
    program.parse process.argv
    repo = program.args[0] || @config.project.name

    owner = program.owner || @config.project.owner
    tag = semver.valid(program.tag) || @config.project.version
    docker_url = program.dockerUrl

    @dieHelp new Error 'Missing repo argument' unless repo?
    @dieHelp new Error 'Missing docker-url argument' unless docker_url?

    return { repo, owner, tag, docker_url }

  run: =>
    return @die new Error('Beekeeper must be enabled') unless @config.beekeeper.enabled
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
