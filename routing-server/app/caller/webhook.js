let EventEmitter = require('events')
let eventEmitter = new EventEmitter()
eventEmitter.setMaxListeners(10000)

let app

exports.on = (key, callback = () => {}) => {
    eventEmitter.on(key, callback)
}

exports.eventEmitter = eventEmitter

exports.open = (dir) => {
    app.post(dir, (req, res) => {
        // ステータスコード200
        res.status(200)
        eventEmitter.emit(dir, resObj(res), req.body, req)
        if (!res.finished) {
            res.send('{}')
        }
    })
}

exports.init = (_app) => {
    app = _app
}

let resObj = (res) => {
    return {
        send: (obj) => {
            if (!res.finished) {
                res.send(obj)
            }
        },
        finished: () => {
            return res.finished
        },
        desist: () => {
            res.finished = true
        }
    }
}
