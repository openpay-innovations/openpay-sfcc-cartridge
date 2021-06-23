var chai = require('chai');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var orderMock = {
    orderNo: '000000000',
    getOrderToken: function () {
        return 'ordertoken';
    }
};

describe('openpayCheckoutHelpers', function () {
    var openpayCheckoutHelpers = proxyquire('../../../../../cartridges/int_openpay_sfra/cartridge/scripts/checkout/openpayCheckoutHelpers', {
        'dw/web/URLUtils': {
            https: function () {}
        },
        '~/cartridge/scripts/checkout/getPlanID': {
            getPlanID: function () {
                return {
                    PlanID: 'planid',
                    TransactionToken: 'transactiontoken'
                };
            }
        },
        '~/cartridge/scripts/checkout/prepareRedirect': {
            prepare: function () {
                return {
                    HandoverURL: 'handoverurl'
                };
            }
        }
    });
    it('should return handover url', function () {
        var res = openpayCheckoutHelpers.doOpenpayCheckout(orderMock);
        expect(res).to.be.equal('handoverurl');
    });
});
