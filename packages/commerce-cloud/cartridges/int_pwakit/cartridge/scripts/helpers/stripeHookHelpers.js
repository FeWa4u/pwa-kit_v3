/**
 * Recalculates the basket total and updates Stripe PaymentIntent
 * @param {dw.order.Basket} basket the basket
 */
function updatePaymentIntentAmount(basket) {
    var HookMgr = require('dw/system/HookMgr')
    var totalBeforeRecalc = basket.getTotalGrossPrice().value

    HookMgr.callHook('dw.order.calculate', 'calculate', basket)
    var basketTotal = basket.getTotalGrossPrice().value

    if (
        basket.custom &&
        basket.custom.stripePaymentIntentID &&
        (totalBeforeRecalc !== basketTotal ||
            basket.custom.stripePaymentIntentAmount !== basketTotal)
    ) {
        var basketCurrencyCode = basket.getCurrencyCode()
        var basketCurrency = dw.util.Currency.getCurrency(basketCurrencyCode)

        var multiplier = Math.pow(10, basketCurrency.getDefaultFractionDigits())

        var amount = Math.round(basketTotal * multiplier)

        var updatePaymentIntentPayload = {
            amount
        }

        var stripeService = require('*/cartridge/scripts/stripe/services/stripeService')

        stripeService.paymentIntents.update(
            basket.custom.stripePaymentIntentID,
            updatePaymentIntentPayload
        )

        var Transaction = require('dw/system/Transaction')

        /* eslint-disable no-param-reassign */
        Transaction.wrap(function () {
            basket.custom.stripePaymentIntentAmount = amount
        })
    }
}

/**
 *
 * @param {Object} e error object
 * @returns {string} error message
 */
function logStripeError(e) {
    var Logger = require('dw/system/Logger').getLogger('Stripe', 'stripe')

    var m = e.message

    if (e.callResult) {
        var o = JSON.parse(e.callResult.errorMessage)
        m = o.error.message
    }
    Logger.error('Error: {0}', e.message)

    return m
}

module.exports = {
    updatePaymentIntentAmount,
    logStripeError
}
