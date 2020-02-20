define(
    [
        'jquery',
        'underscore',
        'View',
        'm/PubSub',
        'lib/utils'
    ],
    function ($, _, View, PubSub, utils) {

        var me = new PubSub.Module('views/sidebar/course')

        var view = View.extend({

            $els:{
                $text:'textarea',
                $loading:'.loading',
                $message:'.message',
                $error:'.error'
            },
            template:'sidebar/paste-siga',

            events:{
            },

            refreshList:function () {
                if (!$.trim(this.$text.val())) return;


                var query = this.currentQuery();
                if (!query.q.length) {
                    return this.$error.stop().fadeIn().delay(1000).fadeOut()
                }

                if (_.isEqual(query, this._query)) {
                    return;
                }


                _gaq.push(['_trackEvent', 'sidebar/paste-siga', 'fetch'])

                this._query = query;
                this.hasMore = true;
                this.fetchList(true)
            },

            currentQuery:function () {
                return {
                    q:this.parseSIGACourses($.trim(this.$text.val()))
                }
            },

            hasMore:true,
            currentXHR:null,
            fetchList:function (reset) {
                if (!this._query || !this.hasMore) return;
                var self = this;
                this.$loading.show()

                // We don't want to mess up our list with old content
                if (this.currentXHR) {
                    this.currentXHR.abort()
                    this.currentXHR = null;
                }

                if (reset) {
                    this.collection.reset();
                }

                this.currentXHR =
                    this.collection
                        .fetch({
                            add:true,
                            data:_.extend({
                                skip:this.collection.models.length || undefined
                            }, this._query)
                        })
                        .success(function (models, res) {
                            self.hasMore = false;

                            var q = self._query.q
                            if (q.length / 2 == models.length) {
                                return self.$message.hide();
                            }

                            var courses = {};
                            for (var i = 0; i < q.length; i += 2) {
                                courses[q[i]] = q[i + 1];
                            }

                            models.each(function (model) {
                                delete courses[model.get('code')]
                            })

                            var missingCourses = [];
                            _.each(courses, function (name, code) {
                                missingCourses.push('<li class=course><span class=code>' + code + '</span> <span class=name>' + name + '</span></li>')
                            })

                            self.$message.html(
                                ( missingCourses.length == 1 ? 'A seguinte matéria não foi encontrada: ' : 'As seguintes matérias não foram encontradas:') + '<ul>' + missingCourses.join('') + '</ul>'
                            ).show();

                        })
                        .error(function (models, res) {
                            self.hasMore = false;
                        })
                        .complete(function () {
                            self.$loading.hide()
                        })
                        .xhr

            },

            parseSIGACourses:function (text) {
//                /(^|\n)/ig.exec(text)
                var r = /(?:^|\n)(.*)?\n.*?([A-Z\d]{6}).*?\d\.\d/g
                    , m
                    , courses = []
                while (m = r.exec(text)) {
                    courses.push(m[2], $.trim(m[1]))
                }
                return courses;
            },

            beforeBinding:function () {
                this.collection = Collection.create('Courses')
                this.collection.url = '/courses/sets'
            },

            initialize:function () {
                this.removable(utils.spin(this.$loading, {speed:1.3}), 'stop');
                this.$loading.hide()
                this.$text.on('change focus blur keyup mouseup paste', this.refreshListDebounced.bind(this))
            }

        })

        view.prototype.refreshListDebounced = view.prototype.refreshList.debounce(200)

        return view;

    }
)
;
