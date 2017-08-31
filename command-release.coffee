colors            = require 'colors'
program           = require 'commander'

GithubService     = require './src/github-service.coffee'

packageJSON       = require './package.json'

program
  .version packageJSON.version
  .usage '[options] <project-name>'
  .option '-o, --owner <octoblu>', 'Project owner'

class Command
  constructor: (@config) ->
    process.on 'uncaughtException', @die
    { @repo, @owner } = @parseOptions()
    @githubService = new GithubService { @config }

  parseOptions: =>
    program.parse process.argv

    repo = program.args[0] || @config.name
    owner = program.owner || @config.owner

    return {
      repo,
      owner
    }

  run: =>
    console.log colors.green('IDK'), colors.white('not done')
    process.exit 0

  dieHelp: (error) =>
    console.error error.toString()
    program.outputHelp()
    process.exit 1

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.stack
    process.exit 1

module.exports = Command
