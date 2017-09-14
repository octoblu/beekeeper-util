const BeekeeperService = require("./beekeeper-service")
const GithubService = require("./github-service")
const GitService = require("./git-service")
const ProjectHelper = require("../helpers/project-helper")

class ReleaseService {
  constructor(options) {
    const { githubToken, githubDraft, githubPrerelease, projectRoot, beekeeperUri, beekeeperEnabled, spinner } = options
    this.spinner = spinner
    this.projectHelper = new ProjectHelper({ projectRoot })
    this.beekeeperService = new BeekeeperService({ beekeeperUri, beekeeperEnabled, spinner })
    this.githubService = new GithubService({ githubToken, githubDraft, githubPrerelease, spinner })
    this.gitService = new GitService({ projectRoot, spinner })
  }

  async release({ message, projectVersion, projectName, release, projectOwner }) {
    const tag = `v${projectVersion}`
    if (this.spinner) this.spinner.log(`Releasing ${tag} (${release})`, "🐝")
    this.spinner.start("Beekeeping")
    this.projectHelper.modifyVersionFile({ tag })
    await this.gitService.release({ projectVersion, message })
    await this.beekeeperService.createDeployment({ projectName, projectOwner, projectVersion })
    await this.githubService.createRelease({ projectOwner, projectName, projectVersion, message, release })
  }
}

module.exports = ReleaseService
