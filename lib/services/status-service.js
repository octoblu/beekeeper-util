const bindAll = require("lodash/fp/bindAll")
const get = require("lodash/get")
const isEqual = require("lodash/isEqual")
const BeekeeperService = require("./beekeeper-service")
const Project = require("../models/project")
const chalk = require("chalk")

class StatusService {
  constructor(options) {
    bindAll(Object.getOwnPropertyNames(StatusService.prototype), this)
    const { beekeeperUri, projectUri, beekeeperEnabled, spinner, dockerEnabled, disableColors } = options
    this.spinner = spinner
    this.dockerEnabled = dockerEnabled
    this.chalk = disableColors ? chalk.constructor({ enabled: false }) : chalk
    this.beekeeperService = new BeekeeperService({ beekeeperUri, beekeeperEnabled, spinner })
    this.project = new Project({ projectUri })
  }

  async get({ projectVersion, projectName, projectOwner, filterTags }) {
    let running, current, latest
    current = await this.beekeeperService.getDeployment({ projectName, projectOwner, projectVersion, filterTags })
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
      current: current || null,
      latest: latest || null,
      running: running || null,
    }
  }

  render({ current, running, latest }) {
    const currentSection = this._getDeploymentSection(current)
    const runningSection = this._getDeploymentSection(running)
    const latestSection = this._getDeploymentSection(latest)
    const status = this.getStatusText({ current, running, latest })
    const template = `
      ${status}
      ${this.chalk.bold("Current:")}
        ${currentSection}
      ${this.chalk.bold("Latest:")}
        ${latestSection}
      ${this.chalk.bold("Running:")}
        ${runningSection}
    `
    return template.trim()
  }

  getStatusText({ current, running, latest }) {
    if (!current) {
      return `${this.chalk.bold("Error:")} ${this.chalk.keyword("orange")("Deployment not found")}`
    }
    const currentTag = get(current, "tag")
    const ciPassing = get(current, "ci_passing")
    const dockerUrl = get(current, "docker_url")
    const runningTag = get(running, "tag")
    const latestTag = get(latest, "tag")
    if (running && isEqual(currentTag, latestTag) && isEqual(currentTag, runningTag)) {
      return `${this.chalk.bold("Status:")} ${this.chalk.green("Deployed")}`
    }
    if (!running && isEqual(currentTag, latestTag)) {
      return `${this.chalk.bold("Status:")} ${this.chalk.green("Deployed")}`
    }
    if ((this.dockerEnabled && dockerUrl == null) || ciPassing == null) {
      return `${this.chalk.bold("Status:")} ${this.chalk.cyan("Pending...")}`
    }
    return `${this.chalk.bold("Status:")} ${this.chalk.cyanBright("Deploying...")}`
  }

  _getDeploymentSection(deployment) {
    let template

    const tag = get(deployment, "tag")
    const ciStatusText = this._getCIPassingStatus(get(deployment, "ci_passing"))
    const dockerStatusText = this._getDockerPassingStatus(get(deployment, "docker_url"))
    if (!deployment) {
      template = `Error: Not found`
    } else if (this.dockerEnabled) {
      template = `
        Tag: ${tag}
        CI Build: ${ciStatusText}
        Docker URL: ${dockerStatusText}
      `
    } else {
      template = `
        Tag: ${tag}
        CI Build: ${ciStatusText}
      `
    }
    return template.trim()
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
