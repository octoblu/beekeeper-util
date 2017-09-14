#!/usr/bin/env node

const OctoDash = require("octodash")
const packageJSON = require("./package.json")
const BeekeeperService = require("./lib/services/beekeeper-service")
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
    names: ["project-version"],
    type: "string",
    env: "BEEKEEPER_PROJECT_VERSION",
    required: true,
    default: projectHelper.projectVersion(),
    help: "Project Version",
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

  const { beekeeperUri, projectVersion, projectName, projectOwner } = options
  const beekeeperService = new BeekeeperService({ beekeeperUri })

  try {
    await beekeeperService.delete({ projectOwner, projectName, projectVersion })
  } catch (error) {
    octoDash.die(error)
  }

  octoDash.die() // exits with status 0
}

run()
