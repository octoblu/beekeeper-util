#!/usr/bin/env node

const OctoDash = require("octodash")
const packageJSON = require("./package.json")
const ReleaseService = require("./lib/services/release-service")
const ProjectHelper = require("./lib/helpers/project-helper")
const Spinner = require("./lib/models/spinner")
const map = require("lodash/map")
const compact = require("lodash/compact")
const first = require("lodash/first")
const isEmpty = require("lodash/isEmpty")

const projectRoot = process.cwd()

const projectHelper = new ProjectHelper({ projectRoot })

const checkExclusiveOptions = function(options) {
  const exclusiveOptions = compact(
    map(options, (value, key) => {
      if (value === true || !isEmpty(value)) return key
    })
  )
  const length = exclusiveOptions.length
  if (length > 1) throw new Error(`Multiple release options cannot be specified ${exclusiveOptions}`)
  if (length === 0) return "patch"
  return first(exclusiveOptions).toString()
}

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
    names: ["github-token"],
    type: "string",
    env: "BEEKEEPER_GITHUB_TOKEN",
    required: true,
    help: "Github token",
  },
  {
    names: ["github-release-enabled", "enable-github-release"],
    type: "boolarg",
    env: "BEEKEEPER_GITHUB_RELEASE_ENABLED",
    required: true,
    default: true,
    help: "Github release enabled",
  },
  {
    names: ["github-draft"],
    type: "bool",
    env: "BEEKEEPER_GITHUB_DRAFT",
    default: false,
    help: "Github draft",
  },
  {
    names: ["github-prerelease"],
    type: "bool",
    env: "BEEKEEPER_GITHUB_PRERELEASE",
    default: false,
    help: "Github prerelease",
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
    names: ["init"],
    type: "bool",
    help: "Set version 1.0.0",
  },
  {
    names: ["major"],
    type: "bool",
    help: "Increment semver major version",
  },
  {
    names: ["premajor"],
    type: "bool",
    help: "Increment semver premajor version",
  },
  {
    names: ["minor"],
    type: "bool",
    help: "Increment semver minor version",
  },
  {
    names: ["preminor"],
    type: "bool",
    help: "Increment semver preminor version",
  },
  {
    names: ["patch"],
    type: "bool",
    help: "Increment semver patch version",
  },
  {
    names: ["prepatch"],
    type: "bool",
    help: "Increment semver prepatch version",
  },
  {
    names: ["prerelease"],
    type: "string",
    help: "Increment semver prerelease version, value is 'tag-preid'",
    helpArg: "preid",
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
  const message = first(options._argv)

  const {
    beekeeperUri,
    beekeeperEnabled,
    projectName,
    projectOwner,
    githubToken,
    githubReleaseEnabled,
    projectVersion,
    init,
    major,
    premajor,
    minor,
    preminor,
    patch,
    prepatch,
    prerelease,
  } = options

  const release = checkExclusiveOptions({
    init,
    major,
    premajor,
    minor,
    preminor,
    patch,
    prepatch,
    prerelease,
  })

  const newProjectVersion = projectHelper.incrementVersion({ release, projectVersion, prerelease })

  const spinner = new Spinner()

  const releaseService = new ReleaseService({
    projectRoot,
    beekeeperEnabled,
    beekeeperUri,
    githubToken,
    githubReleaseEnabled,
    spinner,
  })

  try {
    await releaseService.release({ projectOwner, projectName, release, projectVersion: newProjectVersion, message })
  } catch (error) {
    console.log({ error })
    octoDash.die(error)
  }

  octoDash.die() // exits with status 0
}

run().catch(function(error) {
  console.error(error.stack)
})
