define(
    [
        'jquery',
        'underscore'
        // Modules
        // Views
    ],
    function ($, _) {

        var MatrixSlider = function ($el) {
            this.$el = $el;
        };
        MatrixSlider.prototype = {

            // Callabck to handle jQuery's usage
            mSlider:function (a, b) {

                // Shortcuts parsing

                // Slides to the given elements
                if (a instanceof $) {
                    this._slideTo(a);
                }
                // Slides to the given indexes
                else if (typeof a == 'number') {
                    if (!b) {
                        b = a;
                        a = 0;
                    }
                    this._slideTo(this.matrix[a][b]);
                } else {

                    var options = a || {};

                    // Configuration
                    _.extend(this.options, options);

                    // Initialization
                    if (!this.$wrapper) {
                        var children = this.$el.children();
                        this._wrapElement();
                        if (children.size() && (!options.matrix)) {
                            this.setMatrix(children);
                        }
                    }

                    // Matrix settings
                    if (options.matrix) {
                        this.setMatrix(options.matrix);
                    }
                }
            },

            options:{
                // Elements' bounds
                width:null,
                height:null
            },

            // jQuery element where the matrix will be staged
            $el:null,

            // Wraps The element with an overflow:hidden canvas and a track to
            // scroll the elements
            _wrapElement:function () {
                this.$wrapper = $('<div></div>').css({overflow:'hidden'});
                this.$track = $('<div></div>').css({position:'relative'});

                this.$el.empty();
                this.$wrapper.appendTo(this.$el);
                this.$track.appendTo(this.$wrapper);

                this.$wrapper.add(this.$track).css({width:'100%', height:'100%'})
            },

            // Returns a normalized matrix, which must be bidimensional
            _normalizeMatrix:function (matrix) {
                if (!(matrix[0] instanceof Array)) {
                    matrix = [matrix];
                }
                for (var i = 0; i < matrix.length; i++) {
                    for (var j = 0; j < matrix[i].length; j++) {
                        if (!(matrix[i][j] instanceof $))
                            matrix[i][j] = $(matrix[i][j]);
                    }
                }
                return matrix;
            },

            // Configures the current matrix
            setMatrix:function (matrix) {
                this.matrix = this._normalizeMatrix(matrix);
                this._layoutMatrix(this.matrix);
            },

            // Lays out the children according to our matrix
            _layoutMatrix:function (matrix) {
                var w = this.options.width || this.$wrapper.width()
                    , h = this.options.height || this.$wrapper.height()
                    ;

                for (var i = 0; i < matrix.length; i++) {
                    for (var j = 0; j < matrix[i].length; j++) {
                        var $el = matrix[i][j];
                        $el.css({
                            position:'absolute',
                            top:i * h,
                            left:j * w,
                            width:'100%',
                            height:'100%'
                        })
                        this.$track.append($el);
                    }
                }
            },

            _slideTo:function ($el) {
                if (this.$track.children().filter($el).size()) {
                    this.$track.animate({left:-$el.position().left, top:-$el.position().top})
                }
            }

        }

        $.fn.mSlider = function (matrix) {
            var ms = this.data('matrix-slider') || new MatrixSlider(this);
            ms.mSlider.apply(ms, arguments);
            this.data('matrix-slider', ms);
        }

    }
);
