colors      = require 'colors'
program     = require 'commander'
semver      = require 'semver'
packageJSON = require './package.json'

BeekeeperService = require './src/beekeeper-service'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '-t, --tag <tag>', 'Project version'
  .option '-o, --owner <octoblu>', 'Project owner'

class Command
  constructor: (@config) ->
    process.on 'uncaughtException', @die
    @beekeeperService = new BeekeeperService { @config }

  parseOptions: =>
    program.parse process.argv
    repo = program.args[0] || @config.name
    owner = program.owner || @config.owner
    tag = semver.clean(program.tag) || @config.version

    @dieHelp new Error 'Missing repo' unless repo?
    @dieHelp new Error 'Missing tag' unless tag?

    return { repo, owner, tag }

  run: =>
    {repo, owner, tag} = @parseOptions()
    @beekeeperService.delete { repo, owner, tag }, (error) =>
      return @die error if error?
      console.log colors.bold("[DELETED]"), "tag #{tag}"
      @die()

  dieHelp: (error) =>
    console.error error.toString()
    program.outputHelp()
    process.exit 1

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.stack
    process.exit 1

module.exports = Command
