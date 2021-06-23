'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockCollections = require('../../../../../../mocks/util/collections');
var ArrayList = require('../../../../../../mocks/dw.util.Collection.js');

var paymentInformationMock = {
    cardNumber: {
        value: '41111111111111111',
        htmlName: '4111111111111111'
    },
    securityCode: {
        value: '123',
        htmlName: '123'
    },
    expirationMonth: {
        value: '12',
        htmlName: '12'
    },
    expirationYear: {
        value: '2030',
        htmlName: '2030'
    },
    cardType: {
        value: 'visa',
        htmlName: 'visa'
    }
};

var currentBasket = {
    totalGrossPrice: '$200.00',
    paymentInstrument: {
        paymentTransaction: {
            setAmount: function (orderTotal) { // eslint-disable-line no-unused-vars
            }
        }
    },
    billingAddress: {
        fullName: 'John Doe'
    },
    getPaymentInstruments: function () { return [{}]; },
    createPaymentInstrument: function () {
        return {
            setCreditCardHolder: function () {},
            setCreditCardNumber: function () {},
            setCreditCardType: function () {},
            setCreditCardExpirationMonth: function () {},
            setCreditCardExpirationYear: function () {},
            setCreditCardToken: function () {}
        };
    },
    removePaymentInstrument: sinon.spy()
};

describe('basic_credit', function () {
    var error = false;
    var basicCredit = proxyquire('../../../../../../../cartridges/int_openpay_sfra/cartridge/scripts/hooks/payment/processor/basic_credit', {
        'dw/web/Resource': {
            msg: function () {
                return 'someString';
            },
            msgf: function () {
                return 'someString';
            }
        },
        'dw/order/PaymentInstrument': {},
        'dw/order/PaymentMgr': {
            getPaymentCard: function () {
                return {
                    verify: function () {
                        return {
                            error: error,
                            items: new ArrayList([
                                {
                                    code: '111'
                                }
                            ])
                        };
                    }
                };
            }
        },
        'dw/order/PaymentStatusCodes': {
            CREDITCARD_INVALID_CARD_NUMBER: true,
            CREDITCARD_INVALID_EXPIRATION_DATE: true,
            CREDITCARD_INVALID_SECURITY_CODE: true
        },
        'dw/system/Transaction': {
            wrap: function (arg) { arg(); }
        },
        '*/cartridge/scripts/util/collections': {
            forEach: mockCollections.forEach
        }
    });

    it('should handle credit card order process', function () {
        var res = basicCredit.Handle(currentBasket, paymentInformationMock);  // eslint-disable-line new-cap
        expect(res.error).to.be.false; // eslint-disable-line
    });

    it('should return error if credit card information invalid', function () {
        error = true;
        var res = basicCredit.Handle(currentBasket, paymentInformationMock);  // eslint-disable-line new-cap
        expect(res.error).to.be.true; // eslint-disable-line
    });

    it('should test authorize success', function () {
        var paymentInstrument = {
            paymentTransaction: {
                setTransactionID: function (setTransactionID) {}, // eslint-disable-line no-unused-vars
                setPaymentProcessor: function (paymentProcessor) {} // eslint-disable-line no-unused-vars

            }
        };
        var res = basicCredit.Authorize('123', paymentInstrument, {}); // eslint-disable-line new-cap
        expect(res.error).to.be.false; // eslint-disable-line
    });

    it('should test authorize failure', function () {
        var paymentInstrument = {
            paymentTransaction: {
                setTransactionID: function (setTransactionID) { throw new Error(); }, // eslint-disable-line no-unused-vars
                setPaymentProcessor: function (paymentProcessor) { throw new Error(); } // eslint-disable-line no-unused-vars

            }
        };
        var res = basicCredit.Authorize('123', paymentInstrument, {}); // eslint-disable-line new-cap
        expect(res.error).to.be.true; // eslint-disable-line
    });
});
