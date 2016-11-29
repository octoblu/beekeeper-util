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
    options =
      baseUrl: @beekeeperUri
      uri: "/deployments/#{owner}/#{repo}/#{tag}"
      json: true
    debug 'get latest options', options
    request.get options, (error, response, body) =>
      debug 'got latest', { body, error }
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

module.exports = BeekeeperService
