const Judge = require('./judge.js')

module.exports = (ifText, value) => {
    return new Filter(ifText, value)
}

function Filter(ifText, value) {
    value = typeof value == 'object' ? value : {}
    ifText = typeof ifText == 'string' ? ifText : ''
    this.value = value
    this.ifText = ifText
    this.type = 'filter'
}

Filter.prototype.judge = function(addValue, callback = () => {}) {
    addValue = typeof addValue == 'object' ? addValue : {}
    let val = defaultValue()
    // integration
    for (let key in addValue) {
        val[key] = addValue[key]
    }
    // integration
    for (let key in this.value) {
        val[key] = this.value[key]
    }

    val = expandValues(val)

    let result = Judge(this.ifText, val)
    if (result.judge) {
        callback(result)
        return true
    }
    callback(result)
    return false
}

let expandValues = (data, root, exp) => {
    root = root ? root : ''
    exp = exp ? exp : {}
    for (let key in data) {
        let type = typeof data[key]
        if (type === 'function') {
            continue
        }
        if (type === 'object') {
            expandValues(data[key], root + key + '.', exp)
        }
        if (['undefined', 'boolean', 'number', 'string'].indexOf(type) >= 0) {
            exp[root + key] = data[key]
        }
    }
    return exp
}

let jpDate = () => {
    return new Date(new Date().getTime() + (9 * 60 + new Date().getTimezoneOffset()) * 60 * 1000)
}

let defaultValue = () => {
    let date = jpDate()
    return {
        timestamp: date.getTime(),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        min: date.getMinutes(),
        sec: date.getSeconds(),
        weekday: date.getDay(),
        numberOfWeek: parseInt(date.getDate() / 7) + 1
    }
}
