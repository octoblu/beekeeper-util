const ProjectService = require("../../src/project-service")
const BeekeeperService = require("./beekeeper-service")
const GithubService = require("./github-service")
const GitService = require("./git-service")
const { promisify } = require("util")

class ReleaseService {
  constructor({ config, spinner }) {
    const { github, project } = config
    this.spinner = spinner
    this.projectService = new ProjectService({ config, spinner })
    this.beekeeperService = new BeekeeperService({ config, spinner })
    this.githubService = new GithubService({ github, spinner })
    this.gitService = new GitService({ project, spinner })
  }

  async release({ message, tag, repo, release, owner }) {
    const projectOwner = owner
    const projectName = repo
    const projectVersion = tag
    this.spinner.log(`Releasing v${tag} (${release})`, "🐝")
    this.spinner.start("Beekeeping")
    const initVersionFile = promisify(this.projectService.initVersionFile)
    const modifyVersion = promisify(this.projectService.modifyVersion)
    await initVersionFile()
    await modifyVersion({ tag })
    await this.gitService.release({ projectVersion, message })
    await this.beekeeperService.createDeployment({ projectName, projectOwner, projectVersion })
    await this.githubService.createRelease({ projectOwner, projectName, projectVersion, message, release })
  }
}

module.exports = ReleaseService
