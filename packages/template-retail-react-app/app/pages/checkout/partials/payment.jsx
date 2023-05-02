/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useCallback, useRef, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {Box, Button, Checkbox, Container, Heading, Stack, Text, Divider} from '@chakra-ui/react'
import {useForm} from 'react-hook-form'
import {useToast} from '../../../hooks/use-toast'
import {useShopperBasketsMutation} from 'commerce-sdk-react-preview'
import {useCurrentBasket} from '../../../hooks/use-current-basket'
import {useCheckout} from '../util/checkout-context'
import {ToggleCard, ToggleCardEdit} from '../../../components/toggle-card'
import {PaymentElement} from '@stripe/react-stripe-js'
import ShippingAddressSelection from './shipping-address-selection'
import AddressDisplay from '../../../components/address-display'
import {PromoCode, usePromoCode} from '../../../components/promo-code'
import {API_ERROR_MESSAGE} from '../../../constants'
import {useCreateStripeOrder} from '../../../hooks/stripe'

const Payment = () => {
    const {formatMessage} = useIntl()
    const {data: basket} = useCurrentBasket()
    const selectedShippingAddress = basket?.shipments && basket?.shipments[0]?.shippingAddress
    const selectedBillingAddress = basket?.billingAddress
    const appliedPayment = basket?.paymentInstruments && basket?.paymentInstruments[0]
    const [billingSameAsShipping, setBillingSameAsShipping] = useState(true) // By default, have billing addr to be the same as shipping
    const [paymentInfoComplete, setPaymentInfoComplete] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const createStripeOrder = useCreateStripeOrder()

    const paymentType = useRef(null)
    const {mutateAsync: addPaymentInstrumentToBasket} = useShopperBasketsMutation(
        'addPaymentInstrumentToBasket'
    )
    const {mutateAsync: updateBillingAddressForBasket} = useShopperBasketsMutation(
        'updateBillingAddressForBasket'
    )
    const showToast = useToast()
    const showError = () => {
        showToast({
            title: formatMessage(API_ERROR_MESSAGE),
            status: 'error'
        })
    }

    const {step, STEPS, goToStep} = useCheckout()

    const billingAddressForm = useForm({
        mode: 'onChange',
        shouldUnregister: false,
        defaultValues: {...selectedBillingAddress}
    })

    // Using destructuring to remove properties from the object...
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {removePromoCode, ...promoCodeProps} = usePromoCode()

    const paymentMethodForm = useForm()

    const onPaymentSubmit = async () => {
        const paymentInstrument = {
            paymentMethodId: 'STRIPE_PAYMENT_ELEMENT',
            amount: basket.orderTotal,
            paymentCard: {
                cardType: paymentType.current
            }
        }

        return addPaymentInstrumentToBasket({
            parameters: {basketId: basket?.basketId},
            body: paymentInstrument
        })
    }

    const onBillingSubmit = async () => {
        const isFormValid = await billingAddressForm.trigger()

        if (!isFormValid) {
            return
        }
        const billingAddress = billingSameAsShipping
            ? selectedShippingAddress
            : billingAddressForm.getValues()
        // Using destructuring to remove properties from the object...
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {addressId, creationDate, lastModified, preferred, ...address} = billingAddress
        return updateBillingAddressForBasket({
            body: address,
            parameters: {basketId: basket.basketId, shipmentId: 'me'}
        })
    }

    const onSubmit = paymentMethodForm.handleSubmit(async () => {
        try {
            setIsLoading(true)
            if (!appliedPayment) {
                await onPaymentSubmit()
            }
            await onBillingSubmit()

            await submitOrder()
        } catch (error) {
            showError()
        } finally {
            setIsLoading(false)
        }
    })

    const updatePaymentType = (newType) => {
        if (paymentType.current !== newType) {
            paymentType.current = newType
        }
    }

    const onPaymentElementChange = useCallback(
        (event) => {
            if (event.value) {
                updatePaymentType(event.value.type)
            }
            setPaymentInfoComplete(event.complete)
        },
        [updatePaymentType]
    )

    const submitOrder = async () => {
        try {
            createStripeOrder.createOrder()
        } catch (error) {
            showError()
        }
    }

    return (
        <ToggleCard
            id="step-3"
            title={formatMessage({defaultMessage: 'Payment', id: 'checkout_payment.title.payment'})}
            editing={step === STEPS.PAYMENT}
            isLoading={
                isLoading ||
                paymentMethodForm.formState.isSubmitting ||
                billingAddressForm.formState.isSubmitting
            }
            disabled={appliedPayment == null}
            onEdit={() => goToStep(STEPS.PAYMENT)}
        >
            <ToggleCardEdit>
                <Box mt={-2} mb={4}>
                    <PromoCode {...promoCodeProps} itemProps={{border: 'none'}} />
                </Box>

                <Stack spacing={6}>
                    <Box data-testid="payment-element-wrapper">
                        <PaymentElement
                            id="payment-element"
                            options={{layout: 'accordion'}}
                            onChange={onPaymentElementChange}
                        />
                    </Box>

                    <Divider borderColor="gray.100" />

                    <Stack spacing={2}>
                        <Heading as="h3" fontSize="md">
                            <FormattedMessage
                                defaultMessage="Billing Address"
                                id="checkout_payment.heading.billing_address"
                            />
                        </Heading>

                        <Checkbox
                            name="billingSameAsShipping"
                            isChecked={billingSameAsShipping}
                            onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                        >
                            <Text fontSize="sm" color="gray.700">
                                <FormattedMessage
                                    defaultMessage="Same as shipping address"
                                    id="checkout_payment.label.same_as_shipping"
                                />
                            </Text>
                        </Checkbox>

                        {billingSameAsShipping && selectedShippingAddress && (
                            <Box pl={7}>
                                <AddressDisplay address={selectedShippingAddress} />
                            </Box>
                        )}
                    </Stack>

                    {!billingSameAsShipping && (
                        <ShippingAddressSelection
                            form={billingAddressForm}
                            selectedAddress={selectedBillingAddress}
                            hideSubmitButton
                        />
                    )}

                    <Box pt={3}>
                        <Container variant="form">
                            <Button w="full" onClick={onSubmit} disabled={!paymentInfoComplete}>
                                <FormattedMessage
                                    defaultMessage="Place Order"
                                    id="checkout.button.place_order"
                                />
                            </Button>
                        </Container>
                    </Box>
                </Stack>
            </ToggleCardEdit>
        </ToggleCard>
    )
}

export default Payment
