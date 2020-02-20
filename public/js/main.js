requirejs.config(
    {
        // Scripts carregados sempre
        deps:['sugar', 'lib/jquery-utils', 'jquery-ext/cookie', 'jquery-ext/mousewheel', 'lib/utils', 'lib/models', 'lib/cols', 'jquery-ui'],

        // Dependências das bibliotecas e adaptador AMD para bibliotecas
        // que não suportam AMD
        shim:{
            'underscore':{
                exports:'_'
            },

            // jQuery & plug-ins
            'jquery':{
                exports:'jQuery'
            },

            'lib/jquery-utils':['jquery'],
            'jquery-ui':['jquery'],
            'jquery-ext/jscrollpane.min':['jquery'],
            'jquery-ext/mousewheel':['jquery'],
            'jquery-ext/mwheelintent':['jquery'],
            'jquery-ext/cookie':['jquery'],
            'jquery-ext/matrixSlider':['jquery'],
            'jquery-ext/selectBox':['jquery'],
            'jquery-ext/masonry':['jquery'],
            'jquery-ext/fileupload':['jquery', 'jquery-ext/iframe-transport'],
            'jquery-ext/jcrop':['jquery', 'jquery-ext/color'],
            'jquery-ext/color':['jquery'],
            'jquery-ext/iframe-transport':['jquery'],
            'jquery-ext/tags-input':['jquery'],


            'facebook_raw':{
                exports:'FB'
            },
            'spin':{
                exports:'Spinner'
            },
            'key':{
                exports:'key'
            }
        },

        optimize:'none',

        baseUrl:'/js/',

        paths:{
            // vendor libs
            underscore:'vendor/underscore',
            facebook:'vendor/facebook',
            facebook_raw:'http://connect.facebook.net/en_US/all',
            spin:'vendor/spin',
            key:'vendor/keymaster',
            sugar:'vendor/sugar',
            jquery:'vendor/jquery',
            'jquery-ui':'vendor/jquery-ui',

            m:'modules',

            // requirejs plugins
            async:'vendor/require/async',
            text:'vendor/require/text',

            // jquery plugins
            'jquery-ext':'vendor/jquery',
            'jquery.ui.widget':'vendor/jquery/ui/widget',

            Model:'lib/Backbone/Model',
            Collection:'lib/Backbone/Collection',
            View:'lib/Backbone/View'
        }
    }
);

require(['m/App'], function (App) {
    App.initialize();
});