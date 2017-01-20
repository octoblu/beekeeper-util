_       = require 'lodash'
url     = require 'url'
request = require 'request'
debug   = require('debug')('beekeeper-util:service')

class BeekeeperService
  constructor: ({ config }) ->
    @beekeeperUri = url.format {
      hostname: config['beekeeper'].hostname,
      protocol: 'https',
      slashes: true,
      auth: config['beekeeper'].auth
    }

  getTag: ({ owner, repo, tag }, callback) =>
    @_getTag { owner, repo, tag }, (error, deployment) =>
      return callback error if error?
      return callback null, deployment, deployment if tag == 'latest'
      @_getTag { owner, repo, tag: 'latest' }, (error, latest) =>
        return callback error if error?
        if deployment?.tag == latest?.tag
          return callback null, latest, latest
        callback null, deployment, latest

  _getTag: ({ owner, repo, tag }, callback) =>
    options =
      baseUrl: @beekeeperUri
      uri: "/deployments/#{owner}/#{repo}/#{tag}"
      json: true
    debug 'get tag options', options
    request.get options, (error, response, body) =>
      debug 'got tag', { body, error }
      return callback error if error?
      if response.statusCode > 499
        return callback new Error 'Fatal error from beekeeper service'
      if response.statusCode == 404
        return callback null
      callback null, body

  delete: ({ owner, repo, tag }, callback) =>
    options =
      baseUrl: @beekeeperUri
      uri: "/deployments/#{owner}/#{repo}/#{tag}"
      json: true
    debug 'delete options', options
    request.delete options, (error, response, body) =>
      return callback error if error?
      if response.statusCode > 499
        return callback new Error 'Fatal error from beekeeper service'
      callback()

  update: ({ owner, repo, tag, docker_url }, callback) =>
    options =
      baseUrl: @beekeeperUri
      uri: "/deployments/#{owner}/#{repo}/#{tag}"
      json: { docker_url }
    debug 'update options', options
    request.patch options, (error, response, body) =>
      return callback error if error?
      if response.statusCode > 399
        message = _.get body, 'error', 'Error from beekeeper service'
        return callback new Error message
      callback()
module.exports = BeekeeperService
