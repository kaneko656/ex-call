/*
 * require
 */

// app
let app = require('./app')

// team
let manager = require('./team/manager.js')

require('dotenv').config()
let config = process.env

app.init(config.PORT || 8080)

// app
let appSocket = app.socket()
let appApi = app.api()

// team
manager.init(appSocket, appApi)

let localAddress = require('./utils/address')
console.log(localAddress.toURL(config.PORT || 8080))

exports.app = app.app
exports.server = app.server
