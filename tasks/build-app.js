module.exports = function (grunt) {

    grunt.registerTask('build-app', 'Builds the JS Web Application', function () {

// Script utilizado para compilar o código client-side
        var path = require('path')
            , fs = require('fs')
            , wrench = require('wrench')
            , spawn = require('child_process').spawn
            , CONFIG_PATH = '../var/client-build-config.js'
            , done = this.async()
            , _ = require('underscore')
            ;

        var __approot = path.resolve(__dirname, '../')
            , buildConfig = ({

                // Define our base URL - all module paths are relative to this
                // base directory.
                baseUrl:__approot + "/public/js",

                // Define our build directory. All files in the base URL will be
                // COPIED OVER into the build directory as part of the
                // concatentation and optimization process. You should use this
                // so you don't override your raw source files.
                dir:__approot + "/js-build",

                // Load the RequireJS config() definition from the main.js file.
                // Otherwise, we'd have to redefine all of our paths again here.
                mainConfigFile:__approot + "/public/js/main.js",

                // Define the modules to compile.
                modules:[

                    // When compiling the main file, don't include the FAQ module.
                    // We want to lazy-load FAQ since it probably won't be used
                    // very much.
                    {
                        name:"main",

                        // Explicitly include modules that are NOT required
                        // directly by the MAIN module. This allows us to include
                        // commonly used modules that we want to front-load.
                        include:null,

                        // Use the *shallow* exclude; otherwise, dependencies of
                        // the FAQ module will also be excluded from this build
                        // (including jQuery and text and util modules). In other
                        // words, a deep-exclude would override our above include.
                        excludeShallow:[
                        ]
                    }

                ],

                paths:{
                    facebook_raw:'empty:'
                },

                // Turn off UglifyJS so that we can view the compiled source
                // files (in order to make sure that we know that the compile
                // is working properly - for debugging only.)
                optimize:"uglify"

            })

            , getFiles = function (dirPath, prefix, noExt) {
                prefix = prefix || '';
                var files = wrench.readdirSyncRecursive(dirPath);
                files = files
                    .filter(function (file) {
                        return !fs.statSync(dirPath + '/' + file).isDirectory() && (~file.indexOf('.html') || ~file.indexOf('.js'))
                    })
                    .map(function (file) {
                        var l = file.lastIndexOf('.')
                        return  prefix + (noExt && ~l ? file.substring(0, l) : file)
                    })
                return _.unique(files);
            }
// Copia o build para a pasta pública
            , releaseBuild = function () {
                var dst = __approot + '/public/app.min.js';
                try {
                    fs.unlinkSync(dst)
                } catch (e) {}
                fs.linkSync(__approot + '/js-build/main.js', dst);
                grunt.log.writeln('O aplicativo foi compilado e está em ' + dst);
            };


        buildConfig.modules[0].include = getFiles(__approot + '/public/js/templates', 'text!templates/')
            .concat(getFiles(__approot + '/public/js/views', 'views/', true))
            .concat(getFiles(__approot + '/public/js/lib', 'lib/', true))
            .concat(getFiles(__approot + '/public/js/modules', 'm/', true))
            .concat(['config'])
            // Removemos algumas exceções
            .filter(function (file) {
                return !~['lib/Backbone/Model', 'lib/Backbone/Collection', 'lib/Backbone/View'].indexOf(file)
            })

        fs.writeFileSync(__approot + '/var/client-build-config.js', "(" + JSON.stringify(buildConfig, null, '\t') + ")");

        var rjs = spawn('r.js', ['-o', './var/client-build-config.js']);
        rjs.stdout.on('data', function (data) {
            grunt.log.write(data.toString());
        });

        rjs.stderr.on('data', function (data) {
            grunt.log.error.write(data.toString());
        });

        rjs.on('exit', function (code) {
            if (code !== 0) {
                grunt.log.writeln('Não foi possível compilar o código');
                return done();
            }
            grunt.log.writeln('O código foi compilado com sucesso');
            releaseBuild();
            done();
        });
    })
}