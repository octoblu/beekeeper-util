#!/usr/bin/env node

const OctoDash = require("octodash")
const packageJSON = require("./package.json")
const ConfigureService = require("./lib/services/configure-service")
const ProjectHelper = require("./lib/helpers/project-helper")

const projectHelper = new ProjectHelper({ projectRoot: process.cwd() })

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
    names: ["travis-enabled", "enable-travis"],
    type: "string",
    env: "BEEKEEPER_TRAVIS_ENABLED",
    required: true,
    default: true,
    help: "Travis enabled",
  },
  {
    names: ["beekeeper-enabled", "enable-beekeeper"],
    type: "string",
    env: "BEEKEEPER_ENABLED",
    required: true,
    default: true,
    help: "Beekeeper enabled",
  },
  {
    names: ["travis-token"],
    type: "string",
    env: "BEEKEEPER_TRAVIS_TOKEN",
    required: true,
    help: "Travis token",
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

  const { beekeeperUri, projectName, projectOwner, travisEnabled, travisToken, githubToken } = options
  const configureService = new ConfigureService({ beekeeperUri, githubToken, travisToken, travisEnabled })

  try {
    await configureService.configure({ projectOwner, projectName })
  } catch (error) {
    octoDash.die(error)
  }

  octoDash.die() // exits with status 0
}

run()
