define(
    [
        'jquery',
        'underscore',
        'View',
        'm/PubSub'
    ],
    function ($, _, View, PubSub) {

        var me = new PubSub.Module('views/')

        return View.extend({
            $els:{

            },
            el:"<div class='program-tooltip'></div>",
            template:'program-tooltip/index',

            events:{
            },

            initialize:function () {
                this.$el.appendTo('body')
            }

        })
    }
);
