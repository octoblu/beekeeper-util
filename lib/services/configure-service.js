const async = require("async")
const QuayService = require("./src/quay-service")
const DockerHubService = require("./src/docker-hub-service")
const ProjectService = require("./src/project-service")
const CodefreshService = require("./src/codefresh-service")
const TravisService = require("./travis-service")
const CodecovService = require("./src/codecov-service")
const GithubService = require("./github-service")

class ConfigureService {
  constructor({ config, spinner }) {
    const { github, travis } = config
    this.spinner = spinner
    this.githubService = new GithubService({ github, spinner })
    this.travisService = new TravisService({ github, travis, spinner })
    this.projectService = new ProjectService({ config, spinner })
    this.quayService = new QuayService({ config, spinner })
    this.dockerHubService = new DockerHubService({ config, spinner })
    this.codefreshService = new CodefreshService({ config, spinner })
    this.codecovService = new CodecovService({ config, travisService: this.travisService, spinner })
  }

  async configure({ repo, owner }) {
    const projectName = repo
    const projectOwner = owner

    const isPrivate = await this.githubService.isPrivate({ projectName, projectOwner })
    this.spinner.log("Configuring #{owner}/#{repo}", "🐝")
    this.spinner.start("Configuring")
    await this.travisService.configure({ projectName, projectOwner, isPrivate })
    async.series(
      [
        async.apply(this.codecovService.configure, { repo, owner, isPrivate }),
        async.apply(this.codecovService.configureEnv, { repo, owner, isPrivate }),
        async.apply(this.projectService.configure, { isPrivate }),
        async.apply(this.projectService.initVersionFile),
        async.apply(this.quayService.configure, { repo, owner, isPrivate }),
        async.apply(this.dockerHubService.configure, { repo, owner, isPrivate }),
        async.apply(this.codefreshService.configure, { repo, owner, isPrivate }),
      ],
      error => {
        return Promise.reject(error)
      }
    )
  }
}

module.exports = ConfigureService
