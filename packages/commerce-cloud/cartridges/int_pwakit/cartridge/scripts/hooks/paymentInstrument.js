const Status = require('dw/system/Status')
const stripeHelper = require('*/cartridge/scripts/helpers/stripeHookHelpers')

/**
 *
 * @param {dw.order.Basket} basket the basket
 * @returns {dw.system.Status} - the status of the hook
 */
exports.afterPOST = function (basket) {
    try {
        stripeHelper.updatePaymentIntentAmount(basket)
    } catch (e) {
        var m = stripeHelper.logStripeError(e)

        return new Status(Status.ERROR, m)
    }

    return new Status(Status.OK, 'OK', 'PaymentIntent amount successfully updated')
}
