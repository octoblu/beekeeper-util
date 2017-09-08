_            = require 'lodash'
url          = require 'url'
dockerHubApi = require '@octoblu/docker-hub-api'
colors       = require 'colors'
debug        = require('debug')('beekeeper-util:docker-hub-service')

class DockerHubService
  constructor: ({ config }) ->
    throw new Error 'Missing config argument' unless config?
    {
      @beekeeper,
      @dockerHub
    } = config
    if @dockerHub.enabled
      throw new Error 'Missing dockerHub.username in config' unless @dockerHub.username?
      throw new Error 'Missing dockerHub.password in config' unless @dockerHub.password?
    if @beekeeper.enabled
      throw new Error 'Missing beekeeper.uri in config' unless @beekeeper.uri?
    urlParts = url.parse @beekeeper.uri
    _.set urlParts, 'slashes', true
    _.set urlParts, 'pathname', '/webhooks/docker:hub'
    @webhookUrl = url.format urlParts
    debug 'webhookUrl', @webhookUrl

  configure: ({ @repo, @owner, @isPrivate, @noWebhook }, callback) =>
    return callback null unless @dockerHub.enabled
    debug 'setting up docker', { @repo, @owner, @isPrivate, @noWebhook }
    dockerHubApi.login @dockerHub.username, @dockerHub.password
      .then (info) =>
        dockerHubApi.setLoginToken info.token
        @_ensureRepository (error) =>
          return callback error if error?
          @_ensureWebhook callback
        return
      .catch (error) =>
        callback error
    return

  _ensureRepository: (callback) =>
    @_getRepository (error, repo) =>
      return callback error if error?
      @_deleteBuildTag repo, (error) =>
        return callback error if error?
        @_createRepository callback

  _ensureWebhook: (callback) =>
    return callback null unless @beekeeper.enabled
    return callback null if @noWebhook
    @_createWebhookV2 (error, webhookId) =>
      return callback error if error?
      return callback null unless webhookId?
      @_removeV1Webhook (error) =>
        return callback error if error?
        @_createWebhookHook webhookId, callback

  _createRepository: (callback) =>
    debug 'repository does not exist, but I will make it exist'
    details = {
      active: true,
      description: "docker registry for #{@owner}/#{@repo}"
      is_private: @isPrivate,
      provider: 'github',
      vcs_repo_name: "#{@owner}/#{@repo}",
    }
    debug 'create respository build details', details
    console.log colors.magenta('NOTICE'), colors.white('creating the repository hub.docker.com')
    dockerHubApi.createRepository @owner, @repo, details
      .then (build) =>
        debug 'created repository', build
        callback null
      .catch (error) =>
        debug 'create repository failed', error
        callback error

  _deleteBuildTag: (repo, callback) =>
    return callback() unless repo?
    @_getBuildTags (error, tag) =>
      return callback null if error?
      return callback null unless tag?
      dockerHubApi.deleteBuildTag @owner, @repo, tag.id
        .then =>
          console.log colors.magenta('NOTICE'), colors.white('removed the automated build in docker hub')
          callback null
        .catch (error) =>
          callback error

  _getRepository: (callback) =>
    debug 'getting repository'
    dockerHubApi.repository @owner, @repo
      .then (repository) =>
        debug 'got respository', repository
        callback null, repository
      .catch (error) =>
        return callback null if error.message == 'Object not found'
        debug 'get registory error', error
        callback error

  _getBuildTags: (callback) =>
    dockerHubApi.buildSettings @owner, @repo
      .then (settings) =>
        debug 'got settings', settings
        build_tags = _.get settings, 'build_tags'
        build_tag = _.find build_tags, {
          name: '{sourceref}',
          source_name: '/v.*/',
          source_type: 'Tag',
          dockerfile_location: "/",
        }
        debug 'got tag', build_tag
        callback null, build_tag
      .catch (error) =>
        callback error

  _removeV1Webhook: (callback) =>
    dockerHubApi.makeDeleteRequest("/repositories/#{@owner}/#{@repo}/webhook_pipeline/beekeeper/")
      .then =>
        console.log colors.magenta('NOTICE'), colors.white('removed the old webhook v1 in docker hub')
        debug 'v1 beekeeper hook removed'
        callback null
      .catch (error) =>
        debug 'v1 beekeeper hook removal error', error
        callback error

  _createWebhookV2: (callback) =>
    debug 'creating webhook v2'
    dockerHubApi.createWebhook @owner, @repo, 'Beekeeper v2'
      .then (webhook) =>
        debug 'create webhook v2 response', webhook
        if webhook?.name[0].indexOf('already exists') > -1
          debug 'webhook v2 already exists'
          return callback null
        callback null, webhook.id
      .catch (error) =>
        debug 'create webhook v2 failed', error
        return callback null, false if error.message == 'Object not found'
        callback error

  _createWebhookHook: (webhookId, callback) =>
    debug 'creating webhook v2 hook'
    console.log colors.magenta('NOTICE'), colors.white('creating the webhook v2 in docker hub')
    dockerHubApi.createWebhookHook @owner, @repo, webhookId, @webhookUrl
      .then (hook) =>
        debug 'created webhook hook', hook
        callback null, hook
      .catch (error) =>
        debug 'create webhook hook failed', error
        callback error

module.exports = DockerHubService
