let { VTexec } = require('open-term')
let { InterpreterPath } = require('./server')


function buildShellCommand(executable, args) {
    let str = JSON.stringify(executable) + ' ' + args.map(arg => JSON.stringify(arg)).join(' ')
    if (process.platform == 'win32') {
        str = str.replace(/"/g, '^"')
        str = `"${str}"`
    }
    return str
}

function registerCommands () { 
    atom.commands.add('atom-workspace', 'kumachan:run-file', () => {
        let path = (editor => (editor != null)? editor.getPath(): null)(atom.workspace.getActiveTextEditor())
        if (path && InterpreterPath) {
            VTexec(buildShellCommand(InterpreterPath, [path]))
        }
    })
    atom.commands.add('atom-workspace', 'kumachan:run-project', () => {
        let path = (paths => (paths.length == 1)? paths[0]: null)(atom.project.getPaths())
        if (path && InterpreterPath) {
            VTexec(buildShellCommand(InterpreterPath, [path]))
        }
    })
}

module.exports.registerCommands = registerCommands