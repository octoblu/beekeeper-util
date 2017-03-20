request = require 'request'
async   = require 'async'
colors  = require 'colors'
debug   = require('debug')('beekeeper-util:quay-service')

QUAY_BASE_URL='https://quay.io/api/v1'

class QuayService
  constructor: ({ config, @quayToken }) ->
    throw new Error 'Missing config argument' unless config?
    throw new Error 'Missing quayToken argument' unless @quayToken?

  configure: ({ @repo, @owner, @isPrivate }, callback) =>
    debug 'setting up quay'
    @_repositoryExists (error, exists) =>
      return callback error if error?
      return callback null unless exists
      @_clearNotifications callback

  _getNotifications: (callback) =>
    debug 'getting notifications'
    options =
      method: 'GET'
      uri: "/repository/#{@owner}/#{@repo}/notification/"
      json: true

    @_request options, (error, body) =>
      return callback error if error?
      debug 'got notifications', body.notifications
      callback null, body.notifications

  _deleteNotification: ({ uuid }, callback) =>
    debug 'delete notification', { uuid }
    options =
      method: 'DELETE'
      uri: "/repository/#{@owner}/#{@repo}/notification/#{uuid}"
      json: true

    console.log colors.magenta('NOTICE'), colors.white('deleting quay webook')
    @_request options, callback

  _clearNotifications: (callback) =>
    @_getNotifications (error, notifications) =>
      return callback error if error?
      async.each notifications, @_deleteNotification, callback

  _repositoryExists: (callback) =>
    options =
      method: 'GET'
      uri: "/repository/#{@owner}/#{@repo}"
      json: true

    @_request options, (error, body, statusCode) =>
      return callback error if error?
      exists = statusCode != 404
      debug 'repo exists', exists
      callback null, exists

  _request: ({ method, uri, json }, callback) =>
    options = {
      method,
      uri,
      baseUrl: QUAY_BASE_URL
      headers:
        Authorization: "Bearer #{@quayToken}"
      followAllRedirects: true
      json
    }
    request options, (error, response, body) =>
      return callback error, null, response.statusCode if error?
      return callback body, null, response.statusCode if response.statusCode > 499
      callback null, body, response.statusCode

module.exports = QuayService
