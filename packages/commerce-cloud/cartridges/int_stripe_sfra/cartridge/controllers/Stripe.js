var CacheMgr = require('dw/system/CacheMgr');
var stripeHelper = require('*/cartridge/scripts/helpers/stripeHookHelpers')

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
        res.setStatusCode(500)
        return next()
    }
})

server.post('FailOrder', function (req, res, next) {
    var params = request.httpParameterMap
    var body = JSON.parse(params.getRequestBodyAsString())

    var token = body.token
    var orderNo = body.orderNo
    var dwsid

    var cache = CacheMgr.getCache('BearerToSession');
    // store bearer's session for 15 minutes
    dwsid = cache.get(token, function () {
        var ocapiService = require('*/cartridge/scripts/services/ocapi.js');
        // call /sessions ocapi / ocapi session bridge
        var sessionsResponse = ocapiService.getService().call({ requestPath: 's/' + dw.system.Site.current.ID + '/dw/shop/v21_10/sessions', requestMethod: 'POST', token: token });
        var message = sessionsResponse.errorMessage;
        // get the set-cookie of the dwsid cookie
        var dwsidCookie = sessionsResponse.object.responseHeaders['set-cookie'].toArray().filter((cookie) => cookie.indexOf('dwsid') > -1).pop();
        // just get the cookie value
        return dwsidCookie.split(';')[0].replace('dwsid=', '');
    });

    var args = {
        orderNo: orderNo,
    }

    var controllerService = require('*/cartridge/scripts/services/controller.js');
    var controllerResponse = controllerService.getService().call({ controller: 'Stripe-CallFailOrder', params: args, dwsid: dwsid });

    res.setStatusCode(200)
    res.json(controllerResponse)
    return next()
})

server.get('CallFailOrder', function (req, res, next){
    var OrderMgr = require('dw/order/OrderMgr');
    var params = request.httpParameterMap
    var orderNo = params.orderNo.stringValue

    if (orderNo) {
        try {
            var order = OrderMgr.getOrder(orderNo)
            var Transaction = require('dw/system/Transaction')

            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
            });
        } catch (e) {
            var m = stripeHelper.logStripeError(e)
        }
    }
})

module.exports = server.exports()
