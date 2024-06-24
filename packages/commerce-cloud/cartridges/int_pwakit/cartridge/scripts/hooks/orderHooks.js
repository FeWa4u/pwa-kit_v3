/**
 *
 * @param {dw.order.Basket} basket the basket
 */
exports.beforePOST = function (basket) {
    var stripeHelper = require('*/cartridge/scripts/helpers/stripeHookHelpers')
    var Transaction = require('dw/system/Transaction')
    var stripeCheckoutHelper = require('*/cartridge/scripts/stripe/helpers/checkoutHelper')

    // How can I select this? 🤔
    var paymentMethodId = 'STRIPE_PAYMENT_ELEMENT' // 'CREDIT_CARD' // 'STRIPE_PAYMENT_ELEMENT'
    var paymentMethodType =
        basket.paymentInstruments[0] && basket.paymentInstruments[0].creditCardType

    var params = {
        paymentMethod: paymentMethodType
    }

    try {
        stripeHelper.updatePaymentIntentAmount(basket)
    } catch (e) {
        stripeHelper.logStripeError(e)
    }

    Transaction.begin()
    stripeCheckoutHelper.createStripePaymentInstrument(basket, paymentMethodId, params)
    Transaction.commit()
}

/**
 *
 * @param {dw.order} order the order
 */
exports.afterPOST = function (order) {
    const stripeHelper = require('*/cartridge/scripts/helpers/stripeHookHelpers')

    var paymentIntentId = order.custom.stripePaymentIntentID
    var updatePaymentIntentPayload = {
        metadata: {
            order_id: order.orderNo
        }
    }

    var stripeService = require('*/cartridge/scripts/stripe/services/stripeService')

    try {
        stripeService.paymentIntents.update(paymentIntentId, updatePaymentIntentPayload)
    } catch (e) {
        stripeHelper.logStripeError(e)
    }
}
