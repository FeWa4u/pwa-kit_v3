/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {
    useMultiStyleConfig,
    Box,
    Flex,
    IconButton,
    Badge,
    Button,
    Popover,
    PopoverHeader,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    PopoverFooter,
    PopoverArrow,
    Stack,
    Text,
    Divider,
    useDisclosure,
    useMediaQuery,
} from '@chakra-ui/react'

import useBasket from '^retail-react-app/app/commerce-api/hooks/useBasket'
import useCustomer from '^retail-react-app/app/commerce-api/hooks/useCustomer'

import Link from '^retail-react-app/app/components/link'
import Search from '^retail-react-app/app/components/search'
import withRegistration from '^retail-react-app/app/hoc/with-registration'
import {
    AccountIcon,
    BrandLogo,
    BasketIcon,
    HamburgerIcon,
    ChevronDownIcon,
    HeartIcon,
    SignoutIcon,
} from '../icons'

import {noop} from '^retail-react-app/app/utils/utils'
import {navLinks, messages} from '^retail-react-app/app/pages/account/constant'
// import {navLinks} from '../../pages/account/constant'
import useNavigation from '^retail-react-app/app/hooks/use-navigation'
import LoadingSpinner from '^retail-react-app/app/components/loading-spinner'

const ENTER_KEY = 'Enter'

const IconButtonWithRegistration = withRegistration(IconButton)
/**
 * The header is the main source for accessing
 * navigation, search, basket, and other
 * important information and actions. It persists
 * on the top of your application and will
 * respond to changes in device size.
 *
 * To customize the styles, update the themes
 * in theme/components/project/header.js
 * @param  props
 * @param   {func} props.onMenuClick click event handler for menu button
 * @param   {func} props.onLogoClick click event handler for menu button
 * @param   {object} props.searchInputRef reference of the search input
 * @param   {func} props.onMyAccountClick click event handler for my account button
 * @param   {func} props.onMyCartClick click event handler for my cart button
 * @return  {React.ReactElement} - Header component
 */
const Header = ({
    children,
    onMenuClick = noop,
    onMyAccountClick = noop,
    onLogoClick = noop,
    onMyCartClick = noop,
    onWishlistClick = noop,
    ...props
}) => {
    const intl = useIntl()
    const basket = useBasket()
    const customer = useCustomer()
    const navigate = useNavigation()

    const {isOpen, onClose, onOpen} = useDisclosure()
    const [isDesktop] = useMediaQuery('(min-width: 992px)')

    const [showLoading, setShowLoading] = useState(false)
    // // tracking if users enter the popover Content,
    // // so we can decide whether to close the menu when users leave account icons
    // const hasEnterPopoverContent = useRef()

    const styles = useMultiStyleConfig('Header')

    const onSignoutClick = async () => {
        setShowLoading(true)
        // await customer.logout()
        navigate('/login')
        setShowLoading(false)
    }

    // const keyMap = {
    //     Escape: () => onClose(),
    //     Enter: () => onOpen(),
    // }

    // const handleIconsMouseLeave = () => {
    //     // don't close the menu if users enter the popover content
    //     setTimeout(() => {
    //         if (!hasEnterPopoverContent.current) onClose()
    //     }, 100)
    // }

    // return (
    //     <Box {...styles.container} {...props}>
    //         <Box {...styles.content}>
    //             {showLoading && <LoadingSpinner wrapperStyles={{height: '100vh'}} />}
    //             <Flex wrap="wrap" alignItems={['baseline', 'baseline', 'baseline', 'center']}>
    //                 <IconButton
    //                     // @TODO: modified
    //                     aria-label="Menu"
    //                     icon={<HamburgerIcon />}
    //                     variant="unstyled"
    //                     display={{lg: 'none'}}
    //                     {...styles.icons}
    //                     onClick={onMenuClick}
    //                 />
    //                 <IconButton
    //                     aria-label="Logo"
    //                     icon={<BrandLogo {...styles.logo} />}
    //                     {...styles.icons}
    //                     variant="unstyled"
    //                     onClick={onLogoClick}
    //                 />
    //                 <Box {...styles.bodyContainer}>{children}</Box>
    //                 <Box {...styles.searchContainer}>
    //                     <Search placeholder="Search for products..." {...styles.search} />
    //                 </Box>
    //                 Hello Header
    //             </Flex>
    //         </Box>
    //     </Box>
    // )

    return (
        <Box {...styles.container} {...props}>
            <Box {...styles.content}>
                {showLoading && <LoadingSpinner wrapperStyles={{height: '100vh'}} />}
                <Flex wrap="wrap" alignItems={['baseline', 'baseline', 'baseline', 'center']}>
                    <IconButton
                        // @TODO: modified
                        aria-label="Menu"
                        icon={<HamburgerIcon />}
                        variant="unstyled"
                        display={{lg: 'none'}}
                        {...styles.icons}
                        onClick={onMenuClick}
                    />
                    <IconButton
                        aria-label="Logo"
                        icon={<BrandLogo {...styles.logo} />}
                        {...styles.icons}
                        variant="unstyled"
                        onClick={onLogoClick}
                    />
                    <Box {...styles.bodyContainer}>{children}</Box>
                    <Box {...styles.searchContainer}>
                        <Search placeholder="Search for products..." {...styles.search} />
                    </Box>
                    <AccountIcon
                        {...styles.accountIcon}
                        tabIndex={0}
                        onMouseOver={isDesktop ? onOpen : noop}
                        onKeyDown={(e) => {
                            e.key === ENTER_KEY ? onMyAccountClick() : noop
                        }}
                        onClick={onMyAccountClick}
                        aria-label="My account"
                    />

                    {customer.isRegistered && (
                        <Popover
                            isLazy
                            arrowSize={15}
                            isOpen={isOpen}
                            placement="bottom-end"
                            onClose={onClose}
                            onOpen={onOpen}
                        >
                            <PopoverTrigger>
                                <ChevronDownIcon
                                    aria-label="My account trigger"
                                    onMouseLeave={handleIconsMouseLeave}
                                    onKeyDown={(e) => {
                                        keyMap[e.key]?.(e)
                                    }}
                                    {...styles.arrowDown}
                                    onMouseOver={onOpen}
                                    tabIndex={0}
                                />
                            </PopoverTrigger>

                            <PopoverContent
                                {...styles.popoverContent}
                                onMouseLeave={() => {
                                    hasEnterPopoverContent.current = false
                                    onClose()
                                }}
                                onMouseOver={() => {
                                    hasEnterPopoverContent.current = true
                                }}
                            >
                                <PopoverArrow />
                                <PopoverHeader>
                                    <Text>My account</Text>
                                </PopoverHeader>
                                <PopoverBody>
                                    <Stack spacing={0} as="nav" data-testid="account-detail-nav">
                                        {navLinks.map((link) => {
                                            const LinkIcon = link.icon
                                            return (
                                                <Button
                                                    key={link.name}
                                                    to={`/account${link.path}`}
                                                    useNavLink={true}
                                                    variant="menu-link"
                                                    leftIcon={<LinkIcon boxSize={5} />}
                                                >
                                                    {link.name}
                                                </Button>
                                            )
                                        })}
                                    </Stack>
                                </PopoverBody>
                                <PopoverFooter onClick={onSignoutClick} cursor="pointer">
                                    <Divider colorScheme="gray" />
                                    <Button variant="unstyled" {...styles.signout}>
                                        <Flex>
                                            <SignoutIcon boxSize={5} {...styles.signoutIcon} />
                                            <Text as="span" {...styles.signoutText}>
                                                Log out
                                            </Text>
                                        </Flex>
                                    </Button>
                                </PopoverFooter>
                            </PopoverContent>
                        </Popover>
                    )}
                    <IconButtonWithRegistration
                        aria-label="Wishlist"
                        icon={<HeartIcon />}
                        variant="unstyled"
                        {...styles.icons}
                        onClick={onWishlistClick}
                    />
                    <IconButton
                        aria-label="My cart"
                        icon={
                            <>
                                <BasketIcon />
                                {basket?.loaded && (
                                    <Badge variant="notification">
                                        {basket.itemAccumulatedCount}
                                    </Badge>
                                )}
                            </>
                        }
                        variant="unstyled"
                        {...styles.icons}
                        onClick={onMyCartClick}
                    />
                </Flex>
            </Box>
        </Box>
    )
}

Header.propTypes = {
    children: PropTypes.node,
    onMenuClick: PropTypes.func,
    onLogoClick: PropTypes.func,
    onMyAccountClick: PropTypes.func,
    onWishlistClick: PropTypes.func,
    onMyCartClick: PropTypes.func,
    searchInputRef: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({current: PropTypes.elementType}),
    ]),
}

export default Header