'use strict';
/* eslint-disable no-undef */
/* eslint-disable consistent-return */
/* eslint-disable default-case */

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var StringWriter = require('dw/io/StringWriter');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');

/* Script Modules */
var ServiceUtils = require('*/cartridge/scripts/services/openpayHttpService');
var OpenpayUtils = require('*/cartridge/scripts/utils/openpayUtilities');
var sitePreferences = OpenpayUtils.getSitePreferencesUtilities();
var LogUtils = require('*/cartridge/scripts/utils/openpayLogUtils');
var Logger = LogUtils.getLogger('TransActions');

/**
 * Prepare request body to refund amount
 * @param {string} planID - openpay plan id
 * @param {number} amount - refund amount
 * @param {boolean} fullRefund - full refunded or not
 * @returns {string} - request body
 */
function getRequestBody(planID, amount, fullRefund) {
    var strwr = new StringWriter();
    var xsw = new XMLStreamWriter(strwr);
    // xsw.writeStartDocument();
    xsw.writeStartElement('OnlineOrderReduction');
    xsw.writeStartElement('JamAuthToken');
    xsw.writeCharacters(sitePreferences.getJamAuthToken());
    xsw.writeEndElement();
    xsw.writeStartElement('AuthToken');
    xsw.writeCharacters(sitePreferences.getAuthToken());
    xsw.writeEndElement();
    xsw.writeStartElement('PlanID');
    xsw.writeCharacters(planID);
    xsw.writeEndElement();
    xsw.writeStartElement('NewPurchasePrice');
    xsw.writeCharacters('0.00');
    xsw.writeEndElement();
    xsw.writeStartElement('ReducePriceBy');
    xsw.writeCharacters(amount);
    xsw.writeEndElement();
    xsw.writeStartElement('FullRefund');
    xsw.writeCharacters(fullRefund);
    xsw.writeEndElement();
    xsw.writeEndElement();

    xsw.close();
    return strwr.toString();
}

/**
 *Prepare request body to get openpay order status
 * @param {string} planID - openpay plan status
 * @returns {string} - request object
 */
function getRequestOrderStatusBody(planID) {
    var strwr = new StringWriter();
    var xsw = new XMLStreamWriter(strwr);

    xsw.writeStartElement('OnlineOrderStatus');
    xsw.writeStartElement('JamAuthToken');
    xsw.writeCharacters(sitePreferences.getJamAuthToken());
    xsw.writeEndElement();
    xsw.writeStartElement('AuthToken');
    xsw.writeCharacters(sitePreferences.getAuthToken());
    xsw.writeEndElement();
    xsw.writeStartElement('PlanID');
    xsw.writeCharacters(planID);
    xsw.writeEndElement();
    xsw.writeEndElement();

    xsw.close();
    return strwr.toString();
}


/**
 * Updates the plan status before refunding
 * @param {string} orderNo - order no
 * @param {string} planstatus - openpay plan status
 */
function updatePlanStatus(orderNo, planstatus) {
    var Order = OrderMgr.getOrder(orderNo);

    try {
        if (Order.custom.openpayPlanStatus && planstatus !== 'Active') {
            Transaction.begin();
            Order.custom.openpayPlanStatus = planstatus;
            Transaction.commit();
        }
    } catch (e) {
        Transaction.rollback();
        Logger.error('Exception occured while updating the order status after Refund Transaction' + e);
    }
}

/**
 * check Plan Status Action
 * @param {string} orderNo - order no
 * @param {string} planID - openpay pland id
 * @returns {Object} - succses true or false
 */
function checkPlanStatus(orderNo, planID) {
    var param = {};
    param.body = getRequestOrderStatusBody(planID);
    param.method = OpenpayUtils.METHODS.OnlineOrderStatus;
    var response = ServiceUtils.call(param);

    try {
        if (response.ok) {
            var parseXMLResponse = new XML(response.object);
            var status = parseXMLResponse.descendants('status');
            var planstatus = parseXMLResponse.descendants('PlanStatus');
            if (status.toString() === '0') {
                updatePlanStatus(orderNo, planstatus);
                return {
                    success: true,
                    planstatus: planstatus.toString()
                };
            }
            var reason = parseXMLResponse.descendants('reason');
            return {
                success: false,
                error: reason.toString()
            };
        }
    } catch (e) {
        Logger.error('Exception occured while calling the Service: ' + e);
    }
}

/**
 * Updates the order status and refund History
 * @param {string} orderNo - order no
 * @param {number} amount - refund amount
 * @param {string} planID - openpay plan id
 */
function updateOrderStatus(orderNo, amount, planID) {
    var Order = OrderMgr.getOrder(orderNo);
    var refundedHistory = [];
    var today = new Date();
    try {
        var planStatusResponse = checkPlanStatus(orderNo, planID);

        if (Order.custom.openpayRefundHistory) {
            refundedHistory = JSON.parse(Order.custom.openpayRefundHistory);
        }

        refundedHistory.push({ date: today.toString(), value: amount });
        Transaction.begin();

        switch (planStatusResponse && planStatusResponse.planstatus) {
            case 'Refunded':
            case 'Finished':
                Order.custom.openpayPlanStatus = planStatusResponse.planstatus;
                Order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
                Order.setStatus(Order.ORDER_STATUS_COMPLETED);
                break;
            case 'Active':
                Order.custom.openpayPlanStatus = planStatusResponse.planstatus;
                Order.setPaymentStatus(Order.PAYMENT_STATUS_PARTPAID);
                Order.setStatus(Order.ORDER_STATUS_OPEN);
                break;
        }

        Order.custom.openpayRefundHistory = JSON.stringify(refundedHistory);
        Transaction.commit();
    } catch (e) {
        Transaction.rollback();
        Logger.error('Exception occured while updating the order status after Refund Transaction' + e);
    }
}


/**
 * Refund action
 * @param {string} orderNo - order no
 * @param {string} planID - openpay plan id
 * @param {number} amount - refund amount
 * @param {boolean} fullRefund - full refund or not
 * @returns {Object} - success true or false
 */
function refund(orderNo, planID, amount, fullRefund) {
    var param = {};
    param.body = getRequestBody(planID, amount, fullRefund);
    param.method = OpenpayUtils.METHODS.OnlineOrderReduction;
    var response = ServiceUtils.call(param);

    try {
        if (response.ok) {
            var parseXMLResponse = new XML(response.object);
            var status = parseXMLResponse.descendants('status');
            if (status.toString() === '0') {
                updateOrderStatus(orderNo, amount, planID);
                return {
                    success: true
                };
            }
            var reason = parseXMLResponse.descendants('status') + ':' + parseXMLResponse.descendants('reason');
            return {
                success: false,
                error: reason.toString()
            };
        }
    } catch (e) {
        Logger.error('Exception occured while calling the Service: ' + e);
    }
}


module.exports = {
    refund: refund
};
