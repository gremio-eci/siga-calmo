define(
    [
        'jquery',
        'underscore',
        'View',
        'm/PubSub',
        'lib/utils',
        'Collection',
        'jquery-ext/tags-input'
    ],
    function ($, _, View, PubSub, utils, Collection) {

        var me = new PubSub.Module('views/sidebar/course')

        var view = View.extend({

            $els:{
                $search:'input.search',
                $q:'input.search',
                $loading:'.loading',
                $noResults:'.no-results',
                $extraToggle:'.icon-filter',
                $extra:'.extra-filters',
                $teachers:'[name=teachers]',
                $programs:'[name=programs]',
                $outdated:'[name="old-courses"]',
                $codes:'[name=codes]',
                $days:'div.days',
                $clearFilters:'.clear-filters'
            },
            template:'sidebar/courses',

            events:{
                'keyup $search':function () {
                    this.refreshList();
                },
                'click $extraToggle':function () {
                    _gaq.push(['_trackEvent', 'sidebar/courses/filters', 'click', this.$extra.is(':visible')])
                    this.toggleExtraFilters()
                },
                'click .days > .btn':function (ev) {
                    $(ev.target).toggleClass('active')
                    this.refreshList()
                },
                'change $outdated':function (ev) {
                    this.refreshList()
                },
                'click $clearFilters':function () {
                    this.clearFilters()
                    this.collection.reset()
                },
                'mousewheel':function (ev) {
                    var d = ev.originalEvent.wheelDelta
                    if (this.$container[0].scrollHeight == this.$container.innerHeight()) return
                    if ((this.$container.scrollTop() === 0 && d > 0)
                        || (this.$container.scrollTop() == this.$container[0].scrollHeight - this.$container.innerHeight() && d < 0)) {
                        ev.preventDefault();
                    }
                }
            },

            refreshList:function () {
                var query = this.currentQuery();

                if (_.isEqual(query, this._query)) {
                    return;
                }

                this._query = query;
                this.hasMore = true;
                this.fetchListDebounced(true)
            },

            clearFilters:function () {
                this.setFilters(null)
            },

            setFilters:function (query) {
                this._query = query;

                this.$programs.val('')
                this.$teachers.val('')
                this.$codes.val('')
                this.$search.val('')
                this.$days.find('day').removeClass('active')
                this.$outdated.attr('checked', false)

                this.$programs.importTags('')
                this.$teachers.importTags('')
                this.$codes.importTags('')

                if (!query) {
                    return
                }

                this.$codes.importTags(query['codes'])

                if (query['days']) {
                    var self = this;
                    query['days'].each(function (day) {
                        self.$days.eq(day).addClass('active')
                    })
                }

                this.refreshList();
                this.toggleExtraFilters()

            },

            currentQuery:function () {
                var query = {
                    q:$.trim(this.$search.val()),
                    codes:$.trim(this.$codes.val()),
                    teachers:$.trim(this.$teachers.val()),
                    programs:$.trim(this.$programs.val()),
                    outdated: this.$outdated.is(':checked')
                }
                var found = false

                for (var field in query) {
                    if (!query[field]) {
                        delete query[field];
                        continue;
                    }
                    found = true;
                }

                if (!found) return null;

                query.days = []
                this.$days.find('a').each(function (i) {
                    if ($(this).hasClass('active')) {
                        query.days.push(i)
                    }
                })

                query.days = query.days.length && query.days.length != 7 ? query.days.join(',') : '';

                return found ? query : null;
            },

            hasMore:true,
            currentXHR:null,
            fetchList:function (reset) {
                if (!this._query || !this.hasMore) return;
                var self = this;
                this.$loading.show()
                this.$noResults.hide()

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
                            self.$noResults.toggle(self.collection.length == 0)
                            self.hasMore = res.hasMore;
                        })
                        .error(function (models, res) {
                            self.hasMore = false;
                        })
                        .complete(function () {
                            self.$loading.hide()
                        })
                        .xhr

            },

            evalScroll:function () {
                var self = this;
                if (this.$el.scrollTop() + this.$el.height() >= this.$el.prop('scrollHeight')) {
                    if (!this.collection.inSync()) {
                        this.fetchList()
                    }
                }
            },

            toggleExtraFilters:function (visible) {
                var self = this;
                if (this.$extra.is(':visible') && !visible) {
                    this.$extra.stop().slideUp(this.renderExtra);
                } else {
                    this.$extra.stop().slideDown();
                    this.renderExtra()
                }
            },

            renderExtra:function () {
                if (this.$extra.is(':visible')) {
                    this.$extraToggle.addClass('active')
                } else {
                    this.$extraToggle.removeClass('active')
                }
            },

            beforeBinding:function () {
                this.collection = Collection.create('Courses')
            },

            initialize:function () {
                this.$container = this.$el
                this.evalScroll = this.evalScroll.bind(this)
                this.renderExtra = this.renderExtra.bind(this)
                this.refreshList = this.refreshList.bind(this)

                this.removable(utils.spin(this.$loading, {speed:1.3}), 'stop');
                this.$loading.hide();
                this.$el.bind('scroll', this.evalScroll)


                this.$teachers.tagsInput({
                    height:'20px',
                    width:'100%',
                    defaultText:'digite nomes',
                    placeholderColor:'#aaa',
                    onChange:this.refreshList
                });

                this.$codes.tagsInput({
                    height:'20px',
                    width:'100%',
                    defaultText:'digite códigos',
                    placeholderColor:'#aaa',
                    onChange:this.refreshList,
                    minChars:4,
                    maxChars:6
                });

                this.$programs.tagsInput({
                    height:'20px',
                    width:'100%',
                    defaultText:'digite cursos',
                    placeholderColor:'#aaa',
                    onChange:this.refreshList
                });

                var self = this;
                me.react('filter', function (query) {
                    self.setFilters(query)
                })

            }

        })

        view.prototype.fetchListDebounced = view.prototype.fetchList.debounce(400)
        return view;
    }
);
