request = require 'request'
debug   = require('debug')('beekeeper-util:travis-github-token')

class TravisGithubToken
  constructor: ({ config }) ->
    throw new Error 'Missing config argument' unless config?
    { @githubToken, @travisEnabled } = config
    throw new Error 'Missing githubToken in config' unless @githubToken?

  getToken: ({ isPrivate }, callback) =>
    return callback() unless @travisEnabled
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
