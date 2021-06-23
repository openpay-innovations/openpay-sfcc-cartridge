'use strict';
/* eslint-disable no-shadow */
/* eslint-disable new-cap */
/* eslint-disable no-unused-vars */

var openpay = {
    config: {

    },
    init: function () {
        $('button.place-order').on('click', function (e) {
            var isOpenpayRouteURL = $('.openpay-isopenpayURL').val();
            $('.alert.error-message p.error-message-text').remove();
            $.ajax({
                url: isOpenpayRouteURL,
                type: 'post',
                success: function (data) {
                    if (data && data.isOpenpay !== undefined && data.isOpenpay) {
                        // payment method is openpay
                        $('button.place-order').text(data.resource.pleaseWait);
                        var redirectMessage = data.resource.redirectMessage;
                        var redirectRouteURL = $('.openpay-redirectURL').val();
                        // get redirect url
                        $.ajax({
                            url: redirectRouteURL,
                            type: 'post',
                            success: function (data) {
                                var defer = $.Deferred();
                                $('.alert.error-message').html('<p class="error-message-text"></p>');
                                $('.alert.error-message p.error-message-text').text(redirectMessage);

                                if (data.error) {
                                    if (data.cartError) {
                                        window.location.href = data.cartUrl;
                                        defer.reject();
                                    } else {
                                        // go to appropriate stage and display error message
                                        defer.reject(data);
                                        $('button.place-order').text(data.placeOrderMessage);
                                        $('.error-message').show();
                                        $('.error-message-text').text(data.errorMessage);
                                    }
                                } else {
                                    window.location.href = data.redirectUrl;
                                    defer.resolve(data);
                                }
                            }
                        });
                    }
                }
            });
        });

        $('.openpay-checkout-widget .openpay-button').on('click', function () {
            $('button.submit-payment').trigger('click');
        });

        $('ul.payment-options a.nav-link').on('click', function () {
            var paymentMethod = $(this).closest('li.nav-item').data('method-id');
            $('input[name$=_paymentMethod]').val(paymentMethod);
        });
    }
};

module.exports = openpay;
