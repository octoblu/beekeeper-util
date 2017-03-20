_                 = require 'lodash'
async             = require 'async'
request           = require 'request'
debug             = require('debug')('beekeeper-util:travis-service')
TravisGithubToken = require './travis-github-token.coffee'

class TravisService
  constructor: ({ config, @githubToken }) ->
    throw new Error 'Missing config argument' unless config?
    throw new Error 'Missing githubToken argument' unless @githubToken?

  configure: ({ @repo, @owner, @isPrivate }, callback) =>
    debug 'setting up travis', { @repo, @owner, @isPrivate }
    travisGithubToken = new TravisGithubToken { @githubToken }
    travisGithubToken.getToken {@repo, @owner, @isPrivate}, (error, @travisToken) =>
      return callback error if error?
      @_ensureRepo (error) =>
        return callback error if error?
        callback null

  _ensureRepo: (callback) =>
    @getRepo { @repo, @owner, @isPrivate }, (error, result) =>
      return callback error if error?
      return callback() unless _.isEmpty result
      @syncRepos (error) =>
        return error if error?
        @enableRepo { @repo, @owner, @isPrivate }, callback

  getRepo: ({repo, owner}, callback) =>
    debug 'checking if repo exists'
    @_request { pathname: "/repos/#{owner}/#{repo}" }, (error, repo) =>
      return callback error if error?
      debug 'repo', repo
      callback null, repo

  syncRepos: (callback) =>
    @_request { pathname: '/users/sync', method: 'POST' }, callback

  enableRepo: ({ repo, owner, isPrivate }, callback) =>
    @getRepo { repo, owner, isPrivate }, (error, result) =>
      return callback error if error?
      json = {
        hook:
          id: result.id
          active: true
      }
      @_request { pathname: '/hooks', method: 'PUT', json }, (error) =>
        return callback error if error?
        callback null, result

  updateEnv: ({ repo, owner, @isPrivate, envName, envValue }, callback) =>
    travisGithubToken = new TravisGithubToken { @githubToken }
    travisGithubToken.getToken { @repo, @owner, @isPrivate }, (error, @travisToken) =>
      return callback error if error?
      @getRepo { repo, owner, @isPrivate }, (error, result) =>
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

  _deleteEnvVar: (envVar, callback) =>
    @_request { pathname: "/settings/env_vars/#{envVar.id}?repository_id=#{envVar.repository_id}", method: 'DELETE'}, callback

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
        setTimeout =>
          callback null, body
        , 10000
        return

      if response.statusCode > 499
        debug response.statusCode, body
        return callback new Error "Unexpected Response #{response.statusCode}"
      callback null, body

module.exports = TravisService
