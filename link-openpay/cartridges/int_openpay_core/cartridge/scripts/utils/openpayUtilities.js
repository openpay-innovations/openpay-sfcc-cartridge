'use strict';
/* eslint-disable no-undef */
/* eslint-disable no-useless-escape */

var Site = require('dw/system/Site');
var Class = require('~/cartridge/scripts/utils/class').Class;

// Site Preferences Utilities
var createOpenpaySitePreferencesUtilities = Class.extend({
    isOpenpayEnabled: function () {
        return Site.getCurrent().getCustomPreferenceValue('isOpenpayEnabled');
    },
    getOpenpayMinPrice: function () {
        return Site.getCurrent().getCustomPreferenceValue('openpayMinPrice') || '3';
    },
    getOpenpayMaxPrice: function () {
        return Site.getCurrent().getCustomPreferenceValue('openpayMaxPrice') || '10000';
    },
    getAuthToken: function () {
        return Site.getCurrent().getCustomPreferenceValue('openpayJamAuthToken');
    },
    getJamAuthToken: function () {
        return Site.getCurrent().getCustomPreferenceValue('openpayMerchantID') + '|' + this.getAuthToken();
    },
    getHandoverUrl: function () {
        return Site.getCurrent().getCustomPreferenceValue('openpayHandoverURL');
    },
    getUserAgent: function () {
        return Site.getCurrent().getCustomPreferenceValue('openpayUserAgent') || 'Openpay SFRA Cartridge/1.0.0 (Salesforce Commerce Cloud/1.0.0)';
    }
});

var getSitePreferencesUtilities = function () {
    var SitePreferences = createOpenpaySitePreferencesUtilities;
    return new SitePreferences();
};

var OpenpayUtilities = {
	/**
	 * Services Urls, mapped with business manager.
	 */
    SERVICES: {
        ServiceID: Site.getCurrent().getCustomPreferenceValue('openpayServiceID')
    },
	/**
	 * Service methods name.
	 */
    METHODS: {
        NewOnlineOrder: 'NewOnlineOrder',
        OnlineOrderReduction: 'OnlineOrderReduction',
        OnlineOrderStatus: 'OnlineOrderStatus',
        OnlineOrderCapturePayment: 'OnlineOrderCapturePayment'
    },
    CONFIG: {
        SERVICE_ENCODING_UTF_8: 'UTF-8',
        SERVICE_METHOD_POST: 'POST',
        SERVICE_HEADER_CONTENT_TYPE: 'Content-Type',
        SERVICE_CONTENT_TYPE_XML: 'application/xml;charset=UTF-8',
        SERVICE_USER_AGENT: 'User-Agent'
    }
};

/**
 * Hide sensitive details like customer details on request due to security reasons
 * @param {Object} request - request object
 * @returns {Object} toBeFilteredReq - filtered log data
 */
var filterLogData = function (request) {
    var xmlWithNs = request.toString();
    var nameSpacedXml = /xmlns\:i/.test(xmlWithNs) ? xmlWithNs.replace('xmlns:i', 'xmlns') : xmlWithNs;
    var serviceResponseXml = new XML(nameSpacedXml);
    var serviceCopyObj = serviceResponseXml.copy();

    if (serviceCopyObj.elements('JamAuthToken').toString()) {
        serviceCopyObj.replace('JamAuthToken', '***');
    }
    if (serviceCopyObj.elements('CallbackURL').toString()) {
        serviceCopyObj.replace('CallbackURL', '***');
    }
    if (serviceCopyObj.descendants('FirstName').toString()) {
        serviceCopyObj.replace('FirstName', '***');
    }
    if (serviceCopyObj.descendants('FamilyName').toString()) {
        serviceCopyObj.replace('FamilyName', '***');
    }
    if (serviceCopyObj.descendants('Email').toString()) {
        serviceCopyObj.replace('Email', '***');
    }
    if (serviceCopyObj.descendants('PhoneNumber').toString()) {
        serviceCopyObj.replace('PhoneNumber', '***');
    }
    if (serviceCopyObj.descendants('ResAddress1').toString()) {
        serviceCopyObj.replace('ResAddress1', '***');
    }
    if (serviceCopyObj.descendants('ResAddress2').toString()) {
        serviceCopyObj.replace('ResAddress2', '***');
    }
    if (serviceCopyObj.descendants('ResSuburb').toString()) {
        serviceCopyObj.replace('ResSuburb', '***');
    }
    if (serviceCopyObj.descendants('ResState').toString()) {
        serviceCopyObj.replace('ResState', '***');
    }
    if (serviceCopyObj.descendants('ResPostCode').toString()) {
        serviceCopyObj.replace('ResPostCode', '***');
    }
    if (serviceCopyObj.descendants('DelAddress1').toString()) {
        serviceCopyObj.replace('DelAddress1', '***');
    }
    if (serviceCopyObj.descendants('DelAddress2').toString()) {
        serviceCopyObj.replace('DelAddress2', '***');
    }
    if (serviceCopyObj.descendants('DelSuburb').toString()) {
        serviceCopyObj.replace('DelSuburb', '***');
    }
    if (serviceCopyObj.descendants('DelState').toString()) {
        serviceCopyObj.replace('DelState', '***');
    }

    if (serviceCopyObj.descendants('DelPostCode').toString()) {
        serviceCopyObj.replace('DelPostCode', '***');
    }

    return serviceCopyObj;
};

var sortByDate = function (ar, fieldName) {
    var data = ar.concat();
    data.sort(function (a, b) { return new Date(b[fieldName]) - new Date(a[fieldName]); });
    return data;
};


module.exports = OpenpayUtilities;
module.exports.getSitePreferencesUtilities = getSitePreferencesUtilities;
module.exports.filterLogData = filterLogData;
module.exports.sortByDate = sortByDate;
