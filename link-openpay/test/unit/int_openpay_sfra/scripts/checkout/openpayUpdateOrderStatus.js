/* eslint-disable new-cap */

var chai = require('chai');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var argsMock = {
    paymentDelayMinutes: 30
};

describe('openpayUpdateOrderStatus', function () {
    var openpayUpdateOrderStatus = proxyquire('../../../../../cartridges/int_openpay_sfra/cartridge/scripts/checkout/openpayUpdateOrderStatus', {
        'dw/order/OrderMgr': {
            searchOrders: function () {
                return {
                    hasNext: function () {},
                    next: function () {},
                    close: function () {}
                };
            },
            placeOrder: function () {
                return {
                    custom: {
                        openpayOrderStatus: '',
                        openpayPlanStatus: ''
                    }
                };
            },
            failOrder: function () {}
        },
        'dw/order/Order': {
            ORDER_STATUS_CREATED: 'created'
        },
        'dw/system/Transaction': {
            begin: function () {},
            wrap: function (arg) {
                arg();
            },
            commit: function () {}
        },
        '~/cartridge/scripts/checkout/sendStatus': {
            sendStatus: function () {
                return {
                    Success: true,
                    orderStatus: 'approved',
                    planStatus: 'active'
                };
            }
        }
    });
    it('should return openpay update order status', function () {
        var res = openpayUpdateOrderStatus.Run(argsMock);
        expect(res).to.be.equal(undefined);
    });
});
