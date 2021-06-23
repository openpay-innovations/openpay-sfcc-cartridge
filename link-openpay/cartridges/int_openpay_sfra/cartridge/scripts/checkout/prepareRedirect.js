'use strict';

/* eslint-disable no-param-reassign */

 /* API Includes */
var URLUtils = require('dw/web/URLUtils');

/* Script Includes */
var sitePreferencesUtilities = require('*/cartridge/scripts/utils/openpayUtilities').getSitePreferencesUtilities();
var hourl = sitePreferencesUtilities.getHandoverUrl();

/**
 *Prepare redirect url
 * @param {string} planid - plan id
 * @param {string} transactiontoken - transaction token
 * @param {string} returnurl - return url
 * @returns {Object} handover url object
 */
function prepare(planid, transactiontoken, returnurl) {
    if (!planid) {
        return { error: true };
    }
    // building parameter
    var jamCallbackURL = returnurl.toString();
    var jamPlanID = planid;

    var jamFailURL = URLUtils.https('OpenpayCheckout-Failure').toString();
    var jamCancelURL = URLUtils.https('OpenpayCheckout-Failure').toString();

    var handoverurl = hourl;
    handoverurl += '?TransactionToken=' + encodeURIComponent(transactiontoken);
    handoverurl += '&JamCallbackURL=' + encodeURIComponent(jamCallbackURL);
    handoverurl += '&JamCancelURL=' + encodeURIComponent(jamCancelURL);
    handoverurl += '&JamFailURL=' + encodeURIComponent(jamFailURL);
    handoverurl += '&JamPlanID=' + encodeURIComponent(jamPlanID);

    return { HandoverURL: handoverurl };
}

module.exports = {
    prepare: prepare
};
