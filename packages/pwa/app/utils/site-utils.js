/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from './utils'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {resolveConfigFromUrl} from './url-config'

/**
 * This functions takes an url and returns a site object,
 * an error will be thrown if no url is passed in or no site is found
 * @param {string} url
 * @returns {object}
 */
export const resolveSiteFromUrl = (url) => {
    if (!url) {
        throw new Error('url is required to find a site object.')
    }
    const {hostname, pathname, search} = new URL(url)
    const path = `${pathname}${search}`
    // get all the sites from a specific hostname
    const sites = getSitesByHost(hostname)
    let site

    // Step 1: look for the site based on a hostname,
    // if that host only contains one site, use it
    // otherwise, we need to use another way to determine the site
    site = getSiteByHostname(hostname)
    if (site) {
        return site
    }

    // Step 2: As using hostname is not unique enough to determine the site
    // we will use the pathname to look further into the sites of current hostname
    site = getSiteByPath(path, sites)

    if (site) {
        return site
    }

    // Step 3: use the default for the current host as none of the above works
    const defaultSiteId = getDefaultSiteIdByHost(hostname)
    site = sites.find((site) => site.id === defaultSiteId)
    // Step 4: throw an error if site can't be found by any of the above steps
    if (!site) {
        throw new Error("Can't find any site. Please check you sites configuration.")
    }
    return site
}

export const getDefaultSiteIdByHost = (hostname) => {
    const hosts = getHosts()
    const host = hosts.find((host) => host.domain.includes(hostname))
    return host?.defaultSite
}

export const getDefaultSite = () => {
    const {hostname} = new URL(getAppOrigin())
    const sites = getSitesByHost(hostname)
    const defaultSiteId = getDefaultSiteIdByHost(hostname)

    return sites.find((site) => site.id === defaultSiteId)
}

export const getDefaultLocale = () => {
    const defaultSite = getDefaultSite()
    return defaultSite.l10n.supportedLocales.find(
        (locale) => locale.id === defaultSite.l10n.defaultLocale
    )
}

/**
 * This function goes over the default site and group id and alias of site and locale into their own value list
 */
export const getDefaultSiteValues = () => {
    const defaultSite = getDefaultSite()
    const defaultLocale = getDefaultLocale()
    return {
        defaultLocaleVal: [defaultLocale.id, defaultLocale.alias],
        defaultSiteVal: [defaultSite.id, defaultSite.alias]
    }
}
/**
 * Get the site based on the given hostname
 * If there is only one site in that host, use that
 * Otherwise, return undefined
 * @param {string} hostname
 * @returns {string} site
 */
export const getSiteByHostname = (hostname) => {
    const sites = getSitesByHost(hostname)
    if (!sites || !sites.length)
        throw new Error('No site config found. Please check you configuration')

    return sites?.length === 1 ? sites[0] : undefined
}

/**
 * get the site by looking for the site value (either site id or alias) from the url
 * @param {string} path
 * @param  {array} sites
 * @returns {object|undefined}
 */
export const getSiteByPath = (path, sites) => {
    // extract the site from the url
    const {site: currentSite} = resolveConfigFromUrl(path)
    if (!currentSite) return

    if (!sites || !sites.length)
        throw new Error('No site config found. Please check you configuration')
    // look for the site that has the currentSite
    const site = sites.find((site) => site.id === currentSite || site.alias === currentSite)
    return site
}

/**
 * Return all the sites based on a hostname from config
 * @param hostname - input hostname to look for the sites
 * @returns {object|undefined}
 */
export const getSitesByHost = (hostname) => {
    if (!hostname) return
    const hosts = getHosts()
    const sites = hosts.find((host) => host.domain.includes(hostname))?.siteMaps
    return sites
}

/**
 * Get the hosts config from pwa-kit.config.json
 * @returns {array} - list of hosts
 */
export const getHosts = () => getConfig('app.routing.hosts')