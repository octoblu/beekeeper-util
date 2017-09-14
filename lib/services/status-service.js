const BeekeeperService = require("./beekeeper-service")
const Project = require("../models/project")

class StatusService {
  constructor(options) {
    const { beekeeperUri, projectUri, beekeeperEnabled, spinner } = options
    this.spinner = spinner
    this.beekeeperService = new BeekeeperService({ beekeeperUri, beekeeperEnabled, spinner })
    this.project = new Project({ projectUri })
  }

  async get({ projectVersion, projectName, projectOwner }) {
    const desired = await this.beekeeperService.getDeployment({ projectName, projectOwner, projectVersion })
    const latest = await this.beekeeperService.getDeployment({ projectName, projectOwner, projectVersion: "latest" })
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
}

module.exports = StatusService
