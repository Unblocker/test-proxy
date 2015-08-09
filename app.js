var express = require('express');
var app = express();
var request = require('request');
var validator = require('validator');

// might be a bug in the request.js library
// proxying over HTTPS always gets error
// so we have to disable TLS checking
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


var TEST_URL = 'http://ipservice.163.com/isFromMainland';
var TEST_STR = 'true';

app.get('/:prot/:addr/:port', function(req, res){
    var prot = req.param('prot');
    var addr = req.param('addr');
    var port = req.param('port');

    if ((prot !== 'http' && prot !== 'https') ||
        (!validator.isIP(addr) && !validator.isFQDN(addr)) ||
        !validator.isInt(port, {min: 1, max: 65535})
    ) {
        res.send(403);
        return;
    }

    var request_options = {
        url: TEST_URL,
        method: 'GET',
        proxy: prot + '://' + addr + ':' + port,
        headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate, sdch",
            "Accept-Language": "en-US,en;q=0.8,zh;q=0.6",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.125 Safari/537.36"
        }
    };

    request(request_options, function(err, resp, body) {
        if (err) {
            res.send(503);
            return;
        }
        if (resp.statusCode === 200 && body.indexOf(TEST_STR) !== -1) {
            res.send(200);
            return;
        }
        res.send(503);
    });
});


// default handler
app.use(function(req, res){
    res.send(403);
});


var port = Number(process.env.PORT || 5000);
var server = app.listen(port, function() {
    console.log("Listening on " + port);
});


process.on('SIGTERM', function () {
    console.log("Closing on SIGTERM");
    server.close();
});
