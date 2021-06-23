'use strict';
/* eslint-disable no-undef*/
/* eslint-disable consistent-return */
/* eslint-disable no-alert */

(function ($) {
    var trans = {
        init: function () {
            var refundHistoryString = $('input[name=refundHistory]').val();
            var refundedAmount = 0;
            var total = parseFloat($('input[name=total]').val());
            var refundHistory;

            if (refundHistoryString !== '') { refundHistory = JSON.parse(refundHistoryString); }
            if (refundHistory) {
                $.each(refundHistory, function (index, refundAmount) {
                    refundedAmount += parseFloat(refundAmount.value);
                });
            }
            var maxRefundAmount = total - refundedAmount;
            $('[name=amount]').val(maxRefundAmount.toFixed(2));
            $('[name=amount]').attr('data-refundhistorytotal', refundedAmount.toFixed(2));

            if ($('.openpay-module .operations-holder').length) {
                this.transOperationsEvents();
            }
        },
        transOperationsEvents: function () {
            $('.transaction-actions').on('click', function () {
                $('.operations-holder').toggle();
            });
            $('.operations-holder button').on('click', function () {
                var button = $(this);
                var buttonLabel = button.text();
                var orderno = $('input[name=orderno]').val();
                var planID = $('input[name=planID]').val();
                var amount = parseFloat($('input[name=amount]').val());
                var total = parseFloat($('input[name=total]').val());
                var refundHistoryTotal = parseFloat($('input[name=amount]').data('refundhistorytotal'));
                var fullRefund = false;
                var url;
                var postData;

                if (amount <= 0.0 || amount > total) {
                    $('.operations-holder .error').text(Resources.INVALID_REFUND_AMOUNT);
                    return false;
                }
                if (refundHistoryTotal) {
                    if ((refundHistoryTotal + amount).toFixed(2) > total) {
                        var maxRefundAmount = total - refundHistoryTotal;
                        $('.operations-holder .error').text(Resources.MAXIMUM_REFUND_AMOUNT + maxRefundAmount.toFixed(2));
                        return false;
                    }
                }
                if ((refundHistoryTotal + amount) === total) {
                    fullRefund = true;
                }

                $('.operations-holder .error').text('');
                url = Urls.operationActions;
                postData = {
                    orderno: orderno,
                    planID: planID,
                    amount: amount,
                    fullRefund: fullRefund
                };

                button.prop('disabled', true);
                button.text(Resources.TRANSACTION_PROCESSING);

                $.post(url, postData, function (data) {
                    var result = data ? data : {};

                    button.prop('disabled', false);
                    button.text(buttonLabel);

                    if (result && result.success && result.planstatus && result.planstatus !== 'Active') {
                        $('.operations-holder .error').html('The status of this plan is ' + result.planstatus + '. Please contact <br/>Openpay support.');
                        return false;
                    } else if (result && result.success) {
                        alert(Resources.TRANSACTION_SUCCESS);
                        window.location.reload();
                    } else {
                        alert(Resources.TRANSACTION_FAILED + result.error);
                    }
                })
                    .fail(function () {
                        $('.operations-holder .error').html('Currently service is not available, please contact <br/>Openpay OR try after sometime');
                        return false;
                    });
            });
        }
    };

    // initialize app
    $(document).ready(function () {
        trans.init();
    });
}(jQuery));
