/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useStripe, useElements} from '@stripe/react-stripe-js'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {useIntl} from 'react-intl'
import {useToast} from './use-toast'
import useNavigation from './use-navigation'
import {API_ERROR_MESSAGE} from '../constants'

import {useQueryClient} from '@tanstack/react-query'

import {useCurrentBasket} from './use-current-basket'
import {useCreateOrderStore} from '../stores/isCreatingOrder'

import {
    useUsid,
    useShopperBasketsMutation,
    useShopperOrdersMutation
} from 'commerce-sdk-react-preview'
import { useFailOrder } from '../pages/checkout/util/checkout-request-helper'

export const useCreateStripeOrder = () => {
    const {formatMessage} = useIntl()
    const usid = useUsid()
    const stripe = useStripe()
    const elements = useElements()
    const toast = useToast()
    const setIsCreatingOrder = useCreateOrderStore((state) => state.setIsCreatingOrder)

    const {mutateAsync: createOrder} = useShopperOrdersMutation('createOrder')
    const {data: basket} = useCurrentBasket()

    const {processFailedPayment} = useFailedPayment()

    return {
        async createOrder() {
            const basketId = basket.basketId
            const clientSecret = basket.c_stripeClientSecret
            setIsCreatingOrder(true)
            
            const response = await createOrder({
                headers: {_sfdc_customer_id: usid},
                body: {basketId: basket.basketId}
            })

            if (response.fault || (response.title && response.type && response.detail)) {
                throw new Error(response.title)
            }

            const orderNumber = response.orderNo
            const stripeReturnURL = `${getAppOrigin()}/checkout/confirmation/${orderNumber}?basket_id=${basketId}`

            sessionStorage.setItem('basket', JSON.stringify(basket))
            sessionStorage.setItem('order_no', orderNumber)

            window.addEventListener(
                'pageshow',
                async (event) => {
                    if (event.persisted) {
                        try {
                            processFailedPayment(orderNumber, response, clientSecret)
                        } catch (error) {
                            toast({
                                title: formatMessage(API_ERROR_MESSAGE),
                                status: 'error'
                            })

                            basket.handleError(error)
                        }
                    }
                },
                {once: true}
            )

            const {error} = await stripe.confirmPayment({
                elements,
                redirect: 'always',
                confirmParams: {
                    return_url: stripeReturnURL
                }
            })

            // This is only needed for payment methods that don't redirect
            if (error) {
                toast({
                    title: error.message,
                    status: 'error'
                })

                processFailedPayment(orderNumber, response, clientSecret)
            }
        }
    }
}

export const useFailedPayment = () => {
    const toast = useToast()
    const navigate = useNavigation()
    const queryClient = useQueryClient()
    const {data: basket} = useCurrentBasket()
    const failOrder = useFailOrder()
    const createBasket = useShopperBasketsMutation('createBasket')
    const setIsCreatingOrder = useCreateOrderStore((state) => state.setIsCreatingOrder)

    const recreateBasketFromOrder = async (orderData, clientSecret) => {
        let storageBasket = JSON.parse(sessionStorage.getItem('basket'))
        sessionStorage.removeItem('basket')

        try {
            if (basket && basket.basketId && basket.productItems?.length > 0) {
                await createBasket.mutateAsync({body: basket})
            } else if (orderData && orderData.productItems?.length > 0) {
                const {
                    createdBy,
                    confirmationStatus,
                    customerName,
                    exportStatus,
                    orderNo,
                    orderToken,
                    paymentStatus,
                    shippingStatus,
                    siteId,
                    status,
                    ...basketInput
                } = orderData

                basketInput.c_stripeClientSecret = clientSecret

                await createBasket.mutateAsync({body: basketInput})
            } else if (
                storageBasket &&
                storageBasket.basketId &&
                storageBasket.productItems?.length > 0
            ) {
                await createBasket.mutateAsync({body: storageBasket})
            }

            setIsCreatingOrder(false)
            queryClient.invalidateQueries('baskets')

            sessionStorage.removeItem('basket')
            sessionStorage.removeItem('order_no')
        } catch {
            toast({
                title: "Something went wrong. Please try again.",
                status: 'error'
            })

            sessionStorage.removeItem('basket')
            sessionStorage.removeItem('order_no')
            navigate('/cart')
        }
    }

    return {
        async processFailedPayment(orderNo, orderData = null, clientSecret = null) {
            try {
                if(!orderNo) {
                    orderNo = sessionStorage.getItem('order_no')

                    if(!orderNo) {
                        throw new Error("Order number is missing")
                    }
                }

                const result = await failOrder.mutateAsync(orderNo)

                if (result?.ok) {
                    setIsCreatingOrder(false)
                    queryClient.invalidateQueries('baskets')

                    sessionStorage.removeItem('basket')
                    sessionStorage.removeItem('order_no')
                } else {
                    throw new Error(result?.error)
                }
            } catch {
                await recreateBasketFromOrder(orderData, clientSecret)
            }
        }
    }
}
