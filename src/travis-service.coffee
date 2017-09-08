_                 = require 'lodash'
async             = require 'async'
request           = require 'request'
debug             = require('debug')('beekeeper-util:travis-service')

class TravisService
  constructor: ({ @config, @spinner }) ->
    throw new Error 'Missing config argument' unless @config?
    { @github, @travis } = @config
    if @travis.enabled
      throw new Error 'Missing github.token in config' unless @github.token?

  configure: ({ repo, owner, isPrivate }, callback) =>
    return callback null unless @travis.enabled
    debug 'setting up travis', { repo, owner, isPrivate }
    githubToken = @github.token
    travisRequest = new TravisRequest({ repo, owner, isPrivate, @spinner, githubToken })
    travisRequest.ensureRepo callback

  updateEnv: ({ repo, owner, isPrivate, envName, envValue }, callback) =>
    return callback null unless @travis.enabled
    githubToken = @github.token
    travisRequest = new TravisRequest({ repo, owner, isPrivate, @spinner, githubToken })
    travisRequest.upsertEnv {envName, envValue}, callback

class TravisRequest
  constructor: ({ @repo, @owner, @isPrivate, @spinner, @githubToken }) ->

  _request: ({ method='GET', pathname, json=true }, callback) =>
    throw new Error 'TravisService->_request: requires pathname' unless pathname?

    @_getToken (error, @travisToken) =>
      return callback error if error?
      baseUrl = 'https://api.travis-ci.org'
      baseUrl = 'https://api.travis-ci.com' if @isPrivate
      options = {
        baseUrl
        headers:
          authorization: "token #{@travisToken}"
        uri: pathname,
        method,
        json
      }
      debug 'options', options
      request options, (error, response, body) =>
        return callback error if error?
        debug 'got response', response.statusCode

        if response.statusCode == 409
          _.delay callback, 10000, body
          return

        if response.statusCode > 499
          debug response.statusCode, body
          return callback new Error "Unexpected Response #{response.statusCode}"
        callback null, body

  upsertEnv: ({ envName, envValue }, callback) =>
    @spinner?.start 'Travis: Updating Environment'
    json =
      env_var:
        name: envName
        value: envValue
        public: false

    @_getRepo (error, result) =>
      return callback error if error?
      @_request { pathname: "/settings/env_vars?repository_id=#{result.id}", json, method: 'POST' }, (error) =>
        return callback error if error?
        @spinner?.log 'Travis: Environment updated'
        callback()

  _enableRepo: (callback) =>
    @spinner?.start 'Travis: Enable repo'
    @_getRepo (error, result) =>
      return callback error if error?
      json = {
        hook:
          id: result.id
          active: true
      }
      @_request { pathname: '/hooks', method: 'PUT', json }, (error) =>
        return callback error if error?
        @spinner?.log 'Travis: Repo enabled'
        callback null, result

  _getToken: (callback) =>
    return callback null, @travisToken if @travisToken?
    return callback() unless @isPrivate
    options = {
      baseUrl: 'https://api.travis-ci.com'
      uri: '/auth/github'
      method: 'POST'
      json:
        github_token: @githubToken
    }
    debug 'options', options
    request options, (error, response, body) =>
      return callback error if error?
      debug 'got response', response.statusCode
      if response.statusCode > 499
        debug response.statusCode, body
        return callback new Error "Unexpected Response #{response.statusCode}"
      callback null, body.access_token

  ensureRepo: (callback) =>
    @_getRepo (error, result) =>
      return callback error if error?
      return @_enableRepo(callback) unless _.isEmpty result
      @_syncRepos (error) =>
        return error if error?
        @_enableRepo callback

  _getRepo: (callback) =>
    debug 'checking if repo exists'
    @_request { pathname: "/repos/#{@owner}/#{@repo}" }, (error, result) =>
      return callback error if error?
      debug 'result', result
      callback null, result

  _syncRepos: (callback) =>
    @spinner?.start 'Travis: Syncing repos'
    @_request { pathname: '/users/sync', method: 'POST' }, (error) =>
      return callback(error) if error?
      @spinner?.log 'Travis: Synced repos'
      callback()

module.exports = TravisService
