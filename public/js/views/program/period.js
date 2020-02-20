define(
    [
        'jquery',
        'underscore',
        'View',
        'm/PubSub',
        'lib/utils'
    ],
    function ($, _, View, PubSub, utils) {

        var me = new PubSub.Module('views/')

        return View.extend({

            $els:{
                $courses:'.period-courses',
                $expansion:'.expansion',
                $loading:'.loading',
                $header:'.header',
                $selectedCount:'.count .selected',
                $message:'.message'
            },
            el:"<li name='program-period'></li>",
            template:'program/period',

            events:{
                'click .header':function () {
                    if (!this.period.length) {
                        _gaq.push(['_trackEvent', 'sidebar/period', 'click', 'empty'])
                        return
                    }
                    _gaq.push(['_trackEvent', 'sidebar/period', 'click', this.$expansion.is(':visible')])
                    this.toggle();
                }
            },
            toggle:function () {
                if (this.collection.inSync()) return;
                if (this.$expansion.is(':visible')) {
                    this.$expansion.slideUp();
                    this.$header.removeClass('selected')
                } else {
                    var self = this;
                    if (!this.collection.length) {
                        this.$loading.show();
                        this.collection.fetch()
                            .success(function () {
                                self.$loading.hide();
                                self.$expansion.delay(50).slideDown()
                                self.$header.addClass('selected')
                                self.collection.each(function (course) {
                                    delete self.missingCodes[course.get('code')]
                                })
                                self.render()
                            })
                    } else {
                        this.$expansion.slideDown();
                        this.$header.addClass('selected')
                    }
                }
            },

            render:function () {
                var c = 0
                    , self = this
                if (this.collection) {
                    this.collection.each(function (model) {
                        if (self.courses.getByCid(model.cid)) {
                            c++
                        }
                    })
                }
                this.$selectedCount.text(c)

                var codes = [], plainCodes = []
                for (var code in this.missingCodes) {
                    plainCodes.push(code)
                    codes.push('<span class=code>' + code + '</span>')
                }
                if (codes.length) {
                    var btn = $('<div class="search-courses">Clique aqui para buscá-las em outros cursos</div>')
                    this.$message.html(
                        ( codes.length == 1 ? 'A seguinte matéria não foi encontrada na grade do curso: ' : 'As seguintes matérias não foram encontradas na grade do curso: ') + codes.join(', ')
                    ).append(btn)
                    btn.click(function () {
                        me.demand('views/sidebar/course/filter', {codes:plainCodes.join(',')})
                        me.demand('views/sidebar/view', 1)
                    })
                } else {
                    this.$message.hide();
                }

            },

            missingCodes:null,

            initialize:function () {
                var self = this;

                this.missingCodes = {}

                this.render = this.render.bind(this)

                this.courses = this.session.get('courses')
                this.courses.on('all', this.render)

                this.period.each(function (code) {
                    self.missingCodes[code] = true;
                })

                this.render();

                this.$expansion.hide();
                this.removable(utils.spin(this.$loading, {speed:1.3, radius:3, length:4, width:2 }), 'stop')
            },

            beforeRemove: function(){
//                this.courses.off()
            }

        })
    }
);
