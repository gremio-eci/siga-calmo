define(
    [
        'jquery',
        'underscore',
        'View',
        'm/PubSub',
        'views/program/period'
    ],
    function ($, _, View, PubSub, PeriodView) {

        var me = new PubSub.Module('views/sidebar/course')

        return View.extend({

            $els:{
                $periods:'ul.periods',
                $header:'>.header'
            },
            el:'<div class=expanded-program></div>',
            template:'sidebar/expanded-program',
            tooltip:null,

            initialize:function () {
                var self = this;
                this.$header.click(function(){
                    me.demand('views/sidebar/programs/details', null)
                })

                this.model.get('periods').each(function (period) {
                    self.removable(
                        new PeriodView({
                            appendTo:self.$periods,
                            title:(period.index + 1) + 'º período',
                            period:period.courses,
                            collection:Collection.create('Courses', {url:'/courses?programs=' + encodeURI(self.model.get('name')) + '&codes=' + encodeURI(period.courses.join(','))})
                        })
                    )
                })

                if (this.model.get('conditional')) {
                    this.removable(
                        new PeriodView({
                            appendTo:self.$periods,
                            title:'Eletivas Condicionadas',
                            period:this.model.get('conditional'),
                            collection:Collection.create('Courses', {url:'/courses?programs=' + encodeURI(self.model.get('name')) + '&codes=' + encodeURI(self.model.get('conditional').join(','))})
                        })
                    )
                }

                if (this.model.get('restricted')) {
                    this.removable(
                        new PeriodView({
                            appendTo:self.$periods,
                            title:'Eletivas Restritas',
                            period:this.model.get('restricted'),
                            collection:Collection.create('Courses', {url:'/courses?programs=' + encodeURI(self.model.get('name')) + '&codes=' + encodeURI(self.model.get('restricted').join(','))})
                        })
                    )
                }
            }

        })
    }
);
