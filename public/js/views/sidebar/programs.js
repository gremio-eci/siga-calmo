define(
    [
        'jquery',
        'underscore',
        'View',
        'm/PubSub',
        'lib/utils',
        'Collection',
        'views/sidebar/expanded-program'
    ],
    function ($, _, View, PubSub, utils, Collection, ExpandedProgramView) {

        var me = new PubSub.Module('views/sidebar/programs')

        var view = View.extend({

            $els:{
                $search:'input.search',
                $loading:'.loading',
                $noResults:'.no-results',
                $expandedProgram:'.expanded-program',
                $list:'.list',
                $showOutdated:'.show-outdated',
                $showRecent:'.show-recent',
                $messages:'.messages'
            },
            template:'sidebar/programs',

            events:{
                'keyup $search':function () {
                    this.refreshListDebounced();
                },
                'click $showOutdated':function () {
                    _gaq.push(['_trackEvent', 'sidebar/programs/show-outdated', 'click', 'show'])
                    this.$list.addClass('showing')
                },
                'click $showRecent':function () {
                    _gaq.push(['_trackEvent', 'sidebar/programs/show-outdated', 'click', 'hide'])
                    this.$list.removeClass('showing')
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
                var query = $.trim(this.$search.val());
                if (query == this._query) return;
                this.showSearch();
                this._query = query;
                this.hasMore = true;
                if (query) {
                    this.fetchList(true)
                }

                this.saveSession()
            },

            hasMore:true,
            currentXHR:null,
            fetchList:function (reset) {
                if (!this._query || !this.hasMore || this._query.length < 3) return;
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
                            data:{
                                q:this._query,
                                skip:this.collection.models.length || undefined
                            }
                        })
                        .success(function (models, res) {
                            self.$noResults.toggle(self.collection.length == 0)
                            self.$messages.toggle(self.collection.length > 0)
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

            expandedProgram:null,
            expandProgram:function (program) {
                var self = this;
                if (!program) {
                    this.showSearch()
                } else {
                    this.showDetails();
                    if (this.expandedProgram) {
                        this.expandedProgram.remove(false);
                        this.$expandedProgram.empty()
                    }
                    this.expandedProgram = this.removable(new ExpandedProgramView({el:this.$expandedProgram, model:program }))
                }
            },

            showSearch:function () {
                var self = this;
                this.$expandedProgram.fadeOut(function () {
                    self.$list.fadeIn()
                });
            },

            showDetails:function () {
                var self = this;
                this.$list.fadeOut(function () {
                    self.$expandedProgram.fadeIn()
                });
                self.$expandedProgram.hide();
            },

            beforeBinding:function () {
                this.collection = Collection.create('Programs')
            },


            restoreSession:function () {
                if (!this.$search.val().trim()) {
                    this.$search.val($.cookie('sidebar-programs-search'))
                    this.refreshList()
                }
            },

            saveSession:function () {
                $.cookie('sidebar-programs-search', this.$search.val().trim())
            },

            initialize:function () {
                this.$container = this.$el
                var self = this;

                me.react('details', function (program) {
                    self.expandProgram(program)
                })

                this.evalScroll = this.evalScroll.bind(this)
                self.$messages.hide();

                this.removable(utils.spin(this.$loading, {speed:1.3}), 'stop');
                this.$loading.hide();
                this.$el.bind('scroll', this.evalScroll)

                this.restoreSession();
            }

        })

        view.prototype.refreshListDebounced = view.prototype.refreshList.debounce(400)
        return view;
    }
);
