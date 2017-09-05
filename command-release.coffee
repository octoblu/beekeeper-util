_       = require 'lodash'
colors  = require 'colors'
program = require 'commander'

GithubService = require './src/github-service.coffee'
GitService    = require './src/git-service.coffee'

packageJSON   = require './package.json'

list = (val) -> _.map _.split(val, ','), _.trim

program
  .version packageJSON.version
  .usage '[options] <message>'
  .option '-r, --repo <repo-name>', 'Project repo name'
  .option '-o, --owner <octoblu>', 'Project owner'
  .option '-t, --tag <tag>', 'Project version'
  .option '-a, --authors <authors>', 'a list of authors', list

class Command
  constructor: (@config) ->
    # process.on 'uncaughtException', @die
    @githubService = new GithubService { @config }
    @gitService = new GitService { @config }

  parseOptions: =>
    program.parse process.argv
    message = program.args[0]
    repo = program.repo || @config.name
    owner = program.owner || @config.owner
    tag = program.tag || @config.version
    authors = _.map program.authors, (initial) => @config.authors[initial]
    return {
      repo,
      owner,
      tag,
      authors,
      message
    }

  run: =>
    { authors, message, tag } = @parseOptions()
    @gitService.check { tag }, (error) =>
      return @die error if error?
      @gitService.release { authors, message, tag }, (error) =>
        return @die error if error?
        console.log colors.green('RELEASED!')
        @die()

  dieHelp: (error) =>
    console.error error.toString()
    program.outputHelp()
    process.exit 1

  die: (error) =>
    return process.exit(0) unless error?
    console.error error.toString()
    process.exit 1

module.exports = Command
