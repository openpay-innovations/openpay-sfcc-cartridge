var chai = require('chai');
var sinonChai = require('sinon-chai');
var sinon = require('sinon');
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var orderMock = {
    custom: {
        openpayPlanID: 'openpayPlanID'
    }
};

describe('sendStatus', function () {
    var sendStatus = proxyquire('../../../../../cartridges/int_openpay_sfra/cartridge/scripts/checkout/sendStatus', {
        'dw/io/StringWriter': sinon.stub(),
        'dw/io/XMLStreamWriter': function () {
            return {
                writeStartElement: sinon.stub(),
                writeCharacters: sinon.stub(),
                writeEndElement: sinon.stub(),
                close: sinon.stub()
            };
        },
        '*/cartridge/scripts/utils/openpayUtilities': {
            getSitePreferencesUtilities: function () {
                return {
                    getJamAuthToken: function () {
                        return 'jamAuthToken';
                    }
                };
            },
            METHODS: {
                NewOnlineOrder: 'NewOnlineOrder'
            }
        },
        '*/cartridge/scripts/services/openpayHttpService': {
            call: function () {
                return {
                    ok: true,
                    object: {}
                };
            }
        }
    });
    global.XML = function () {
        return {
            descendants: function () {
                return '0';
            }
        };
    };
    it('should update openpay status in sfcc order', function () {
        var res = sendStatus.sendStatus(orderMock);
        expect(res.Success).to.be.equal(true);
    });
});
