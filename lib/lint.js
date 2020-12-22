let { Point, Range } = require("atom")
let { SendRequest } = require('./server')
let Mutex = require('./mutex')

async function GetLintResult(path, visitedModules) {
    let res = await SendRequest('lint', { path, visitedModules })
    if (res.module == '' && res.errors == null) {
        return null
    }
    return {
        module:   res.module,
        messages: (
            (res.errors || [])
            .map(e => {
                Object.setPrototypeOf(e.location.position, Range.prototype)
                Object.setPrototypeOf(e.location.position.start, Point.prototype)
                Object.setPrototypeOf(e.location.position.end, Point.prototype)
                return e
            })
        )
    }
}

let consumer = registerIndie => {
    let linter = registerIndie({
        name: 'KumaChan',
    })
    let mu = new Mutex()
    let prevFilesMap = {}
    let lint = async () => {
        await mu.lock()
        let newPrevFilesMap = {}
        let visitedModules = []
        for (let editor of atom.workspace.getTextEditors()) {
            let path = editor.getPath()
            let result = await GetLintResult(path, visitedModules)
            if (result == null) {
                continue
            }
            let { messages, module } = result
            visitedModules.push(module)
            for (let file of (prevFilesMap[module] || [])) {
                linter.setMessages(file, [])
            }
            let fileMsgMap = {}
            for (let e of messages) {
                let file = e.location.file
                fileMsgMap[file] = fileMsgMap[file] || []
                fileMsgMap[file].push(e)
                newPrevFilesMap[module] = newPrevFilesMap[module] || []
                newPrevFilesMap[module].push(file)
            }
            for (let [file, messages] of Object.entries(fileMsgMap)) {
                console.log({file,messages})
                linter.setMessages(file, messages)
            }
        }
        prevFilesMap = newPrevFilesMap
        mu.unlock()
    }
    atom.workspace.observeTextEditors(editor => {
        if (!editor.getPath().endsWith('.km')) { return }
        let l = editor.onDidSave(_ => {
            lint()
        })
        editor.onDidDestroy(_ => {
            l.dispose()
        })
        lint()
    })
}

module.exports.consumer = consumer