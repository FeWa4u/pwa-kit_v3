const sites = require('./sites.js')
module.exports = {
    app: {
        url: {
            locale: 'none'
        },
        defaultSite: 'Germany',
        sites,
        commerceAPI: {
            proxyPath: `/mobify/proxy/api`,
            parameters: {
                clientId: '8ad5f6f9-820d-4759-af7b-1fd6958f8322',
                organizationId: 'f_ecom_zyfq_006',
                shortCode: 'kv7kzm78',
                siteId: 'Germany'
            }
        },
        einsteinAPI: {
            host: 'https://api.cquotient.com',
            einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            // This differs from the siteId in commerceAPIConfig for testing purposes
            siteId: 'aaij-MobileFirst',
            isProduction: false
        }
    },
    externals: [],
    pageNotFoundURL: '/page-not-found',
    ssrEnabled: true,
    ssrOnly: ['ssr.js', 'ssr.js.map', 'node_modules/**/*.*'],
    ssrShared: [
        'static/ico/favicon.ico',
        'static/robots.txt',
        '**/*.js',
        '**/*.js.map',
        '**/*.json'
    ],
    ssrParameters: {
        ssrFunctionNodeVersion: '16.x',
        proxyConfigs: [
            {
                host: 'kv7kzm78.api.commercecloud.salesforce.com',
                path: 'api'
            },
            {
                host: 'zyfq-006.dx.commercecloud.salesforce.com',
                path: 'ocapi'
            }
        ]
    },
    stripePublicKey:
        'pk_test_51JUBJ2Dkv9ywW0vORN1zfG2bVpAsbWW03BPg8c8Bygaq1ZPJdypkRm3YOnlV8gBipZDmYjCrTS22WfqHYVNkBm4z00WHCABZkn',
}
