colors      = require 'colors'
program     = require 'commander'
moment      = require 'moment'
packageJSON = require './package.json'

Config           = require './src/config'
BeekeeperService = require './src/beekeeper-service'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
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

    throw new Error '"delete" is not a valid project name' if repo == 'delete'

    { owner, tag } = program
    owner ?= 'octoblu'
    tag ?= @config.getVersion(tag)

    @dieHelp new Error 'Missing repo' unless repo?
    @dieHelp new Error 'Missing tag' unless tag?

    return { repo, owner, tag }

  run: =>
    {repo, owner, tag} = @parseOptions()
    @beekeeperService.delete { repo, owner, tag }, (error) =>
      return @die error if error?
      console.log '[deleted at] ', colors.cyan moment().toString()
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
