'use strict';

var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var iPlanid = require('~/cartridge/scripts/checkout/getPlanID');
var iPrepare = require('~/cartridge/scripts/checkout/prepareRedirect');

/**
 * Prepare handover url
 * @param {Object} currentBasket - cart object
 * @returns {string} - handover url
 */
function doOpenpayCheckout(currentBasket) {
    var plan = iPlanid.getPlanID(currentBasket);
    if (!plan.PlanID) {
        return { errorCode: plan.errorCode, errorMessage: plan.errorMessage };
    }
    var returnurl = URLUtils.https('OpenpayCheckout-Success');
    var handoverurl = iPrepare.prepare(plan.PlanID, plan.TransactionToken, returnurl);

    if (!handoverurl.error && handoverurl.HandoverURL) {
        return handoverurl.HandoverURL;
    }
    return '';
}

module.exports.doOpenpayCheckout = doOpenpayCheckout;
