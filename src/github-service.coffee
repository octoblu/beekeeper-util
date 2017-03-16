_                 = require 'lodash'
url               = require 'url'
request           = require 'request'
debug             = require('debug')('beekeeper-util:github-service')

class GithubService
  constructor: ({ config, @githubToken }) ->
    throw new Error 'Missing config argument' unless config?
    throw new Error 'Missing githubToken argument' unless @githubToken?

  getRepo: ({ repo, owner, isPrivate }, callback) =>
    debug 'checking if repo exists'
    @_request { pathname: "/repos/#{owner}/#{repo}" }, (error, repo) =>
      return callback error if error?
      debug 'repo', repo
      callback null, repo

  _request: ({ method='GET', pathname, json=true, body }, callback) =>
    throw new Error 'GithubService->_request: requires pathname' unless pathname?
    options = {
      baseUrl: 'https://api.github.com'
      headers:
        authorization: "token #{@githubToken}"
        'User-Agent': 'beekeeper-util'
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

module.exports = GithubService
