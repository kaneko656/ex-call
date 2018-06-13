let client = require('./client')

module.exports = (team = '') => {
    client.team(team)
    return client
}
