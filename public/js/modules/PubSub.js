define(
    [
        'jquery',
        'lib/Backbone/Events'
    ],
    function ($, Events) {

        // Logger das mensagens PubSub
        var log = function (action, name, fullName) {
            if (!name) {
                name = action;
                action = '*';
            }
            if (!fullName) {
                fullName = name
            }
            var callbacks = [], callback;
            if (PubSub._callbacks && (callback = PubSub._callbacks[fullName])) {
                while ((callback = callback.next) && callback.next) { callbacks.push(callback.callback) }
            }
            console.log('[PubSub ' + (Date.create().format('{hh}:{mm}:{ss}')) + '] ' + callbacks.length + ' ' + action + ' ' + name);
        };

        var PubSub = {
            publish:function (name) {
                Events.trigger.apply(PubSub, arguments);
            },
            on:Events.on,
            off:Events.off
        };

        // Canal de comunicação de um módulo
        var Module = function (name, states, actions) {
            this.name = name;
            this.states = states || [];
            this.actions = actions || [];
        };
        Module.prototype = {

            // Retorna o nome completo para o estado
            _completeName:function (name) {
                return this.name + '/' + name;
            },

            // Dispara uma mensagem PubSub indicando o estado do módulo
            state:function (name) {
                arguments[0] = this._completeName(name);
                log('? ' + this.name + ':', name, arguments[0]);
                PubSub.off.apply(PubSub, arguments)
            },

            // Dispara uma mensagem PubSub indicando o estado do módulo
            _state:function (name) {
                PubSub.off.apply(PubSub, arguments)
            },

            react:function (name) {
                arguments[0] = this._completeName(name);
                PubSub.on.apply(PubSub, arguments)
            },

            demand:function (name) {
                log('! ' + this.name + ':', name);
                PubSub.publish.apply(PubSub, arguments)
            },

            _demand:function (name) {
                PubSub.publish.apply(PubSub, arguments)
            }

        };

        PubSub.Module = Module;
        return PubSub;
    }
)
;

