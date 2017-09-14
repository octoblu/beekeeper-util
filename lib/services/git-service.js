const bindAll = require("lodash/fp/bindAll")
const GitRepo = require("../models/git-repo")
const { getTag } = require("../helpers/semver")

class GitService {
  constructor({ gitMock, projectRoot, spinner }) {
    bindAll(Object.getOwnPropertyNames(GitService.prototype), this)
    this.spinner = spinner
    this.gitRepo = new GitRepo({ gitMock, projectRoot })
  }

  async release({ projectVersion, message }) {
    const { spinner } = this
    if (spinner) spinner.start("Git: Releasing...")
    await this.gitRepo.verifyRepo()
    await this.gitRepo.verifyTag(projectVersion)
    await this.gitRepo.add()
    if (spinner) spinner.log("Git: git add .")
    await this.gitRepo.commit(message)
    if (spinner) spinner.log(`Git: git commit -m "${message}"`)
    await this.gitRepo.tag(projectVersion)
    if (spinner) spinner.log(`Git: git tag "${getTag(projectVersion)}"`)
    await this.gitRepo.push()
    if (spinner) spinner.log(`Git: git tag && git push --tags`)
    if (spinner) spinner.start("Git: Released!")
  }
}

module.exports = GitService
