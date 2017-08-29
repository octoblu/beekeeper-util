program     = require 'commander'
packageJSON = require './package.json'

BeekeeperService = require './src/beekeeper-service'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '--type <type>', '(required) webhook type'
  .option '-c, --ci-passing <bool>', 'CI is passing. Defaults to false'
  .option '-t, --tag <tag>', 'Project version (not the tag on the deployment). Defaults to package.version'
  .option '-o, --owner <octoblu>', 'Project owner'

class Command
  constructor: (@config) ->
    process.on 'uncaughtException', @die
    @beekeeperService = new BeekeeperService { @config }

  parseOptions: =>
    program.parse process.argv
    repo = program.args[0] || @config.name

    { type } = program
    owner = program.owner ? @config.owner
    tag ?= program.tag ? @config.version
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
