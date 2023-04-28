/* eslint-env es6 */
/* global session, dw */

'use strict'

var server = require('server')

server.post('WebHook', function (req, res, next) {
    const webhooksHelper = require('*/cartridge/scripts/stripe/helpers/webhooksHelper')
    var success = webhooksHelper.processIncomingNotification()

    res.setStatusCode(success ? 200 : 500)
    res.json({
        success: !!success
    })
    next()
})

module.exports = server.exports()
