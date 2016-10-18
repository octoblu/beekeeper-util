_       = require 'lodash'
request = require 'request'
debug   = require('debug')('beekeeper-util:pingdom-service')

class PingdomService
  constructor: ({ @appKey, @username, @password }) ->
    throw new Error 'Missing appKey' unless @appKey?
    throw new Error 'Missing username' unless @username?
    throw new Error 'Missing password' unless @password?
    @baseUrl = 'https://api.pingdom.com/api/2.0'

  configure: ({ hostname }, callback) =>
    @_get { hostname }, (error, check) =>
      return callback error if error?
      return callback null if check?
      @_create { hostname }, callback

  _create: ({ hostname }, callback) =>
    body = {
      name: hostname
      host: hostname
      type: 'http'
      resolution: 1
      url: '/healthcheck'
      encryption: true
      contactids: '11058966,10866214'
      sendtoemail: true
      use_legacy_notifications: true
    }
    @_request { method: 'POST', uri: '/checks', body }, (error, response) =>
      return callback error if error?
      debug 'response', response
      callback null

  _get: ({ hostname }, callback) =>
    @_request { method: 'GET', uri: '/checks' }, (error, body) =>
      return callback error if error?
      { checks } = body
      check = _.find checks, { hostname }
      debug 'found check', check
      callback null, check

  _request: ({ method, uri, body }, callback) =>
    options = {
      method
      uri
      @baseUrl
      form: body ? true
      headers: {
        'App-Key': @appKey
        'Accept': 'application/json'
      }
      auth: {
        @username
        @password
      }
    }
    debug 'pingdom request options', options
    request options, (error, response, body) =>
      debug 'pingdom response', { error, statusCode: response?.statusCode }
      return callback error if error?
      return callback new Error('Invalid response') if response.statusCode > 499
      callback null, body

module.exports = PingdomService
