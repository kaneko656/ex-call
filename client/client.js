/**
 * for - client
 * socket
 * @type {[type]}
 */

const io = require('socket.io-client')
const UUID = require('node-uuid')
const socketBundle = require('./client-socketBundle')
const localConfig = require('../common/config')
const debug = require('debug')('socket')

let EventEmitter = require('events').EventEmitter
let eventEmitter = new EventEmitter()
eventEmitter.setMaxListeners(10000)

// socket
// 別々に呼び出しても同じsocketでは一つに
let connected = false
let isLocal = false

let serverUrl = localConfig.SERVER_URL
let localUrl = 'http://localhost:' + (localConfig.PORT || 8080)

let socket = null
let team = ''

let isConnecting = false

/**
 * team名のセット
 */
exports.team = (_team) => {
    team = _team
}

/**
 * localhostでつなげる場合
 */
exports.local = (target) => {
    if (target) {
        localUrl = target
    }
    isLocal = true
}

exports.url = (url) => {
    isLocal = false
    serverUrl = url
}


/**
 * 独自でsocketをつなげる場合
 */
exports.setSocket = (_socket) => {
    socket = _socket
    setEvent(socket)
}

/**
 * on
 * key, callback
 * key, filter, callback
 * {key, auth}, filter callback
 * {key, auth, filter} callback
 */

exports.on = (...arg) => {
    let key, auth, filter, callback

    if (typeof arg[1] === 'function') {
        key = arg[0]
        callback = arg[1]
    } else if (typeof arg[2] === 'function') {
        key = arg[0]
        filter = arg[1]
        callback = arg[2]
    }
    if (typeof key == 'object') {
        auth = key.auth || undefined
        filter = key.filter ? key.filter : filter
        key = key.key
        // console.log(filter)
    }

    socketBundle.on(socket, {
        key: key,
        auth: auth,
        filter: filter
    }, callback)
}

/**
 * eiit
 */
exports.emit = (key, body, onComplete = () => {}, onError = () => {}) => {
    socketBundle.emit(socket, key, body, onComplete, onError)
}

/**
 * connect
 *
 * callback
 * auth, callback
 * disconnectすると全てのイベントをリセットする．再接続時にconnectが再度呼ばれる
 */
exports.connect = (...arg) => {
    let auth, callback
    let debugID = Math.floor(Math.random() * 10000)
    if (typeof arg[0] === 'function') {
        callback = arg[0]
    } else if (typeof arg[1] === 'function') {
        auth = arg[0]
        callback = arg[1]
    }

    if (socket && socket.connected) {
        callback(module.exports)
        return
    } else {
        if (!isConnecting) {
            if (isLocal) {
                console.log('connecting... ' + localUrl)
                socket = io.connect(localUrl)
            } else {
                console.log('connecting... ' + serverUrl)
                socket = io.connect(serverUrl)
            }
            setEvent(socket)
            isConnecting = true
        }
    }

    eventEmitter.on('connect', () => {
        debug(debugID, 'connect')
        isConnecting = false
        callback(new ex(module.exports, {
            auth: auth
        }))
    })
}

class ex {
    constructor(client, options = {}) {
        this.client = client
        this.emit = client.emit
        this.auth = options.auth || undefined
        this.disonenct = client.disconnect
        this.removeListeners = client.removeListeners
    }

    on(...arg) {
        let key, auth, filter, callback
        if (typeof arg[1] === 'function') {
            key = arg[0]
            callback = arg[1]
            auth = this.auth
        } else if (typeof arg[2] === 'function') {
            key = arg[0]
            filter = arg[1]
            callback = arg[2]
            auth = this.auth
        }

        if (typeof key == 'object') {
            auth = key.auth || undefined
            filter = key.filter ? key.filter : filter
            key = key.key
        }

        this.client.on({
            key: key,
            auth: auth,
            filter: filter
        }, callback)
    }
}

/**
 * ]
 */
exports.disconnect = (callback) => {
    eventEmitter.on('disconnect', callback)
}

/**
 *
 */
exports.removeListeners = (key) => {
    socketBundle.removeListners(socket, key)
}

const setEvent = (socket) => {
    let isFirst = true
    socket.on('connect', () => {
        console.log('connect')
        debug('connect')
        if (isFirst) {
            isFirst = false
            socket.emit('connectTeam', {
                team: team
            })
        } else {
            debug('emit connect')
            eventEmitter.emit('connect')
        }
    })

    socket.on('connectedTeam', () => {
        eventEmitter.emit('connect')
    })

    socket.on('disconnect', () => {
        debug('disconnect')

        // connectも除去される
        socket.off()

        debug('off')
        setEvent(socket)
        eventEmitter.emit('disconnect')
    })
}
