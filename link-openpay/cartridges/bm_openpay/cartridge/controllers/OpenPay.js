'use strict';
/* global request */
/**
 * Controller for Order management pages
 *
 */

/* API Includes */
var ISML = require('dw/template/ISML');

/**
 * OpenPay Order List page
 */
function orderList() {
    var pageSize = request.httpParameterMap.pagesize.value;
    var pageNumber = request.httpParameterMap.pagenumber.value;
    var orderNumber = request.httpParameterMap.ordernumber.value || '';

    pageSize = pageSize ? parseInt(pageSize, 10) : 10;
    pageNumber = pageNumber ? parseInt(pageNumber, 10) : 1;

    var orderListResponse = require('~/cartridge/scripts/getOrders').output({
        pageSize: pageSize,
        pageNumber: pageNumber,
        orderNumber: orderNumber
    });

    ISML.renderTemplate('application/orderlist', orderListResponse);
}

/**
 * OpenPay Order Details page
 */
function orderDetails() {
    var resourceHelper = require('~/cartridge/scripts/util/resource');
    var utils = require('*/cartridge/scripts/utils/openpayUtilities');

    ISML.renderTemplate('application/orderdetails', {
        resourceHelper: resourceHelper,
        utils: utils
    });
}

/*
 * Exposed web methods
 */

orderList.public = true;
orderDetails.public = true;

exports.OrderList = orderList;
exports.OrderDetails = orderDetails;
