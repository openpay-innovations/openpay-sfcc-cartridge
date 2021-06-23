'use strict';

/**
 * @namespace Checkout
 */

var server = require('server');
var checkout = module.superModule;
server.extend(checkout);

// Main entry point for Checkout
/**
 * Checkout-Begin : The Checkout-Begin endpoint will render the checkout shipping page for both guest shopper and returning shopper
 * @name Base/Checkout-Begin
 * @function
 * @memberof Checkout
 * @param {middleware} - server.middleware.https
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - csrfProtection.generateToken
 * @param {querystringparameter} - stage - a flag indicates the checkout stage
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.append(
    'Begin',
    server.middleware.https,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Site = require('dw/system/Site');

        var showOpenpay = Site.current.getCustomPreferenceValue('isOpenpayEnabled');
        var openpayMinPrice = Site.current.getCustomPreferenceValue('openpayMinPrice');
        var openpayMaxPrice = Site.current.getCustomPreferenceValue('openpayMaxPrice');
        var basketObject = BasketMgr.getCurrentBasket();
        var totalPrice = Number(basketObject.totalGrossPrice);

        if (showOpenpay) {
            if (openpayMinPrice) {
                openpayMinPrice = parseFloat(openpayMinPrice, 10);

                if (openpayMinPrice > totalPrice) {
                    showOpenpay = false;
                }

                if (openpayMaxPrice) {
                    openpayMaxPrice = parseFloat(openpayMaxPrice, 10);

                    if (openpayMaxPrice > openpayMinPrice && openpayMaxPrice < totalPrice) {
                        showOpenpay = false;
                    }
                }
            } else if (openpayMaxPrice) {
                openpayMaxPrice = parseFloat(openpayMaxPrice, 10);

                if (openpayMaxPrice < totalPrice) {
                    showOpenpay = false;
                }
            }
        }

        // Openpay content
        var sitePreferences = require('*/cartridge/scripts/utils/openpayUtilities').getSitePreferencesUtilities();

        var isOpenpayEnabled;

        if (sitePreferences) {
            isOpenpayEnabled = sitePreferences.isOpenpayEnabled();
        }

        res.render('checkout/checkout', {
            showOpenpay: showOpenpay,
            isOpenpayEnabled: isOpenpayEnabled
        });

        return next();
    }
);


module.exports = server.exports();
