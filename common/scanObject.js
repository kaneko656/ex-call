/**
 * オブジェクトを展開し、末端のkeyとvalueを返す
 * setter.setでvalueのアップデート
 * setter.set(value, ['channel', 'slack']) で　slack.channel.key = value
 * keyPath  slack.channel.key だったら ['key', 'channel','slack']
 */

let clone = require('./clone')

module.exports = (origin, callback = () => {}) => {

    let obj = clone(origin)
    objectExpandScan(obj, obj, [], callback)
    if (obj && typeof obj == 'object' && typeof obj.__proto__ == 'object') {
        let methods = Object.getOwnPropertyNames(obj.__proto__)
        if (methods.indexOf('hasOwnProperty') == -1) {
            methods.forEach((method) => {
                if (method != 'constructor' && method.indexOf('_') != 0) {
                    let key = method
                    let my = origin
                    let thisMethod = origin[method]
                    let value = (...arg) => {
                        thisMethod.apply(my, arg)
                    }
                    callback({
                        key: key,
                        value: value,
                        keyPath: [],
                        set: (updateValue) => {
                            obj[key] = updateValue
                        },
                        add: (addValue, addKey) => {
                            addKey = addKey || key
                            obj[addKey] = addValue
                        },
                        remove: () => {
                            delete obj[key]
                        }
                    })
                }
            })
        }

    }

    return obj
}

let objectExpandScan = (origin, obj, keyPath, callback = () => {}) => {
    if (typeof obj == 'object') {
        for (let key in obj) {
            if (typeof obj[key] == 'object') {
                let newKeyPath = [].concat(keyPath)
                newKeyPath.unshift(key)
                objectExpandScan(origin, obj[key], newKeyPath, callback)
            }
            let value = obj[key]
            callback({
                key: key,
                value: value,
                keyPath: keyPath,
                set: (updateValue, keyParent) => {
                    if (Array.isArray(keyParent)) {
                        let addObj = origin
                        for (let i = keyPath.length - 1; i >= 0; i--) {
                            if (keyPath[i] == keyParent[i]) {
                                addObj[keyPath[i]] = updateValue
                                return
                            } else {
                                addObj = addObj[keyPath[i]]
                            }
                        }
                    }
                    obj[key] = updateValue
                },
                add: (addValue, addKey) => {
                    addKey = addKey || key
                    obj[addKey] = addValue
                },
                remove: () => {
                    delete obj[key]
                }
            })
        }
    }
}
