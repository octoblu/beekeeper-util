const bindAll = require("lodash/fp/bindAll")
const BeekeeperDeployment = require("../models/beekeeper-deployment")
const get = require("lodash/get")

class BeekeeperService {
  constructor({ beekeeper, spinner }) {
    bindAll(Object.getOwnPropertyNames(BeekeeperService.prototype), this)
    this.beekeeperEnabled = get(beekeeper, "enabled")
    this.beekeeperUri = get(beekeeper, "uri")
    if (this.beekeeperEnabled && !this.beekeeperUri) throw new Error("Missing beekeeper.uri in config")
    this.spinner = spinner
  }

  async createDeployment({ projectName, projectOwner, isPrivate, projectVersion }) {
    if (!this.beekeeperEnabled) return
    const { spinner, beekeeperUri } = this
    const beekeeperDeployment = new BeekeeperDeployment({ projectName, projectOwner, isPrivate, beekeeperUri })
    if (spinner) spinner.start("Beekeeper: Creating deployment")
    await beekeeperDeployment.init()
    await beekeeperDeployment.create({ projectVersion })
    if (spinner) spinner.log("Beekeeper: Deployment created")
  }

  async deleteDeployment({ projectName, projectOwner, isPrivate, projectVersion }) {
    if (!this.beekeeperEnabled) return
    const { spinner, beekeeperUri } = this
    const beekeeperDeployment = new BeekeeperDeployment({ projectName, projectOwner, isPrivate, beekeeperUri })
    if (spinner) spinner.start("Beekeeper: Deleting deployment")
    await beekeeperDeployment.init()
    await beekeeperDeployment.delete({ projectVersion })
    if (spinner) spinner.log("Beekeeper: Deployment deleted")
  }
}

module.exports = BeekeeperService
