const bindAll = require("lodash/fp/bindAll")
const GitRepo = require("../models/git-repo")

class GitService {
  constructor({ gitMock, project }) {
    bindAll(Object.getOwnPropertyNames(GitService.prototype), this)
    const projectRoot = project.root
    this.gitRepo = new GitRepo({ gitMock, projectRoot })
  }

  async release({ newProjectVersion, message }) {
    await this.gitRepo.verifyRepo()
    await this.gitRepo.verifyTag(newProjectVersion)
    await this.gitRepo.add()
    await this.gitRepo.commit(message)
    await this.gitRepo.tag(newProjectVersion)
    await this.gitRepo.push()
  }
}

module.exports = GitService
