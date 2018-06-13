/**
 * 関数をexFunction{emitKey, uuid}に変換する
 */

const UUID = require('node-uuid')
const scanObject = require('../common/scanObject')

// socket on/emit
exports.on = (socket, query, callback = () => {}) => {
    let key = query.key
    let auth = query.auth
    let filter = query.filter

    // UUIDでonする
    let onKey = UUID.v4()

    // 引数exFunctionを関数に変換する
    socket.on(onKey, (...arg) => {
        arg.forEach((body, idx) => {
            if (body && typeof body === 'object' && body.type === 'exFunction') {
                let exFunction = body
                body = (...a) => {
                    module.exports.emit(socket, exFunction.emitKey, ...a)
                }
            }
            scanObject(body, (obj) => {
                if (typeof obj.value === 'object' && obj.value && obj.value.type && obj.value.type === 'exFunction') {
                    let exFunction = obj.value
                    obj.set((...a) => {
                        module.exports.emit(socket, exFunction.emitKey, ...a)
                    })
                }
            })
            arg[idx] = body
        })
        callback(...arg)
    })

    // serverにonしていることを伝える
    socket.emit('exOn', {
        key: key,
        auth: auth,
        filter: filter,
        uuid: onKey
    })
}

// socket on/emit
exports.emit = (socket, key, ...arg) => {

    // 関数はexFunctionにして渡す
    arg.forEach((body, idx) => {
        if (body && typeof body === 'function') {
            let argFunction = body
            let emitKey = UUID.v4()

            // socket経由で引数関数の実行
            socket.on(emitKey, argFunction)

            body = {
                emitKey: emitKey,
                type: 'exFunction'
            }
        }

        scanObject(body, (obj) => {
            if (typeof obj.value === 'function') {
                let argFunction = obj.value
                let emitKey = UUID.v4()

                // socket経由で引数関数の実行
                socket.on(emitKey, argFunction)

                obj.set({
                    emitKey: emitKey,
                    type: 'exFunction'
                })
            }
        })
        arg[idx] = body
    })
    socket.emit('exEmit', {
        key: key,
        uuid: UUID.v4()
    }, ...arg)
}

/**
 * serverにremoveListenersを伝える
 */
exports.removeListners = (socket, key) => {
    socket.emit('exOnRemove', {
        key: key
    })
}
