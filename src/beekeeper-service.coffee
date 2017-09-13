_       = require 'lodash'
request = require 'request'
debug   = require('debug')('beekeeper-util:service')

parseTag = (tag) =>
  return tag if tag == 'latest'
  return "v#{tag}"

class BeekeeperService
  constructor: ({ config, @spinner }) ->
    throw new Error 'Missing config argument' unless config?
    { @beekeeper } = config
    if @beekeeper.enabled
      throw new Error 'Missing beekeeper.uri in config' unless @beekeeper.uri?
    debug 'using beekeeper.uri', { @beekeeper }

  getTag: ({ owner, repo, tag, filter }, callback) =>
    return callback null unless @beekeeper.enabled
    @_getTag { owner, repo, tag, filter }, (error, deployment) =>
      return callback error if error?
      return callback null, deployment, deployment if tag == 'latest'
      @_getTag { owner, repo, tag: 'latest', filter }, (error, latest) =>
        return callback error if error?
        if deployment?.tag == latest?.tag
          return callback null, latest, latest
        callback null, deployment, latest

  tagDeployment: ({ owner, repo, tag, tagName }, callback) =>
    return callback null unless @beekeeper.enabled
    options =
      baseUrl: @beekeeper.uri
      uri: "/deployments/#{owner}/#{repo}/#{parseTag(tag)}/tags"
      json: { tagName }
    debug 'tag deployment options', options
    request.post options, (error, response, body) =>
      return callback error if error?
      if response.statusCode > 399
        message = _.get body, 'error'
        message ?= "Unexpected Status Code #{response.statusCode}"
        return callback new Error message
      callback()

  update: ({ owner, repo, tag, docker_url }, callback) =>
    return callback null unless @beekeeper.enabled
    options =
      baseUrl: @beekeeper.uri
      uri: "/deployments/#{owner}/#{repo}/#{parseTag(tag)}"
      json: { docker_url }
    debug 'update options', options
    request.patch options, (error, response, body) =>
      return callback error if error?
      if response.statusCode > 399
        message = _.get body, 'error', 'Error from beekeeper service'
        return callback new Error message
      callback()

  webhook: ({ owner, repo, tag, ci_passing, type }, callback) =>
    return callback null unless @beekeeper.enabled
    options =
      baseUrl: @beekeeper.uri
      uri: "/webhooks/#{type}/#{owner}/#{repo}"
      json: { tag, ci_passing }
    debug 'update options', options
    request.post options, (error, response, body) =>
      return callback error if error?
      if response.statusCode > 399
        message = _.get body, 'error', 'Error from beekeeper service'
        return callback new Error message
      callback()

  _getTag: ({ owner, repo, tag, filter }, callback) =>
    options =
      baseUrl: @beekeeper.uri
      uri: "/deployments/#{owner}/#{repo}/#{parseTag(tag)}"
      json: true
      qs: { tags: filter }
    debug 'get tag options', options
    request.get options, (error, response, body) =>
      debug 'got tag', { body, error }
      return callback error if error?
      if response.statusCode > 499
        return callback new Error 'Fatal error from beekeeper service'
      if response.statusCode == 404
        return callback null
      callback null, body

module.exports = BeekeeperService
