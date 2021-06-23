/**
*
*	Makes request
*   @param args {Object}
*   @return {Object} parsedResponse
*/

/* API Includes */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/* Script Includes */
var ServiceUtils = require('*/cartridge/scripts/utils/openpayUtilities');
var sitePreferences = ServiceUtils.getSitePreferencesUtilities();
var serviceID = ServiceUtils.SERVICES.ServiceID;

module.exports = LocalServiceRegistry.createService(serviceID, {

    createRequest: function (service, params) {
        service.setRequestMethod(ServiceUtils.CONFIG.SERVICE_METHOD_POST || 'POST');
        service.addHeader(ServiceUtils.CONFIG.SERVICE_HEADER_CONTENT_TYPE, ServiceUtils.CONFIG.SERVICE_CONTENT_TYPE_XML);
        service.setEncoding(ServiceUtils.CONFIG.SERVICE_ENCODING_UTF_8);
        service.setURL(service.configuration.credential.URL + params.method);
        service.addHeader(ServiceUtils.CONFIG.SERVICE_USER_AGENT, sitePreferences.getUserAgent().toString());
        return params.body;
    },
    parseResponse: function (service, responseObject) {
        return responseObject.text;
    },
    getRequestLogMessage: function (request) {
        return ServiceUtils.filterLogData(request);
    },
    getResponseLogMessage: function (response) {
        return ServiceUtils.filterLogData(response.text);
    }
});
