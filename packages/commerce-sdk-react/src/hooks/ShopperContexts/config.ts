/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, CacheUpdateMatrix} from '../types'
import {NotImplementedError} from '../utils'

type Client = ApiClients['shopperContexts']

const TODO = (method: string) => {
    throw new NotImplementedError(method)
}
export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    updateShopperContext: TODO('updateShopperContext'),
    createShopperContext: TODO('createShopperContext'),
    deleteShopperContext: TODO('deleteShopperContext')
}