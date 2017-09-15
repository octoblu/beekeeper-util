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
    const template = `${status}
${this.chalk.bold("Current:")}
  ${currentSection}
${this.chalk.bold("Latest:")}
  ${latestSection}
${this.chalk.bold("Running:")}
  ${runningSection}`
    return template
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
      return `${this.chalk.bold("Status:")} ${this.chalk.greenBright("Deployed")}`
    }
    if (!running && isEqual(currentTag, latestTag)) {
      return `${this.chalk.bold("Status:")} ${this.chalk.greenBright("Deployed")}`
    }
    if ((this.dockerEnabled && dockerUrl == null) || ciPassing == null) {
      return `${this.chalk.bold("Status:")} ${this.chalk.underline.magentaBright("Pending...")}`
    }
    return `${this.chalk.bold("Status:")} ${this.chalk.cyanBright("Deploying...")}`
  }

  _getDeploymentSection(deployment) {
    const tag = get(deployment, "tag")
    const ciStatusText = this._getCIPassingStatus(get(deployment, "ci_passing"))
    const dockerStatusText = this._getDockerPassingStatus(get(deployment, "docker_url"))
    if (!deployment) {
      return `${this.chalk.white("Error:")} ${this.chalk.keyword("orange")("Not found")}`
    }
    if (this.dockerEnabled) {
      return `${this.chalk.white("Tag:")} ${this.chalk.cyan(tag)}
  ${this.chalk.white("CI Build:")} ${ciStatusText}
  ${this.chalk.white("Docker URL:")} ${dockerStatusText}`
    }
    return `${this.chalk.white("Tag:")} ${this.chalk.cyan(tag)}
  ${this.chalk.white("CI Build:")} ${ciStatusText}`
  }

  _getCIPassingStatus(value) {
    if (value == null) {
      return this.chalk.underline.magenta("pending...")
    }
    if (!value) {
      return this.chalk.keyword("orange")("failed")
    }
    return this.chalk.green("passed")
  }

  _getDockerPassingStatus(value) {
    if (!value) {
      return this.chalk.underline.magenta("pending...")
    }
    return this.chalk.green(value)
  }
}

module.exports = StatusService
