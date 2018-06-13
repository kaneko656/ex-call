let db = null

try {
    const admin = require('firebase-admin')

    let serviceAccount = require('../../../apikey/excall-auth-firebase-adminsdk.json')

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    })

    db = admin.firestore()

} catch (e) {

}

module.exports = db
