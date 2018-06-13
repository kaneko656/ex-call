/**
 * 各Clinetのsocketをルーティングする
 */

const EventEmitter = require('events')
const UUID = require('node-uuid')
const DB = require('./firebase')
const scanObject = require('../../common/scanObject')
const Filter = require('../../common/filter')
const debug = require('debug')('team')

let managerList = {}
let connectedList = {}
let socketInfo = {}

exports.init = (appSocket, appApi) => {

    const createTeamManager = (team) => {
        let uuid_v4 = UUID.v4()
        uuid_v4.split('-').join('')

        // manager per team
        let manager = new Manager(team, uuid_v4)
        managerList[team] = manager

        // createTeamAPI
        createTeamAPI(team)

        debug('create', team)
        return manager
    }

    const createTeamAPI = (team) => {
        appApi.open('/' + team + '/*')
        appApi.eventEmitter.on('/' + team + '/*', (res, body, req) => {
            let dir = ''
            if (req.params) {
                let params = req.params[0]
                dir += params
                if (params.length >= 1 && params[params.length - 1] == '/') {
                    dir += 'index.html'
                }
            }
            if (managerList[team]) {
                let manager = managerList[team]
                // clientがres.send()で返せる
                // dir, body, resolve, reject
                manager.onAPI(dir, body, (body, header) => {
                    if (!body || res.finished) {
                        return
                    }

                    if (header && header['content-type']) {
                        res.set({
                            'content-type': header['content-type'],
                            "Access-Control-Allow-Origin": "*",
                            "Pragma": "no-cache",
                            "Cache-Control": "no-cache"
                        })
                    }
                    res.send(body)
                }, (body, header) => {
                    if (!res.finished) {
                        res.send(body)
                    }
                })
            }
        })
    }


    // exBotのログイン
    appSocket.connect((socket) => {

        debug('socket conncet')

        socket.on('connectTeam', (body) => {
            let team = body && body.team ? body.team : null
            if (!team) {
                socket.disconnect()
                return
            }

            socketInfo[socket.id] = {
                team: team
            }


            // teamManager
            let manager
            if (!managerList[team]) {
                manager = createTeamManager(team)
            } else {
                manager = managerList[team]
            }

            // already 多重ログインを防ぐ
            if (connectedList[socket.id]) {
                return
            }

            debug('createTeam', socket.id)
            manager.createTeamEvent(socket, socket.id)
            socket.emit('connectedTeam', {})
        })
    })


    appSocket.disconnect((socket) => {
        if (socketInfo[socket.id]) {
            let team = socketInfo[socket.id].team
            let manager = managerList[team]
            manager.release(socket.id)
            debug('disconnect', team, socket.id)
        }
    })
}


function Manager(team, uuid) {
    this.team = team
    this.uuid = uuid
    this.eventEmitter = new EventEmitter()
    this.eventEmitter.setMaxListeners(10000)
    this.removeListenerList = {}
    this.onAuth = null
    this.readyAuthCall = []
    let self = this

    if (DB) {
        this.ref = DB.collection(team)
        this.ref.get()
            .then((snapshot) => {
                self.onAuth = {}
                snapshot.forEach((doc) => {
                    self.onAuth[doc.id] = doc.data()
                })
                self.readyAuthCall.forEach((callback) => {
                    callback(self.onAuth)
                })
            })
            .catch((err) => {
                debug('Error getting documents', err)
            })
    } else {
        self.readyAuthCall.forEach((callback) => {
            callback({})
        })
    }

}


Manager.prototype.onAPI = function(dir, body, resolve, reject) {
    let resolveKey = UUID.v4()
    this.eventEmitter.on(resolveKey, resolve)
    let rejectKey = UUID.v4()
    this.eventEmitter.on(rejectKey, reject)

    this.eventEmitter.emit(dir, body, {
        emitKey: resolveKey,
        type: 'exFunction'
    }, {
        emitKey: rejectKey,
        type: 'exFunction'
    })
}

Manager.prototype.createTeamEvent = function(socket) {

    let thisManager = this

    return new TeamEvent(this, socket)
}

Manager.prototype.release = function(uuid) {
    if (this.removeListenerList[uuid]) {
        this.removeListenerList[uuid].forEach((obj) => {
            this.eventEmitter.removeListener(obj.key, obj.emitted)
        })
        delete this.removeListenerList[uuid]
    }
}

class TeamEvent {
    constructor(manager, socket) {
        this.uuid = socket.id
        this.socket = socket
        this.manager = manager

        this.on()
        this.emit()
        this.removeListeners()

        debug(this.manager.eventEmitter.eventNames())
    }


    on() {
        // on
        let onKeyList = []

        // query { key, auth, filter}
        this.socket.on('exOn', (query) => {

            if (typeof query != 'object') {
                return
            }

            debug('on exOn', query.key)

            let key = query.key
            let auth = query.auth || null
            let filter = query.filter
            let onKey = query.uuid

            let callback = (...arg) => {
                this.socket.emit(onKey, ...arg)
            }

            // AuthCordがないと同じkeyを作れないようにする機能
            if (this.manager.onAuth) {
                let onAuth = this.manager.onAuth
                let docKey = key.split('/').join('__')
                if ((docKey in onAuth) && auth && auth === onAuth[docKey].auth) {
                    debug('auth ok')
                } else if (docKey in onAuth) {
                    callback('This key do not authorized')
                    debug('This key do not authorized')
                    return
                } else if (auth) {
                    this.manager.onAuth[docKey] = {
                        auth: auth
                    }
                    this.manager.ref.doc(docKey).set({
                        auth: auth
                    })
                    debug('Register')
                } else {
                    // debug(key, '')
                }
            } else {
                this.manager.readyAuthCall.push((onAuth) => {
                    let docKey = key.split('/').join('__')
                    if ((docKey in onAuth) && auth && auth === onAuth[docKey].auth) {
                        debug('auth ok', key)
                    } else if (docKey in onAuth) {
                        callback('This key do not authorized')
                        debug('This key do not authorized', key)
                        return
                    } else if (auth) {
                        this.manager.onAuth[docKey] = {
                            auth: auth
                        }
                        this.manager.ref.doc(docKey).set({
                            auth: auth
                        })
                        debug('Register', key)
                    } else {
                        // debug(key, '')
                    }
                })
            }

            // filterのインスタンス化
            if (filter && typeof filter.ifText == 'string' && filter.type == 'filter') {
                filter = Filter(filter.ifText, filter.value)
            } else {
                filter = null
            }

            // 呼び出し
            const onCallback = (...arg) => {

                let context = arg.length >= 1 ? arg[0] : {}

                // filter
                if (filter) {
                    filter.judge(context, (result) => {
                        if (result.judge) {
                            debug('←  exOn  filter ', key, filter.ifText)
                            this.socket.emit(onKey, ...arg)
                        }
                    })
                } else {
                    debug('←  exOn ', key)
                    this.socket.emit(onKey, ...arg)
                }
            }

            // 内部eventEmitter（teamで共通）
            this.manager.eventEmitter.on(key, onCallback)

            // for release  if first, create array
            if (!this.manager.removeListenerList[this.uuid]) {
                this.manager.removeListenerList[this.uuid] = []
            }

            this.manager.removeListenerList[this.uuid].push({
                key: key,
                emitted: onCallback
            })
        })
    }

    emit() {
        // emit
        this.socket.on('exEmit', (query, ...arg) => {
            if (typeof query != 'object') {
                return
            }

            debug('→　　exEmit', query.key)
            let key = query.key
            let uuid = query.uuid

            // exFunctionの処理
            arg.forEach((body) => {
                if (body && typeof body === 'object' && body.type === 'exFunction') {
                    let exFunction = body
                    this.manager.eventEmitter.on(exFunction.emitKey, (...arg) => {
                        debug('←　　   exFunction', exFunction.emitKey)
                        this.socket.emit(exFunction.emitKey, ...arg)
                        // exFunctionはclient側ではすでにonされている
                    })
                }
                scanObject(body, (obj) => {
                    if (typeof obj.value === 'object' && obj.value && obj.value.type && obj.value.type === 'exFunction') {
                        let exFunction = obj.value
                        this.manager.eventEmitter.on(exFunction.emitKey, (...arg) => {
                            debug('←　　   exFunction', exFunction.emitKey)
                            this.socket.emit(exFunction.emitKey, ...arg)
                            // exFunctionはclient側ではすでにonされている
                        })
                    }
                })
            })

            // 連鎖呼び出し機能
            // point:aaa
            // point → resolve → point:aaa

            let splitColon = key.split(':')
            if (splitColon.length >= 2) {
                let body = arg[0]
                let resolve = typeof arg[1] === 'function' ? arg[1] : () => {}
                let reject = typeof arg[2] === 'function' ? arg[2] : () => {}
                let onKey = ''
                let onKeyList = []
                splitColon.forEach((splitKey) => {
                    onKey += onKey == '' ? splitKey : ':' + splitKey
                    onKeyList.push(onKey)
                })
                const splitEmit = (idx, body) => {
                    this.manager.eventEmitter.emit(onKeyList[idx], body, (res) => {
                        debug(onKeyList[idx], res)
                        if (idx + 1 == onKeyList.length) {
                            debug('resolve')
                            resolve(res)
                            return
                        }
                        splitEmit(idx + 1, res)
                    }, reject)
                }
                splitEmit(0, body)
                return
            }

            // 内部eventEmitter（teamで共通）
            this.manager.eventEmitter.emit(key, ...arg)
        })
    }

    /**
     * removeListeners
     */
    removeListeners() {
        this.socket.on('exOnRemove', (query) => {
            if (typeof query != 'object') {
                return
            }
            let key = query.key

            if (this.manager.removeListenerList[this.uuid]) {
                debug('remove', this.manager.removeListenerList[this.uuid])
                this.manager.removeListenerList[this.uuid].forEach((obj) => {
                    if (obj.key == key) {
                        this.manager.eventEmitter.removeListener(key, obj.emitted)
                    }
                })
            }
        })
    }
}
