/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'

const Json = ({data}: {data: any}) => {
    const [expanded, setExpanded] = useState(false)

    const style = {
        body: {
            position: 'relative',
            cursor: expanded ? 'zoom-out' : 'zoom-in',
            height: expanded ? 'inherit' : '150px',
            overflow: 'hidden'
        },
        button: {
            position: 'absolute',
            right: 0,
            paddingRight: 10
        },
        shadow: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 10,
            background:
                'linear-gradient(to bottom, rgba(137,255,241,0) 0%,rgba(255,255,255,1) 100%)'
        }
    }
    return (
        <div style={style.body} onClick={() => setExpanded(!expanded)}>
            <a style={style.button}>{expanded ? '[-]' : '[+]'}</a>
            <pre>{JSON.stringify(data, null, 2)}</pre>
            {!expanded && <div style={style.shadow} />}
        </div>
    )
}

Json.displayName = 'Json'

export default Json
