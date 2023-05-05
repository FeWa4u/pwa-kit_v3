import {useMutation, useQueryClient} from '@tanstack/react-query'
import {useAccessToken} from 'commerce-sdk-react-preview'

import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'

const createPaymentIntent = (basket) => {
    const {app} = getConfig()
    const proxy = `/mobify/proxy/ocapi`
    const host = `${getAppOrigin()}${proxy}`

    const amount = String(basket?.orderTotal).replace('.', '')
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({
            basketId: basket?.basketId,
            amount,
            currency: basket?.currency
        })
    }

    return fetch(`${host}/on/demandware.store/Sites-${app.commerceAPI.parameters.siteId}-Site/default/Stripe-CreatePI`, requestOptions)
}

const failOrder = (token, orderNo) => {
    const {app} = getConfig()
    const proxy = `/mobify/proxy/ocapi`
    const host = `${getAppOrigin()}${proxy}`

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({
            token,
            orderNo
        })
    }

    return fetch(`${host}/on/demandware.store/Sites-${app.commerceAPI.parameters.siteId}-Site/default/Stripe-FailOrder`, requestOptions)
}

export const useCreatePaymentIntent = () => {
    return useMutation({
        mutationFn: (basket) => createPaymentIntent(basket)
    })
}

export const useFailOrder = () => {
    const {token} = useAccessToken()

    return useMutation({
        mutationFn: (orderNo) => failOrder(token, orderNo)
    })
}