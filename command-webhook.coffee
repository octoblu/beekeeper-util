program     = require 'commander'
packageJSON = require './package.json'

Config           = require './src/config'
BeekeeperService = require './src/beekeeper-service'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '--type <type>', '(required) webhook type'
  .option '-c, --ci-passing <bool>', 'CI is passing. Defaults to false'
  .option '-t, --tag <tag>', 'Project tag. Defaults to package.version'
  .option '-o, --owner <octoblu>', 'Project owner'

class Command
  constructor: ->
    process.on 'uncaughtException', @die
    @config = new Config()
    beekeeperUri = process.env.BEEKEEPER_URI
    return @dieHelp(new Error('Missing env BEEKEEPER_URI')) unless beekeeperUri?
    @beekeeperService = new BeekeeperService { config: null, beekeeperUri }

  parseOptions: =>
    program.parse process.argv
    repo = @config.getName(program.args[0])

    { owner, tag, type } = program
    owner ?= 'octoblu'
    tag = @config.getVersion(tag)
    ci_passing = program.ciPassing

    @dieHelp new Error 'Missing repo argument' unless repo?
    @dieHelp new Error 'Missing type argument' unless type?

    return { repo, owner, tag, ci_passing, type }

  run: =>
    @beekeeperService.webhook @parseOptions(), (error) =>
      return @die error if error?
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
