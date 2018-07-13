/**
 * for - client
 * socket
 * @type {[type]}
 */

const io = require('socket.io-client')
const UUID = require('node-uuid')
const socketBundle = require('./client-socketBundle')
const debug = require('debug')('socket')

let EventEmitter = require('events').EventEmitter


class Client {
    constructor(query) {

        this.eventEmitter = new EventEmitter()
        this.eventEmitter.setMaxListeners(10000)

        this.socket = null
        this.connected = false
        this.isConnecting = false

        this.defaultUrl = 'http://localhost:8080'
        this.url = null

        this.team = query.team
        this.url = query.url
    }

    /**
     * team名のセット
     */
    team(team) {
        this.team = team
    }

    url(url) {
        this.url = url
    }


    /**
     * 独自でsocketをつなげる場合
     */
    setSocket(socket) {
        this.socket = socket
        this._setEvent(this.socket)
    }


    /**
     * on
     * key, callback
     * key, filter, callback
     */

    on(...arg) {
        let key, filter, callback

        if (typeof arg[1] === 'function') {
            key = arg[0]
            callback = arg[1]
        } else if (typeof arg[2] === 'function') {
            key = arg[0]
            filter = arg[1]
            callback = arg[2]
        }

        socketBundle.on(this.socket, {
            key: key,
            filter: filter
        }, callback)
    }

    /**
     * eiit
     */
    emit(key, body, onComplete = () => {}, onError = () => {}) {
        socketBundle.emit(this.socket, key, body, onComplete, onError)
    }

    /**
     *
     */
    disconnect(callback) {
        this.eventEmitter.on('disconnect', callback)
    }

    /**
     *
     */
    removeListeners(key) {
        socketBundle.removeListners(this.socket, key)
    }

    /**
     * connect
     *
     * callback
     * disconnectすると全てのイベントをリセットする．再接続時にconnectが再度呼ばれる
     */
    connect(callback = () => {}) {
        let targetUrl = this.url || this.defaultUrl
        if (this.socket && this.socket.connected) {
            callback(this)
            return
        } else {
            if (!this.isConnecting) {
                console.log('connecting... ' + targetUrl)
                this.socket = io.connect(targetUrl)
                this._setEvent(this.socket)
                this.isConnecting = true
            }
        }

        this.eventEmitter.on('connect', () => {
            this.isConnecting = false
            callback(this)
        })
    }


    _setEvent(socket) {
        let isFirst = true
        this.socket.on('connect', () => {
            console.log('connect')
            debug('connect')
            if (isFirst) {
                isFirst = false
                this.socket.emit('connectTeam', {
                    team: this.team
                })
            } else {
                debug('emit connect')
                this.eventEmitter.emit('connect')
            }
        })

        this.socket.on('connectedTeam', () => {
            this.eventEmitter.emit('connect')
        })

        this.socket.on('disconnect', () => {
            debug('disconnect')

            // connectも除去される
            this.socket.off()

            debug('off')
            this._setEvent(this.socket)
            this.eventEmitter.emit('disconnect')
        })
    }
}

module.exports = Client
