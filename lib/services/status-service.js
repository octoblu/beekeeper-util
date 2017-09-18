const bindAll = require("lodash/fp/bindAll")
const get = require("lodash/get")
const isEqual = require("lodash/isEqual")
const BeekeeperService = require("./beekeeper-service")
const Project = require("../models/project")
const chalk = require("chalk")
const path = require("path")
const notifier = require("node-notifier")
const BEEKEEPER_ICON = path.join(__dirname, "../../assets/beekeeper.png")

class StatusService {
  constructor(options) {
    bindAll(Object.getOwnPropertyNames(StatusService.prototype), this)
    const { beekeeperUri, beekeeperEnabled, spinner, dockerEnabled, disableColors } = options
    this.spinner = spinner
    this.dockerEnabled = dockerEnabled
    this.chalk = disableColors ? chalk.constructor({ enabled: false }) : chalk
    this.beekeeperService = new BeekeeperService({ beekeeperUri, beekeeperEnabled, spinner })
    this._lastStatus = null
  }

  async get({ projectVersion, projectUri, projectName, projectOwner, filterTags }) {
    let running, current, latest
    const project = new Project({ projectUri })
    current = await this.beekeeperService.getDeployment({ projectName, projectOwner, projectVersion, filterTags })
    latest = await this.beekeeperService.getDeployment({
      projectName,
      projectOwner,
      projectVersion: "latest",
      filterTags,
    })
    const runningVersion = await project.getVersion()
    if (runningVersion) {
      running = await this.beekeeperService.getDeployment({ projectName, projectOwner, projectVersion: runningVersion })
    }
    const status = {
      current: current || null,
      latest: latest || null,
      running: running || null,
    }
    const statusText = this.getStatusText(status)
    status.changed = !isEqual(statusText, this._lastStatus)
    this._lastStatus = statusText
    return status
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

  getStatusError({ current }) {
    if (!current) {
      return new Error("Deployment not found")
    }
    if (get(current, "ci_passing") === false) {
      return new Error("CI Failed!")
    }
  }

  isDeployed({ current, running, latest }) {
    if (!current) return
    const currentTag = get(current, "tag")
    const runningTag = get(running, "tag")
    const latestTag = get(latest, "tag")
    if (running && isEqual(currentTag, latestTag) && isEqual(currentTag, runningTag)) {
      return true
    }
    if (!running && isEqual(currentTag, latestTag)) {
      return true
    }
    return false
  }

  isPending({ current }) {
    if (!current) return
    const ciPassing = get(current, "ci_passing")
    const dockerUrl = get(current, "docker_url")
    return (this.dockerEnabled && dockerUrl == null) || ciPassing == null
  }

  notify({ current, projectName, projectVersion, projectUri }) {
    let message, sound
    const statusError = this.getStatusError({ current })
    if (statusError) {
      message = statusError.toString()
      sound = "Basso"
    } else if (this.isDeployed({ current })) {
      message = "Service Deployed"
      sound = "Purr"
    } else if (this.isPending({ current })) {
      message = "Status Change: Pending..."
    } else {
      message = "Status Change: Deploying..."
    }
    notifier.notify({
      title: "Beekeeper",
      subtitle: `${projectName}:${projectVersion}`,
      message,
      icon: BEEKEEPER_ICON,
      sound,
      open: projectUri,
      timeout: 10,
    })
  }

  getStatusText({ current, running, latest }) {
    const statusError = this.getStatusError({ current })
    if (statusError) {
      return `${this.chalk.bold("Error:")} ${this.chalk.keyword("orange")(statusError.message)}`
    }
    if (this.isDeployed({ current, running, latest })) {
      return `${this.chalk.bold("Status:")} ${this.chalk.underline.magentaBright("Deployed")}`
    }
    if (this.isPending({ current })) {
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
    if (value === false) {
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
