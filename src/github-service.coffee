request           = require 'request'
debug             = require('debug')('beekeeper-util:github-service')

class GithubService
  constructor: ({ config }) ->
    throw new Error 'Missing config argument' unless config?
    { @github } = config
    throw new Error 'Missing github.token in config' unless @github.token?

  getRepo: ({ repo, owner }, callback) =>
    debug 'checking if repo exists'
    @_request { pathname: "/repos/#{owner}/#{repo}" }, (error, repo) =>
      return callback error if error?
      debug 'repo', repo
      callback null, repo

  createRelease: ({ repo, owner, tag, message, release }, callback) =>
    return callback null unless @github.release.enabled
    options = {
      pathname: "/repos/#{owner}/#{repo}/releases"
      method: 'POST'
      json:
        tag_name: "v#{tag}"
        target_commitish: 'master'
        name: "v#{tag}"
        body: message
        draft: @github.release.draft || false
        prerelease: @github.release.prerelease || release == 'prerelease'
    }
    debug 'creating github release', options
    @_request options, (error, repo) =>
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
