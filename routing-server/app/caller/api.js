let EventEmitter = require('events')
let eventEmitter = new EventEmitter()
eventEmitter.setMaxListeners(10000)
let app

exports.eventEmitter = eventEmitter

eventEmitter.on('open', (key) => {
    if (typeof key == 'string') {
        module.exports.open(key)
    }
})

exports.open = (key) => {
    let path = key
    console.log('api.js open', path)

    app.get(path, (req, res) => {
        // ステータスコード200
        // res.status(200)
        eventEmitter.emit(key, res, req.query, req)
    })

    app.post(path, (req, res) => {
        // ステータスコード200
        // res.status(200)
        eventEmitter.emit(key, res, req.body, req)
    })

    return {
        ok: true,
        key: key,
        sec: new Date().getSeconds()
    }
}

exports.init = (_app) => {
    app = _app
}
