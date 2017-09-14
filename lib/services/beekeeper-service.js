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

  async updateDeployment({ projectName, projectOwner, isPrivate, projectVersion, dockerUrl }) {
    const { spinner, beekeeperUri } = this
    const beekeeperDeployment = new BeekeeperDeployment({ projectName, projectOwner, isPrivate, beekeeperUri })
    if (spinner) spinner.start("Beekeeper: Updating deployment")
    await beekeeperDeployment.init()
    await beekeeperDeployment.update({ projectVersion, dockerUrl })
    if (spinner) spinner.log("Beekeeper: Deployment updated")
  }

  async webhookDeployment({ projectName, projectOwner, isPrivate, projectVersion, webhookType, ciPassing }) {
    const { spinner, beekeeperUri } = this
    const beekeeperDeployment = new BeekeeperDeployment({ projectName, projectOwner, isPrivate, beekeeperUri })
    if (spinner) spinner.start("Beekeeper: Updating webhook")
    await beekeeperDeployment.init()
    await beekeeperDeployment.webhook({ projectVersion, webhookType, ciPassing })
    if (spinner) spinner.log("Beekeeper: Webhook updated")
  }

  async tagDeployment({ projectName, projectOwner, isPrivate, projectVersion, tagName }) {
    if (!tagName) throw new Error("Missing tagName")
    const { spinner, beekeeperUri } = this
    const beekeeperDeployment = new BeekeeperDeployment({ projectName, projectOwner, isPrivate, beekeeperUri })
    if (spinner) spinner.start("Beekeeper: Creating tag")
    await beekeeperDeployment.init()
    await beekeeperDeployment.tag({ projectVersion, tagName })
    if (spinner) spinner.log("Beekeeper: Tag created")
  }
}

module.exports = BeekeeperService
