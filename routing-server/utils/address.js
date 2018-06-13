const os = require('os')
let netInterface = os.networkInterfaces()
let localAddress = 'localhost'

for (let net in netInterface) {
    netInterface[net].forEach((n) => {
        if (n.family == 'IPv4' && n.address != '127.0.0.1' && localAddress == 'localhost') {
            localAddress = n.address
        }
    })
}

exports.toURL = (port = null) => {
    if(port){
        return 'http://' + localAddress + ':' + port
    }
    return 'http://' + localAddress
}
