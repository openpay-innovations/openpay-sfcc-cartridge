var chai = require('chai');
var sinonChai = require('sinon-chai');
var sinon = require('sinon');
var expect = chai.expect;
chai.use(sinonChai);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var orderMock = {
    totalGrossPrice: {
        available: true,
        value: 100
    },
    getOrderNo: function () {
        return '0000000000';
    },
    getBillingAddress: function () {
        return {
            firstName: 'firstName',
            lastName: 'lastName',
            phone: '8888888888',
            getAddress1: function () {
                return 'address1';
            },
            getAddress2: function () {
                return 'address2';
            },
            getCity: function () {
                return 'city';
            },
            getStateCode: function () {
                return 'staeCode';
            },
            getPostalCode: function () {
                return 'postalCode';
            }
        };
    },
    getCustomerEmail: function () {
        return 'emalid';
    },
    getDefaultShipment: function () {
        return {
            getID: function () {
                return 'defaultShipmentID';
            }
        };
    },
    getShipment: function () {
        return {
            getShippingAddress: function () {
                return {
                    address1: 'address1',
                    city: 'city',
                    stateCode: 'stateCode',
                    postalCode: 'postalCode'

                };
            }
        };
    },
    getProductLineItems: function () {
        return [{
            productName: 'productName',
            productID: 'productID',
            product: {
                priceModel: {
                    price: {
                        value: 100
                    }
                }
            },
            quantityValue: 1,
            proratedPrice: {
                value: 90
            }
        }];
    }
};

describe('getPlanID', function () {
    var getPlanID = proxyquire('../../../../../cartridges/int_openpay_sfra/cartridge/scripts/checkout/getPlanID', {
        'dw/web/URLUtils': {
            https: function () {
                return 'urls';
            }
        },
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
    it('should return plan id', function () {
        var res = getPlanID.getPlanID(orderMock);
        expect(res.PlanID).to.be.equal('0');
    });
});
