let ChildProcess = require('child_process')
let ReadLine = require('readline')
let Mutex = require('./mutex')
let Path = require('path')
let ExeSuffix = (process.platform == 'win32')? '.exe': ''

let InterpreterPath = ((dir,suffix) => dir? `${dir}${Path.sep}kumachan${suffix}`: '')(process.env['KUMACHAN_PATH'], ExeSuffix)
let { Server, ServerOutputLines } = (() => {
    if (InterpreterPath) {
        let Server = ChildProcess.spawn(InterpreterPath, ['--mode=atom-lang-server'], {})
        let readlineInterface = ReadLine.createInterface(Server.stdout)
        let ServerOutputLines = readlineInterface[Symbol.asyncIterator]()
        Promise.resolve().then(async _ => {
            let lines = ReadLine.createInterface(Server.stderr)
            for await (let line of lines) {
                atom.notifications.addInfo(line, { dismissable: true })
            }
        })
        return { Server, ServerOutputLines }
    } else {
        return { Server: null, ServerOutputLines: null }
    }
})()

let RequestMutex = new Mutex()
async function SendRequest(kind, req) {
    if (Server != null) {
        console.log('REQUEST', kind, req)
        await RequestMutex.lock()
        await new Promise((res, rej) => {
            Server.stdin.write((kind + ' ' + JSON.stringify(req) + '\n'), err => {
                if (err != null) { rej(err) }
                res(null)
            })
        })
        let { value, done } = await ServerOutputLines.next()
        RequestMutex.unlock()
        if (!done) {
            console.log('RESPONSE', value)
            return JSON.parse(value)
        }
    }
}

module.exports.InterpreterPath = InterpreterPath
module.exports.SendRequest = SendRequest