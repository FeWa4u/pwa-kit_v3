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

server.post('CreatePI', function (req, res, next) {
    var params = request.httpParameterMap
    var body = JSON.parse(params.getRequestBodyAsString())

    var amount = parseInt(body.amount)
    var basketId = body.basketId
    var currency = body.currency

    var stripeChargeCapture =
        dw.system.Site.getCurrent().getCustomPreferenceValue('stripeChargeCapture')
    
    var stripeService = require('*/cartridge/scripts/stripe/services/stripeService')
    const stripeHelper = require('*/cartridge/scripts/helpers/stripeHookHelpers')

     
    if (!amount || amount === 0 || !basketId || !currency) {
        res.json({
            error: 'Invalid parameters'
        })
        return next()
    }

    var createPaymentIntentPayload = {
        // payment_method: paymentMethod,
        amount,
        currency,
        // confirmation_method: 'automatic',
        capture_method: stripeChargeCapture ? 'automatic' : 'manual',
        // confirm: true // This only works if the payment method is provided
        automatic_payment_methods: {
            enabled: true
        },
        metadata: {
            basket_id: basketId
        }
    }
    try {
        var paymentIntent = stripeService.paymentIntents.create(createPaymentIntentPayload)

        res.setStatusCode(200)
        res.json(paymentIntent)
        return next()
    } catch (e) {
        var m = stripeHelper.logStripeError(e)

        return new Status(Status.ERROR, m)
    }
})

module.exports = server.exports()
