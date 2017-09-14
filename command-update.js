#!/usr/bin/env node

const OctoDash = require("octodash")
const packageJSON = require("./package.json")
const BeekeeperService = require("./lib/services/beekeeper-service")
const ProjectHelper = require("./lib/helpers/project-helper")
const first = require("lodash/first")
const Spinner = require("./lib/models/spinner")

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
    names: ["project-version"],
    type: "string",
    env: "BEEKEEPER_PROJECT_VERSION",
    required: true,
    default: projectHelper.projectVersion(),
    help: "Project Version",
  },
  {
    names: ["docker-url"],
    type: "string",
    env: "BEEKEEPER_DOCKER_URL",
    required: true,
    help: "Docker Url",
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

  const { beekeeperUri, projectVersion, projectName, projectOwner, dockerUrl } = options
  const beekeeperService = new BeekeeperService({ beekeeperUri })

  const spinner = new Spinner()
  if (spinner) spinner.log(`Updating ${projectOwner}/${projectName}/${projectVersion}`, "🐝")
  if (spinner) spinner.start("Updating")

  try {
    await beekeeperService.updateDeployment({ projectOwner, projectName, projectVersion, dockerUrl })
  } catch (error) {
    if (spinner) spinner.warn()
    if (spinner) spinner.fail(error)
    octoDash.die(error)
  }

  if (spinner) spinner.succeed("Updated")
  octoDash.die() // exits with status 0
}

run()
