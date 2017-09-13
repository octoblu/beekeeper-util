#!/usr/bin/env node

const OctoDash = require("octodash")
const packageJSON = require("./package.json")

const CLI_OPTIONS = [
  {
    names: ["beekeeper-uri"],
    type: "string",
    env: "BEEKEEPER_URI",
    required: true,
    help: "Beekeeper Uri",
    helpArg: "URL",
  },
]

const octoDash = new OctoDash({
  argv: process.argv,
  cliOptions: CLI_OPTIONS,
  name: packageJSON.name,
  version: packageJSON.version,
})
const options = octoDash.parseOptions()
console.log("Parsed Options", options)
octoDash.die() // exits with status 0
octoDash.die(new Error("oh no")) // prints error and exists with status code 1
