define([
    'jquery',
    'underscore',
    'lib/Backbone/History',
    'lib/Backbone/Router'
], function ($, _, History, BackboneRouter) {

    if (History.instance) {
        throw "We can't start the Router module after history has been started."
    }

    var defaultCallbacks = []
    // Applying default route callbacks
        , applyDefault = function (fragment) {
            defaultCallbacks.each(function (callback) {
                return callback(fragment);
            })
        };

    History.instance = new History;
    var router = new BackboneRouter;

    History.applyDefault = applyDefault;

    var Router = function () {
        if (Object.isFunction(arguments[0])) {
            Router.default.apply(Router, arguments);
        } else {
            Router.register.apply(Router, arguments);
        }
        return Router;
    };

    Object.merge(Router, {

        route:function () {
            router.route.apply(router, arguments);
            return this;
        },

        register:function (routes) {
            for (var route in routes) {
                router.route(route, route, routes[route]);
            }
            return this;
        },

        default:function (callback) {
            defaultCallbacks.add(callback);
        },

        back:function (options) {
            History.instance.back(_.extend({silent:true}, options))
        },

        instance:History.instance,

        bind:function (cb) {
            History.instance.on('route', cb);
        },

        unbind:function () {
            History.instance.off('route', cb);
        },

        // Save a fragment into the hash history, or replace the URL state if the
        // 'replace' option is passed. You are responsible for properly URL-encoding
        // the fragment in advance.
        //
        // The options object can contain `trigger: true` if you wish to have the
        // route callback be fired (not usually desirable), or `replace: true`, if
        // you wish to modify the current URL without adding an entry to the history.
        navigate:function (fragment, trigger) {
            if (fragment[0] == '/') fragment = '/' + fragment;
            History.instance.navigate(fragment, {trigger:trigger !== false });
            return this;
        },

        initialize:function () {
            History.instance.start();
        }

    });

    return Router;

});
