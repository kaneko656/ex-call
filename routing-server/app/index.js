// setup

const express = require('express')
const bodyParser = require('body-parser')

const api = require('./caller/api.js')
const webhook = require('./caller/webhook.js')
const socket = require('./caller/socket.js')

let app
let server

exports.init = (port) => {
    app = express()
    server = app.listen(port, () => {
        console.log('start server listening')
    })

    // app.user
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({
        extended: true
    }))

    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*")
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
        next()
    })

    api.init(app)
    webhook.init(app)
    socket.init(server)
}

exports.app = () => {
    return app
}

exports.server = () => {
    return server
}

exports.api = () => {
    return api
}

exports.webhook = () => {
    return webhook
}

exports.socket = () => {
    return socket
}

exports.app = () => {
    return app
}
