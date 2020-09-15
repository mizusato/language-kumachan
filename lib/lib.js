let { provider: AutoCompleteProvider } = require('./autocomplete')
let { consumer: LinterConsumer } = require('./lint')
let { provider: HighlightProvider } = require('./highlight')
let { registerCommand: registerRenameCommand } = require('./rename')
let { provider: OutlineProvider } = require('./outline')
let { registerCommands: registerRunCommands } = require('./run')

registerRenameCommand()
registerRunCommands()

module.exports.provideAutoComplete = () => AutoCompleteProvider
module.exports.consumeLinter = LinterConsumer
module.exports.provideHighlight = () => HighlightProvider
module.exports.provideOutline = () => OutlineProvider