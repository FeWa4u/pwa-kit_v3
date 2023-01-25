/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuth from './useAuth'
import useLocalStorage from './useLocalStorage'

const onClient = typeof window !== 'undefined'

/**
 * A hook to return customer auth type, either guest or registered user
 *
 */
const useAuthType = (): string | null => {
    if (onClient) {
        return useLocalStorage('auth_type')
    }
    const auth = useAuth()
    return auth.get('auth_type')
}

export default useAuthType