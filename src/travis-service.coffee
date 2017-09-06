_                 = require 'lodash'
async             = require 'async'
request           = require 'request'
debug             = require('debug')('beekeeper-util:travis-service')
TravisGithubToken = require './travis-github-token.coffee'

class TravisService
  constructor: ({ @config }) ->
    throw new Error 'Missing config argument' unless @config?
    { @githubToken, @travisEnabled } = @config
    if @travisEnabled
      throw new Error 'Missing githubToken in config' unless @githubToken?

  configure: ({ @repo, @owner, @isPrivate }, callback) =>
    return callback null unless @travisEnabled
    debug 'setting up travis', { @repo, @owner, @isPrivate }
    travisGithubToken = new TravisGithubToken { @config }
    travisGithubToken.getToken {@repo, @owner, @isPrivate}, (error, @travisToken) =>
      return callback error if error?
      @_ensureRepo (error) =>
        return callback error if error?
        callback null
        
  updateEnv: ({ repo, owner, @isPrivate, envName, envValue }, callback) =>
    return callback null unless @travisEnabled
    travisGithubToken = new TravisGithubToken { @githubToken }
    travisGithubToken.getToken { @repo, @owner, @isPrivate }, (error, @travisToken) =>
      return callback error if error?
      @_getRepo { repo, owner, @isPrivate }, (error, result) =>
        return callback error if error?
        json =
          env_var:
            name: envName
            value: envValue
            public: false

        @_request { pathname: "/settings/env_vars?repository_id=#{result.id}" }, (error, envResult) =>
          return callback error if error?
          codecovVars = _.filter envResult.env_vars, { name: 'CODECOV_TOKEN' }
          async.each codecovVars, @_deleteEnvVar, (error) =>
            return callback error if error?
            @_request { pathname: "/settings/env_vars?repository_id=#{result.id}", json, method: 'POST' }, callback


  _ensureRepo: (callback) =>
    @_getRepo { @repo, @owner, @isPrivate }, (error, result) =>
      return callback error if error?
      return callback() unless _.isEmpty result
      @_syncRepos (error) =>
        return error if error?
        @_enableRepo { @repo, @owner, @isPrivate }, callback

  _getRepo: ({repo, owner}, callback) =>
    debug 'checking if repo exists'
    @_request { pathname: "/repos/#{owner}/#{repo}" }, (error, repo) =>
      return callback error if error?
      debug 'repo', repo
      callback null, repo

  _syncRepos: (callback) =>
    @_request { pathname: '/users/sync', method: 'POST' }, callback

  _enableRepo: ({ repo, owner, isPrivate }, callback) =>
    @_getRepo { repo, owner, isPrivate }, (error, result) =>
      return callback error if error?
      json = {
        hook:
          id: result.id
          active: true
      }
      @_request { pathname: '/hooks', method: 'PUT', json }, (error) =>
        return callback error if error?
        callback null, result

  _deleteEnvVar: (envVar, callback) =>
    options = {
      pathname: "/settings/env_vars/#{envVar.id}?repository_id=#{envVar.repository_id}",
      method: 'DELETE'
    }
    @_request options, callback

  _request: ({ method='GET', pathname, json=true }, callback) =>
    throw new Error 'TravisService->_request: requires pathname' unless pathname?
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

module.exports = TravisService
