const socketio = require('socket.io')

let EventEmitter = require('events')
let eventEmitter = new EventEmitter()
eventEmitter.setMaxListeners(10000)


let socketList = {}

exports.eventEmitter = eventEmitter

exports.init = (server) => {
    let io = socketio.listen(server)

    io.sockets.on('connection', (socket) => {
        socketList[socket.id] = socket
        eventEmitter.emit('connect', socket)

        socket.on('disconnect', () => {
            eventEmitter.emit('disconnect', socket)
            delete socketList[socket.id]
        })
    })
}

exports.connect = (callback) => {
    for(let id in socketList){
        callback(socketList[id])
    }
    eventEmitter.on('connect', callback)
}


exports.disconnect = (callback) => {
    eventEmitter.on('disconnect', callback)
}
