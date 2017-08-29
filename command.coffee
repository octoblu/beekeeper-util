program     = require 'commander'
packageJSON = require './package.json'

program
  .version packageJSON.version
  .command 'configure', 'configure a project to work with beekeeper'
  .command 'delete', 'delete the current deployment'
  .command 'get', 'get the status of a current deployment (alias of "status")'
  .command 'status-notify', 'get the status of a current deployment and notify when done'
  .command 'status', 'get the status of a current deployment'
  .command 'tag', 'tag a deployment'
  .command 'update', 'update a deployment'
  .command 'webhook', 'trigger webhook deployment'

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
