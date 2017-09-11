const nock = require("nock")
const uuid = require("uuid")
const bindAll = require("lodash/fp/bindAll")
const each = require("lodash/each")

class TravisMocks {
  constructor({ githubToken, isPrivate }) {
    bindAll(Object.getOwnPropertyNames(TravisMocks.prototype), this)
    const uri = isPrivate ? "https://api.travis-ci.com" : "https://api.travis-ci.org"
    const accessToken = uuid.v1()

    this._tokenExchange = nock(uri)
      .matchHeader("accept", "application/json")
      .matchHeader("user-agent", "Travis CI/1.0")
      .post("/auth/github", { github_token: githubToken })
      .reply(200, { access_token: accessToken })

    this.authed = nock(uri)
      .matchHeader("accept", "application/json")
      .matchHeader("user-agent", "Travis CI/1.0")
      .matchHeader("authorization", `token ${accessToken}`)
  }

  getRepo() {
    this.authed.get("/repos/some-owner/example-repo-name").reply(200, {
      id: "travis-repo-id",
    })
    return this
  }

  getRepoWithSync() {
    this.authed
      .get("/repos/some-owner/example-repo-name")
      .reply(404)
      .post("/users/sync")
      .reply(200)
      .get("/repos/some-owner/example-repo-name")
      .reply(200, {
        id: "travis-repo-id",
      })
    return this
  }

  enableRepo() {
    this.authed
      .put("/hooks", {
        hook: {
          id: "travis-repo-id",
          active: true,
        },
      })
      .reply(204)
    return this
  }

  getEnvVars(envVars) {
    this.authed.get("/settings/env_vars?repository_id=travis-repo-id").reply(200, {
      env_vars: envVars,
    })
    return this
  }

  updateEnvVars(envVars) {
    each(envVars, ({ name, value, id, env }) => {
      if (!value && env) {
        value = process.env[env]
      }
      this.authed
        .patch(`/settings/env_vars/${id}?repository_id=travis-repo-id`, {
          repository_id: "travis-repo-id",
          name: name,
          value: value,
          public: false,
        })
        .reply(204)
    })
    return this
  }

  createEnvVars(envVars) {
    each(envVars, ({ name, value, env }) => {
      if (!value && env) {
        value = process.env[env]
      }
      this.authed
        .post("/settings/env_vars?repository_id=travis-repo-id", {
          repository_id: "travis-repo-id",
          name: name,
          value: value,
          public: false,
        })
        .reply(204)
    })
    return this
  }

  cleanup() {
    nock.cleanAll()
  }

  done() {
    this._tokenExchange.done()
    this.authed.done()
  }
}

module.exports = TravisMocks
