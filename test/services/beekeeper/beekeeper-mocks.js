const nock = require("nock")
const bindAll = require("lodash/fp/bindAll")
const size = require("lodash/size")
const join = require("lodash/join")

class BeekeeperMocks {
  constructor({ isPrivate }) {
    bindAll(Object.getOwnPropertyNames(BeekeeperMocks.prototype), this)
    this.isPrivate = isPrivate

    this.authed = nock("https://beekeeper.octoblu.com")
      .matchHeader("accept", "application/json")
      .matchHeader("user-agent", "Beekeeper Util/1.0")
  }

  createDeployment(tag) {
    this.authed.post(`/deployments/some-owner/example-repo-name/${tag}`).reply(204)
    return this
  }

  deleteDeployment(tag) {
    this.authed.delete(`/deployments/some-owner/example-repo-name/${tag}`).reply(204)
    return this
  }

  updateDeployment(tag, dockerUrl) {
    this.authed.patch(`/deployments/some-owner/example-repo-name/${tag}`, { docker_url: dockerUrl }).reply(204)
    return this
  }

  webhookDeployment(tag, webhookType, ciPassing) {
    this.authed.post(`/webhooks/${webhookType}/some-owner/example-repo-name`, { tag, ci_passing: ciPassing }).reply(204)
    return this
  }

  getDeployment(tag, filterTags = []) {
    const req = this.authed.get(`/deployments/some-owner/example-repo-name/${tag}`)
    if (size(filterTags)) req.query({ tags: join(filterTags, ",") })
    req.reply(200, {
      tag,
      owner_name: "some-owner",
      repo_name: "example-repo-name",
      ci_passing: true,
      docker_url: `some-owner/example-repo-name:${tag}`,
      tags: filterTags,
    })
    return this
  }

  getMissingDeployment(tag, filterTags = []) {
    const req = this.authed.get(`/deployments/some-owner/example-repo-name/${tag}`)
    if (size(filterTags)) req.query({ tags: join(filterTags, ",") })
    req.reply(404)
    return this
  }

  tagDeployment({ tag, tagName }) {
    this.authed.post(`/deployments/some-owner/example-repo-name/${tag}/tags`, { tagName }).reply(204)
    return this
  }

  cleanup() {
    nock.cleanAll()
  }

  done() {
    this.authed.done()
  }
}

module.exports = BeekeeperMocks
