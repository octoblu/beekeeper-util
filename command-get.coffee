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
  .option '-l, --latest', 'Override the tag with "latest"'
  .option '-e, --exit', 'When watching exit 0 when it passes'
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
    repo = @config.getName(program.args[0])

    throw new Error '"get" is not a valid project name' if repo == 'get'

    { owner, json, tag, watch, latest, exit } = program
    owner ?= 'octoblu'
    tag = @config.getVersion(tag)
    tag ?= 'latest'
    tag = 'latest' if latest?

    @dieHelp new Error 'Missing repo' unless repo?

    return { repo, owner, json: json?, tag, watch: watch?, exit: exit? }

  run: =>
    {repo, owner, tag, json, @watch, @exit } = @parseOptions()
    @start()
    @beekeeperService.getTag { repo, owner, tag }, (error, deployment, latest) =>
      return @die error if error?
      return @printJSON deployment if json
      @printHeader "#{owner}/#{repo}:#{tag}" unless deployment?
      return @printNotFound() unless deployment?
      @printDeployHeader { latest, deployment }
      if deployment.ci_passing? and not deployment.ci_passing
        return @printFailed deployment, 'CI failed'
      if deployment.ci_passing and deployment.docker_url?
        return @printPassing deployment, 'CI passed but no docker build'
      @printPending deployment

  start: =>
    return unless @watch
    cliClear()
    console.log '[refreshed at] ', colors.cyan moment().toString()

  end: (exitCode, passing) =>
    return process.exit(0) if @exit && passing
    return _.delay @run, 10000 if @watch
    process.exit exitCode

  printJSON: (deployment) =>
    console.log JSON.stringify deployment, null, 2
    @end 0

  printHeader: (slug) =>
    console.log ''
    console.log "#{colors.cyan('Deployment:')}", slug

  printDeployHeader: ({ latest, deployment }) =>
    return unless deployment?
    latestSlug = "#{latest.owner_name}/#{latest.repo_name}:#{latest.tag}" if latest?
    deploymentSlug = "#{deployment.owner_name}/#{deployment.repo_name}:#{deployment.tag}"
    console.log ''
    unless latest?
      console.log "#{colors.cyan('There is no latest version, maybe it has never been deployed?')}"
      console.log colors.bold("#{colors.cyan('Desired:')}"), colors.bold(deploymentSlug)
      return
    else if deployment.tag == latest.tag
      console.log "#{colors.cyan('Running:')}", deploymentSlug
      return
    else
      console.log "#{colors.cyan('Running:')}", latestSlug
      console.log colors.bold("#{colors.cyan('Desired:')}"), colors.bold(deploymentSlug)

  printPassing: ({ created_at, docker_url }) =>
    console.log ''
    console.log "#{colors.bold('Build')}   ", colors.green('Passing')
    console.log "#{colors.bold('Docker')}  ", colors.underline(docker_url)
    console.log "#{colors.bold('Created')} ", @prettyDate(created_at)
    console.log ''
    @end 0, true

  printPending: ({ ci_passing, docker_url, created_at, updated_at }) =>
    waitlist = []
    waitlist.push '"CI Build"' unless ci_passing?
    waitlist.push '"Docker URL"' unless docker_url?
    console.log ''
    console.log "#{colors.bold('Build')}     ", colors.yellow('Pending...')
    console.log "#{colors.bold('Waiting on')}", colors.magenta(waitlist.join(', '))
    console.log "#{colors.bold('Created')}   ", @prettyDate(created_at)
    @printComponents updated_at
    console.log ''
    @end 0, false

  printFailed: ({ created_at, updated_at }, reason) =>
    console.log ''
    console.log "#{colors.bold('Build')}   ", colors.red('Failed')
    console.log "#{colors.bold('Created')} ", @prettyDate(created_at)
    console.log "#{colors.bold('Reason')}  ", "'#{reason}'"
    console.log ''
    @printComponents updated_at
    console.log ''
    @end 1, false

  printNotFound: =>
    console.log ''
    console.log "#{colors.bold('Build')} ", colors.yellow.underline('Not found!')
    console.log ''
    @end 1, false

  printComponents: (components) =>
    return console.log("#{colors.bold('No completed components')}") if _.isEmpty components
    console.log "#{colors.bold('Completed Components')} "
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
