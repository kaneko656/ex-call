/**
 * 関数をexFunction{emitKey, uuid}に変換する
 */

const UUID = require('node-uuid')
const scanObject = require('../common/scanObject')

// socket on/emit
exports.on = (socket, query, callback = () => {}) => {
    let key = query.key
    let filter = query.filter

    // UUIDでonする
    let onKey = UUID.v4()

    // 引数exFunctionを関数に変換する
    socket.on(onKey, (...arg) => {
        arg.forEach((body, idx) => {
            if (body && typeof body === 'object' && body.type === 'exFunction') {
                let exFunction = body
                body = (...argument) => {
                    module.exports.emit(socket, exFunction.emitKey, ...argument)
                }
            }
            scanObject(body, (obj) => {
                if (typeof obj.value === 'object' && obj.value && obj.value.type && obj.value.type === 'exFunction') {
                    let exFunction = obj.value
                    obj.set((...argument) => {
                        module.exports.emit(socket, exFunction.emitKey, ...argument)
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
        filter: filter,
        uuid: onKey
    })
}

// socket on/emit
exports.emit = (socket, key, ...arg) => {

    // socket経由で引数関数の実行
    let onArgFunction = (emitKey, argFunction) => {
        socket.on(emitKey, (...arg) => {
            if (!Array.isArray(arg)) {
                arg = [arg]
            }

            arg.forEach((body, idx) => {
                if (body && typeof body == 'object' && typeof body.type == 'string' && body.type === 'exFunction' && body.emitKey) {
                    let key = body.emitKey
                    body = (...argument) => {
                        // socket.emit('exEmit', {
                        //     key: body.emitKey,
                        //     uuid: UUID.v4()
                        // }, ...argument)
                        module.exports.emit(socket, key, ...argument)
                    }
                }
                scanObject(body, (obj) => {
                    if (typeof obj.value == 'object' && obj.value && obj.value.type && typeof obj.value.type == 'string' && obj.value.type === 'exFunction' && obj.value.emitKey) {

                        obj.set((...argument) => {
                            // socket.emit('exEmit', {
                            //     key: obj.value.emitKey,
                            //     uuid: UUID.v4()
                            // }, ...argument)
                            module.exports.emit(socket, obj.value.emitKey, ...argument)
                        })
                    }
                })
                arg[idx] = body
            })
            argFunction(...arg)
        })
    }

    // 関数はexFunctionにして渡す
    arg.forEach((body, idx) => {
        if (body && typeof body === 'function') {
            let argFunction = body
            let emitKey = UUID.v4()

            // socket経由で引数関数の実行
            onArgFunction(emitKey, argFunction)

            body = {
                emitKey: emitKey,
                type: 'exFunction'
            }
        }

        scanObject(body, (obj) => {
            if(obj.key.indexOf('_') == 0){
                obj.remove()
                return
            }
            if (typeof obj.value === 'function') {
                let argFunction = obj.value
                let emitKey = UUID.v4()

                // socket経由で引数関数の実行
                onArgFunction(emitKey, argFunction)

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
