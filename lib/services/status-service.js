const BeekeeperService = require("./beekeeper-service")
const Project = require("../models/project")

class StatusService {
  constructor(options) {
    const { beekeeperUri, projectUri, beekeeperEnabled, spinner } = options
    this.spinner = spinner
    this.beekeeperService = new BeekeeperService({ beekeeperUri, beekeeperEnabled, spinner })
    this.project = new Project({ projectUri })
  }

  async get({ projectVersion, projectName, projectOwner, filterTags }) {
    const desired = await this.beekeeperService.getDeployment({ projectName, projectOwner, projectVersion, filterTags })
    const latest = await this.beekeeperService.getDeployment({
      projectName,
      projectOwner,
      projectVersion: "latest",
      filterTags,
    })
    const runningVersion = await this.project.getVersion()
    let running = {}
    if (runningVersion) {
      running = await this.beekeeperService.getDeployment({ projectName, projectOwner, projectVersion: runningVersion })
    }
    return {
      desired,
      latest,
      running,
    }
  }

  render({ desired, running, latest }) {
    const desiredSlug = this.project.getSlugFromDeployment(desired)
    const runningSlug = this.project.getSlugFromDeployment(running)
    const latestSlug = this.project.getSlugFromDeployment(latest)
    const template = `
      Desired: ${desiredSlug}
      Latest: ${latestSlug}
      Running: ${runningSlug}
    `
    return template.trim()
  }
}

module.exports = StatusService
