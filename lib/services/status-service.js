const bindAll = require("lodash/fp/bindAll")
const get = require("lodash/get")
const isEqual = require("lodash/isEqual")
const BeekeeperService = require("./beekeeper-service")
const Project = require("../models/project")

class StatusService {
  constructor(options) {
    bindAll(Object.getOwnPropertyNames(StatusService.prototype), this)
    const { beekeeperUri, projectUri, beekeeperEnabled, spinner, dockerEnabled } = options
    this.spinner = spinner
    this.dockerEnabled = dockerEnabled
    this.beekeeperService = new BeekeeperService({ beekeeperUri, beekeeperEnabled, spinner })
    this.project = new Project({ projectUri })
  }

  async get({ projectVersion, projectName, projectOwner, filterTags }) {
    let running, desired, latest
    desired = await this.beekeeperService.getDeployment({ projectName, projectOwner, projectVersion, filterTags })
    latest = await this.beekeeperService.getDeployment({
      projectName,
      projectOwner,
      projectVersion: "latest",
      filterTags,
    })
    const runningVersion = await this.project.getVersion()
    if (runningVersion) {
      running = await this.beekeeperService.getDeployment({ projectName, projectOwner, projectVersion: runningVersion })
    }
    return {
      desired: desired || null,
      latest: latest || null,
      running: running || null,
    }
  }

  render({ desired, running, latest }) {
    const desiredSection = this._getDeploymentSection(desired)
    const runningSection = this._getDeploymentSection(running)
    const latestSection = this._getDeploymentSection(latest)
    const status = this.getStatusText({ desired, running, latest })
    const template = `
      ${status.toString()}
      Desired:
        ${desiredSection}
      Latest:
        ${latestSection}
      Running:
        ${runningSection}
    `
    return template.trim()
  }

  getStatusText({ desired, running, latest }) {
    if (!desired) {
      return new Error("Deployment not found")
    }
    const desiredTag = get(desired, "tag")
    const ciPassing = get(desired, "ci_passing")
    const dockerUrl = get(desired, "docker_url")
    const runningTag = get(running, "tag")
    const latestTag = get(latest, "tag")
    if (running && isEqual(desiredTag, latestTag) && isEqual(desiredTag, runningTag)) {
      return "Status: Deployed"
    }
    if (!running && isEqual(desiredTag, latestTag)) {
      return "Status: Deployed"
    }
    if ((this.dockerEnabled && dockerUrl == null) || ciPassing == null) {
      return "Status: Pending..."
    }
    return "Status: Deploying..."
  }

  _getDeploymentSection(deployment) {
    if (!deployment)
      return `
      Error: Not found
    `.trim()
    const tag = get(deployment, "tag")
    const ciStatusText = this._getCIPassingStatus(get(deployment, "ci_passing"))
    const dockerStatusText = this._getDockerPassingStatus(get(deployment, "docker_url"))
    if (this.dockerEnabled) {
      return `
        Tag: ${tag}
        CI Build: ${ciStatusText}
        Docker URL: ${dockerStatusText}
      `.trim()
    }
    return `
      Tag: ${tag}
      CI Build: ${ciStatusText}
    `.trim()
  }

  _getCIPassingStatus(value) {
    if (value == null) {
      return "pending..."
    }
    if (!value) {
      return "failed"
    }
    return "passed"
  }

  _getDockerPassingStatus(value) {
    if (!value) {
      return "pending..."
    }
    return value
  }
}

module.exports = StatusService
