/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
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

import {loadStripe} from '@stripe/stripe-js'
import {Elements} from '@stripe/react-stripe-js'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'

const {stripePublicKey} = getConfig()
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
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()

    if (!customer || !customer.customerId || !basket || !basket.basketId) {
        return <CheckoutSkeleton />
    }

    return (
        <CheckoutProvider>
            <Checkout />
        </CheckoutProvider>
    )
}

export default CheckoutContainer
