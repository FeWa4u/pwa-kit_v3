/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import PropTypes from 'prop-types'

import {rest} from 'msw'
import {mockProductSearch, mockCategories} from '../../commerce-api/mock-data'
import {screen, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {Route, Switch} from 'react-router-dom'
import {createPathWithDefaults, renderWithProviders} from '../../utils/test-utils'
import ProductList from '.'
import EmptySearchResults from './partials/empty-results'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import useWishlist from '../../hooks/use-wishlist'

let mockCategoriesResponse = mockCategories
let mockProductListSearchResponse = mockProductSearch

jest.mock('../../commerce-api/einstein')

jest.mock('../../hooks/use-wishlist')

jest.mock('commerce-sdk-isomorphic', () => {
    const sdk = jest.requireActual('commerce-sdk-isomorphic')
    return {
        ...sdk,
        helpers: {
            ...sdk.helpers,
            loginGuestUser: async () => ({
                access_token: '',
                id_token: '',
                refresh_token: '',
                expires_in: 1800,
                token_type: 'BEARER',
                usid: '',
                customer_id: '',
                enc_user_id: '',
                idp_access_token: null
            })
        }
    }
})

const MockedComponent = ({isLoading, isLoggedIn = false}) => {
    const customer = useCustomer()
    useEffect(() => {
        if (isLoggedIn) {
            customer.login('test@test.com', 'password')
        }
    }, [])
    return (
        <Switch>
            <Route
                path={[
                    createPathWithDefaults('/category/:categoryId'),
                    createPathWithDefaults('/search')
                ]}
                render={(props) => (
                    <div>
                        <div>{customer.customerId}</div>
                        <ProductList {...props} isLoading={isLoading} />
                    </div>
                )}
            />
        </Switch>
    )
}

MockedComponent.propTypes = {
    isLoading: PropTypes.bool,
    isLoggedIn: PropTypes.bool
}

const MockedEmptyPage = () => {
    return <EmptySearchResults searchQuery={'test'} category={undefined} />
}

beforeEach(() => {
    useWishlist.mockReturnValue({
        isInitialized: true,
        isEmpty: false,
        data: {},
        findItemByProductId: () => {}
    })
    global.server.use(
        rest.get('*/product-search', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockProductListSearchResponse))
        ),
        rest.post('*/einstein/v3/personalization/*', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockProductListSearchResponse))
        )
    )
})

afterEach(() => {
    mockProductListSearchResponse = mockProductSearch
    jest.resetModules()
    localStorage.clear()
})

test('should render product list page', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('sf-product-list-page')).toBeInTheDocument()
})

test('should render sort option list page', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('sf-product-list-sort')).toBeInTheDocument()
})

test('should render skeleton', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent isLoading />)
    expect(screen.getAllByTestId('sf-product-tile-skeleton').length).toEqual(25)
})

test('should render empty list page', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedEmptyPage />)
    expect(await screen.findByTestId('sf-product-empty-list-page')).toBeInTheDocument()
})

test('pagination is rendered', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('sf-pagination')).toBeInTheDocument()
})

test('should display Selected refinements as there are some in the response', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent />)
    const countOfRefinements = await screen.findAllByText('Black')
    expect(countOfRefinements.length).toEqual(2)
})

// test('show login modal when an unauthenticated user tries to add an item to wishlist', async () => {
//     window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
//     renderWithProviders(<MockedComponent />)
//     const wishlistButton = screen.getAllByLabelText('Wishlist')
//     expect(wishlistButton.length).toBe(25)
//     user.click(wishlistButton[0])
//     expect(await screen.findByText(/Email/)).toBeInTheDocument()
//     expect(await screen.findByText(/Password/)).toBeInTheDocument()
// })

test('clicking a filter will change url', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}}
    })
    // NOTE: Look for a better wait to wait an additional render.
    await waitFor(() => !!screen.getByText(/Beige/i))

    user.click(screen.getByText(/Beige/i))
    await waitFor(() =>
        expect(window.location.search).toEqual(
            '?limit=25&refine=c_refinementColor%3DBeige&sort=best-matches'
        )
    )
})

// test('click on filter All should clear out all the filter in search params', async () => {
//     window.history.pushState(
//         {},
//         'ProductList',
//         '/uk/en-GB/category/mens-clothing-jackets?limit=25&refine=c_refinementColor%3DBeige&sort=best-matches'
//     )
//     renderWithProviders(<MockedComponent />, {
//         wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}}
//     })
//     const clearAllButton = await screen.findAllByText(/Clear All/i)
//     user.click(clearAllButton[0])
//     await waitFor(() => expect(window.location.search).toEqual(''))
// })

test('should display Search Results for when searching ', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/search?q=test')
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}}
    })
    expect(await screen.findByTestId('sf-product-list-page')).toBeInTheDocument()
})

test('clicking a filter on search result will change url', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/search?q=dress')
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}}
    })

    // NOTE: Look for a better wait to wait an additional render.
    await waitFor(() => !!screen.getByText(/Beige/i))

    user.click(screen.getByText(/Beige/i))

    await waitFor(() =>
        expect(window.location.search).toEqual(
            '?limit=25&q=dress&refine=c_refinementColor%3DBeige&sort=best-matches'
        )
    )
})
