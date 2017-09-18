const DockerHubService = require("./docker-hub-service")
const CodefreshService = require("./codefresh-service")
const TravisService = require("./travis-service")
const CodecovService = require("./codecov-service")
const GithubService = require("./github-service")

class ConfigureService {
  constructor(options) {
    const {
      beekeeperUri,
      githubToken,
      travisEnabled,
      travisOrgToken,
      travisComToken,
      dockerHubEnabled,
      dockerHubUsername,
      dockerHubPassword,
      codecovEnabled,
      codecovToken,
      npmToken,
      projectRoot,
      projectHasDockerfile,
      codefreshToken,
      codefreshEnabled,
      travisJsonFile,
      spinner,
    } = options
    this.spinner = spinner
    this.githubService = new GithubService({ githubToken, spinner })
    this.travisService = new TravisService({
      githubToken,
      travisEnabled,
      travisOrgToken,
      travisComToken,
      travisJsonFile,
      spinner,
    })
    this.dockerHubService = new DockerHubService({
      beekeeperUri,
      dockerHubEnabled,
      dockerHubUsername,
      dockerHubPassword,
      spinner,
    })
    this.codefreshService = new CodefreshService({
      codefreshEnabled,
      codefreshToken,
      npmToken,
      projectRoot,
      projectHasDockerfile,
      beekeeperUri,
      spinner,
    })
    this.codecovService = new CodecovService({
      githubToken,
      travisEnabled,
      travisOrgToken,
      travisComToken,
      codecovEnabled,
      codecovToken,
      spinner,
    })
  }

  async configure({ projectName, projectOwner }) {
    if (this.spinner) this.spinner.log(`Configuring ${projectOwner}/${projectName}`, "🐝")
    if (this.spinner) this.spinner.start("Configuring")

    const isPrivate = await this.githubService.isPrivate({ projectName, projectOwner })
    await this.travisService.configure({ projectName, projectOwner, isPrivate })
    await this.codecovService.configure({ projectName, projectOwner, isPrivate })
    await this.codefreshService.configure({ projectName, projectOwner, isPrivate })
    await this.dockerHubService.configure({ projectName, projectOwner, isPrivate })
  }
}

module.exports = ConfigureService
