#!/usr/bin/env node

const OctoDash = require("octodash")
const packageJSON = require("./package.json")
const StatusService = require("./lib/services/status-service")
const ProjectHelper = require("./lib/helpers/project-helper")
const Spinner = require("./lib/models/spinner")
const parseBeekeeperEnv = require("./lib/helpers/parse-beekeeper-env")
const clear = require("console-clear")
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
  {
    names: ["notify", "n"],
    type: "boolarg",
    env: "BEEKEEPER_NOTIFY",
    default: true,
    help: "Send system notification on state change",
  },
  {
    names: ["watch", "w"],
    type: "bool",
    env: "BEEKEEPER_STATUS_WATCH",
    default: false,
    help: "Watch the status and refresh",
  },
  {
    names: ["watch-interval"],
    type: "number",
    env: "BEEKEEPER_STATUS_WATCH_INTERVAL",
    default: 15,
    help: "Refresh interval",
    helpArg: "SECONDS",
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
    notify,
    watch,
    watchInterval,
  } = options

  const spinner = new Spinner()

  const statusService = new StatusService({
    beekeeperUri,
    beekeeperEnabled,
    disableColors,
    dockerEnabled,
    spinner,
  })
  if (watch) {
    const refresh = async () => {
      let status
      clear(true)
      console.log("Refreshing....")
      try {
        status = await statusService.get({ projectOwner, projectName, projectVersion, projectUri })
        clear(true)
        console.log(`${statusService.render(status)}`)
      } catch (error) {
        octoDash.die(error)
      }
      const { current, changed } = status
      if (notify && changed) {
        statusService.notify({ current, projectName, projectVersion, projectUri })
      }
      if (statusService.isDeployed({ current })) {
        octoDash.die()
      }
      const statusError = statusService.getStatusError({ current })
      if (statusError) {
        octoDash.die(statusError)
      }
    }
    await refresh()
    const refreshInterval = setInterval(refresh, watchInterval * 1000)
    process.on("SIGINT", () => {
      console.log("exiting...")
      clearInterval(refreshInterval)
    })
  } else {
    let status
    try {
      status = await statusService.get({ projectOwner, projectName, projectVersion, projectUri })
      console.log(`${statusService.render(status)}`)
    } catch (error) {
      octoDash.die(error)
    }
    const { current } = status
    if (notify) {
      statusService.notify({ current, projectName, projectVersion, projectUri })
    }
    octoDash.die()
  }
}

run().catch(function(error) {
  console.error(error.stack)
})
