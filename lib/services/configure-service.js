const async = require("async")
const ProjectService = require("../../src/project-service")
const DockerHubService = require("./docker-hub-service")
const CodefreshService = require("./codefresh-service")
const TravisService = require("./travis-service")
const CodecovService = require("./codecov-service")
const GithubService = require("./github-service")

class ConfigureService {
  constructor({ config, spinner }) {
    const { beekeeperUri, githubToken, travisEnabled, travisToken, codecov, npm, project, codefresh, beekeeper, dockerHub } = config
    this.spinner = spinner
    this.githubService = new GithubService({ githubToken, spinner })
    this.travisService = new TravisService({ githubToken, travisEnabled, travisToken, spinner })
    this.projectService = new ProjectService({ config, spinner })
    this.dockerHubService = new DockerHubService({ beekeeperUri, dockerHub, spinner })
    this.codefreshService = new CodefreshService({ codefresh, npm, project, beekeeper, spinner })
    this.codecovService = new CodecovService({ githubToken, travisEnabled, travisToken, codecov, spinner })
  }

  async configure({ projectName, projectOwner }) {
    this.spinner.log(`Configuring ${projectOwner}/${projectName}`, "🐝")
    this.spinner.start("Configuring")

    const isPrivate = await this.githubService.isPrivate({ projectName, projectOwner })
    await this.travisService.configure({ projectName, projectOwner, isPrivate })
    await this.codecovService.configure({ projectName, projectOwner, isPrivate })
    await this.codefreshService.configure({ projectName, projectOwner, isPrivate })
    await this.dockerHubService.configure({ projectName, projectOwner, isPrivate })
    return new Promise((resolve, reject) => {
      async.series([async.apply(this.projectService.configure, { isPrivate }), async.apply(this.projectService.initVersionFile)], error => {
        if (error) return reject(error)
        resolve()
      })
    })
  }
}

module.exports = ConfigureService
