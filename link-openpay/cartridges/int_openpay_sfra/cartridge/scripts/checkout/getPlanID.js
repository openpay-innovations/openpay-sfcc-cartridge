'use strict';
/* eslint-disable no-undef */

/* API Includes */
var URLUtils = require('dw/web/URLUtils');
var StringWriter = require('dw/io/StringWriter');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');

/* Scripts Include */
var OpenUtils = require('*/cartridge/scripts/utils/openpayUtilities');
var sitePreferences = OpenUtils.getSitePreferencesUtilities();
var ServiceUtils = require('*/cartridge/scripts/services/openpayHttpService');
var token = sitePreferences.getJamAuthToken();

/**
 * Get plan ID and transaction token
 * @param {Object} currentBasket - cart object
 * @returns {Object} - response object
 */
function getPlanID(currentBasket) {
    if (!currentBasket) {
        return { error: true };
    }

    var orderamount;
    if (currentBasket.totalGrossPrice.available) {
        orderamount = currentBasket.totalGrossPrice.value;
    } else {
        orderamount = currentBasket.getAdjustedMerchandizeTotalPrice(true).add(currentBasket.giftCertificateTotalPrice).value;
    }

    var jamCallbackURL = URLUtils.https('OpenpayCheckout-Success').toString();
    var jamFailURL = URLUtils.https('OpenpayCheckout-Failure').toString();
    var jamCancelURL = URLUtils.https('OpenpayCheckout-Failure').toString();
    var jamFirstName = currentBasket.getBillingAddress().firstName;
    var jamFamilyName = currentBasket.getBillingAddress().lastName;
    var email = currentBasket.customerEmail;
    var defaultShipment = currentBasket.getDefaultShipment();
    var shipment = currentBasket.getShipment(defaultShipment.getID());
    var shippingAddress = shipment.getShippingAddress();
    var delAddress1 = shippingAddress.address1 ? shippingAddress.address1 : '-';
    var delAddress2 = shippingAddress.address2 ? shippingAddress.address2 : '-';
    var delSuburb = shippingAddress.city ? shippingAddress.city : '-';
    var delState = shippingAddress.stateCode ? shippingAddress.stateCode : '-';
    var delPostCode = shippingAddress.postalCode ? shippingAddress.postalCode : '-';
    var phoneNumber = currentBasket.getBillingAddress().phone ? currentBasket.getBillingAddress().phone : '-';
    var resAddress1 = currentBasket.getBillingAddress().getAddress1() ? currentBasket.getBillingAddress().getAddress1() : '-';
    var resAddress2 = currentBasket.getBillingAddress().getAddress2() ? currentBasket.getBillingAddress().getAddress2() : '-';
    var resSuburb = currentBasket.getBillingAddress().getCity() ? currentBasket.getBillingAddress().getCity() : '-';
    var resState = currentBasket.getBillingAddress().getStateCode() ? currentBasket.getBillingAddress().getStateCode() : '-';
    var resPostCode = currentBasket.getBillingAddress().getPostalCode() ? currentBasket.getBillingAddress().getPostalCode() : '-';

    var strwr = new StringWriter();
    var xsw = new XMLStreamWriter(strwr);

    xsw.writeStartElement('NewOnlineOrder');
    xsw.writeStartElement('JamAuthToken');
    xsw.writeCharacters(token);
    xsw.writeEndElement();
    xsw.writeStartElement('CallbackURL');
    xsw.writeCharacters(jamCallbackURL);
    xsw.writeEndElement();
    xsw.writeStartElement('CancelURL');
    xsw.writeCharacters(jamCancelURL);
    xsw.writeEndElement();
    xsw.writeStartElement('FailURL');
    xsw.writeCharacters(jamFailURL);
    xsw.writeEndElement();
    xsw.writeStartElement('PurchasePrice');
    xsw.writeCharacters(orderamount.toFixed(2));
    xsw.writeEndElement();
    xsw.writeStartElement('PlanCreationType');
    xsw.writeCharacters('Pending');
    xsw.writeEndElement();
    xsw.writeStartElement('FirstName');
    xsw.writeCharacters(jamFirstName);
    xsw.writeEndElement();
    xsw.writeStartElement('FamilyName');
    xsw.writeCharacters(jamFamilyName);
    xsw.writeEndElement();
    xsw.writeStartElement('Email');
    xsw.writeCharacters(email);
    xsw.writeEndElement();
    xsw.writeStartElement('PhoneNumber');
    xsw.writeCharacters(phoneNumber);
    xsw.writeEndElement();
    xsw.writeStartElement('ResAddress1');
    xsw.writeCharacters(resAddress1);
    xsw.writeEndElement();
    xsw.writeStartElement('ResAddress2');
    xsw.writeCharacters(resAddress2);
    xsw.writeEndElement();
    xsw.writeStartElement('ResSuburb');
    xsw.writeCharacters(resSuburb);
    xsw.writeEndElement();
    xsw.writeStartElement('ResState');
    xsw.writeCharacters(resState);
    xsw.writeEndElement();
    xsw.writeStartElement('ResPostCode');
    xsw.writeCharacters(resPostCode);
    xsw.writeEndElement();
    xsw.writeStartElement('DelAddress1');
    xsw.writeCharacters(delAddress1);
    xsw.writeEndElement();
    xsw.writeStartElement('DelAddress2');
    xsw.writeCharacters(delAddress2);
    xsw.writeEndElement();
    xsw.writeStartElement('DelSuburb');
    xsw.writeCharacters(delSuburb);
    xsw.writeEndElement();
    xsw.writeStartElement('DelState');
    xsw.writeCharacters(delState);
    xsw.writeEndElement();
    xsw.writeStartElement('DelPostCode');
    xsw.writeCharacters(delPostCode);
    xsw.writeEndElement();
    xsw.writeStartElement('BasketData');
    var productLineItems = currentBasket.getProductLineItems();

    for (var i = 0; i < productLineItems.length; i++) {
        var lineItem = productLineItems[i];
        xsw.writeStartElement('BasketItem');
        xsw.writeStartElement('ItemName');
        xsw.writeCharacters(lineItem.productName);
        xsw.writeEndElement();
        xsw.writeStartElement('ItemCode');
        xsw.writeCharacters(lineItem.productID);
        xsw.writeEndElement();
        xsw.writeStartElement('ItemRetailUnitPrice');
        xsw.writeCharacters(lineItem.product.priceModel.price.value);
        xsw.writeEndElement();
        xsw.writeStartElement('ItemQty');
        xsw.writeCharacters(lineItem.quantityValue);
        xsw.writeEndElement();
        xsw.writeStartElement('ItemRetailCharge');
        xsw.writeCharacters(lineItem.proratedPrice.value);
        xsw.writeEndElement();
        xsw.writeEndElement();
    }
    xsw.writeEndElement();
    xsw.writeStartElement('TenderTypes');
    xsw.writeStartElement('TenderType');
    xsw.writeStartElement('Tender');
    xsw.writeCharacters('Openpay');
    xsw.writeEndElement();
    xsw.writeStartElement('Amount');
    xsw.writeCharacters(orderamount);
    xsw.writeEndElement();
    xsw.writeEndElement();
    xsw.writeEndElement();
    xsw.writeEndElement();

    xsw.close();

    var param = {};
    param.body = strwr.toString();
    param.method = OpenUtils.METHODS.NewOnlineOrder;
    var response = ServiceUtils.call(param);

    if (response.ok) {
        var parseXMLResponse = new XML(response.object);
        var status = parseXMLResponse.descendants('status');

        if (status.toString() !== '0') {
            return { PlanID: null, TransactionToken: null, errorCode: parseXMLResponse.descendants('status'), errorMessage: parseXMLResponse.descendants('reason') };
        }

        var planid = parseXMLResponse.descendants('PlanID').toString();
        var transactiontoken = parseXMLResponse.descendants('TransactionToken').toString();

        if (planid !== '') {
            return { PlanID: planid, TransactionToken: transactiontoken };
        }
    }

    return { PlanID: null, TransactionToken: null };
}

module.exports = {
    getPlanID: getPlanID
};
