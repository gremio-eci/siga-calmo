define(
    [
        'jquery',
        'lib/cols',

        // Modules
        'm/Router',
        'm/PubSub',
        'm/Session',

        'views/app'
    ],
    function ($, cols, Router, PubSub, Session, AppView) {

        var me = new PubSub.Module('app');
        var title = function (m) {
            document.title = (m + ' - SIGA helper')
        }

        //
        //  Routing
        //
        Router({
            'horarios/:id':function (id) {
                var courses = Session.get('courses')
                if (courses.sharedId == id) {
                    return;
                }
                courses.sharedId = id;
                courses.fetch({
                    url:'/api/courses/horario?id=' + id
                })
            }
        });

        var view;

        me.react('view', function (name, options) {
            view.showView(name, options);
        })

        return {
            initialize:function () {
                $(function () {
                    var view = new AppView({el:$('body')})
                })
                $.cookie.defaults = {expires:365 * 10}
                Router.initialize()
            }
        };
    }
);

