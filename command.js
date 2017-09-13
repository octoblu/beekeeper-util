#!/usr/bin/env node

const chalk = require("chalk")
const dashdash = require("dashdash")
const has = require("lodash/fp/has")
const concat = require("lodash/fp/concat")
const Commands = require("./lib/commands")
const packageJson = require("./package.json")

const parser = dashdash.createParser({
  interspersed: false,
  options: [
    {
      names: ["help", "h"],
      type: "bool",
      help: "Print this help and exit.",
    },
    {
      names: ["version", "v"],
      type: "bool",
      help: "Print the current version and exit.",
    },
  ],
})

class Command {
  constructor({ argv }) {
    this.options = parser.parse(argv)
  }

  run() {
    if (this.options.help) {
      console.log(this.usage()) // eslint-disable-line no-console
      process.exit(0)
    }

    if (this.options.version) {
      console.log(packageJson.version) // eslint-disable-line no-console
      process.exit(0)
    }

    const [command] = this.options._args
    if (!has(command, Commands)) {
      console.error(this.usage()) // eslint-disable-line no-console
      console.error(chalk.red(`\nInvalid command: "${command}"`)) // eslint-disable-line no-console
      process.exit(1)
    }
    Commands.run({ name: command, argv: concat(["node"], this.options._args) })
    // const tradingPost = new TradingPost
  }

  usage() {
    return `
USAGE:
    ${packageJson.name} [GLOBALOPTS] <command> [OPTIONS]

GLOBALOPTS:
${parser.help({ includeEnv: true, indent: 4 })}
COMMANDS:
    status    Show deployment status
    `.trim()
  }
}

module.exports = Command
if (!module.parent) {
  const command = new Command({ argv: process.argv })
  command.run()
}
