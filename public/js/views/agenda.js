define(
    [
        'jquery',
        'underscore',
        'View',
        'm/PubSub',
        'views/agenda/schedule'
    ],
    function ($, _, View, PubSub, ScheduleView) {

        var me = new PubSub.Module('agenda')

        return View.extend({

            $els:{
                $hours:'.hours',
                $schedules:'.schedules'
            },
            el:"<div></div>",
            template:'agenda',


            events:{
            },

            startTime:600,
            endTime:2400,
            hourHeight:24,

            initialize:function () {
                var self = this;
                (this.startTime / 100).upto(this.endTime / 100).each(function (i) {
                    self.$hours.append('<div>' + i + ':00</div>')
                })
                this.$schedules.height((this.endTime - this.startTime) * this.hourHeight / 100 + 10)

                this.views = {};
                this.previewCourse = null;

                // Events
                this.collection.on('add', this.renderCourse.bind(this))
                this.collection.on('remove', this.unrenderCourse.bind(this))
                this.collection.on('reset', this.handleReset.bind(this))
                this.collection.each(this.renderCourse.bind(this))

                me.react('preview', this.preview.bind(this))
                me.react('preview/clear', this.preview.bind(this, null))
            },

            preview:function (course) {
                if (this.previewCourse) this.unrenderCourse(this.previewCourse)
                if (!course) return;
                this.previewCourse = course;
                this.renderCourse(course)
            },

            renderCourse:function (course) {
                var self = this;

                if (this.views[course.cid]) {
                    if (this.previewCourse == course) {
                        this.views[course.cid].each(function (view) {
                            view.$el.removeClass('preview')
                        })
                        this.previewCourse = null;
                        return
                    }
                    throw 'Course already rendered';
                }

                this.views[course.cid] = [];
                course.get('days').each(function (day) {
                    var view = new ScheduleView({
                        model:course, day:day,
                        appendTo:self.$schedules.eq(day.weekday),
                        hourHeight:self.hourHeight
                    })
                    self.views[course.cid].push(view)
                    view.$el.css('top', self.dayOffsetTop(day))
                    if (course == self.previewCourse) {
                        view.$el.addClass('preview')
                    }
                })
            },


            dayOffsetTop:function (day) {
                return (day.start - this.startTime) * this.hourHeight / 100;
            },

            unrenderCourse:function (course) {
                if (this.views[course.cid]) {
                    this.views[course.cid].each(function (view) {
                        view.remove();
                    })
                    delete this.views[course.cid];
                }
            },

            handleReset:function () {
                for (var cid in this.views) {
                    this.views[cid].each(function (view) {
                        view.remove();
                    })
                }
                this.views = {}

                this.collection.each(this.renderCourse.bind(this))
            }

        })
    }
);
