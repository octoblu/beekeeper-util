ora     = require 'ora'
chalk   = require 'chalk'

class Spinner
  constructor: ->
    @ora = ora()

  start: (text) =>
    @ora.start " #{text}"

  log: (text, symbol) =>
    symbol ?= '🔹'
    text = " #{text}"
    @ora.stopAndPersist { text, symbol }

  succeed: (text) =>
    symbol = '📦'
    text = " #{text}"
    @ora.stopAndPersist { text, symbol }

  fail: (text) =>
    symbol = '❌'
    text = " #{text}"
    @ora.stopAndPersist { text, symbol }

  warn: =>
    text = " #{text}"
    @ora.stopAndPersist symbol: '💩'

module.exports = Spinner
