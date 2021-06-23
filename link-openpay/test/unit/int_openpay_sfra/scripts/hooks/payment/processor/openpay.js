'use strict';

/* eslint-disable no-unused-vars */
/* eslint-disable new-cap */
/* eslint-disable no-unused-expressions */

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockCollections = require('../../../../../../mocks/util/collections');

describe('openpay', function () {
    var openpay = proxyquire('../../../../../../../cartridges/int_openpay_sfra/cartridge/scripts/hooks/payment/processor/openpay', {
        '*/cartridge/scripts/util/collections': {
            forEach: mockCollections.forEach
        },
        'dw/system/Transaction': {
            wrap: function (arg) {
                arg();
            }
        },
        'dw/web/Resource': {
            msg: function () {
                return 'someString';
            }
        }
    });
    it('should handle openpay order process', function () {
        var removeFn = sinon.spy();
        var createFn = sinon.spy();
        var currentBasket = {
            totalGrossPrice: '$200.00',
            paymentInstrument: {
                paymentTransaction: {
                    setAmount: function (orderTotal) {
                    }
                }
            },
            getPaymentInstruments: function () { return [{}]; },
            createPaymentInstrument: createFn,
            removePaymentInstrument: removeFn
        };

        openpay.Handle(currentBasket);

        expect(removeFn).to.have.been.calledWith({});
        expect(createFn).to.have.been.calledWith('OPENPAY', currentBasket.totalGrossPrice);
    });
    it('should test authorize success', function () {
        var paymentInstrument = {
            paymentTransaction: {
                setTransactionID: function (setTransactionID) {},
                setPaymentProcessor: function (paymentProcessor) {}

            }
        };

        var res = openpay.Authorize('123', paymentInstrument, {});
        expect(res.error).to.be.equal(false);
    });
    it('should test authorize failure', function () {
        var paymentInstrument = {
            paymentTransaction: {
                setTransactionID: function (setTransactionID) { throw new Error(); },
                setPaymentProcessor: function (paymentProcessor) { throw new Error(); }

            }
        };

        var res = openpay.Authorize('123', paymentInstrument, {});
        expect(res.error).to.be.true;
    });
});
