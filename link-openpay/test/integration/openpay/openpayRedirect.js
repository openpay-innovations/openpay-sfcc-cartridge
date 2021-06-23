var assert = require('chai').assert;
var request = require('request-promise');
var expect = require('chai').expect;
var config = require('../it.config');

describe('Redirect to openpay', function () {
    this.timeout(80000);

    var qty1 = 1;
    var variantPid1 = '013742000443M';

    var cookieJar = request.jar();
    var cookie;
    var cookieString;
    var myRequest = {
        url: '',
        method: 'POST',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    before(function () {
        myRequest.url = config.baseUrl + '/Cart-AddProduct';
        myRequest.form = {
            pid: variantPid1,
            quantity: qty1
        };

        return request(myRequest)
                .then(function (response) {
                    assert.equal(response.statusCode, 200, 'Expected statusCode to be 200.');
                    cookieString = cookieJar.getCookieString(myRequest.url);
                })
                .then(function () {
                    cookie = request.cookie(cookieString);
                    cookieJar.setCookie(cookie, myRequest.url);
                });
    });

    it('should redirect to openpay', function () {
        myRequest.url = config.baseUrl + '/OpenpayCheckout-Redirect';
        return request(myRequest)
            .then(function (response) {
                var bodyAsJson = JSON.parse(response.body);
                expect(bodyAsJson.action).to.be.equal('OpenpayCheckout-Redirect');
            })
            .catch(function (e) {
                console.log(e.message); // eslint-disable-line no-console
            });
    });
});
