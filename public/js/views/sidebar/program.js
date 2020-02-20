define(
    [
        'jquery',
        'underscore',
        'View',
        'm/PubSub'
    ],
    function ($, _, View, PubSub) {

        var me = new PubSub.Module('views/sidebar/course')

        return View.extend({

            $els:{
            },
            template:'sidebar/program',
            el:'<li class=program title="Clique para ver as matérias do curso"></li>',
            tooltip:null,
            events:{
                'click':function () {
                    _gaq.push(['_trackEvent', 'sidebar/program', 'click', 'details'])
                    me.demand('views/sidebar/programs/details', this.model)
                }
            },

            initialize:function () {
                this.model.on('all', this.renderTemplate)
                this.$el.addClass(this.model.get('endSemester') != '9999/9' ? 'outdated' : 'recent')
            }

        })
    }
);
