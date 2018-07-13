let Client = require('./client')
let clients = {}

module.exports = (query = '') => {
    let team, url
    if (typeof query == 'string') {
        team = query
    } else if (typeof query == 'object') {
        team = query.team
        url = query.url
    }
    if(clients[team + '_' + url]){
        return clients[team + '_' + url]
    }

    let client = new Client({
        team: team,
        url: url
    })
    clients[team + '_' + url] = client
    return client
}
