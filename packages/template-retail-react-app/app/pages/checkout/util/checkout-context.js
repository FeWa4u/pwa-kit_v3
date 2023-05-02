/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import useEinstein from '../../../hooks/use-einstein'
import {useCurrentCustomer} from '../../../hooks/use-current-customer'
import {useCurrentBasket} from '../../../hooks/use-current-basket'
import {useShopperBasketsMutation} from 'commerce-sdk-react-preview'

const CheckoutContext = React.createContext()

export const CheckoutProvider = ({children}) => {
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()
    const einstein = useEinstein()
    const [step, setStep] = useState()

    const {mutateAsync: removePaymentInstrumentFromBasket} = useShopperBasketsMutation(
        'removePaymentInstrumentFromBasket'
    )

    const CHECKOUT_STEPS_LIST = ['CONTACT_INFO', 'SHIPPING_ADDRESS', 'SHIPPING_OPTIONS', 'PAYMENT']
    const STEPS = CHECKOUT_STEPS_LIST.reduce((acc, step, idx) => ({...acc, [step]: idx}), {})

    const getCheckoutStepName = (step) => CHECKOUT_STEPS_LIST[step]

    useEffect(async () => {
        if (!customer || !basket) {
            return
        }

        let step = STEPS.PAYMENT

        if (customer.isGuest && !basket.customerInfo?.email) {
            step = STEPS.CONTACT_INFO
        } else if (!basket.shipments[0]?.shippingAddress) {
            step = STEPS.SHIPPING_ADDRESS
        } else if (!basket.shipments[0]?.shippingMethod) {
            step = STEPS.SHIPPING_OPTIONS
        }

        let paymentInstrumentId =
            basket.paymentInstruments && basket.paymentInstruments[0]?.paymentInstrumentId

        if (paymentInstrumentId) {
            await removePaymentInstrumentFromBasket({
                parameters: {
                    basketId: basket.basketId,
                    paymentInstrumentId
                }
            })
        }

        setStep(step)
    }, [
        customer?.isGuest,
        basket?.customerInfo?.email,
        basket?.shipments[0]?.shippingAddress,
        basket?.shipments[0]?.shippingMethod
    ])

    /**************** Einstein ****************/
    // Run this once when checkout begins
    useEffect(() => {
        if (basket?.productItems) {
            einstein.sendBeginCheckout(basket)
        }
    }, [])

    // Run this every time checkout steps change
    useEffect(() => {
        if (step != undefined) {
            einstein.sendCheckoutStep(getCheckoutStepName(step), step, basket)
        }
    }, [step])

    const value = {
        step,
        STEPS,
        goToNextStep: () => setStep(step + 1),
        goToStep: (step) => setStep(step)
    }

    return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
}

CheckoutProvider.propTypes = {
    children: PropTypes.any
}

/**
 * A hook for managing checkout state and actions
 * @returns {Object} Checkout data and actions
 */
export const useCheckout = () => {
    return React.useContext(CheckoutContext)
}
