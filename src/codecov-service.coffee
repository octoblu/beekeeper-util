_                 = require 'lodash'
url               = require 'url'
request           = require 'request'
debug             = require('debug')('beekeeper-util:codecov-service')

class CodecovService
  constructor: ({ config, @codecovToken, @travisService }) ->
    throw new Error 'Missing config argument' unless config?
    throw new Error 'Missing travisService argument' unless @travisService?
    throw new Error 'Missing codecovToken argument' unless @codecovToken?

  configure: ({ @repo, @owner, @isPrivate }, callback) =>
    debug 'setting up travis', { @repo, @owner, @isPrivate }
    @_ensureRepo (error) =>
      return callback error if error?
      callback null

  _ensureRepo: (callback) =>
    @getRepo { @repo, @owner, @isPrivate }, (error, result) =>
      return callback error if error?
      return callback() if _.get(result, 'repo.activated') == true
      @enableRepo { @repo, @owner, @isPrivate }, callback

  configureEnv: ({ @repo, @owner, @isPrivate }, callback) =>
    return callback() unless @isPrivate
    @getRepo { @repo, @owner, @isPrivate }, (error, result) =>
      return callback error if error?
      uploadToken = _.get result, 'repo.upload_token'
      @travisService.updateEnv { @repo, @owner, @isPrivate, envName: 'CODECOV_TOKEN', envValue: uploadToken }, callback

  getRepo: ({repo, owner, isPrivate}, callback) =>
    debug 'checking if repo exists'
    @_request { pathname: "/#{owner}/#{repo}" }, (error, repo) =>
      return callback error if error?
      debug 'repo', repo
      callback null, repo

  enableRepo: ({ repo, owner, isPrivate }, callback) =>
    return callback error if error?

    body = 'action=activate'
    @_request { pathname: "/#{owner}/#{repo}/settings", method: 'POST', body }, (error) =>
      return callback error if error?
      callback()

  _request: ({ method='GET', pathname, json=true, body }, callback) =>
    throw new Error 'CodecovService->_request: requires pathname' unless pathname?
    options = {
      baseUrl: 'https://codecov.io/api/gh'
      headers:
        authorization: "token #{@codecovToken}"
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
