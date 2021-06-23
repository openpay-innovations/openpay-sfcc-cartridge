'use strict';

/**
 * Controller for OpenPay payment
 *
 */
/* global request, response */
/* eslint-disable default-case*/

var LogUtils = require('*/cartridge/scripts/utils/openpayLogUtils');
var logger = LogUtils.getLogger('Operations');

/**
 * redirects to specific actions
 */
function performAction() {
    var params = request.httpParameterMap;
    var orderNo = params.isParameterSubmitted('orderno') ? params.orderno.value : '';
    var planID = params.isParameterSubmitted('planID') ? params.planID.value : '';
    var amount = params.isParameterSubmitted('amount') ? params.amount.value : '';
    var fullRefund = params.isParameterSubmitted('fullRefund') ? params.fullRefund.value : '';
    var action = 'refund';

    if (orderNo === '' || planID === '' || amount === '' || fullRefund === '') {
        logger.error('Exception in Operation-performAction: Some parameters are empty');
        return;
    }
    var transActions = require('bm_openpay/cartridge/scripts/transActions');
    var result;
    switch (action) {
        case 'refund':
            result = transActions.refund(orderNo, planID, amount, fullRefund);
            break;
    }

    var r = require('~/cartridge/scripts/util/response');

    r.renderJSON(result);
}

/*
 * Exposed web methods
 */

performAction.public = true;

exports.Action = performAction;
