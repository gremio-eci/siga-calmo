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
                $details:'.details'
            },
            template:'sidebar/course',
            el:'<li class=course></li>',
            events:{
                'click':function () {
                    if (this.courses.isConflicting(this.model)) {
                        _gaq.push(['_trackEvent', 'sidebar/schedule', 'click', 'conflict'])
                        return alert('Este horário entra em conflito com outro, por favor remova os horários para prosseguir.')
                    }
                    if (this.courses.has(this.model)) {
                        _gaq.push(['_trackEvent', 'sidebar/schedule', 'click', 'remove'])
                        this.courses.remove(this.model)
                    } else {
                        _gaq.push(['_trackEvent', 'sidebar/schedule', 'click', 'add'])
                        this.courses.add(this.model)
                        $('[data-code=' + this.model.get('code') + ']').addClass('removing')
                    }
                },
                'mouseenter':function (ev) {
                    me._demand('agenda/preview', this.model)
                    this.showDetails.delay(600)
                    if (this.courses.has(this.model)) {
                        $('[data-code=' + this.model.get('code') + ']').addClass('removing')
                    }
                },
                'mouseleave':function (ev) {
                    me._demand('agenda/preview/clear')
                    this.showDetails.cancel()
//                    this.hideDetails.delay(200)
                    if (this.courses.has(this.model)) {
                        $('[data-code=' + this.model.get('code') + ']').removeClass('removing')
                    }
                }
            },

            _mouseIsOver:false,
            renderConflict:function () {
                if (this.courses.isConflicting(this.model)) {
                    this.$el.addClass('conflict')
                } else {
                    this.$el.removeClass('conflict')
                }
                if (this.courses.has(this.model)) {
                    this.$el.addClass('selected')
                } else {
                    this.$el.removeClass('selected')
                }
            },

            showDetails:function () {
                if (this.$details.is(":visible")) return;
                this.$details.slideDown()
            },

            hideDetails:function () {
                if (!this.$details.is(":visible")) return;
                this.$details.slideUp()
            },

            initialize:function () {

                this.$el.attr('data-code', this.model.get('code'))
                this.showDetails = this.showDetails.bind(this)
                this.hideDetails = this.hideDetails.bind(this)

                this.courses = this.session.get('courses');
                this.courses.on('all', this.renderConflict.bind(this))
                this.renderConflict()
            }

        })
    }
);
