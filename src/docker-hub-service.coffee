url          = require 'url'
dockerHubApi = require '@octoblu/docker-hub-api'
colors       = require 'colors'
debug        = require('debug')('beekeeper-util:docker-hub-service')

class DockerHubService
  constructor: ({ config, dockerHubToken, @hubOnly }) ->
    throw new Error 'Missing config argument' unless config?
    throw new Error 'Missing dockerHubToken argument' unless dockerHubToken?
    @hubOnly ?= false
    dockerHubApi.setLoginToken(dockerHubToken)
    @webhookUrl = url.format {
      hostname: config['beekeeper'].hostname,
      protocol: 'https',
      slashes: true,
      pathname: '/webhooks/docker:hub'
    }
    debug 'webhookUrl', @webhookUrl

  configure: ({ @repo, @owner, @isPrivate }, callback) =>
    debug 'setting up docker', { @repo, @owner, @isPrivate }
    @_ensureRepository (error) =>
      return callback error if error?
      @_ensureWebhook callback

  _ensureRepository: (callback) =>
    @_repositoryExists (error, exists) =>
      return callback error if error?
      return callback null if exists
      @_createRepository callback

  _ensureWebhook: (callback) =>
    return callback null if @hubOnly
    @_createWebhook (error, webhookId) =>
      return callback error if error?
      return callback null unless webhookId?
      @_createWebhookHook webhookId, callback

  _createRepository: (callback) =>
    debug 'repository does not exist, but I will make it exist'
    details = {
      active: true,
      description: "docker registry for #{@owner}/#{@repo}"
      build_tags: [
        {
          name: '{sourceref}',
          source_name: '/v.*/',
          source_type: 'Tag',
          dockerfile_location: "/",
        }
      ],
      is_private: @isPrivate,
      provider: 'github',
      vcs_repo_name: "#{@owner}/#{@repo}",
    }
    debug 'create respository build details', details
    console.log colors.magenta('NOTICE'), colors.white('creating the repository hub.docker.com')
    dockerHubApi.createAutomatedBuild @owner, @repo, details
      .then (build) =>
        debug 'created automated build', build
        callback null
      .catch (error) =>
        debug 'create automated build failed', error
        callback error

  _repositoryExists: (callback) =>
    debug 'checking if repository exists'
    dockerHubApi.repository(@owner, @repo)
      .then (repository) =>
        debug 'got respository', repository
        callback null, repository?
      .catch (error) =>
        return callback null, false if error.message == 'Object not found'
        debug 'get registory error', error
        callback error

  _createWebhook: (callback) =>
    debug 'creating webhook'
    dockerHubApi.createWebhook @owner, @repo, 'Beekeeper'
      .then (webhook) =>
        debug 'create webhook response', webhook
        if webhook?.name[0].indexOf('already exists') > -1
          debug 'webhook already exists'
          return callback null
        callback null, webhook.id
      .catch (error) =>
        debug 'create webhook failed', error
        return callback null, false if error.message == 'Object not found'
        callback error

  _createWebhookHook: (webhookId, callback) =>
    debug 'creating webhook hook'
    console.log colors.magenta('NOTICE'), colors.white('creating the webhook docker build')
    dockerHubApi.createWebhookHook @owner, @repo, webhookId, @webhookUrl
      .then (hook) =>
        debug 'created webhook hook', hook
        callback null, hook
      .catch (error) =>
        debug 'create webhook hook failed', error
        callback error

module.exports = DockerHubService
