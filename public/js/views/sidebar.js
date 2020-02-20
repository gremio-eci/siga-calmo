define(
    [
        'jquery',
        'underscore',
        'View',
        'm/PubSub',
        'lib/utils',
        'views/sidebar/courses',
        'views/sidebar/programs'
    ],
    function ($, _, View, PubSub, utils, CoursesView, ProgramsView) {

        var me = new PubSub.Module('views/sidebar')

        var view = View.extend({

            $els:{
            },
            template:'sidebar',

            events:{
            },
            initialize:function () {
                var self = this;
                this.$('.accordion').accordion({
                    header:'input[type=button]',
                    active: parseInt($.cookie('sidebar-tab')) || 0,
                    fillSpace:true,
                    changestart:function (ev, ui) {
                        $.cookie('sidebar-tab', ui.options.active)
                        _gaq.push(['_trackEvent', 'sidebar', 'tab', ui.newHeader.value])
                    }
                })
                this.removable(new CoursesView({el:this.$('.course-search')}))
                this.removable(new ProgramsView({el:this.$('.program-search')}))

                me.react('view', function (name) {
                    self.$('.accordion').accordion('activate', name)
                })
            }

        })

        return view;
    }
);
