_       = require 'lodash'
url     = require 'url'
request = require 'request'
debug   = require('debug')('beekeeper-util:travis-github-token')

class TravisGithubToken
  constructor: ({ @githubToken }) ->
    throw new Error 'Missing githubToken argument' unless @githubToken?

  getToken: ({ repo, owner, isPrivate }, callback) =>
    return callback() unless isPrivate

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

module.exports = TravisGithubToken
