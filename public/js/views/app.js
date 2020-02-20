define(
    [
        'jquery',
        'underscore',
        'm/Router',
        'View',
        'm/PubSub',
        'm/Session',
        'views/totals',
        'views/agenda',
        'views/sidebar',
        'Collection',
        'Model',
        'views/program-tooltip/index',
        'lib/utils'
    ],
    function (
        $, _, Router, View, PubSub, Session, TotalsView, AgendaView, SidebarView, Collection, Model, ProgramTooltip,
        utils
        ) {

        var me = new PubSub.Module('views/app')

        return View.extend({

            $els:{
                $print:'.icon-print',
                $shareLink:'.share-link',
                $shareButton:'.fb-share',
                $saveSchedule:'.save-schedule',
                $reloadSchedule:'.reload-schedule',
                $loading:'.app-loading'
            },

            horario:null,

            events:{
                'click $saveSchedule':function () {
                    if (this.$saveSchedule.attr('disabled')){
                        return
                    }
                    var self = this

                    this.$saveSchedule.text('Salvando..').attr('disabled', 'true');
                    if (this.courses.length) {
                        var horario = Model.create('Horario', {courses:this.courses.asArray()})
                        horario.save()
                            .success(function () {
                                self.courses.sharedId = horario.id;
                                self.session.saveCourses();
                                self.session.savedHorarioId(horario.id)
                                Router.navigate('/horarios/' + horario.id, false)
                                self.render()
                            })
                    } else {
                        Router.navigate('/', false)
                        this.session.savedHorarioId(null)
                        this.session.saveCourses()
                        this.render()
                    }
                },
                'click $reloadSchedule':function () {
                    var self = this
                    this.courses.sharedId = null;
                    this.session.restoreCourses()
                },
                'click $shareLink':function (ev) {
                    this.$shareLink.select()
                    return false;
                },
                'click $shareButton':function () {
                    if (!this.$shareButton.hasClass('enabled')) {
                        return false;
                    }
                    window.open('http://www.facebook.com/sharer.php?s=100' +
                        '&p[url]=' + encodeURIComponent(this.$shareLink.val()) +
                        '&p[title]=' + encodeURIComponent('Meu horário na UFRJ') +
                        '&p[images][0]=' + encodeURIComponent('http://siga.pimguilherme.com/images/preview.png') +
                        '&p[summary]=' + encodeURIComponent('Crie seu horário da UFRJ com uma interface amigável, imprima seu calendário ou compartilhe-o com seus amigos!')
                        , '_blank', "status = 1, height = 340, width = 560, resizable = 0")
                }
            },

            renderButtons:function () {
                this.$saveSchedule.show();

                var isSaved = this.session.isSaved(), savedCourses = this.session.savedCourses()

                if (isSaved || (!savedCourses && !this.courses.length)) {
                    this.$saveSchedule.text('Salvo!').attr('disabled', 'true')
                } else {
                    this.$saveSchedule.text('Salvar').removeAttr('disabled')
                }

                if ((!isSaved && savedCourses && savedCourses.length) || (this.courses.sharedId && this.courses.sharedId != this.session.savedHorarioId())) {
                    this.$reloadSchedule.fadeIn().attr('title', 'Clique para recarregar o último horário que você salvou');
                } else {
                    this.$reloadSchedule.fadeOut()
                }
            },

            el:'body',

            render:function () {
                this.renderButtons();
                this.updateShareLink()
            },

            updateShareLink:function () {
                var id = this.courses.sharedId ? this.courses.sharedId
                    : ( this.session.isSaved() ? this.session.savedHorarioId() : '')

                if (id) {
                    this.$shareLink.val('http://siga.pimguilherme.com/#/horarios/' + id)
                    this.$shareButton.addClass('enabled').attr('title', '')
                } else {
                    this.$shareLink.val('')
                    this.$shareButton.removeClass('enabled').attr('title', 'Salve um horário com matérias para compartilhá-lo')
                }
            },

            initialize:function () {


                this.$reloadSchedule.hide();
                var self = this;

                this.$errorMessage = $('<div class=app-exception><i class="icon-thumbs-down icon-white"></i> ocorreu um erro inesperado!</div>').appendTo(this.$el)
                $(document).ajaxError(function(ev, a, b, c){
                    if (c == 'abort'){
                        return;
                    }
                    self.$errorMessage.slideDown().delay(2000).slideUp()
                })

                $('#print').click(function (ev) {
                    window.print()
                    _gaq.push(['_trackEvent', 'actions', 'print'])
                    ev.stopPropagation()
                    return false;
                })

                this.render = this.render.bind(this).debounce(50)

                window.Model = Model
                window.Collection = Collection
                window.View = View


                this.courses = this.session.get('courses')
                this.courses.on('all', this.render)
                this.render()

                var fetch = this.courses.fetch;
                this.courses.fetch = function () {
                    self.$loading.show();
                    var res = fetch.apply(this, arguments)
                    if (res) {
                        res.success(function () {
                            self.$loading.hide()
                        })
                    }
                    return res;
                }
                self.$loading.hide();

                this.removable(new TotalsView({el:this.$('#totals')}))
                this.removable(new AgendaView({el:this.$('#agenda'), collection:Session.get('courses')}))
                this.removable(new SidebarView({el:this.$('#sidebar')}))

                this.removable(utils.spin(this.$loading, {speed:1.3, length:3, width:2, radius:3}), 'stop');

            }

        })
    }
);
