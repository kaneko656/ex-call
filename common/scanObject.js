/**
 * オブジェクトを展開し、末端のkeyとvalueを返す
 * setter.setでvalueのアップデート
 * setter.set(value, ['channel', 'slack']) で　slack.channel.key = value
 * keyPath  slack.channel.key だったら ['key', 'channel','slack']
 */


module.exports = (obj, callback = () => {}) => {
    objectExpandScan(obj, obj, [], callback)
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