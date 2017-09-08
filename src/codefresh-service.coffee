_       = require 'lodash'
request = require 'request'
debug   = require('debug')('beekeeper-util:codefresh-service')

class CodefreshService
  constructor: ({ config }) ->
    throw new Error 'Missing config argument' unless config?
    { @codefresh, @beekeeper } = config
    if @codefresh.enabled
      throw new Error 'Missing codefresh.token in config' unless @codefresh.token?
    throw new Error 'Missing beekeeper.uri in config' unless @beekeeper.uri?

  configure: ({ @repo, @owner, @isPrivate }, callback) =>
    return callback null unless @codefresh.enabled
    debug 'setting up codefresh', { @repo, @owner, @isPrivate }
    @_ensureService (error) =>
      return callback error if error?
      callback null

  _ensureService: (callback) =>
    @_serviceExists (error, exists) =>
      return callback error if error?
      return callback null if exists
      @_getDefaults (error, defaults) =>
        return callback error if error?
        @_createService { defaults }, callback

  _getDefaults: (callback) =>
    debug 'get service defaults'
    @_request { pathname: "/services/#{@owner}/#{@repo}/default" }, (error, defaults) =>
      return callback error if error?
      debug 'defaults', defaults
      callback null, defaults

  _createService: ({ defaults }, callback) =>
    @_getRegistryId (error, registryId) =>
      return callback error if error?
      debug 'service does not exist, but I will make it exist'
      createBody = @_convertDefaults { defaults, registryId }
      debug 'createBody', createBody
      options = {
        pathname: "/services/#{@owner}/#{@repo}/create"
        method: 'POST'
        json: createBody
      }
      @_request options, (error) =>
        return callback error if error?
        callback null

  _serviceExists: (callback) =>
    debug 'checking if service exists'
    @_request { pathname: "/services/#{@owner}/#{@repo}" }, (error, services) =>
      return callback error if error?
      debug 'services', services
      callback null, !_.isEmpty services

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

  _convertDefaults: ({ defaults, registryId }) =>
    service = _.cloneDeep defaults
    _.set service, 'deploy_sh',  '''
      yarn global add beekeeper-util
      beekeeper webhook --type codefresh --ci-passing false
    '''
    _.set service, 'integ_sh', ''
    _.set service, 'test_sh',  ''
    _.set service, 'env', [
      {
        key: 'BEEKEEPER_URI'
        value: @beekeeper.uri
        encrypted: true
      }
    ]
    _.set service, 'useDockerfileFromRepo', true
    _.set service, 'registry', registryId
    _.set service, 'imageName', "#{@owner}/#{@repo}"
    _.set service, 'webhookFilter', [
      {
        regex: '/v.*/'
        type: 'regex'
      }
    ]
    return {
      services: [service]
    }

module.exports = CodefreshService
