var chai = require('chai');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('prepareRedirect', function () {
    var prepareRedirect = proxyquire('../../../../../cartridges/int_openpay_sfra/cartridge/scripts/checkout/prepareRedirect', {
        'dw/system/Transaction': {
            begin: function () {},
            commit: function () {}
        },
        'dw/web/URLUtils': {
            https: function () {
                return {
                    toString: function () {}
                };
            },
            encodeURIComponent: function (args) {
                return args;
            }
        },
        '*/cartridge/scripts/utils/openpayUtilities': {
            getSitePreferencesUtilities: function () {
                return {
                    getHandoverUrl: function () {
                        return 'handoverurl';
                    }
                };
            }
        }
    });
    it('should preapere handover url', function () {
        var planid = 'planid';
        var transactiontoken = 'transactiontoken';
        var returnurl = 'returnurl';
        var res = prepareRedirect.prepare(planid, transactiontoken, returnurl);
        expect(res.HandoverURL).to.be.equal('handoverurl?TransactionToken=transactiontoken&JamCallbackURL=returnurl&JamCancelURL=undefined&JamFailURL=undefined&JamPlanID=planid');
    });
});
