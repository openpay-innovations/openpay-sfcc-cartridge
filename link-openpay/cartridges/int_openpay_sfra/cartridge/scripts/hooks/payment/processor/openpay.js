'use strict';

/* eslint-disable no-unused-vars*/

var collections = require('*/cartridge/scripts/util/collections');

var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');

/**
 * Verifies that entered Gift card has sufficient balance
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} billingData - the billing information
 * @return {Object} an object that contains error information
 */
function Handle(basket, billingData) {
    var currentBasket = basket;

    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments();

        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        var paymentInstrument = currentBasket.createPaymentInstrument(
            'OPENPAY', currentBasket.totalGrossPrice
        );
    });

    return { fieldErrors: {}, serverErrors: [], error: false };
}

/**
 * default hook if no payment processor is supported
 * @param {string} orderNumber - order no
 * @param {Object} paymentInstrument - payment instrument
 * @param {Object} paymentProcessor - payment prosessor
 * @return {Object} an object that contains error information
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;

    try {
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
        });
    } catch (e) {
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
    }

    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
