_           = require 'lodash'
colors      = require 'colors'
program     = require 'commander'
packageJSON = require './package.json'

Config           = require './src/config'
BeekeeperService = require './src/beekeeper-service'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '-o, --owner <octoblu>', 'Project owner'
  .option '-j, --json', 'Print JSON'

class Command
  constructor: ->
    process.on 'uncaughtException', @die
    @config = new Config()
    @beekeeperService = new BeekeeperService { config: @config.get() }

  parseOptions: =>
    program.parse process.argv
    repo = program.args[0]
    repo ?= @config.getPackageName()

    { owner, json } = program
    owner ?= 'octoblu'

    @dieHelp new Error 'Missing repo' unless repo?

    return { repo, owner, json: json? }

  run: =>
    {repo, owner, json} = @parseOptions()
    @beekeeperService.getLatest { repo, owner }, (error, deployment) =>
      return @die error if error?
      return console.log JSON.stringify deployment, null, 2 if json
      console.log "#{colors.cyan('Docker URL')} :", deployment.docker_url
      console.log "#{colors.cyan('Passing')}    :", deployment.ci_passing
      console.log "#{colors.cyan('Created At')} :", deployment.created_at
      process.exit 0

  dieHelp: (error) =>
    program.outputHelp()
    return @die error

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.stack
    process.exit 1

module.exports = Command
