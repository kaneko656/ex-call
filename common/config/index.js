
let config = {}

let local
try {
    local = require('./config.json')
} catch (e) {
    local = {}
}

config = process.env

for(let key in local){
    config[key] = process.env[key] || local[key]
}

module.exports = config
