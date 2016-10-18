dockerHubApi = require '@octoblu/docker-hub-api'

class GenerateDockerToken
  constructor: ({ @username, @password }) ->
    throw new Error 'Missing DOCKER_HUB_USERNAME' unless @username?
    throw new Error 'Missing DOCKER_HUB_PASSWORD' unless @password?

  generate: =>
    dockerHubApi.login @username, @password
      .then (info) =>
        console.log info.token
        process.exit 0
      .catch (error) =>
        console.error error.stack
        process.exit 1

module.exports = GenerateDockerToken
