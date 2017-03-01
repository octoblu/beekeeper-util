program     = require 'commander'
packageJSON = require './package.json'

Config           = require './src/config'
StatusService    = require './src/status-service'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '-t, --tag <tag>', 'Project tag. Defaults to package.version'
  .option '-l, --latest', 'Override the tag with "latest"'
  .option '-e, --exit', 'When watching exit 0 when it passes'
  .option '-o, --owner <octoblu>', 'Project owner'
  .option '-w, --watch', 'Watch deployment'
  .option '-n, --notify', 'Notify when passing'
  .option '-u, --service-url <url>', 'Poll <service-url>/version for the updated version'
  .option '-j, --json', 'Print JSON'

class Command
  constructor: ->
    process.on 'uncaughtException', @die
    @config = new Config()
    @statusService = new StatusService @parseOptions()

  parseOptions: =>
    program.parse process.argv
    repo = @config.getName program.args[0]

    throw new Error '"get" is not a valid project name' if repo == 'get'

    {
      owner
      json
      tag
      watch
      latest
      exit
      notify
      serviceUrl
    } = program
    owner ?= 'octoblu'
    tag = @config.getVersion(tag)
    tag ?= 'latest'
    tag = 'latest' if latest?

    @dieHelp new Error 'Missing repo' unless repo?

    return {
      repo
      owner
      json: json?
      tag
      watch: watch?
      exit: exit?
      notify: notify?
      serviceUrl
    }

  run: =>
    @statusService.run()

  dieHelp: (error) =>
    program.outputHelp()
    return @die error

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.stack
    process.exit 1

module.exports = Command
