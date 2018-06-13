const express = require('express')
const app = express()
const request = require('request')
const readPath = require('./readPath')

let url = 'http://localhost'
let port = 8000

exports.server = () => {
    app.listen(port, () => {
        console.log('Start web server : http://localhost:' + port)
    })
}

exports.port = (_port) => {
    port = _port
}

exports.use = (ex, exHeader, folderPath) => {
    use(exHeader, folderPath, (pathInfo) => {
        pathInfo.forEach((path) => {
            ex.on(path.exPath, (body, resolve, reject) => {
                request.get({
                    url: path.requestUrl
                }, (err, res, body) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(body, res.headers)
                    }
                })
            })

        })
    })
}

// 静的ファイル
const use = (dirHeader = '', folderPath, callback) => {

    // 'a' → 'a/'
    dirHeader = (dirHeader.length == 0 || dirHeader[dirHeader.length - 1] == '/') ? dirHeader : dirHeader + '/'

    let appHeader = dirHeader == '' ? dirHeader : '/' + dirHeader
    app.use(appHeader, express.static(folderPath))

    let pathInfo = []

    const complete = (items) => {
        items.forEach((item) => {
            //  folderPath   /User/a
            //  dirHeader    head/
            //  item         /User/a/item.html

            //  relativePath item.html
            //  requestUrl   http://localhost:8000/head/item.html
            //               url + ':' + port + '/' + dirHeader + relativePath
            //  exPath       head/item.html
            //               dirHeader + relativePath
            let relativePath = item.replace(folderPath + '/', '')
            let requestUrl = url + ':' + port + '/' + dirHeader + relativePath
            let exPath = dirHeader + relativePath
            pathInfo.push({
                relativePath: relativePath,
                requestUrl: requestUrl,
                exPath: exPath,
                localPath: item
            })
        })
        callback(pathInfo)
    }

    readPath.readSub(folderPath, () => {}, complete)
}
