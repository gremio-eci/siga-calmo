

module.exports = function (req, res, next) {
    var header = req.headers['authorization'] || '', // get the header
        token = header.split(/\s+/).pop() || '', // and the encoded auth token
        auth = new Buffer(token, 'base64').toString(), // convert from base64
        parts = auth.split(/:/), // split on colon
        username = parts[0],
        password = parts[1];

    var keys = {
        'guilherme':'****'
    };

    var accepted = false;
    for (var name in keys) {
        if (name == username && keys[name] == password) {
            accepted = true;
            break;
        }
    }

    if (!accepted) {
        res.writeHead(401, {'WWW-Authenticate':'Basic realm="Area restrita aos desenvolvedores:"'});
        res.end();
    } else {
        next();
    }
}