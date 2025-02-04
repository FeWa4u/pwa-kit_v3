/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// The eslint config used from pwa-kit-dev does not properly parse TypeScript. :\
// TODO: Remove this directive when the eslint config is updated.
/* eslint-disable no-undef */
import React from 'react'

interface Props {
    message: string
}

const HelloTS = ({message}: Props) => {
    return <span>And this is a TS component (it takes a prop: &quot;{message}&quot;).</span>
}

export default HelloTS
