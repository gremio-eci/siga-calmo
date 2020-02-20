define(
    [
        'jquery',
        'underscore',
        'Collection',

        // Modules
        'm/Router',
        'm/PubSub',

        'View',
        'Model'
    ],
    function ($, _, Collection, Router, PubSub, View, Model) {

        var me = new PubSub.Module('session')
            , courses = Collection.create('Courses', {comparator:function (model) { return model.get('code') }});
        courses.url = '/courses/sets';

        var session = new Model({
            courses:courses
        })

        session.restoreCourses = function () {
            var stored = $.parseJSON($.cookie('my-courses'));
            if (stored instanceof Array && stored.length) {
                return courses.fetch({
                    data:{
                        q:stored
                    }
                }).success(function () {
                        if (session.savedHorarioId()) {
                            Router.navigate('/horarios/' + session.savedHorarioId(), false)
                        }
                    })
            } else if (courses.length) {
                courses.reset()
            }
        }

        session.saveCourses = function () {
            $.cookie('my-courses', courses.serialize())
        }

        session.savedCourses = function () {
            return $.parseJSON($.cookie('my-courses'))
        }

        session.clearCourses = function () {
            Router.navigate('/')
            if (courses.sharedId) {
                courses.sharedId = null;
            }
            courses.reset();
        }

        session.isSaved = function () {
            return $.cookie('my-courses') == courses.serialize()
        }

        session.savedHorarioId = function (v) {
            return v !== undefined ? $.cookie('my-courses-id', v) : $.cookie('my-courses-id')
        }

        var DEFAULT_COLORS = ['FFFFCC', 'E6FFCC', 'CCFFE6', 'FFFF8F', 'FFE6CC',
            'A7E7D0', 'D7F4EA', 'F3D9EF', 'D3EAB4', 'C2E2F4', 'A2E2F4']
            .map(function (co) { return "#" + co })
            .randomize();

        var colors = _.clone(DEFAULT_COLORS)
            , updateModel = function (model) {
                if (!colors.length) {
                    colors = _.clone(DEFAULT_COLORS)
                }
                model.set('-color', colors.pop())
                model.set('-selected', true)
            }

        courses.on('add', updateModel)
        courses.on('remove', function (model) {
            colors.push(model.get('-color'))
        })
        courses.on('reset', function () {
            this.models.each(updateModel)
        })

        courses.on('all', function () {
            if (courses.sharedId) {
                courses.sharedId = null;
            }
        })


        session.restoreCourses()

        Model.prototype.session = Collection.prototype.session = View.prototype.session = session;

        return session;
    }
);

