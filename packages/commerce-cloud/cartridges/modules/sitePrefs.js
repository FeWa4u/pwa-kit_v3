'use strict';

/**
 * sitePrefs helper module
 * @module sitePrefs
 */
module.exports = {
    /**
     * Get current site
     * @returns {dw.system.Site} - current site
     */
    getCurrentSite: function () {
        return require('dw/system/Site').getCurrent();
    },
    /**
     * Get current site ID
     * @returns {string} - current site ID
     */
    getSiteID: function () {
        return this.getCurrentSite().getID();
    },
    /**
     * Get site preference attribute value
     * @param {string} attrID - site preference attribute ID
     * @returns {string|null} - site preference attribute value
     */
    get: function (attrID) {
        var Logger = require('dw/system/Logger');

        var sitePrefs = this.getCurrentSite().getPreferences();
        var attrExists = sitePrefs.describe().getCustomAttributeDefinition(attrID);
        var attrValue = null;

        if (attrExists) {
            attrValue = sitePrefs.getCustom()[attrID];

            // Site Preference value is not empty
            if (attrValue === null) {
                Logger.error('Site Preferences: "{0}" value is not configured.', attrID);
            }
        } else {
            // Site Preference attribute definition is not configured on the instance
            Logger.error('Site Preferences: "{0}" attribute metadata is not configured.', attrID);
        }

        return attrValue;
    },
    /**
     * Parse site preference attribute value from a JSON string to an object
     * @param {string} attrID - site preference attribute ID
     * @returns {Object|null} - site preference JSON object
     */
    getJSON: function (attrID) {
        var Logger = require('dw/system/Logger');

        var attrValue = null;

        try {
            attrValue = JSON.parse(this.get(attrID));
        } catch (error) {
            // Site Preference value is not a parsable JSON
            Logger.error('Site Preferences: "{0}" value is not a parsable JSON.', attrID);
        }

        return attrValue;
    }
};
