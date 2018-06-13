let config = {}

let local

try {
    local = require('../../common/config')
} catch (e) {
    local = {}
}

config = process.env

for (let key in local) {
    config[key] = process.env[key] || local[key]
}

module.exports = config
