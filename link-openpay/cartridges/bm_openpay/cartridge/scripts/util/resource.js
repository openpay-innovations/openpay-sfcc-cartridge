/* eslint-disable no-unused-vars*/
/**
 * Resource helper
 */
function ResourceHelper() {}

/**
 * Get the client-side resources of a given page
 * @param {string} pageContext - page context
 * @returns {Object} An objects key key-value pairs holding the resources
 */
ResourceHelper.getResources = function (pageContext) {
    var Resource = require('dw/web/Resource');

    // application resources
    var resources = {

        // Transaction operation messages
        SHOW_ACTIONS: Resource.msg('operations.show.actions', 'openpay', null),
        HIDE_ACTIONS: Resource.msg('operations.hide.actions', 'openpay', null),
        CHOOSE_ACTIONS: Resource.msg('operations.actions', 'openpay', null),
        CHOOSE_ORDERS: Resource.msg('operations.orders', 'openpay', null),
        TRANSACTION_SUCCESS: Resource.msg('transaction.success', 'openpay', null),
        TRANSACTION_FAILED: Resource.msg('transaction.failed', 'openpay', null),
        BULK_AUTHORIZE_FAILED: Resource.msg('bulk.authorize.failed', 'openpay', null),
        TRANSACTION_PROCESSING: Resource.msg('operations.wait', 'openpay', null),
        INVALID_COMPLETE_AMOUNT: Resource.msg('complete.amount.validation', 'openpay', null),
        INVALID_REFUND_AMOUNT: Resource.msg('refund.amount.validation', 'openpay', null),
        MAXIMUM_REFUND_AMOUNT: Resource.msg('maximum.refund.amount', 'openpay', null),
        MAXIMUM_COMPLETE_AMOUNT: Resource.msg('maximum.complete.amount', 'openpay', null)

    };
    return resources;
};

/**
 * Get the client-side URLs of a given page
 * @param {string} pageContext - page context
 * @returns {Object} An objects key key-value pairs holding the URLs
 */
ResourceHelper.getUrls = function (pageContext) {
    var URLUtils = require('dw/web/URLUtils');

    // application urls
    var urls = {
        operationActions: URLUtils.url('Operations-Action').toString()
    };
    return urls;
};

module.exports = ResourceHelper;
