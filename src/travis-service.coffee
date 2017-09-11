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
    travisRequest.ensureRepo (error) =>
      return callback error if error?
      return callback() if _.isEmpty @travis.env
      async.eachSeries @travis.env, ({ env, name, value }, next) =>
        envName = name
        envValue = value ? process.env[env]
        travisRequest.upsertEnv { envName, envValue }, next
      , callback

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

        if response.statusCode == 403
          return callback new Error "Access Denied"

        if response.statusCode == 409
          _.delay callback, 10000, body, response.statusCode
          return

        if response.statusCode > 499
          debug response.statusCode, body
          return callback new Error "Unexpected Response #{response.statusCode}"
        callback null, body, response.statusCode

  upsertEnv: ({ envName, envValue }, callback) =>
    @spinner?.start "Travis: Updating Environment [#{envName}]"
    @_getRepo (error, result) =>
      return callback error if error?
      repoId = result.id
      @_getEnvVars { repoId }, (error, envVars) =>
        return callback error if error?
        envVar = _.find envVars, name: envName
        envId = envVar?.id
        @_updateEnv { repoId, envId, envName, envValue }, (error) =>
          return callback error if error?
          @spinner?.log "Travis: Environment updated [#{envName}]"
          callback()

  _updateEnv: ({ envId, repoId, envName, envValue }, callback) =>
    envPath = ''
    envPath = "/#{envId}" unless _.isEmpty envId
    method = "POST"

    method = "PATCH" if envId?


    json =
      env_var:
        name: envName
        value: envValue
        public: false

    @_request { pathname: "/settings/env_vars#{envPath}?repository_id=#{repoId}", json, method }, (error, body, statusCode) =>
      return callback error if error?
      if statusCode > 299
        error = new Error "Unexpected Response #{statusCode}"
        error.code = statusCode
        return callback error
      callback()

  _getEnvVars: ({ repoId }, callback) =>
    @_request { pathname: "/settings/env_vars?repository_id=#{repoId}" }, (error, result) =>
      return callback error if error?
      return callback null, result.env_vars

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
    baseUrl = 'https://api.travis-ci.org'
    baseUrl = 'https://api.travis-ci.com' if @isPrivate
    options = {
      baseUrl
      headers:
        'User-Agent': 'Travis CI/1.0'
      uri: '/auth/github'
      method: 'POST'
      json:
        github_token: @githubToken
    }
    debug 'options', options
    request options, (error, response, body) =>
      return callback error if error?
      debug 'responsable', response.body
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
