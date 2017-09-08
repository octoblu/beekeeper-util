program     = require 'commander'
semver      = require 'semver'
packageJSON = require './package.json'

StatusService    = require './src/status-service'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '-e, --exit', 'When watching exit 0 when it passes'
  .option '-f, --filter [<tag>,<tag>...]',
    'Filter by beekeeper tag (not related to git tags or the package.version).'
  .option '-j, --json', 'Print JSON'
  .option '-l, --latest', 'Override the tag with "latest"'
  .option '-n, --notify', 'Notify when passing'
  .option '-o, --owner <repo>', 'Project owner'
  .option '-t, --tag <tag>', 'Project version (not the tag on the deployment). Defaults to package.version'
  .option '-u, --service-url <url>', 'Poll <service-url>/version for the updated version'
  .option '-w, --watch', 'Watch deployment'

class Command
  constructor: (@config) ->
    process.on 'uncaughtException', @die
    @statusService = new StatusService { options: @parseOptions(), @config }

  parseOptions: =>
    program.parse process.argv
    {
      json
      watch
      latest
      exit
      notify
      serviceUrl
      filter
    } = program
    repo = program.args[0] || @config.project.name
    owner = program.owner || @config.project.owner
    tag = semver.valid(program.tag) || @config.project.version
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
      filter
    }

  run: =>
    return @die new Error('Beekeeper must be enabled') unless @config.beekeeper.enabled
    @statusService.run()

  dieHelp: (error) =>
    console.error error.toString()
    program.outputHelp()
    process.exit 1

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.stack
    process.exit 1

module.exports = Command
