var app = require('express')();
var httpServer = require('http').createServer(app);
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

global.call_map = {};
global.call_recieve_map = {};
global.session_map = {};
global.name_map = {};

global.caller = "";

var WebSocketServer = require('websocket').server;
var http = require('http');
var janusLib = require('./janus');

app.get('/', function (req, res) {
    res.send("SERVER_RUNNING");
});

app.post('/', function (req, res) {
    if (req.body.type !== 128 && req.body.type !== 32) {
        console.log(JSON.stringify(req.body));
        ProcessEvent(req.body);
    }

    //ProcessEvent(req.body);
    res.send(true);
});

httpServer.listen(5000, function () {
    console.log('listening on *:5000');
});

var server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(4000, function () {
    console.log((new Date()) + ' Server is listening on port 4000');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

wsServer.on('request', function (request) {
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');

    connection.on('message', async function (message) {
        // console.log("got message", message);
        let request = JSON.parse(message.utf8Data);
        if (message.type === 'utf8') {
            if (request.type) {
                console.log("======================================================================================================");
                console.log("REQUEST", JSON.stringify(request));
                let response = await distribute(request);

                if (request.type === "init") {
                    global[response.caller_session_id] = connection;
                }

                console.log("SUMMARY => REQUEST:", JSON.stringify(request), "RESPONSE:", JSON.stringify(response));
                connection.sendUTF(JSON.stringify(response));
                console.log("======================================================================================================");
            } else {
                console.log(JSON.stringify(request));
                connection.sendUTF(request);
            }
        } else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });

    connection.on('close', function (reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});


let distribute = async (data) => {
    let outResp = {};
    try {
        switch (data.type) {
            case 'init':
                outResp = await Register(data.caller_username);
                break;
            case 'offer':
                outResp = await InitCall(data.caller_session_id, data.caller_handle_id, data.callee_username, data.sdp);
                break;
            case 'answer':
                outResp = await Destroy(data.session_id);
                break;
            default:
                console.log("UNDEFINED TYPE:" + data.type);
                break;
        }
    } catch (e) {
        console.log('ERROR:' + e);
    }

    return outResp;
};

let Register = async (username) => {
    let outResp = {
        status: true,
        message: "SUCCESS",
        type: "init"
    };

    try {
        //create caller session and attach
        let session_resp = await janusLib.CreateSession();
        let attach_resp = await janusLib.AttachPlugin(session_resp.data.id, "janus.plugin.videocall");
        outResp.caller_session_id = attach_resp.session_id;
        outResp.caller_handle_id = attach_resp.data.id;

        global.session_map[outResp.caller_session_id] = username;
        global.name_map[username] = outResp.caller_session_id;

        //register
        let reg_resp = await janusLib.RegisterUser(outResp.caller_session_id, outResp.caller_handle_id, username);
    } catch (e) {
        console.log("ERROR_REGISTER", e);
        outResp.status = false;
        outResp.message = e.toString();
    }

    return outResp;
};

let InitCall = async (caller_session_id, caller_handle_id, callee_username, sdp) => {
    let outResp = {
        status: true,
        message: "SUCCESS",
        type: "offer"
    };

    try {
        //create offer
        let offer_create_resp = await janusLib.CreateOffer(caller_session_id, caller_handle_id, callee_username, sdp);
        global.call_map[caller_session_id] = global.name_map[callee_username];
        global.call_recieve_map[global.name_map[callee_username]] = caller_session_id;
        global.caller = caller_session_id;


        outResp.message = "CALL_REQUEST_ACCEPTED";
        outResp.data = offer_create_resp;
    } catch (e) {
        console.log("ERROR_CALL_DUDE", e);
    }

    return outResp;
};

let Destroy = async (session_id) => {
    let outResp = {
        status: true,
        message: "SUCCESS",
        type: "end"
    };

    try {
        //create caller session and attach
        let session_resp = await janusLib.DestroySession(session_id);
    } catch (e) {
        console.log("ERROR_REGISTER", e);
        outResp.status = false;
        outResp.message = e.toString();
    }
    return outResp;
};

let ProcessEvent = (event) => {
    //register user
    //{"emitter":"MyJanusInstance","type":64,"timestamp":1571814835334784,"session_id":8208059443368160,"handle_id":7795966642338636,"opaque_id":"videocalltest-eIy9TnE4snGt","event":{"plugin":"janus.plugin.videocall","data":{"event":"registered","username":"aa"}}}
    let outResp = {};
    let connection = null;

    if (event.event.plugin && event.event.data && event.event.data.event && event.event.data.event === "calling") {
        console.log("incoming call alert to callee.. inform callee");
        connection = global[call_map[event.session_id]];
        outResp.type = "incoming-call";
        outResp.from = global.name_map[event.session_id];
    } else if (event.event.jsep && event.event.jsep.type === "answer" && event.event.owner && event.event.owner === "local") {
        console.log("call answered by callee.. inform caller");
        //let caller_session = global.call_recieve_map[event.session_id];
        let caller_session = global.caller;
        connection = global[caller_session];
        outResp.type = "call_answered";
        outResp.callee_sdp = event.event.jsep.sdp;
    } /*else if (event.event.plugin && event.event.data && event.event.data.event && event.event.data.event === "accepted") {
        console.log("call answered by callee.. inform caller.. before webrtc establishment.");
        let caller_session = global.call_recieve_map[event.session_id];
        connection = global[caller_session];
        outResp.type = "call-accepted";
    } else if (event.event.connection && event.event.connection === "webrtcup") {
        connection = global[event.session_id];
        outResp.type = "webrtc-conn-completed";
    } else if (event.event.media && event.event.media === "video" && event.event.receiving) {
        connection = global[event.session_id];
        outResp.type = "video-stream-ok";
    } else if (event.event.media && event.event.media === "audio" && event.event.receiving) {
        connection = global[event.session_id];
        outResp.type = "audio-stream-ok";
    }*/

    if (connection != null) {
        console.log("WS SEND:", JSON.stringify(outResp));
        connection.sendUTF(JSON.stringify(outResp));
    }
};