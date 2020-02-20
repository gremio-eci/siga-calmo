define(
    [
        'jquery',
        'underscore',
        'View',
        'm/PubSub',
        'm/Router',
        'm/Session',
        'Collection'
    ],
    function ($, _, View, PubSub, Router, Session, Collection) {

        var me = new PubSub.Module('views/app')

        return View.extend({

            $els:{
                $hours:'.hours .count',
                $credits:'.credits .count',
                $courses:'.courses'
            },

            template:'totals',
            beforeBinding:function () {
                this.collection = this.session.get('courses')
            },

            initialize:function () {
                var self = this;
                this.collection.on('all', this.renderCounts.bind(this))
                this.renderCounts();
            },

            getCounts:function () {
                var counts = {
                    credits:0,
                    hours:0,
                    courses:this.collection.length
                }

                this.collection.each(function (course) {
                    counts.credits += course.get('credits') || 0;
                    course.get('days').each(function (day) {
                        counts.hours += (day.end - day.start) / 100
                    })
                })

                counts.hours = Math.round(counts.hours);
                return counts;
            },

            renderCounts:function () {
                var counts = this.getCounts()
                    , self = this

                this.$hours.text(counts.hours)
                this.$credits.text(counts.credits)

                this.$('.clear-courses').live('click', function () {
                    self.session.clearCourses()
                    _gaq.push(['_trackEvent', 'actions', 'clear-courses'])
                })

                this.$courses.html(
                    (counts.courses == 0 ?
                        'Você não está cursando <span class=count>nenhuma</span> matéria.'
                        :
                        (counts.courses == 1 ?
                            'Você está cursando <span class=count>1</span> matéria.'
                            : 'Você está cursando <span class=count>' + counts.courses + '</span> matérias.'
                            ))
                        + ( counts.courses > 0 ? ' <a class="clear-courses">[ limpar horários ]</a>' : '' )
                )
            }

        })
    }
);
