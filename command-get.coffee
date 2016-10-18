_           = require 'lodash'
colors      = require 'colors'
program     = require 'commander'
moment      = require 'moment'
cliClear    = require 'cli-clear'
packageJSON = require './package.json'

Config           = require './src/config'
BeekeeperService = require './src/beekeeper-service'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '-t, --tag <tag>', 'Project tag. Defaults to package.version'
  .option '-o, --owner <octoblu>', 'Project owner'
  .option '-w, --watch', 'Watch deployment'
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

    { owner, json, tag, watch } = program
    owner ?= 'octoblu'
    tag   ?= @config.getPackageVersion()
    tag   ?= 'latest'

    @dieHelp new Error 'Missing repo' unless repo?

    return { repo, owner, json: json?, tag, watch: watch? }

  run: =>
    {repo, owner, tag, json, @watch} = @parseOptions()
    cliClear() if @watch
    console.log '[refreshed at] ', colors.cyan moment().toString()
    @beekeeperService.getLatest { repo, owner, tag }, (error, deployment) =>
      return @die error if error?
      return @printJSON deployment if json
      return @printNotFound() unless deployment?
      return @printPending deployment unless deployment.ci_passing?
      return @printPassing deployment if deployment.ci_passing
      return @printFailed deployment unless deployment.ci_passing
      @end 0

  end: (exitCode) =>
    return _.delay @run, 10000 if @watch
    process.exit exitCode

  printJSON: (deployment) =>
    console.log JSON.stringify deployment, null, 2
    @end 0

  printPassing: ({ created_at, docker_url }) =>
    console.log ''
    console.log "#{colors.bold('Build')}   ",  colors.green('Passing')
    console.log "#{colors.bold('Docker')}  ",  colors.underline(docker_url)
    console.log "#{colors.bold('Created')} ", @prettyDate(created_at)
    console.log ''
    @end 0

  printPending: ({ created_at, updated_at }) =>
    console.log ''
    console.log "#{colors.bold('Build')}   ", colors.yellow('Pending')
    console.log "#{colors.bold('Created')} ", @prettyDate(created_at)
    @printComponents updated_at
    console.log ''
    @end 0

  printFailed: ({ created_at, updated_at }) =>
    console.log ''
    console.log "#{colors.bold('Build')}   ", colors.red('Failed')
    console.log "#{colors.bold('Created')} ", @prettyDate(created_at)
    @printComponents updated_at
    console.log ''
    @end 1

  printNotFound: =>
    console.log ''
    console.log "#{colors.bold('Build')} ", colors.yellow.underline('Not found!')
    console.log ''
    @end 1

  printComponents: (components) =>
    return console.log("#{colors.bold('No passing components')}") if _.isEmpty components
    console.log "#{colors.bold('Passing Components')} "
    _.each components, (date, key) =>
      console.log "  #{colors.cyan(key)} ", @prettyDate(date)

  prettyDate: (date) =>
    return "@ #{colors.gray(moment(date).fromNow())}"

  dieHelp: (error) =>
    program.outputHelp()
    return @die error

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.stack
    process.exit 1

module.exports = Command
