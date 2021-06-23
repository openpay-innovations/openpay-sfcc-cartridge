'use strict';
/* eslint-disable consistent-return */
/* eslint-disable no-undef */

/* API Includes */
var StringWriter = require('dw/io/StringWriter');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');

/* Script Includes */
var OpenUtils = require('*/cartridge/scripts/utils/openpayUtilities');
var sitePreferences = OpenUtils.getSitePreferencesUtilities();
var ServiceUtils = require('*/cartridge/scripts/services/openpayHttpService');
var token = sitePreferences.getJamAuthToken();

/**
 * Sends DW order status to Openpay
 * @param {Object} planId - planId object
 * @returns {Object} response object
 */
function sendStatus(planId) {
    if (!planId) return;

    var strwr = new StringWriter();
    var xsw = new XMLStreamWriter(strwr);

    // xsw.writeStartDocument();
    xsw.writeStartElement('OnlineOrderStatus');
    xsw.writeStartElement('JamAuthToken');
    xsw.writeCharacters(token);
    xsw.writeEndElement();
    xsw.writeStartElement('PlanID');
    xsw.writeCharacters(planId);
    xsw.writeEndElement();
    xsw.writeEndElement();
    // xsw.writeEndDocument();

    xsw.close();

    var param = {};
    param.body = strwr.toString();
    param.method = OpenUtils.METHODS.OnlineOrderStatus;
    var response = ServiceUtils.call(param);

    if (response.ok) {
        var parseXMLResponse = new XML(response.object);
        var orderStatus = parseXMLResponse.descendants('OrderStatus');
        var planStatus = parseXMLResponse.descendants('PlanStatus');
        var purchasePrice = parseXMLResponse.descendants('PurchasePrice');
        var status = parseXMLResponse.descendants('status');

        if (status.toString() !== '0') {
            var reason = parseXMLResponse.descendants('reason');
            return {
                Success: false,
                Status: status.toString(),
                Reason: reason.toString()
            };
        }
        return {
            Success: true,
            orderStatus: orderStatus.toString(),
            planStatus: planStatus.toString(),
            purchasePrice: parseFloat(purchasePrice, 10)
        };
    }

    return null;
}

module.exports = {
    sendStatus: sendStatus
};
