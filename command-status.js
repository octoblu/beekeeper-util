#!/usr/bin/env node

const OctoDash = require("octodash")
const packageJSON = require("./package.json")
const StatusService = require("./lib/services/status-service")
const ProjectHelper = require("./lib/helpers/project-helper")
const Spinner = require("./lib/models/spinner")
const parseBeekeeperEnv = require("./lib/helpers/parse-beekeeper-env")
const path = require("path")

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
    names: ["project-uri", "u"],
    type: "string",
    env: "BEEKEEPER_PROJECT_URI",
    help: "Project URI",
  },
  {
    names: ["project-version"],
    type: "string",
    env: "BEEKEEPER_PROJECT_VERSION",
    required: true,
    default: projectHelper.projectVersion(),
    help: "Project Version",
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
    names: ["docker-enabled", "enable-docker"],
    type: "boolarg",
    env: "DOCKER_ENABLED",
    required: true,
    default: projectHelper.hasDockerfile(),
    help: "Beekeeper enabled",
  },
  {
    names: ["disable-colors"],
    type: "boolarg",
    env: "BEEKEEPER_DISABLE_COLORS",
    default: false,
    help: "Disable colors in output",
  },
]

const run = async function() {
  const filePath = path.join(projectRoot, ".beekeeper.env")
  const beekeeperEnv = parseBeekeeperEnv({ env: process.env, filePath })
  const octoDash = new OctoDash({
    argv: process.argv,
    env: beekeeperEnv,
    cliOptions: CLI_OPTIONS,
    name: packageJSON.name,
    version: packageJSON.version,
  })
  const options = octoDash.parseOptions()

  const {
    beekeeperUri,
    beekeeperEnabled,
    projectName,
    projectOwner,
    projectVersion,
    dockerEnabled,
    disableColors,
    projectUri,
  } = options

  const spinner = new Spinner()

  const statusService = new StatusService({
    beekeeperUri,
    beekeeperEnabled,
    disableColors,
    dockerEnabled,
    projectUri,
    spinner,
  })

  try {
    const status = await statusService.get({ projectOwner, projectName, projectVersion })
    console.log(`${statusService.render(status)}`)
  } catch (error) {
    octoDash.die(error)
  }

  octoDash.die() // exits with status 0
}

run().catch(function(error) {
  console.error(error.stack)
})
