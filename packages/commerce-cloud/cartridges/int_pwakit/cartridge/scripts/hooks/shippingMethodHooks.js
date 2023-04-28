/* eslint-disable no-param-reassign */
const stripeHelper = require('*/cartridge/scripts/helpers/stripeHookHelpers')

/**
 *
 * @param {dw.order.Basket} basket the basket
 */
exports.afterPUT = function (basket) {
    try {
        stripeHelper.updatePaymentIntentAmount(basket)
    } catch (e) {
        stripeHelper.logStripeError(e)
    }
}
