const bindAll = require("lodash/fp/bindAll")
const BeekeeperDeployment = require("../models/beekeeper-deployment")

class BeekeeperService {
  constructor({ beekeeperUri, spinner }) {
    bindAll(Object.getOwnPropertyNames(BeekeeperService.prototype), this)
    this.beekeeperUri = beekeeperUri
    if (!this.beekeeperUri) throw new Error("Missing beekeeperUri")
    this.spinner = spinner
  }

  async createDeployment({ projectName, projectOwner, isPrivate, projectVersion }) {
    const { spinner, beekeeperUri } = this
    const beekeeperDeployment = new BeekeeperDeployment({ projectName, projectOwner, isPrivate, beekeeperUri })
    if (spinner) spinner.start("Beekeeper: Creating deployment")
    await beekeeperDeployment.init()
    await beekeeperDeployment.create({ projectVersion })
    if (spinner) spinner.log("Beekeeper: Deployment created")
  }

  async deleteDeployment({ projectName, projectOwner, isPrivate, projectVersion }) {
    const { spinner, beekeeperUri } = this
    const beekeeperDeployment = new BeekeeperDeployment({ projectName, projectOwner, isPrivate, beekeeperUri })
    if (spinner) spinner.start("Beekeeper: Deleting deployment")
    await beekeeperDeployment.init()
    await beekeeperDeployment.delete({ projectVersion })
    if (spinner) spinner.log("Beekeeper: Deployment deleted")
  }

  async tagDeployment({ projectName, projectOwner, isPrivate, projectVersion, tagName }) {
    const { spinner, beekeeperUri } = this
    const beekeeperDeployment = new BeekeeperDeployment({ projectName, projectOwner, isPrivate, beekeeperUri })
    if (spinner) spinner.start("Beekeeper: Creating tag")
    await beekeeperDeployment.init()
    await beekeeperDeployment.tag({ projectVersion, tagName })
    if (spinner) spinner.log("Beekeeper: Tag created")
  }
}

module.exports = BeekeeperService
