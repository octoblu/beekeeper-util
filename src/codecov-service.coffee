_                 = require 'lodash'
request           = require 'request'
debug             = require('debug')('beekeeper-util:codecov-service')

class CodecovService
  constructor: ({ config, @travisService, @spinner }) ->
    throw new Error 'Missing config argument' unless config?
    throw new Error 'Missing travisService argument' unless @travisService?
    { @codecov } = config
    if @codecov.enabled
      throw new Error 'Missing codecov.token in config' unless @codecov.token?

  configure: ({ @repo, @owner, @isPrivate }, callback) =>
    return callback null unless @codecov.enabled
    debug 'setting up codecov', { @repo, @owner, @isPrivate }
    @spinner?.start 'Codecov: Enabling repo'
    @_ensureRepo (error) =>
      return callback error if error?
      @spinner?.log 'Codecov: Repo enabled'
      callback null

  configureEnv: ({ @repo, @owner, @isPrivate }, callback) =>
    return callback null unless @codecov.enabled
    return callback() unless @isPrivate
    @spinner?.start 'Codecov: Configuring environment'
    @_getRepo { @repo, @owner, @isPrivate }, (error, result) =>
      return callback error if error?
      uploadToken = _.get result, 'repo.upload_token'
      @travisService.updateEnv { @repo, @owner, @isPrivate, envName: 'CODECOV_TOKEN', envValue: uploadToken }, (error) =>
        return callback error if error?
        @spinner?.log 'Codecov: Environment configured'
        callback()

  _ensureRepo: (callback) =>
    @_getRepo { @repo, @owner, @isPrivate }, (error, result) =>
      return callback error if error?
      return callback() if _.get(result, 'repo.activated') == true
      @_enableRepo { @repo, @owner, @isPrivate }, callback

  _getRepo: ({repo, owner}, callback) =>
    debug 'checking if repo exists'
    @_request { pathname: "/#{owner}/#{repo}" }, (error, repo) =>
      return callback error if error?
      debug 'repo', repo
      callback null, repo

  _enableRepo: ({ repo, owner }, callback) =>
    body = 'action=activate'
    @_request { pathname: "/#{owner}/#{repo}/settings", method: 'POST', body }, (error) =>
      return callback error if error?
      callback()

  _request: ({ method='GET', pathname, json=true, body }, callback) =>
    throw new Error 'CodecovService->_request: requires pathname' unless pathname?
    options = {
      baseUrl: 'https://codecov.io/api/gh'
      headers:
        authorization: "token #{@codecov.token}"
      uri: pathname,
      method,
      json
    }

    if body?
      delete options.json
      options.body = body

    debug 'options', options
    request options, (error, response, body) =>
      return callback error if error?
      debug 'got response', response.statusCode

      if response.statusCode > 499
        debug response.statusCode, body
        return callback new Error "Unexpected Response #{response.statusCode}"
      callback null, body

module.exports = CodecovService
