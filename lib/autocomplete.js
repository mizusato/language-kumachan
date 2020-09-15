let { TextEditor, Point, Range, TextBuffer } = require("atom")
let { SendRequest } = require('./server')
let { getPatternNode, patternToBindingNodes } = require('./util')


function patternToBindings(pattern) {
    return patternToBindingNodes(pattern).map(n => n.text)
}

/**
 *  @param {TextBuffer} buffer 
 *  @param {Point} point
 */
function getLocalBindings(buffer, point) {
    // @ts-ignore
    if (!(buffer.languageMode instanceof Object)) { return [] }
    // @ts-ignore
    if (typeof buffer.languageMode.getSyntaxNodeAtPosition != 'function') { return [] }
    // @ts-ignore
    let currentNode = buffer.languageMode.getSyntaxNodeAtPosition(point)
    if (!(currentNode instanceof Object)) { return [] }
    let findAllAncestors = node => {
        let result = []
        while (node.parent != null) {
            result.push(node.parent)
            node = node.parent
        }
        return result
    }
    let allAncestors = findAllAncestors(currentNode)
    let flatMap = (array, f) => {
        let result = []
        for (let item of array) {
            result.push(...(f(item)))
        }
        return result
    }
    let bindings = flatMap(allAncestors, ancestor => {
        let pattern = getPatternNode(ancestor)
        if (pattern != null) {
            return patternToBindings(pattern)
        } else {
            return []
        }
    })
    return bindings
}

let provider = {
    selector: '.source.kumachan',
    // disableForSelector: '.source.kumachan .comment',
    inclusionPriority: 1,
    excludeLowerPriority: true,
    suggestionPriority: 2,
    filterSuggestions: false,
    getSuggestions({ activatedManually, bufferPosition, editor, prefix, scopeDescriptor }) {
        console.log('getSuggestions', { activatedManually, bufferPosition, editor, prefix, scopeDescriptor })
        /** @type {TextEditor} */
        let currentEditor = editor
        let currentBuffer = currentEditor.getBuffer()
        let currentPath = currentBuffer.getPath()
        /** @type {Point} */
        let point = bufferPosition
        let precedingText = currentBuffer.getTextInRange(new Range(new Point(point.row,0), point))
        let localBindings = getLocalBindings(currentBuffer, point)
        let req = { precedingText, localBindings, currentPath }
        return (async () => {
            let res = await SendRequest('autocomplete', req)
            return (res.suggestions || [])
        })()
    },
    // getSuggestionDetailsOnSelect: function(suggestion) {
    //     return new Promise(function(resolve) {
    //         return resolve(newSuggestion);
    //     });
    // },
    // onDidInsertSuggestion: function({ editor, suggestion, triggerPosition }) {
       
    // },
    // dispose: function() {

    // }
}

module.exports.provider = provider