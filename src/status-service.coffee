_           = require 'lodash'
url         = require 'url'
colors      = require 'colors'
moment      = require 'moment'
path        = require 'path'
request     = require 'request'
cliClear    = require 'cli-clear'
notifier    = require 'node-notifier'

Config           = require './config'
BeekeeperService = require './beekeeper-service'

class StatusService
  constructor: (options) ->
    {
      @repo
      @owner
      @tag
      @json
      @watch
      @exit
      @notify
      serviceUrl
    } = options
    @serviceUrl = @getServiceUrl serviceUrl
    @config = new Config()
    @beekeeperService = new BeekeeperService { config: @config.get() }

  getServiceUrl: (serviceUrl) =>
    return unless serviceUrl?
    unless _.includes serviceUrl, 'http'
      serviceUrl = "https://#{serviceUrl}"
    urlParts = url.parse serviceUrl, true
    urlParts.pathname = '/version'
    urlParts.protocol ?= 'https'
    urlParts.slashes = true
    return url.format urlParts

  run: =>
    @start()
    @beekeeperService.getTag { @repo, @owner, @tag }, (error, deployment, latest) =>
      return @die error if error?
      return @printJSON deployment if @json
      @printHeader "#{@owner}/#{@repo}:#{@tag}" unless deployment?
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
    return @waitForVersion() if @serviceUrl? && passing
    @doNotify() if passing
    return process.exit(0) if @exit && passing
    return _.delay @run, 10000 if @watch
    process.exit exitCode

  doNotify: =>
    return unless @notify
    notifier.notify {
      title: 'Beekeeper'
      subtitle: "#{@repo}:#{@tag}"
      message: 'Service Deployed!'
      icon: path.join(__dirname, '..', 'assets', 'beekeeper.png')
      sound: true
      open: @serviceUrl
    }

  waitForVersion: =>
    @checkVersion (error, passing) =>
      return @die error if error?
      @printVersionResult { passing }
      return _.delay @waitForVersion, 1000 unless passing
      @doNotify()
      process.exit 0

  checkVersion: (callback) =>
    request.get @serviceUrl, { json: true }, (error, response, body) =>
      return callback error if error?
      tag = @tag.replace 'v', ''
      callback null, body.version == tag

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

  printVersionResult: ({ passing }) =>
    if passing
      message = "Service is running #{@tag}!"
      console.log "#{colors.cyan(message)}   "
    else
      message = "Waiting for service to run #{@tag}..."
      console.log "#{colors.yellow(message)}   "
    console.log ''

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

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.stack
    process.exit 1

module.exports = StatusService
