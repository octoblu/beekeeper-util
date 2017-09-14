#!/usr/bin/env node

const OctoDash = require("octodash")
const packageJSON = require("./package.json")
const ConfigureService = require("./lib/services/configure-service")
const ProjectHelper = require("./lib/helpers/project-helper")
const Spinner = require("./lib/models/spinner")

const projectRoot = process.cwd()

const projectHelper = new ProjectHelper({ projectRoot })

const CLI_OPTIONS = [
  {
    names: ["beekeeper-uri"],
    type: "string",
    env: "BEEKEEPER_URI",
    required: true,
    help: "Beekeeper Uri",
    helpArg: "URL",
  },
  {
    names: ["project-has-dockerfile"],
    type: "string",
    env: "BEEKEEPER_PROJECT_HAS_DOCKERFILE",
    help: "Project has ./Dockerfile",
    default: projectHelper.hasDockerfile(),
  },
  {
    names: ["project-owner"],
    type: "string",
    env: "BEEKEEPER_PROJECT_OWNER",
    required: true,
    help: "Project Owner",
  },
  {
    names: ["project-name"],
    type: "string",
    env: "BEEKEEPER_PROJECT_NAME",
    required: true,
    default: projectHelper.defaultProjectName(),
    help: "Project Name",
  },
  {
    names: ["github-token"],
    type: "string",
    env: "BEEKEEPER_GITHUB_TOKEN",
    required: true,
    help: "Github token",
  },
  {
    names: ["beekeeper-enabled", "enable-beekeeper"],
    type: "boolarg",
    env: "BEEKEEPER_ENABLED",
    required: true,
    default: true,
    help: "Beekeeper enabled",
  },
  {
    names: ["codecov-enabled", "enable-codecov"],
    type: "boolarg",
    env: "BEEKEEPER_CODECOV_ENABLED",
    required: true,
    default: true,
    help: "Codecov enabled",
  },
  {
    names: ["codecov-token"],
    type: "string",
    env: "BEEKEEPER_CODECOV_TOKEN",
    required: true,
    help: "Codecov token",
  },
  {
    names: ["codefresh-enabled", "enable-codefresh"],
    type: "boolarg",
    env: "BEEKEEPER_CODEFRESH_ENABLED",
    required: true,
    default: true,
    help: "Codefresh enabled",
  },
  {
    names: ["codefresh-token"],
    type: "string",
    env: "BEEKEEPER_CODEFRESH_TOKEN",
    required: true,
    help: "Codefresh token",
  },
  {
    names: ["travis-enabled", "enable-travis"],
    type: "boolarg",
    env: "BEEKEEPER_TRAVIS_ENABLED",
    required: true,
    default: true,
    help: "Travis enabled",
  },
  {
    names: ["travis-token"],
    type: "string",
    env: "BEEKEEPER_TRAVIS_TOKEN",
    required: true,
    help: "Travis token",
  },
  {
    names: ["npm-token"],
    type: "string",
    env: "BEEKEEPER_NPM_TOKEN",
    required: true,
    help: "NPM token",
  },
]

const run = async function() {
  const octoDash = new OctoDash({
    argv: process.argv,
    cliOptions: CLI_OPTIONS,
    name: packageJSON.name,
    version: packageJSON.version,
  })
  const options = octoDash.parseOptions()

  const {
    beekeeperUri,
    projectHasDockerfile,
    projectName,
    projectOwner,
    travisEnabled,
    travisToken,
    githubToken,
    codecovEnabled,
    codecovToken,
    codefreshEnabled,
    codefreshToken,
    npmToken,
  } = options

  const spinner = new Spinner()

  const configureService = new ConfigureService({
    projectHasDockerfile,
    projectRoot,
    beekeeperUri,
    githubToken,
    travisToken,
    travisEnabled,
    codecovEnabled,
    codecovToken,
    codefreshEnabled,
    codefreshToken,
    npmToken,
    spinner,
  })

  try {
    await configureService.configure({ projectOwner, projectName })
  } catch (error) {
    octoDash.die(error)
  }

  octoDash.die() // exits with status 0
}

run()
