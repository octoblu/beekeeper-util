async             = require 'async'
colors            = require 'colors'
program           = require 'commander'

Spinner          = require './src/spinner'

packageJSON       = require './package.json'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '-o, --owner <repo>', 'Project owner'

class Command
  constructor: (@config) ->
    @spinner = new Spinner()
    @spinner.start 'Starting Beekeeper'
    process.on 'uncaughtException', @die
    { @repo, @owner } = @parseOptions()
    throw new Error("Missing option: repo") unless @repo?
    throw new Error("Missing option: owner") unless @owner?
    @configureService = new ConfigureService { @config, @spinner }

  parseOptions: =>
    program.parse process.argv

    repo = program.args[0] || @config.project.name
    owner = program.owner || @config.project.owner

    return {
      repo,
      owner
    }

  run: =>
    @configureService.configure @repo, @owner
      .then =>
        @spinner.succeed 'Configured!'
        process.exit 0
      .catch (error) =>
        return @die error if error?
        @spinner.warn()
        @spinner.fail error.toString()
        process.exit 1

  dieHelp: (error) =>
    console.error error.toString()
    program.outputHelp()
    process.exit 1

  die: (error) =>
    return process.exit(0) unless error?
    @spinner.warn()
    @spinner.fail error.toString()
    console.error error.stack
    process.exit 1

module.exports = Command
