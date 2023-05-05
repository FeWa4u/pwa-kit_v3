/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef, useState} from 'react'
import {Alert, AlertIcon, Box, Container, Grid, GridItem, Stack} from '@chakra-ui/react'
import {CheckoutProvider, useCheckout} from './util/checkout-context'
import ContactInfo from './partials/contact-info'
import ShippingAddress from './partials/shipping-address'
import ShippingOptions from './partials/shipping-options'
import Payment from './partials/payment'
import OrderSummary from '../../components/order-summary'
import {useCurrentCustomer} from '../../hooks/use-current-customer'
import {useCurrentBasket} from '../../hooks/use-current-basket'
import CheckoutSkeleton from './partials/checkout-skeleton'
import {useCreateOrderStore} from '../../stores/isCreatingOrder'
import LoadingSpinner from '../../components/loading-spinner'
import {useIntl} from 'react-intl'
import {useToast} from '../../hooks/use-toast'
import useNavigation from '../../hooks/use-navigation'
import {useCreatePaymentIntent} from './util/checkout-request-helper'

import {useShopperBasketsMutation} from 'commerce-sdk-react-preview'

import {loadStripe} from '@stripe/stripe-js'
import {Elements} from '@stripe/react-stripe-js'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'

const {app, stripePublicKey} = getConfig()
const stripePromise = loadStripe(stripePublicKey)

const Checkout = () => {
    const {step} = useCheckout()
    const [error, setError] = useState()
    const {data: basket} = useCurrentBasket()

    useEffect(() => {
        if (error || step === 4) {
            window.scrollTo({top: 0})
        }
    }, [error, step])

    return (
        <Box background="gray.50" flex="1">
            <Container
                data-testid="sf-checkout-container"
                maxWidth="container.xl"
                py={{base: 7, lg: 16}}
                px={{base: 0, lg: 8}}
            >
                <Grid templateColumns={{base: '1fr', lg: '66% 1fr'}} gap={{base: 10, xl: 20}}>
                    <GridItem>
                        <Stack spacing={4}>
                            {error && (
                                <Alert status="error" variant="left-accent">
                                    <AlertIcon />
                                    {error}
                                </Alert>
                            )}

                            <ContactInfo />
                            <ShippingAddress />
                            <ShippingOptions />
                            {stripePromise && basket?.c_stripeClientSecret ? (
                                <Elements
                                    stripe={stripePromise}
                                    options={{
                                        clientSecret: basket.c_stripeClientSecret
                                    }}
                                    // This key is needed to force a re-render of the Elements component
                                    // when the c_stripeClientSecret changes. DO NOT REMOVE THIS KEY!
                                    key={basket.c_stripeClientSecret}
                                >
                                    <Payment />
                                </Elements>
                            ) : (
                                'Something went wrong'
                            )}
                        </Stack>
                    </GridItem>

                    <GridItem py={6} px={[4, 4, 4, 0]}>
                        <OrderSummary
                            basket={basket}
                            showTaxEstimationForm={false}
                            showCartItems={true}
                        />
                    </GridItem>
                </Grid>
            </Container>
        </Box>
    )
}

const CheckoutContainer = () => {
    const {formatMessage} = useIntl()
    const toast = useToast()
    const navigate = useNavigation()
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()
    const isCreatingPI = useRef(false)
    const createPaymentIntent = useCreatePaymentIntent()

    const updateBasket = useShopperBasketsMutation('updateBasket')
    const isCreatingOrder = useCreateOrderStore((state) => state.isCreatingOrder)

    const handleError = () => {
        toast({
            title: formatMessage({
                id: 'checkout.message.generic_error',
                defaultMessage: 'An unexpected error occurred during checkout.'
            }),
            status: 'error'
        })
        navigate('/cart')
    }

    const handleCreatePIResponse = async (data) => {
        const response = data?.ok && await data.json()
    
        if (response.error || response?.metadata?.basket_id !== basket.basketId) {
            handleError()
        } else {
            updateBasket.mutate({
                parameters: {basketId: basket.basketId},
                body: {
                    c_stripeClientSecret: response.client_secret,
                    c_stripePaymentIntentAmount: response.amount,
                    c_stripePaymentIntentID: response.id,
                }
            }, {
                onError: () => {
                    handleError()
                }
            })
        }
    }

    useEffect(() => {
        if (basket && basket.basketId && !isCreatingPI.current && !basket.c_stripeClientSecret) {
            isCreatingPI.current = true

            createPaymentIntent.mutate(basket, {
                onSuccess: (data) => {
                    handleCreatePIResponse(data)
                },
                onError: () => handleError()
            })  
        }
    }, [basket])

    if (!customer || !customer.customerId || !basket || !basket.basketId) {
        return (
            <Box>
                <CheckoutSkeleton />
                {isCreatingOrder && <LoadingSpinner />}
            </Box>
        )
    }

    if (!basket.c_stripeClientSecret) {
        return <CheckoutSkeleton />
    }

    return (
        <CheckoutProvider>
            <Checkout />
        </CheckoutProvider>
    )
}

export default CheckoutContainer
