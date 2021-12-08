/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import pwaKitConfig from '../../pwa-kit-config.json'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {HOME_HREF, urlPartPositions} from '../constants'

/**
 * Call requestIdleCallback in supported browsers.
 *
 * https://developers.google.com/web/updates/2015/08/using-requestidlecallback
 * http://caniuse.com/#feat=requestidlecallback
 */
export const requestIdleCallback = (fn) => {
    if ('requestIdleCallback' in window) {
        return window.requestIdleCallback(fn)
    } else {
        return setTimeout(() => fn(), 1)
    }
}

export const watchOnlineStatus = (callback, win = window) => {
    const off = () => callback(false)
    const on = () => callback(true)
    win.addEventListener('offline', off)
    win.addEventListener('online', on)
    const unsubscribe = () => {
        win.removeEventListener('offline', off)
        win.removeEventListener('online', on)
    }
    return unsubscribe
}

/**
 * Compares the primary fields of two address objects to determine if they match.
 * @param {Object} addr1
 * @param {Object} addr2
 * @returns {boolean}
 */
export const isMatchingAddress = (addr1, addr2) => {
    const normalize = (addr) => {
        // eslint-disable-next-line no-unused-vars
        const {id, addressId, _type, preferred, creationDate, lastModified, ...normalized} = addr
        return normalized
    }
    return shallowEquals(normalize(addr1), normalize(addr2))
}

/**
 * Performs a shallow comparison on two objects
 * @param {Object} a
 * @param {Object} b
 * @returns {boolean}
 */
export const shallowEquals = (a, b) => {
    for (let key in a) {
        if (!(key in b) || a[key] !== b[key]) {
            return false
        }
    }
    for (let key in b) {
        if (!(key in a) || a[key] !== b[key]) {
            return false
        }
    }
    return true
}

/**
 * No operation function. You can use this
 * empty function when you wish to pass
 * around a function that will do nothing.
 * Usually used as default for event handlers.
 */
export const noop = () => {}

/**
 * Flattens a tree data structure into an array.
 * @param {*} node
 * @returns
 */
export const flatten = (node, key = 'children') => {
    const children = (node[key] || []).reduce((a, b) => {
        return Array.isArray(b[key]) && !!b[key].length
            ? {...a, ...flatten(b, key)}
            : {...a, [b.id]: b}
    }, {})

    return {
        [node.id]: node,
        ...children
    }
}

/**
 * Check the current execution environment
 * is client side or server side
 * @returns Boolean
 */
export const isServer = typeof window === 'undefined'

/**
 * retrieves an item from session storage
 * @param {string} key
 * @returns JSON | undefined
 */
export const getSessionJSONItem = (key) => {
    if (isServer) {
        return undefined
    }
    const item = window.sessionStorage.getItem(key)
    if (item) {
        return JSON.parse(item)
    } else {
        return undefined
    }
}
/**
 * sets an item in session storage
 * @param {string} key
 * @param {string} value
 */
export const setSessionJSONItem = (key, value) => {
    window.sessionStorage.setItem(key, JSON.stringify(value))
}

/**
 * clears an item in session storage
 * @param {string} key
 */
export const clearSessionJSONItem = (key) => {
    window.sessionStorage.removeItem(key)
}

/**
 * bolds a substring of a string by adding <b> tags
 * @param {string} str
 * @param {string} substr
 * @returns stringified HTML Node
 */
export const boldString = (str, substr) => {
    return str.replace(RegExp(substr, 'g'), `<b>${substr}</b>`)
}

/**
 * Capitalizes the words in a string
 * @param {string} text
 * @returns capitalized text
 */
export const capitalize = (text) => {
    return text
        .toLowerCase()
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ')
}

/**
 * A util to return current url configuration
 * @returns {object} - url object from the pwa-kit-config.json file
 */
export const getUrlConfig = () => pwaKitConfig?.app?.url
/**
 * A util to return current multi site configuration
 * @returns {object} - a list of site objects from the pwa-kit-config.json file
 */
export const getSitesConfig = () => pwaKitConfig?.app?.sites
/**
 * A util to return current defaultSiteId
 * @returns {string} - default site Id string from pwa-kit-config file
 */
export const getDefaultSiteId = () => pwaKitConfig?.app?.defaultSiteId

/**
 * A util to get the siteId
 * @param url
 * @returns {string}
 */
export const getSiteId = (url) => {
    let path = url
    if (!path) {
        path = `${window?.location.pathname}${window?.location.search}`
    }

    const {hostname, pathname, search} = new URL(`${getAppOrigin()}${path}`)
    let siteId = getSiteIdByHostname(hostname)

    if (siteId) {
        return siteId
    }

    siteId = getSiteIdByAlias(`${pathname}${search}`)
    return siteId
}

/**
 * Get the site Id based on the given hostname
 * @param {string} hostname
 * @returns {string} siteId
 */
const getSiteIdByHostname = (hostname) => {
    const sitesConfig = getSitesConfig()
    if (!sitesConfig.length) throw new Error('No site config found. Please check you configuration')
    if (!hostname) return undefined

    const site = sitesConfig.filter((site) => {
        return site?.hostname?.some((i) => i.includes(hostname))
    })

    return site?.length === 1 ? site[0].id : undefined
}

/**
 * get the site id based on the site alias in the given url
 * @param {string} url - input url
 * @returns {string} siteId
 */
const getSiteIdByAlias = (url) => {
    const [pathname, search] = url.split('?')

    const defaultSiteId = getDefaultSiteId()
    const sitesConfig = getSitesConfig()
    const urlConfig = getUrlConfig()
    if (pathname === HOME_HREF) {
        const siteIdList = sitesConfig.map((site) => site.id)
        // check if the default value is in the sites array config
        if (!siteIdList.includes(defaultSiteId)) {
            throw new Error(
                'The default SiteId does not match any values from the site configuration. Please check your configuration'
            )
        }
        return defaultSiteId
    }

    let currentSite
    const sitePosition = urlConfig['site']
    switch (sitePosition) {
        case urlPartPositions.NONE:
            return undefined
        case urlPartPositions.PATH:
            currentSite = pathname.split('/')[1]
            break
        case urlPartPositions.QUERY_PARAM: {
            const params = new URLSearchParams(search)
            currentSite = params.get('site')
            break
        }
    }

    const siteId = sitesConfig.find((site) => site.alias === currentSite)?.id

    return siteId
}

/**
 * return l10n config for current site
 * @param url
 * @returns {object}
 */
export const getL10nConfig = (url) => {
    const sitesConfig = getSitesConfig()
    if (!sitesConfig.length) throw new Error('No site config found. Please check you configuration')
    const siteId = getSiteId(url)
    const l10nConfig = sitesConfig.find((site) => site.id === siteId).l10n
    return l10nConfig
}
