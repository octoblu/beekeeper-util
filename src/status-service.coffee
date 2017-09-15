_           = require 'lodash'
get         = require 'lodash/fp/get'
url         = require 'url'
colors      = require 'colors'
moment      = require 'moment'
path        = require 'path'
request     = require 'request'
cliClear    = require 'cli-clear'
notifier    = require 'node-notifier'
semver      = require 'semver'

BeekeeperService = require './beekeeper-service'

class StatusService
  constructor: ({ options, @config }) ->
    {
      @repo
      @owner
      @tag
      @json
      @watch
      @exit
      @notify
      serviceUrl
      @filter
    } = options
    @serviceUrl = @getServiceUrl serviceUrl
    @beekeeperService = new BeekeeperService { @config }

  getServiceUrl: (serviceUrl) =>
    return unless serviceUrl?
    unless _.startsWith serviceUrl, 'http'
      serviceUrl = "https://#{serviceUrl}"
    urlParts = url.parse serviceUrl, true
    urlParts.pathname = '/version'
    urlParts.protocol ?= 'https'
    urlParts.slashes = true
    return url.format urlParts

  run: =>
    @clear()
    @beekeeperService.getTag { @repo, @owner, @tag, @filter }, (error, deployment, latest) =>
      return @die error if error?
      return @printJSON deployment if @json
      @printHeader "#{@owner}/#{@repo}:v#{@tag}" unless deployment?
      return @printNotFound() unless deployment?
      @printDeployHeader { latest, deployment }
      if deployment.ci_passing? and not deployment.ci_passing
        return @printFailed deployment, 'CI failed'
      if deployment.ci_passing and deployment.docker_url?
        return @printPassing deployment, 'CI passed but no docker build'
      @printPending deployment

  clear: =>
    return unless @watch
    cliClear()
    console.log '[refreshed at] ', colors.cyan moment().toString()

  end: ({ exitCode, pending, passing, notFound }) =>
    return _.delay @waitForVersion, 3000 if @serviceUrl? && passing
    return _.delay @run, 10000 if @watch and pending
    @doNotify { passing, notFound }
    process.exit exitCode if pending

  doNotify: ({ passing, notFound }) =>
    return unless @notify
    message = 'Service Deployed!'
    sound   = 'Purr'
    unless passing
      message = 'Deployment Failed!'
      sound = 'Basso'
    if notFound
      message = 'Deployment Not Found!'
      sound   = 'Funk'
    notifier.notify {
      title: 'Beekeeper'
      subtitle: "#{@repo}:v#{@tag}"
      message: message
      icon: path.join(__dirname, '..', 'assets', 'beekeeper.png')
      sound: sound
      open: @serviceUrl
      timeout: 10
    }

  waitForVersion: (successCount=0) =>
    @clear()
    @checkVersion (error, matches, currentVersion) =>
      return @die error if error?
      successCount++ if matches
      @printVersionResult { currentVersion }
      return _.delay @waitForVersion, 3000, successCount if successCount <= 3
      @doNotify { passing: true }
      process.exit 0

  checkVersion: (callback) =>
    request.get @serviceUrl, { json: true }, (error, response, body) =>
      return callback error if error?
      currentVersion = semver.clean(get('version', body))
      callback null, semver.eq(@tag, currentVersion), currentVersion

  printJSON: (deployment) =>
    console.log JSON.stringify deployment, null, 2
    @end { exitCode: 0 }

  printHeader: (slug) =>
    console.log ''
    console.log "#{colors.cyan('Deployment:')}", slug

  printDeployHeader: ({ latest, deployment }) =>
    return unless deployment?
    latestSlug = "#{latest.owner_name}/#{latest.repo_name}:v#{semver.clean(latest.tag)}" if latest?
    deploymentSlug = "#{deployment.owner_name}/#{deployment.repo_name}:v#{semver.clean(deployment.tag)}"
    console.log ''
    colorTitle = (str='') =>
      return colors.cyan(str)
    colorValue = (str='') =>
      return colors.white(str)
    colorList = (arr=[]) =>
      return colors.italic(_.join(arr, ', '))

    if @serviceUrl?
      console.log colors.gray('Service: '), colors.gray(@serviceUrl)

    unless latest?
      console.log colorTitle('There is no latest version, maybe it has never been deployed?')
      console.log colorTitle('Current'), colorValue(deploymentSlug)
    else if semver.eq(deployment.tag, latest.tag)
      console.log colorTitle('Running'), colorValue(deploymentSlug)
    else
      console.log colorTitle('Running'), colorValue(latestSlug)
      console.log colorTitle('Current'), colorValue(deploymentSlug)

    unless _.isEmpty deployment.tags
      console.log colorTitle('Tag    '), colorList(deployment.tags)

  printPassing: ({ created_at, docker_url }) =>
    console.log ''
    console.log "#{colors.bold('Build')}   ", colors.green('Passing')
    console.log "#{colors.bold('Docker')}  ", colors.underline(docker_url)
    console.log "#{colors.bold('Created')} ", @prettyDate(created_at)
    console.log ''
    @end { exitCode: 0, passing: true }

  printVersionResult: ({ currentVersion }) =>
    console.log ''
    message = "Service is running v#{currentVersion}!"
    if semver.eq(currentVersion, @tag)
      console.log colors.green(message)
    else
      console.log colors.white(message)
      console.log colors.yellow("Waiting for service to run #{@tag}...")
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
    @end { exitCode: 0, pending: true }

  printFailed: ({ created_at, updated_at }, reason) =>
    console.log ''
    console.log "#{colors.bold('Build')}   ", colors.red('Failed')
    console.log "#{colors.bold('Created')} ", @prettyDate(created_at)
    console.log "#{colors.bold('Reason')}  ", "'#{reason}'"
    console.log ''
    @printComponents updated_at
    console.log ''
    @end { exitCode: 1, passing: false }

  printNotFound: =>
    console.log ''
    console.log "#{colors.bold('Build')} ", colors.yellow.underline('Not found!')
    console.log ''
    @end { exitCode: 1, notFound: true, passing: false }

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
