/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Fragment, useRef, forwardRef, useState, useEffect} from 'react'
import PropTypes from 'prop-types'
// import {useIntl} from 'react-intl'
import {Link as RouteLink} from 'react-router-dom'
import omit from 'lodash/omit'
import {useCategories} from 'retail-react-app/app/hooks/use-categories'

// Project Components
import LinksList from 'retail-react-app/app/components/links-list'

// Components
import {
    Box,
    Container,
    SimpleGrid,
    Flex,
    Stack,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    Center,
    Spinner,

    // Hooks
    useTheme,
    useDisclosure,
} from '@chakra-ui/react'
import Link from 'retail-react-app/app/components/link'
// Others
import {categoryUrlBuilder} from 'retail-react-app/app/utils/url'
import {ChevronDownIcon} from 'retail-react-app/app/components/icons'

const MAXIMUM_NUMBER_COLUMNS = 5

const ChevronIconTrigger = forwardRef(function ChevronIconTrigger(props, ref) {
    return (
        <Box {...props} ref={ref}>
            <ChevronDownIcon />
        </Box>
    )
})

const ListMenuTrigger = ({item, name, isOpen, onOpen, onClose, hasItems}) => {
    const theme = useTheme()
    // const {baseStyle} = theme.components.ListMenu

    const keyMap = {
        Escape: () => onClose(),
        Enter: () => onOpen(),
    }

    return (
        <Box>
            <Link as={RouteLink} to={categoryUrlBuilder(item)} onMouseOver={onOpen}>
                {name}
            </Link>

            {hasItems && (
                <Link
                    as={RouteLink}
                    to={'#'}
                    onMouseOver={onOpen}
                    onKeyDown={(e) => {
                        keyMap[e.key]?.(e)
                    }}
                >
                    <PopoverTrigger>
                        <ChevronIconTrigger />
                    </PopoverTrigger>
                </Link>
            )}

            {!hasItems && !item.loaded && <Spinner size="sm" />}
        </Box>
    )
}
ListMenuTrigger.propTypes = {
    item: PropTypes.object,
    name: PropTypes.string,
    isOpen: PropTypes.bool,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    hasItems: PropTypes.bool,
}

const ListMenuContent = ({maxColumns, items, itemsKey, onClose, initialFocusRef}) => {
    const theme = useTheme()
    // const {baseStyle} = theme.components.ListMenu
    // const {locale} = useIntl()

    return (
        <PopoverContent data-testid="popover-menu">
            <PopoverBody>
                <Container as={Stack}>
                    <SimpleGrid
                        spacing={8}
                        justifyContent={'left'}
                        gridTemplateColumns={`repeat(${
                            items.length > maxColumns ? maxColumns : items.length
                        }, minmax(0, 21%))`}
                        marginInlineStart={{lg: '68px', xl: '96px'}}
                    >
                        {items.map((item, index) => {
                            const {id, name} = item
                            const items = item[itemsKey]

                            const heading = {
                                href: categoryUrlBuilder(item, 'en-GB'),
                                text: name,
                                styles: {
                                    fontSize: 'md',
                                    marginBottom: 2,
                                },
                            }

                            const links = items
                                ? items.map((item) => {
                                      const {name} = item
                                      return {
                                          href: categoryUrlBuilder(item, 'en-GB'),
                                          text: name,
                                          styles: {
                                              fontSize: 'md',
                                              paddingTop: 3,
                                              paddingBottom: 3,
                                          },
                                      }
                                  })
                                : []
                            return (
                                <LinksList
                                    key={id}
                                    heading={heading}
                                    links={links}
                                    color={'gray.900'}
                                    onLinkClick={onClose}
                                    {...(index === 0 ? {headingLinkRef: initialFocusRef} : {})}
                                />
                            )
                        })}
                    </SimpleGrid>
                </Container>
            </PopoverBody>
        </PopoverContent>
    )
}
ListMenuContent.propTypes = {
    items: PropTypes.array,
    maxColumns: PropTypes.number,
    onClose: PropTypes.func,
    initialFocusRef: PropTypes.object,
}

const ListMenuPopover = ({items, item, name, maxColumns}) => {
    const initialFocusRef = useRef()
    const {root, itemsKey, setRoot, findFirst} = useCategories()
    const {isOpen, onClose, onOpen} = useDisclosure()

    const _onOpen = () => {
        console.log('~_onOpen()')
        // setRoot({
        //     ...root,
        //     [itemsKey]:
        // })
        onOpen()
    }
    return (
        <Box onMouseLeave={onClose}>
            <Popover
                isLazy
                placement={'bottom-start'}
                initialFocusRef={initialFocusRef}
                onOpen={_onOpen}
                onClose={onClose}
                isOpen={isOpen}
                variant="fullWidth"
            >
                <Fragment>
                    <ListMenuTrigger
                        item={item}
                        name={name}
                        isOpen={isOpen}
                        onOpen={_onOpen}
                        onClose={onClose}
                        hasItems={!!items}
                    />
                    {items && (
                        <ListMenuContent
                            items={items}
                            itemsKey={itemsKey}
                            initialFocusRef={initialFocusRef}
                            onClose={onClose}
                            maxColumns={maxColumns}
                        />
                    )}
                </Fragment>
            </Popover>
        </Box>
    )
}

ListMenuPopover.propTypes = {
    items: PropTypes.array,
    item: PropTypes.object,
    name: PropTypes.string,
    maxColumns: PropTypes.number,
    itemsKey: PropTypes.string,
}

/**
 * This is the navigation component used for desktop devices. Holds the site navigation,
 * providing users with a way to access all product categories and other important pages.
 * The submenus are open when the user moves the mouse over the trigger and for A11y when
 * users use the keyboard Tab key to focus over the chevron icon and press Enter.
 *
 * @param maxColumns The maximum number of columns that we want to use per row inside the ListMenu.
 */
const ListMenu = ({maxColumns = MAXIMUM_NUMBER_COLUMNS}) => {
    const {root, setRoot, findFirst, itemsKey} = useCategories()
    const theme = useTheme()
    // const {baseStyle} = theme.components.ListMenu
    return (
        <nav aria-label="main">
            <Flex>
                {root?.[itemsKey] ? (
                    <Stack direction={'row'} spacing={0}>
                        {root?.[itemsKey]?.map &&
                            root?.[itemsKey]?.map((item) => {
                                const {id, name} = item
                                const items = item[itemsKey]
                                return (
                                    <Box>
                                        <ListMenuPopover
                                            key={id}
                                            maxColumns={maxColumns}
                                            item={item}
                                            name={name}
                                            items={item?.[itemsKey]}
                                            itemsKey={itemsKey}
                                        />
                                    </Box>
                                )
                            })}
                    </Stack>
                ) : (
                    <Center p="2">
                        <Spinner size="lg" />
                    </Center>
                )}
            </Flex>
        </nav>
    )
}

ListMenu.displayName = 'ListMenu'

ListMenu.propTypes = {
    /**
     * The maximum number of columns that we want to use per row in the menu.
     */
    maxColumns: PropTypes.number,
}

export default ListMenu