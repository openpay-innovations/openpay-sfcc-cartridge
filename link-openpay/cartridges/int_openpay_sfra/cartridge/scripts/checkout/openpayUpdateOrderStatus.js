'use strict';

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');

/**
 * Gets Payment Allowed Time from job parameter
 * @param {Object} args - Job parameters
 * @returns {Date} payment allowed time
 */
function getPaymentAllowedTime(args) {
    var paymentDelayMinutes = args.paymentDelayMinutes;

    paymentDelayMinutes = isNaN(paymentDelayMinutes) ? 30 : parseInt(paymentDelayMinutes, 10);

    var now = new Date();
    var oneMinute = 60000;
    var paymentInterval = oneMinute * paymentDelayMinutes;
    var paymentAllowedTime = new Date(now.getTime() - paymentInterval);

    return paymentAllowedTime;
}

/**
 * Function called by job - OpenPayUpdateOrderStatus
 * @param {Object} args - Job parameters
 */
function updateOrderStatus(args) {
    var paymentAllowedTime = getPaymentAllowedTime(args);
    var pendingOrder;

    var orderQuery = 'custom.openpayIsOpOrder = true AND creationDate < {0} AND (status = ' + Order.ORDER_STATUS_CREATED + " OR custom.openpayOrderStatus = 'Pending' OR custom.openpayOrderStatus = '' OR custom.openpayOrderStatus = NULL)";
    var pendingOrders = OrderMgr.searchOrders(orderQuery, null, paymentAllowedTime);

    while (pendingOrders.hasNext()) {
        pendingOrder = pendingOrders.next();

        var iStatus = require('~/cartridge/scripts/checkout/sendStatus');
        var statusresponse = iStatus.sendStatus(pendingOrder.custom.openpayPlanID);

        if (statusresponse && statusresponse.Success
            && statusresponse.orderStatus && statusresponse.orderStatus.toLowerCase() === 'approved'
            && statusresponse.planStatus && statusresponse.planStatus.toLowerCase() === 'active') {
            Transaction.begin();
            OrderMgr.placeOrder(pendingOrder);
            pendingOrder.setPaymentStatus(pendingOrder.PAYMENT_STATUS_PAID);
            pendingOrder.custom.openpayOrderStatus = statusresponse.orderStatus;
            pendingOrder.custom.openpayPlanStatus = statusresponse.planStatus;
            Transaction.commit();
        } else {
            Transaction.begin();
            OrderMgr.failOrder(pendingOrder);
            pendingOrder.custom.openpayOrderStatus = 'Cancelled';
            pendingOrder.custom.openpayPlanStatus = 'Cancelled';
            Transaction.commit();
        }
    }
    pendingOrders.close();
}

/*
 * Web exposed methods
 */
exports.Run = updateOrderStatus;
