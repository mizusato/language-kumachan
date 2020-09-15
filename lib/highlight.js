let { TextEditor, Point, Range, TextBuffer } = require("atom")
let { getPatternNode, patternToBindingNodes } = require('./util')
let { renameTarget } = require('./rename')


function clearRenameTarget() {
    renameTarget.editor = null
    renameTarget.currentSymbolUsageRanges = []
}

function setRenameTarget(editor, ranges) {
    renameTarget.editor = editor
    renameTarget.currentSymbolUsageRanges = ranges
}

function findFirstAncestor(node, f) {
    let parent = node.parent
    if (parent) {
        if (f(parent)) {
            return parent
        } else {
            return findFirstAncestor(parent, f)
        }
    } else {
        return null
    }
}

function findFirstAncestorOfTypes(node, types) {
    return findFirstAncestor(node, n => types.includes(n.type))
}

function* getAllRefNameNodesInScope(scopeNode, name) {
    for (let child of scopeNode.children) {
        if (child.type == 'inline_ref' && child.children[0].text == name) {
            yield child.children[0]
        } else {
            let pattern = getPatternNode(child)
            if (pattern != null) {
                let bindingNodes = patternToBindingNodes(pattern)
                if (bindingNodes.some(n => n.text == name)) {
                    // shadowing
                    continue
                }
            }
            yield* getAllRefNameNodesInScope(child, name)
        }
    }
}

function getAllUsageRanges(defNode) {
    if (defNode == null) { return [] }
    let name = defNode.text
    let scope = findFirstAncestorOfTypes(defNode, ['block', 'lambda', 'cps'])
    if (scope != null) {
        let refs = Array.from(getAllRefNameNodesInScope(scope, name))
        return [defNode.range, ...(refs.map(n => n.range))]
    } else {
        return [defNode.range]
    }
}

function findDefNode(refNode) {
    let name = refNode.text
    let defNode = null
    void (findFirstAncestor(refNode, n => {
        let pattern = getPatternNode(n)
        if (pattern != null) {
            let bindingNodes = patternToBindingNodes(pattern)
            for (let bindingNode of bindingNodes) {
                if (bindingNode.text == name) {
                    defNode = bindingNode
                    return true
                }
            }
            return false
        } else {
            return false
        }
    }))
    return defNode
}

let provider = {
    /**
     *  @param {TextEditor} editor
     *  @param {Point} point 
     */
    async highlight(editor, point) {
        clearRenameTarget()
        let buffer = editor.getBuffer()
        // @ts-ignore
        if (!(buffer.languageMode instanceof Object)) { return [] }
        // @ts-ignore
        if (typeof buffer.languageMode.getSyntaxNodeAtPosition != 'function') { return [] }
        // @ts-ignore
        let currentNode = buffer.languageMode.getSyntaxNodeAtPosition(point)
        if (!(currentNode instanceof Object)) { return [] }
        if (currentNode.type != 'name') { return [] }
        let parent = currentNode.parent
        if (!(parent)) { return [] }
        if (parent.type == 'inline_ref') {
            let defNode = findDefNode(currentNode)
            if (defNode != null) {
                let ranges = getAllUsageRanges(defNode)
                setRenameTarget(editor, ranges)
                return ranges
            } else {
                return []
            }
        } else if (parent.type == 'pattern_trivial') {
            let ranges = getAllUsageRanges(currentNode)
            setRenameTarget(editor, ranges)
            return ranges
        } else if (parent.type == 'pattern_tuple') {
            let ranges = getAllUsageRanges(currentNode)
            setRenameTarget(editor, ranges)
            return ranges
        } else if (parent.type == 'pattern_bundle') {
            if (!(currentNode.previousSibling) || currentNode.previousSibling.type != ':') {
                let ranges = getAllUsageRanges(currentNode)
                setRenameTarget(editor, ranges)
                return ranges
            } else {
                return []
            }
        } else {
            return []
        }
    },
    // dispose() {

    // }
}

module.exports.provider = provider