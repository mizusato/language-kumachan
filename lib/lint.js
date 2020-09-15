let { Point, Range } = require("atom")
let { SendRequest } = require('./server')
let Mutex = require('./mutex')

async function GetLinterMessages(path) {
    let res = await SendRequest('lint', { path })
    return (
        (res.errors || [])
        .map(e => {
            Object.setPrototypeOf(e.location.position, Range.prototype)
            Object.setPrototypeOf(e.location.position.start, Point.prototype)
            Object.setPrototypeOf(e.location.position.end, Point.prototype)
            return e
        })
    )
}

let consumer = registerIndie => {
    let linter = registerIndie({
        name: 'KumaChan',
    })
    let mu = new Mutex()
    let prevFilesMap = {}
    let lint = async () => {
        await mu.lock()
        let fileMsgMap = {}
        for (let editor of atom.workspace.getTextEditors()) {
            let path = editor.getPath()
            if (fileMsgMap[path]) {
                continue
            }
            for (let file of Object.keys(prevFilesMap[path] || {})) {
                linter.setMessages(file, [])
            }
            let messages = await GetLinterMessages(path)
            prevFilesMap[path] = {}
            for (let e of messages) {
                let file = e.location.file
                fileMsgMap[file] = fileMsgMap[file] || []
                fileMsgMap[file].push(e)
                prevFilesMap[path][file] = true
            }
        }
        let entries = Object.entries(fileMsgMap)
        for (let [file, messages] of entries) {
            console.log({file,messages})
            linter.setMessages(file, messages)
        }
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