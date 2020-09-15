class Mutex {
    constructor() {
        this.waiting = []
        this.locked = false
    }
    async lock() {
        if (this.locked) {
            let notify
            let ok = new Promise((resolve, _) => {
                notify = resolve
            })
            this.waiting.push(notify)
            await ok
        } else {
            this.locked = true
        }
    }
    unlock() {
        if (this.waiting.length > 0) {
            let next = this.waiting.shift()
            next()
        } else {
            this.locked = false
        }
    }
}

module.exports = Mutex