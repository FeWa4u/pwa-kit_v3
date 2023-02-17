/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {SimpleGrid} from '@chakra-ui/react'
import {Region} from '../../region'

export const MobileGrid2r3c = ({regions}) => {
    return (
        <SimpleGrid className="mobile-2r-3c" columns={3} spacingX='40px' spacingY='20px'>
            {regions.map((region) => (
                <Region key={region.id} region={region} />
            ))}
        </SimpleGrid>
    )
}

MobileGrid2r3c.displayName = 'MobileGrid1r1c'

MobileGrid2r3c.propTypes = {
    // Internally Provided
    regions: PropTypes.array.isRequired
}

export default MobileGrid2r3c