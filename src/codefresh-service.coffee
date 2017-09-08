_       = require 'lodash'
request = require 'request'
debug   = require('debug')('beekeeper-util:codefresh-service')
path    = require 'path'
fs      = require 'fs-extra'

class CodefreshService
  constructor: ({ config, @spinner }) ->
    throw new Error 'Missing config argument' unless config?
    { @codefresh, @beekeeper, @npm, @project } = config
    if @codefresh.enabled
      throw new Error 'Missing codefresh.token in config' unless @codefresh.token?
    throw new Error 'Missing beekeeper.uri in config' unless @beekeeper.uri?

  configure: ({ @repo, @owner, @isPrivate }, callback) =>
    return callback null unless @codefresh.enabled
    debug 'setting up codefresh', { @repo, @owner, @isPrivate }
    @spinner?.start 'Codefresh: Enabling repo'
    @_ensureService (error) =>
      return callback error if error?
      @spinner?.log 'Codefresh: Repo enabled'
      callback null

  _ensureService: (callback) =>
    @_getServices (error, services) =>
      return callback error if error?
      @_getRegistryId (error, registryId) =>
        return callback error if error?
        return @_updateServices { services, registryId }, callback unless _.isEmpty services
        @_createService { registryId }, callback

  _getDefaults: (callback) =>
    debug 'get service defaults'
    @_request { pathname: "/services/#{@owner}/#{@repo}/default" }, (error, defaults) =>
      return callback error if error?
      debug 'defaults', defaults
      callback null, defaults

  _createService: ({ registryId }, callback) =>
    @_getDefaults (error, service) =>
      return callback error if error?
      debug 'service does not exist, but I will make it exist'
      service = @_setServiceDefaults { registryId, service }
      services = [ service ]
      debug '_createService', JSON.stringify({ services }, null, 2)
      options = {
        pathname: "/services/#{@owner}/#{@repo}/create"
        method: 'POST'
        json: { services }
      }
      @_request options, callback

  _updateServices: ({ registryId, services }, callback) =>
    debug 'updating service'
    services = _.map services, (service) => @_setServiceDefaults { service, registryId }
    debug '_updateServices', JSON.stringify({ services }, null, 2)

    options = {
      pathname: "/services/#{@owner}/#{@repo}"
      method: 'POST'
      json: { services }
    }
    @_request options, callback

  _getServices: (callback) =>
    debug 'checking if service exists'
    @_request { pathname: "/services/#{@owner}/#{@repo}" }, (error, services) =>
      return callback error if error?
      debug 'services', services
      callback null, services

  _getRegistryId: (callback) =>
    @_request { pathname: "/registries" }, (error, registries) =>
      return callback error if error?
      item = _.find registries, provider: 'dockerhub'
      unless item?
        return callback new Error('Docker Hub is not configured in codefresh')
      callback null, _.get item, '_id'

  _request: ({ method='GET', pathname, json=true }, callback) =>
    throw new Error 'CodefreshService->_request: requires pathname' unless pathname?
    options = {
      baseUrl: 'https://g.codefresh.io/api'
      headers:
        'x-access-token':  @codefresh.token
      uri: pathname,
      method,
      json
    }
    debug 'options', options
    request options, (error, response, body) =>
      return callback error if error?
      debug 'got response', response.statusCode
      if response.statusCode > 399
        debug response.statusCode, body
        return callback new Error "Unexpected Response #{response.statusCode}"
      callback null, body

  _getWebhookBuildStrategy: =>
    codefreshFile = path.join @project.root, 'codefresh.yml'
    try
      fs.accessSync codefreshFile, fs.constants.F_OK
    catch
      return 'regular'

    return 'yaml'

  _setServiceDefaults: ({ registryId, service }) =>
    webhookBuildStrategy = @_getWebhookBuildStrategy()
    service = _.cloneDeep service
    _.set service, 'deploy_sh',  'beekeeper webhook --type codefresh'
    _.set service, 'deployment', {
      deploy_image: 'octoblu/beekeeper-util:latest'
      deploy_type: 'image-based'
      deploymentYamlFrom: 'kubeService'
    }
    _.set service, 'integ_sh', ''
    _.set service, 'test_sh',  ''
    _.set service, 'env', [
      {
        key: 'BEEKEEPER_URI'
        value: @beekeeper.uri
        encrypted: true
      }
      {
        key: 'NPM_TOKEN'
        value: @npm.token
        encrypted: true
      }
    ]
    _.set service, 'useDockerfileFromRepo', true
    _.set service, 'webhookBuildStrategy', webhookBuildStrategy
    _.set service, 'registry', registryId
    _.set service, 'imageName', "#{@owner}/#{@repo}"
    _.set service, 'webhookFilter', [
      {
        regex: '/v.*/'
        type: 'regex'
      }
    ]
    return service

module.exports = CodefreshService
