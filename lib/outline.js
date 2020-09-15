let { TextEditor } = require("atom")
let { findChild } = require('./util')


let provider = {
    /**
     *  @param {TextEditor} editor 
     */
    async getOutline(editor) {
        try {
            let buffer = editor.getBuffer()
            // @ts-ignore
            if (!(buffer.languageMode instanceof Object)) { return null }
            // @ts-ignore
            if (!(buffer.languageMode.tree instanceof Object)) { return null }
            // @ts-ignore
            let root = buffer.languageMode.tree.rootNode
            let outlineTrees = []
            let stmts = findChild(root, 'stmts')
            for (let child of stmts.children.filter(c => c.type == 'stmt')) {
                let stmt = child.children[0]
                let info = {
                    startPosition: stmt.range.start,
                    endPosition:   stmt.range.end,
                    children:      []
                }
                if (stmt.type == 'import') {
                    let nameNode = findChild(stmt, 'name')
                    outlineTrees.push({
                        ...info,
                        kind:      'package',
                        plainText: nameNode.text,
                    })
                } else if (stmt.type == 'decl_type') {
                    let process_type_decl = (stmt, outlineTrees) => {
                        let nameNode = findChild(stmt, 'name')
                        let item = {
                            kind:         'class',
                            plainText:     nameNode.text,
                            startPosition: stmt.range.start,
                            endPosition:   stmt.range.end,
                            children:      []
                        }
                        outlineTrees.push(item)
                        let valNode = findChild(stmt, 'type_value')
                        if (valNode != null) {
                            let val = valNode.children[0]
                            if (val.type == 'union_type') {
                                for (let child of val.children) {
                                    if (child.type == 'decl_type') {
                                        process_type_decl(child, item.children)
                                    }
                                }
                            }
                        }
                    }
                    process_type_decl(stmt, outlineTrees)
                } else if (stmt.type == 'decl_const') {
                    let nameNode = findChild(stmt, 'name')
                    outlineTrees.push({
                        ...info,
                        kind:      'constant',
                        plainText: nameNode.text,
                    })
                } else if (stmt.type == 'decl_func') {
                    let nameNode = findChild(stmt, 'name')
                    outlineTrees.push({
                        ...info,
                        kind:      'function',
                        plainText: nameNode.text,
                    })
                }
            }
            return { outlineTrees }
        } catch(e) {
            console.log('getOutline() error', e)
            return null
        }
    }
    // dispose() {
        
    // }
}

module.exports.provider = provider