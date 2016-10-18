colors      = require 'colors'
program     = require 'commander'
packageJSON = require './package.json'

program
  .version packageJSON.version
  .command 'configure', 'configure a project to work with beekeeper'
  .command 'get', 'get the current deployment'
  .command 'hub', 'configure a project to use docker hub (no beekeeper webhooks)'
  .command 'pingdom', 'configure a project to use pingdom'

class Command
  constructor: ->
    process.on 'uncaughtException', @die
    {@runningCommand} = @parseOptions()

  parseOptions: =>
    program.parse process.argv
    { runningCommand } = program
    return { runningCommand }

  run: =>
    return if @runningCommand
    program.outputHelp()
    process.exit 0

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.stack
    process.exit 1

module.exports = Command
