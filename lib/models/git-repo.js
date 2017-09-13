const bindAll = require("lodash/fp/bindAll")
const simpleGit = require("simple-git")
const { getTag } = require("../helpers/semver")
const includes = require("lodash/includes")
const path = require("path")

class GitRepo {
  constructor({ gitMock, projectRoot }) {
    bindAll(Object.getOwnPropertyNames(GitRepo.prototype), this)
    this.projectRoot = projectRoot
    this.git = gitMock ? gitMock : simpleGit(projectRoot)
  }

  async verifyRepo() {
    const { current } = await this.git.branch()
    if (current !== "master") {
      throw new Error("Current branch must be 'master'")
    }
  }

  async verifyTag(newVersion) {
    const tag = getTag(newVersion)
    if (!tag) {
      throw new Error(`Version '${newVersion}' must be valid semver`)
    }
    const tags = await this.git.tags()
    if (includes(tags.all, tag)) {
      throw new Error(`Tag ${tag} already exists`)
    }
  }

  add() {
    return this.git.add(path.join(this.projectRoot, "*"))
  }

  commit(message) {
    return this.git.commit(message)
  }
}

module.exports = GitRepo
