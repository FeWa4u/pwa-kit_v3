/* eslint-disable no-param-reassign */
const stripeHelper = require('*/cartridge/scripts/helpers/stripeHookHelpers')

/**
 *
 * @param {dw.order.Basket} basket the basket
 * @returns {dw.system.Status} - the status of the hook
 */
exports.afterPUT = function (basket) {
    var Status = require('dw/system/Status')
    var stripeChargeCapture =
        dw.system.Site.getCurrent().getCustomPreferenceValue('stripeChargeCapture')
    var basketCurrencyCode = basket.getCurrencyCode()
    var basketCurrency = dw.util.Currency.getCurrency(basketCurrencyCode)

    var multiplier = Math.pow(10, basketCurrency.getDefaultFractionDigits())
    var basketTotal = basket.getTotalGrossPrice()

    var amount = Math.round(basketTotal.value * multiplier)

    if (
        !(basket.custom && basket.custom.stripePaymentIntentID && basket.custom.stripeClientSecret)
    ) {
        if (amount === 0) {
            return new Status(Status.ERROR, 'Amount cannot be 0')
        }

        var createPaymentIntentPayload = {
            // payment_method: paymentMethod,
            amount,
            currency: basketCurrencyCode,
            // confirmation_method: 'automatic',
            capture_method: stripeChargeCapture ? 'automatic' : 'manual',
            // confirm: true // This only works if the payment method is provided
            automatic_payment_methods: {
                enabled: true
            }
        }

        var stripeService = require('*/cartridge/scripts/stripe/services/stripeService')

        try {
            var paymentIntent = stripeService.paymentIntents.create(createPaymentIntentPayload)

            // This part is copied. We can review what we need later
            var createTransaction = require('dw/system/Transaction')
            createTransaction.wrap(function () {
                if (paymentIntent.review) {
                    basket.custom.stripeIsPaymentIntentInReview = true
                }
                basket.custom.stripePaymentIntentAmount = amount
                basket.custom.stripePaymentIntentID = paymentIntent.id
                basket.custom.stripeClientSecret = paymentIntent.client_secret
                basket.custom.stripePaymentSourceID = ''

                if (
                    paymentIntent.charges &&
                    paymentIntent.charges.data &&
                    paymentIntent.charges.data.length > 0 &&
                    paymentIntent.charges.data[0].outcome
                ) {
                    basket.custom.stripeRiskLevel = paymentIntent.charges.data[0].outcome.risk_level
                    basket.custom.stripeRiskScore = paymentIntent.charges.data[0].outcome.risk_score
                }
            })
        } catch (e) {
            var m = stripeHelper.logStripeError(e)

            return new Status(Status.ERROR, m)
        }
    } else if (
        basket.custom &&
        basket.custom.stripePaymentIntentID &&
        amount !== basket.custom.stripePaymentIntentAmount
    ) {
        if (amount === 0) {
            return new Status(Status.ERROR, 'Amount cannot be 0')
        }

        var updatePaymentIntentPayload = {
            amount
        }

        var updateStripeService = require('*/cartridge/scripts/stripe/services/stripeService')

        try {
            updateStripeService.paymentIntents.update(
                basket.custom.stripePaymentIntentID,
                updatePaymentIntentPayload
            )

            // This part is copied. We can review what we need later
            var updateTransaction = require('dw/system/Transaction')
            updateTransaction.wrap(function () {
                basket.custom.stripePaymentIntentAmount = amount
            })
        } catch (e) {
            var msg = stripeHelper.logStripeError(e)

            return new Status(Status.ERROR, msg)
        }
    }

    return new Status(Status.OK, 'OK', 'PaymentMethods successfully fetched')
}
