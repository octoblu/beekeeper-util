const bindAll = require("lodash/fp/bindAll")
const simpleGit = require("simple-git/promise")
const { getTag } = require("../helpers/semver-helper")
const includes = require("lodash/includes")
const path = require("path")
const which = require("which")

class GitRepo {
  constructor({ gitMock, projectRoot }) {
    bindAll(Object.getOwnPropertyNames(GitRepo.prototype), this)
    this.projectRoot = projectRoot
    this.git = gitMock ? gitMock : simpleGit(projectRoot)
    const gitTogether = which.sync("git-together", { nothrow: true })
    if (gitTogether) {
      this.git.customBinary(gitTogether)
    }
  }

  async verifyRepo() {
    const { current } = await this.git.branch()
    if (current !== "master") {
      throw new Error("Current branch must be 'master'")
    }
  }

  async verifyTag(projectVersion) {
    const tag = getTag(projectVersion)
    if (!tag) {
      throw new Error(`Version '${projectVersion}' must be valid semver`)
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

  tag(projectVersion) {
    return this.git.tag([getTag(projectVersion)])
  }

  async push() {
    await this.git.push()
    await this.git.pushTags()
  }
}

module.exports = GitRepo
