const BeekeeperService = require("./beekeeper-service")

class StatusService {
  constructor(options) {
    const { beekeeperUri, beekeeperEnabled, spinner } = options
    this.spinner = spinner
    this.beekeeperService = new BeekeeperService({ beekeeperUri, beekeeperEnabled, spinner })
  }

  async get({ projectVersion, projectName, projectOwner }) {
    const desired = await this.beekeeperService.getDeployment({ projectName, projectOwner, projectVersion })
    return {
      desired,
    }
  }
}

module.exports = StatusService
