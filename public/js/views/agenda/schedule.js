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
                $name:'.name'
            },
            el:"<div class='schedule'></div>",
            template:'agenda/schedule',

            events:{
                'click':function () {
                    this.courses.remove(this.model)
                    _gaq.push(['_trackEvent', 'agenda/schedule', 'click'])
                },
                'mouseenter':function () {
                    $('[data-code=' + this.model.get('code') + ']').addClass('removing')
                },
                'mouseleave':function () {
                    $('[data-code=' + this.model.get('code') + ']').removeClass('removing')
                }
            },

            dayHeight:function () {
                return (this.day.end - this.day.start) * this.hourHeight / 100;
            },

            renderCourseState:function (course) {
                if (course.isConflictingDay(this.day)) {
                    this.$el.addClass('conflict')
                }
                if (course == this.course) {
                    this.$el.addClass('selected')
                }
            },

            handleCourseRemove:function (course) {
                if (course.isConflictingDay(this.day)) {
                    this.$el.removeClass('conflict')
                }
                if (course == this.model) {
                    this.$el.removeClass('selected')
                }
            },

            initialize:function () {
                var self = this;

                this.renderCourseState = this.renderCourseState.bind(this)

                this.$el.attr('data-code', this.model.get('code'))
                this.$el.height(this.dayHeight())
                this.$name.height(this.dayHeight() - 12)
                this.courses = this.session.get('courses');
                this.courses.on('add', this.renderCourseState)
                this.courses.on('remove', this.handleCourseRemove.bind(this))
                this.courses.on('reset', function(){
                    self.$el.removeClass('conflict selected')
                })

                this.courses.each(this.renderCourseState)
            },

            formattedTime:function () {
                var formatTime = function (t) {
                    t = t.toString();
                    return t.substr(0, t.length - 2) + ':' + t.substr(-2)
                }
                return formatTime(this.day.start) + ' - ' + formatTime(this.day.end)
            }



        })
    }
);
