/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Query} from '@tanstack/react-query'
import {getCustomerProductListItem, QueryKeys} from './queryKeyHelpers'
import {ApiClients, CacheUpdate, CacheUpdateMatrix, Tail} from '../types'
import {
    getCustomer,
    getCustomerAddress,
    getCustomerPaymentInstrument,
    getCustomerProductList,
    getCustomerProductLists
} from './queryKeyHelpers'
import {and, pathStartsWith} from '../utils'

type Client = ApiClients['shopperCustomers']

const noop = () => ({})

/** Invalidates the customer endpoint, but not derivative endpoints. */
const invalidateCustomer = (parameters: Tail<QueryKeys['getCustomer']>): CacheUpdate => ({
    invalidate: [{queryKey: getCustomer.queryKey(parameters)}]
})

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    createCustomerAddress(customerId, {parameters}, response) {
        // getCustomerAddress uses `addressName` rather than `addressId`
        const newParams = {...parameters, addressName: response.addressId}
        return {
            // TODO: Rather than invalidate, can we selectively update?
            ...invalidateCustomer(newParams),
            update: [{queryKey: getCustomerAddress.queryKey(newParams)}]
        }
    },
    createCustomerPaymentInstrument(customerId, {parameters}, response) {
        const newParams = {...parameters, paymentInstrumentId: response.paymentInstrumentId}
        return {
            // TODO: Rather than invalidate, can we selectively update?
            ...invalidateCustomer(newParams),
            update: [{queryKey: getCustomerPaymentInstrument.queryKey(newParams)}]
        }
    },
    createCustomerProductList(customerId, {parameters}, response) {
        // We always invalidate, because even without an ID we assume that something has changed
        // TODO: Rather than invalidate, can we selectively update?
        const invalidate: CacheUpdate['invalidate'] = [
            {queryKey: getCustomerProductLists.queryKey(parameters)}
        ]
        // We can only update cache for this product list if we have the ID
        const listId = response.id
        if (!listId) return {invalidate}
        return {
            invalidate,
            update: [{queryKey: getCustomerProductList.queryKey({...parameters, listId})}]
        }
    },
    createCustomerProductListItem(customerId, {parameters}, response) {
        // We always invalidate, because even without an ID we assume that something has changed
        // TODO: Rather than invalidate, can we selectively update?
        const invalidate: CacheUpdate['invalidate'] = [
            {queryKey: getCustomerProductList.queryKey(parameters)},
            {queryKey: getCustomerProductLists.queryKey(parameters)}
        ]
        // We can only update cache for this product list item if we have the ID
        const itemId = response.id
        if (!itemId) return {invalidate}
        return {
            invalidate,
            update: [{queryKey: getCustomerProductListItem.queryKey({...parameters, itemId})}]
        }
    },
    deleteCustomerPaymentInstrument(customerId, {parameters}) {
        return {
            // TODO: Rather than invalidate, can we selectively update?
            ...invalidateCustomer(parameters),
            remove: [{queryKey: getCustomerPaymentInstrument.queryKey(parameters)}]
        }
    },
    deleteCustomerProductList(customerId, {parameters}) {
        return {
            // TODO: Rather than invalidate, can we selectively update?
            invalidate: [{queryKey: getCustomerProductLists.queryKey(parameters)}],
            remove: [{queryKey: getCustomerProductList.path(parameters)}]
        }
    },
    deleteCustomerProductListItem(customerId, {parameters}) {
        return {
            // TODO: Rather than invalidate, can we selectively update?
            invalidate: [
                {queryKey: getCustomerProductList.queryKey(parameters)},
                {queryKey: getCustomerProductLists.queryKey(parameters)}
            ],
            remove: [{queryKey: getCustomerProductListItem.queryKey(parameters)}]
        }
    },
    getResetPasswordToken: noop,
    // TODO: Should this update the `getCustomer` cache?
    registerCustomer: noop,
    // TODO: Implement when the endpoint exits closed beta.
    // registerExternalProfile: TODO('registerExternalProfile'),
    removeCustomerAddress(customerId, {parameters}) {
        return {
            // TODO: Rather than invalidate, can we selectively update?
            ...invalidateCustomer(parameters),
            remove: [{queryKey: getCustomerAddress.queryKey(parameters)}]
        }
    },
    resetPassword: noop,
    updateCustomer(customerId, {parameters}) {
        // When we update a customer, we don't know what data has changed, so we must invalidate all
        // derivative endpoints. They conveniently all start with the same path as `getCustomer`,
        // but we do NOT want to invalidate `getCustomer` itself, we want to _update_ it. (Ideally,
        // we could invalidate *then* update, but React Query can't handle that.) To do so, we
        // examine the path of each cached query. If it starts with the `getCustomer` path, we
        // invalidate, UNLESS the first item afer the path is an object, because that means that it
        // is the `getCustomer` query itself.
        const path = getCustomer.path(parameters)
        const isNotGetCustomer = ({queryKey}: Query) => typeof queryKey[path.length] !== 'object'
        const predicate = and(pathStartsWith(path), isNotGetCustomer)
        return {
            update: [{queryKey: getCustomer.queryKey(parameters)}],
            invalidate: [{predicate}]
        }
    },
    updateCustomerAddress(customerId, {parameters}) {
        return {
            // TODO: Rather than invalidate, can we selectively update?
            ...invalidateCustomer(parameters),
            update: [{queryKey: getCustomerAddress.queryKey(parameters)}]
        }
    },
    updateCustomerPassword: noop,
    updateCustomerProductList(customerId, {parameters}) {
        return {
            update: [{queryKey: getCustomerProductList.queryKey(parameters)}],
            // TODO: Rather than invalidate, can we selectively update?
            invalidate: [{queryKey: getCustomerProductLists.queryKey(parameters)}]
        }
    },
    updateCustomerProductListItem(customerId, {parameters}) {
        return {
            update: [{queryKey: getCustomerProductListItem.queryKey(parameters)}],
            // TODO: Rather than invalidate, can we selectively update?
            invalidate: [
                {queryKey: getCustomerProductList.queryKey(parameters)},
                {queryKey: getCustomerProductLists.queryKey(parameters)}
            ]
        }
    }
}
