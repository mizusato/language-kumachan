let { TextEditor, Range: AtomRange } = require("atom")


/** @type {{ editor: TextEditor,currentSymbolUsageRanges: AtomRange[] }} */
let renameTarget = {
    editor: null,
    currentSymbolUsageRanges: []
}
function registerCommand () { 
    atom.commands.add('atom-workspace', 'kumachan:rename', () => {
        let editor = renameTarget.editor
        let ranges = renameTarget.currentSymbolUsageRanges
        if (editor != null && ranges.length > 0) {
            if (ranges.length == 1) {
                editor.setSelectedBufferRange(ranges[0])
            } else {
                editor.setSelectedBufferRanges(ranges)
            }
        }
    })
}

module.exports.renameTarget = renameTarget
module.exports.registerCommand = registerCommand