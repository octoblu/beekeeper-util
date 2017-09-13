const ora = require("ora")

class Spinner {
  constructor() {
    this.ora = ora()
  }

  start(text) {
    this.ora.start(` ${text}`)
  }

  log(text, symbol) {
    symbol = symbol || "🔹"
    text = ` ${text}`
    this.ora.stopAndPersist({ text, symbol })
  }

  succeed(text) {
    const symbol = "📦"
    text = ` ${text}`
    this.ora.stopAndPersist({ text, symbol })
  }

  fail(text) {
    const symbol = "❌"
    text = ` ${text}`
    this.ora.stopAndPersist({ text, symbol })
  }

  warn() {
    this.ora.stopAndPersist({ symbol: "💩" })
  }
}

module.exports = Spinner
