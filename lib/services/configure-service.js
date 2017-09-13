const async = require("async")
const QuayService = require("../../src/quay-service")
const ProjectService = require("../../src/project-service")
const DockerHubService = require("./docker-hub-service")
const CodefreshService = require("./codefresh-service")
const TravisService = require("./travis-service")
const CodecovService = require("./codecov-service")
const GithubService = require("./github-service")

class ConfigureService {
  constructor({ config, spinner }) {
    const { github, travis, codecov, npm, project, codefresh, beekeeper, dockerHub } = config
    this.spinner = spinner
    this.githubService = new GithubService({ github, spinner })
    this.travisService = new TravisService({ github, travis, spinner })
    this.projectService = new ProjectService({ config, spinner })
    this.quayService = new QuayService({ config, spinner })
    this.dockerHubService = new DockerHubService({ beekeeper, dockerHub, spinner })
    this.codefreshService = new CodefreshService({ codefresh, npm, project, beekeeper, spinner })
    this.codecovService = new CodecovService({ github, travis, codecov, spinner })
  }

  async configure({ repo, owner }) {
    const projectName = repo
    const projectOwner = owner

    this.spinner.log(`Configuring ${owner}/${repo}`, "🐝")
    this.spinner.start("Configuring")

    const isPrivate = await this.githubService.isPrivate({ projectName, projectOwner })
    await this.travisService.configure({ projectName, projectOwner, isPrivate })
    await this.codecovService.configure({ projectName, projectOwner, isPrivate })
    await this.codefreshService.configure({ projectName, projectOwner, isPrivate })
    await this.dockerHubService.configure({ projectName, projectOwner, isPrivate })
    return new Promise((resolve, reject) => {
      async.series(
        [
          async.apply(this.projectService.configure, { isPrivate }),
          async.apply(this.projectService.initVersionFile),
          async.apply(this.quayService.configure, { repo, owner, isPrivate }),
        ],
        error => {
          if (error) return reject(error)
          resolve()
        },
      )
    })
  }
}

module.exports = ConfigureService
