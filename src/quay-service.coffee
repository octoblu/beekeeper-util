request = require 'request'
async   = require 'async'
debug   = require('debug')('beekeeper-util:quay-service')

QUAY_BASE_URL='https://quay.io/api/v1'

class QuayService
  constructor: ({ config, @spinner }) ->
    throw new Error 'Missing config argument' unless config?
    { @quay } = config
    if @quay.enabled
      throw new Error 'Missing quay.token in config' unless @quay.token?

  configure: ({ @repo, @owner, @isPrivate }, callback) =>
    return callback null unless @quay.enabled
    debug 'setting up quay'
    @spinner?.start 'Quay: Enabling repo'
    @_repositoryExists (error, exists) =>
      return callback error if error?
      @spinner?.log 'Quay: Repo enabled'
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
        Authorization: "Bearer #{@quay.token}"
      followAllRedirects: true
      json
    }
    request options, (error, response, body) =>
      return callback error, null, response.statusCode if error?
      return callback body, null, response.statusCode if response.statusCode > 499
      callback null, body, response.statusCode

module.exports = QuayService
