'use strict';
/* eslint-disable consistent-return */
/* eslint-disable eqeqeq */

/**
 * Controller for Openpay payment
 */

var server = require('server');

/* API Includes */
var BasketMgr = require('dw/order/BasketMgr');
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var Logger = require('dw/system/Logger');
var StringWriter = require('dw/io/StringWriter');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');

/* Script Modules */
var iStatus = require('~/cartridge/scripts/checkout/sendStatus');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

/**
 * Sends request to OnlineOrderCapturePayment API
 * @param {Object} order - order object
 * @returns {Object} - success object
 */
function sendOnlineOrderCapturePayment(order) {
    if (!order) {
        return;
    }

    var OpenUtils = require('*/cartridge/scripts/utils/openpayUtilities');
    var sitePreferences = OpenUtils.getSitePreferencesUtilities();
    var ServiceUtils = require('*/cartridge/scripts/services/openpayHttpService');
    var token = sitePreferences.getJamAuthToken();
    var strwr = new StringWriter();
    var xsw = new XMLStreamWriter(strwr);

    xsw.writeStartElement('OnlineOrderCapturePayment');
    xsw.writeStartElement('JamAuthToken');
    xsw.writeCharacters(token);
    xsw.writeEndElement();
    xsw.writeStartElement('PlanID');
    xsw.writeCharacters(order.custom.openpayPlanID);
    xsw.writeEndElement();
    xsw.writeStartElement('RetailerOrderNo');
    xsw.writeCharacters(order.orderNo);
    xsw.writeEndElement();
    xsw.writeEndElement();

    xsw.close();

    var param = {};
    param.body = strwr.toString();
    param.method = OpenUtils.METHODS.OnlineOrderCapturePayment;
    var response = ServiceUtils.call(param);

    if (!response.ok) {
        Logger.error('Error on calling OnlineOrderCapturePayment API: ' + response.errorMessage);

        return {
            Success: false
        };
    }

    return {
        Success: true
    };
}

server.post('IsOpenpay',
    server.middleware.https,
    function (req, res, next) {
        var currentBasket = BasketMgr.getCurrentBasket();
        var openpayInstruments = currentBasket.getPaymentInstruments('OPENPAY');
        var paymentInstruments = currentBasket.getPaymentInstruments();

        res.json({
            isOpenpay: openpayInstruments.length > 0 && openpayInstruments.length === paymentInstruments.length,
            resource: {
                pleaseWait: Resource.msg('openpay.please.wait', 'openpay', null),
                redirectMessage: Resource.msg('openpay.redirect.message', 'openpay', null)
            }
        });

        return next();
    });

server.post('Redirect', server.middleware.https, function (req, res, next) {
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            cartUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }


    if (req.session.privacyCache.get('fraudDetectionStatus')) {
        res.json({
            error: true,
            cartError: true,
            cartUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        return next();
    }

    var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
    if (validationOrderStatus.error) {
        res.json({
            error: true,
            errorMessage: validationOrderStatus.message
        });
        return next();
    }

    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress === null) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
        });
        return next();
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'billingAddress'
            },
            errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
        });
        return next();
    }

    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Re-validates existing payment instruments
    var validPayment = COHelpers.validatePayment(req, currentBasket);
    if (validPayment.error) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'paymentInstrument'
            },
            errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
        });
        return next();
    }

    // Re-calculate the payments.
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
    if (calculatedPaymentTransactionTotal.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    var redirectUrl = require('~/cartridge/scripts/checkout/openpayCheckoutHelpers').doOpenpayCheckout(currentBasket);

    if (redirectUrl === '' || redirectUrl.errorCode != null) {
        var errorMessage;
        if (redirectUrl.errorCode != null) {
            errorMessage = 'Error ' + redirectUrl.errorCode + ' : ' + redirectUrl.errorMessage;
        } else {
            errorMessage = Resource.msg('error.technical', 'checkout', null);
        }
        res.json({
            error: true,
            errorMessage: errorMessage,
            placeOrderMessage: Resource.msg('button.place.order', 'checkout', null)
        });
    } else {
        res.json({
            error: false,
            redirectUrl: redirectUrl
        });
    }

    return next();
});

/**
 * Continue Openpay Checkout after redirect from Openpay server on success payment
 */
server.get('Success', server.middleware.https, function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var order;
    var statusresponse;
    if (req.querystring.status === 'LODGED') {
        statusresponse = iStatus.sendStatus(req.querystring.planid);
        var openpayOrderTotal = statusresponse.purchasePrice.toFixed(2);
        var orderamount;
        if (currentBasket.totalGrossPrice.available) {
            orderamount = currentBasket.totalGrossPrice.value;
        } else {
            orderamount = currentBasket.getAdjustedMerchandizeTotalPrice(true).add(currentBasket.giftCertificateTotalPrice).value;
        }
        if (orderamount != openpayOrderTotal) {
            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'openpayError', Resource.msg('openpay.cart.update.message', 'openpay', null)));
            return next();
        }
        order = COHelpers.createOrder(currentBasket);
        if (order) {
            Transaction.begin();
            order.custom.openpayPlanID = req.querystring.planid;
            order.custom.openpayIsOpOrder = true;
            Transaction.commit();
        } else {
            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'openpayError', Resource.msg('error.technical', 'checkout', null)));
            return next();
        }
        if (statusresponse && statusresponse.Success) {
            // Handles payment authorization
            var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);

            if (handlePaymentResult.error) {
                res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'openpayError', Resource.msg('error.technical', 'checkout', null)));
                return next();
            }

            var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
            if (fraudDetectionStatus.status === 'fail') {
                Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

                // fraud detection failed
                req.session.privacyCache.set('fraudDetectionStatus', true);
                res.redirect(URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode));
                return next();
            }

            // Places the order
            var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
            if (placeOrderResult.error) {
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order, false);
                });
                res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'openpayError', Resource.msg('error.technical', 'checkout', null)));
                return next();
            }

            var captureStatus = sendOnlineOrderCapturePayment(order);

            if (captureStatus.Success) {
                COHelpers.sendConfirmationEmail(order, req.locale.id);
            }

            statusresponse = iStatus.sendStatus(req.querystring.planid);

            if (statusresponse && statusresponse.Success) {
                Transaction.begin();
                if (statusresponse.orderStatus === 'Approved' && statusresponse.planStatus === 'Active') {
                    order.setPaymentStatus(order.PAYMENT_STATUS_PAID);
                }
                order.custom.openpayOrderStatus = statusresponse.orderStatus;
                order.custom.openpayPlanStatus = statusresponse.planStatus;
                Transaction.commit();
            }

            res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken));
        } else {
            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'openpayError', Resource.msg('error.technical', 'checkout', null)));
            return next();
        }
    } else if (req.querystring.status === 'FAILURE' || req.querystring.status === 'CANCELLED') {
        Transaction.begin();
        OrderMgr.failOrder(order);
        order.custom.openpayOrderStatus = 'Cancelled';
        order.custom.openpayPlanStatus = 'Cancelled';
        Transaction.commit();

        res.redirect(URLUtils.url('Home-Show'));
    }
    next();
});

/**
 * Return URL for cancel and fail
 */
server.get('Failure', server.middleware.https, function (req, res, next) {
    res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'openpayError', Resource.msg('openpay.transaction.cancel.message', 'openpay', null)));
    next();
});


module.exports = server.exports();
