const nock = require("nock")
const bindAll = require("lodash/fp/bindAll")

class CodefreshMocks {
  constructor({ codefreshToken, isPrivate }) {
    this.isPrivate = isPrivate
    bindAll(Object.getOwnPropertyNames(CodefreshMocks.prototype), this)

    this.authed = nock("https://g.codefresh.io/api")
      .matchHeader("accept", "application/json")
      .matchHeader("user-agent", "Beekeeper Util/1.0")
      .matchHeader("x-access-token", codefreshToken)
  }

  getServices(services) {
    this.authed.get("/services/some-owner/example-repo-name").reply(200, services)
    return this
  }

  getDefaults() {
    this.authed.get("/services/some-owner/example-repo-name/default").reply(200, {})
    return this
  }

  getRegistries() {
    this.authed.get("/registries").reply(200, [
      {
        provider: "dockerhub",
        _id: "dockerhub-id",
      },
    ])
    return this
  }

  upsertServices() {
    this.authed
      .post("/services/some-owner/example-repo-name", {
        services: [
          {
            deploy_sh: "beekeeper webhook --type codefresh",
            deployment: {
              deploy_image: "octoblu/beekeeper-util:latest",
              deploy_type: "image-based",
              deploymentYamlFrom: "kubeService",
            },
            integ_sh: "",
            test_sh: "",
            env: [
              {
                key: "BEEKEEPER_URI",
                value: "http://localhost:3000",
                encrypted: true,
              },
              {
                key: "NPM_TOKEN",
                value: "npm-token",
                encrypted: true,
              },
            ],
            useDockerfileFromRepo: true,
            webhookBuildStrategy: "regular",
            registry: "dockerhub-id",
            imageName: "some-owner/example-repo-name",
            webhookFilter: [
              {
                regex: "/v.*/",
                type: "regex",
              },
            ],
          },
        ],
      })
      .reply(204)
  }

  cleanup() {
    nock.cleanAll()
  }

  done() {
    this.authed.done()
  }
}

module.exports = CodefreshMocks
