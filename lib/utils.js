var crypto = require('crypto')
    , request = require('request')
    , fs = require('fs')
    , path = require('path')
    , _ = require('underscore')
    , util = require('util')

/**
 * Utilidades em geral
 */

var utils = module.exports = {

    /**
     * Facebook
     */
    fb:{

        config:{
            id:'460598673965233',
            secret:'************',
            appToken:'************'
        },

        srCookieName:'************',

        /**
         * Adaptado de https://github.com/vladbagrin/facebook-wrapper/blob/master/lib/facebook-wrapper.js
         *
         *
         * Parse a signed_request.
         *
         * @param data The request as a string
         * @return JSON decoded signed request object
         */
        parseSignedRequest:function parseSignedRequest(payload_string) {
            try {
                var payload = payload_string.split('.');
                var sig = payload[0];
                var data = JSON.parse(new Buffer(payload[1], 'base64').toString());

                if (data['algorithm'].toUpperCase() !== 'HMAC-SHA256') {
                    console.log('Unknown signed_request hash algorithm: ' + data['algorithm']);
                    return null;
                }
                var expected_sig = crypto.createHmac('sha256', utils.fb.config.secret);
                expected_sig.update(payload[1]);
                expected_sig = expected_sig.digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
                if (sig !== expected_sig) {
                    console.log('Bad signed_request encoding.\n\tExpected: ' + expected_sig + '\n\tGot: ' + sig);
                    return null;
                }

                return data;
            } catch (e) {
                return null;
            }
        },

        //
        // Realiza um pedido ao Facebook Graph API
        //
        graph:function (options, cb) {
            options = options || {};

            if (!options.userId) {
                return cb(new Error('Missing userId for app graph call'))
            }

            var queryString = {
                access_token:utils.fb.config.appToken
            };

            request({
                json:true,
                url:'https://graph.facebook.com/' + options.userId + (options.path || ''),
                qs:queryString
            }, function (err, res, body) {
                if (!err) {
                    if (body && body['error']) {
                        err = body['error'];
                    }
                }
                cb(err, body);

            });

        }
    },

    /**
     * Amazon
     */
    aws:{


        config:{
            key:'**********',
            secret:'**********',
            bucket:'pickkit',
            domain:'pickkit.s3.amazonaws.com'
        },

        knox:function () {
            return require('knox').createClient(utils.aws.config)
        },

        // Essa função recebe o caminho completo para o arquivo temporário
        uploadFileToS3:function (file, cb) {
            var dst = file.split('/public').slice(1).join('')
                , url = 'http://' + utils.aws.config.domain + dst
                , knox = utils.aws.knox();

            knox.putFile(file, dst,
                { 'Content-Type':'image/jpeg' },
                function (err, result) {
                    if (err) return cb(err);
                    if (200 == result.statusCode) {
                        console.log('Successfully uploaded file ' + url);
                    }
                    else {
                        console.log('Failed to upload file ' + url);
                    }
                    cb(err, url);
                });
        },

        deleteFileFromS3: function (fileName, cb) {
            var knox = utils.aws.knox();

            knox.deleteFile(fileName, function (err, cb) {
                if (err) return cb(err);
                if (200 == result.statusCode) {
                    console.log('Successfully deleted file ' + fileName);
                }
                else {
                    console.log('Failed to delete file ' + fileName);
                }
            });
        }
    },

    /**
     * Métodos genéricos
     */

    // Returns a structured object containing all the directory's files
    // exports, indexed by the filename
    dirStructure:function (dirPath, options) {
        options = options || {};
        var files = fs.readdirSync(dirPath)
            , struct = {}
            ;
        files.forEach(function (file) {
            if (options.exclude && options.exclude.indexOf(file) != -1) return;
            struct[path.basename(file, '.js')] = require(dirPath + '/' + file);
        });
        return struct;
    },

    // Gera um identificador único
    guid:function () {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    },


    // Common scoped error logging
    scopedError:function (name) {
        return function (m) {
            throw new Error(name + ": " + m + ' ' + util.inspect(Array.prototype.slice.call(arguments, 1)))
        }
    },

    // Commong scoped logging
    scopedLog:function (name) {
        return function (m) {
            console.log.call(console, "[" + name + "] " + m, Array.prototype.slice.call(arguments, 1));
            if (m && m.stack) {
                console.log(m.stack)
            }
        }
    },

    // Pushes a unique value into the array, based in a property of the object
    pushUnique:function (arr, obj, key) {
        key = key || obj;
        if ((arr._uniqueMap || (arr._uniqueMap = {})) && arr._uniqueMap[key]) return;
        arr._uniqueMap[key] = true;
        arr.push(obj);
    },


    // The self-propagating extend function that Backbone classes use.
    extend:function (protoProps, classProps) {
        var child = utils.inherits(this, protoProps, classProps);
        child.extend = this.extend || utils.extend;
        return child;
    },

    _ctor:function () { },

    // Helper function to correctly set up the prototype chain, for subclasses.
    // Similar to `goog.inherits`, but uses a hash of prototype properties and
    // class properties to be extended.
    inherits:function (parent, protoProps, staticProps) {
        var child;

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.
        if (protoProps && protoProps.hasOwnProperty('constructor')) {
            child = protoProps.constructor;
        } else {
            child = function () { parent.apply(this, arguments); };
        }

        // Inherit class (static) properties from parent.
        _.extend(child, parent);

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        utils._ctor.prototype = parent.prototype;
        child.prototype = new utils._ctor();

        // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps) _.extend(child.prototype, protoProps);

        // Add static properties to the constructor function, if supplied.
        if (staticProps) _.extend(child, staticProps);

        // Correctly set child's `prototype.constructor`.
        child.prototype.constructor = child;

        // Set a convenience property in case the parent's prototype is needed later.
        child.__super__ = parent.prototype;

        return child;
    }

}
