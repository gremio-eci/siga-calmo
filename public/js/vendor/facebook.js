define(['facebook_raw', 'config'], function (FB, config) {
    FB.init({
        appId:config.fb.appId,
        status:false,
        cookie:true,
        xfbml:true
    });

    // Modifying the main login function so that the user can
    // login multiple times in the main session without actually
    // logging out from Facebook
    var oldLogin = FB.login;
    FB.login = function (cb) {
        oldLogin.call(this, function (res) {
            if (res && res.status == 'connected' && res.authResponse) {
                var domains = window.location.hostname.split('.')
                    , domain = window.location.hostname;
                if (domains.length > 3) {
                    domain = '.' + domains.slice(domains.length - 3).join('.')
                }
//                document.cookie = 'fbm_' + config.fb.appId + '=base_domain=' + domain + '; Domain=' + domain;
//                document.cookie = 'fbsr_' + config.fb.appId + '=' + res.authResponse.signedRequest + '; Domain=' + domain;
            }
            cb.apply(this, arguments);
        });
    }

    return FB;
});
