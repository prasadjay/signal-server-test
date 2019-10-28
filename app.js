global.call_map = {};
global.call_recieve_map = {};
global.session_map = {};
global.name_map = {};
global.name_arr = {};
global.caller = "";
global.callee_session_id = "";
global.callee_handle_id = "";


global.sessionToName = {};
global.nameToSession = {};
global.sessionToHandle = {};
global.callerToCallee = {};
global.calleeToCaller = {};

//-------------- HTTP SERVER-------------
const expressServer = require('./express');


//---------------------- WEBSOCKET SERVER ------------------------------
var WebSocketServer = require('websocket').server;
var janusLib = require('./janus');

//----------------- HTTPS-------------------
// var http = require('https');
// const fs = require('fs');
// var options = {
//     key: fs.readFileSync('./private-key.pem'),
//     cert: fs.readFileSync('./certificate.crt')
// };
// var server = http.createServer(options, function (request, response) {
//     console.log((new Date()) + ' Received request for ' + request.url);
//     //response.writeHead(404);
//     response.end();
// });

//----------------- HTTP-------------------
var http = require('http');
var server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    //response.writeHead(404);
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
                if (request.type !== "trickle") {
                    connection.sendUTF(JSON.stringify(response));
                }
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
                outResp = await Register(data.caller_username, data);
                break;
            case 'offer':
                outResp = await InitCall(data.caller_session_id, data.caller_handle_id, data.callee_username, data.sdp);
                break;
            case 'accept':
                outResp = await AcceptCall(data.caller_session_id, data.caller_handle_id, data.sdp);
                break;
            case 'destroy':
                outResp = await Destroy(data.session_id);
                break;
            case 'trickle':
                outResp = await TrickleSendToJanus(data.caller_session_id, data.caller_handle_id, data.candidate);
                break;
            case 'trickle_end':
                outResp = await TrickleEndToJanus(data.caller_session_id, data.caller_handle_id);
                break;
            case 'offer_update':
                outResp = await ReOffer(data.caller_session_id, data.caller_handle_id, data.callee_username, data.sdp);
                //outResp = await ReOffer(global.callee_session_id, global.callee_handle_id, "aa", "sdb");
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

let Register = async (username, data) => {
    let outResp = {
        status: true,
        message: "SUCCESS",
        type: "init"
    };

    try {
        //create caller session and attach
        let session_resp = await janusLib.CreateSession();

        let pluginName = "janus.plugin.videocall";
        if (data.plugin && data.plugin === "sip") {
            pluginName = "janus.plugin.sip";
        }

        let attach_resp = await janusLib.AttachPlugin(session_resp.data.id, pluginName);
        outResp.caller_session_id = attach_resp.session_id;
        outResp.caller_handle_id = attach_resp.data.id;

        //new
        if (global.nameToSession[username] && global.nameToSession[username] !== "") {
            outResp.status = false;
            outResp.message = "Already existing session";
            return outResp;
        }

        global.sessionToName[outResp.caller_session_id] = username;
        global.nameToSession[username] = outResp.caller_session_id;
        global.sessionToHandle[outResp.caller_session_id] = outResp.caller_handle_id;

        //old
        global.session_map[outResp.caller_session_id] = username;
        global.name_map[username] = outResp.caller_session_id;
        global.name_arr[username] = {
            session_id: outResp.caller_session_id,
            handler_id: outResp.caller_handle_id
        };

        janusLib.LongPoll(outResp.caller_session_id);

        //register
        let reg_resp = await janusLib.RegisterUser(outResp.caller_session_id, outResp.caller_handle_id, username, data);
        console.log(reg_resp);

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

        //new
        global.callerToCallee[caller_session_id] = global.nameToSession[callee_username];
        global.calleeToCaller[global.nameToSession[callee_username]] = caller_session_id;

        outResp.message = "CALL_REQUEST_ACCEPTED";
        outResp.data = offer_create_resp;
    } catch (e) {
        console.log("ERROR_CALL_DUDE", e);
    }

    return outResp;
};

let AcceptCall = async (callee_session_id, callee_handle_id, sdp) => {
    let outResp = {
        status: true,
        message: "SUCCESS",
        type: "answer"
    };

    try {
        //create offer
        let offer_create_resp = await janusLib.CreateAnswer(callee_session_id, callee_handle_id, sdp);

        //let aaa = await janusLib.DisableAudio(callee_session_id, callee_handle_id);
        //let aaa1 = await janusLib.DisableAudio(global.name_arr.bb.session_id, global.name_arr.bb.handler_id);
        //let bb = await janusLib.SetRecording(callee_session_id, callee_handle_id, "callee");
        //let cc = await janusLib.SetRecording(global.name_arr.bb.session_id, global.name_arr.bb.handler_id, "caller");
        // global.call_map[caller_session_id] = global.name_map[callee_username];
        // global.call_recieve_map[global.name_map[callee_username]] = caller_session_id;
        // global.caller = caller_session_id;

        global.callee_session_id = callee_session_id;
        global.callee_handle_id = callee_handle_id;

        outResp.message = "CALL_ACCEPTED";
        outResp.data = offer_create_resp;
    } catch (e) {
        console.log("ERROR_ACCEPT", e);
    }

    return outResp;
};

let TrickleSendToJanus = async (callee_session_id, callee_handle_id, candidate) => {
    let outResp = {
        status: true,
        message: "SUCCESS",
        type: "trickle_added"
    };

    try {
        let offer_create_resp = await janusLib.CreateTrickle(callee_session_id, callee_handle_id, candidate);
        outResp.message = "TRICKLE_CREATED";
        outResp.data = offer_create_resp;
    } catch (e) {
        console.log("ERROR_TRICKLE_CREATE", e);
    }

    return outResp;
};

let TrickleEndToJanus = async (callee_session_id, callee_handle_id) => {
    let outResp = {
        status: true,
        message: "SUCCESS",
        type: "trickle_ended"
    };

    try {
        let offer_create_resp = await janusLib.EndTrickle(callee_session_id, callee_handle_id);
        outResp.message = "TRICKLE_ENDED";
        outResp.data = offer_create_resp;
    } catch (e) {
        console.log("ERROR_TRICKLE_END", e);
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

let ReOffer = async (caller_session_id, caller_handle_id, callee_username, sdp) => {
    let outResp = {
        status: true,
        message: "SUCCESS",
        type: "offer_update"
    };

    try {
        //create offer
        let offer_create_resp_pre = await janusLib.ReOfferPre(global.callee_session_id, global.callee_handle_id, callee_username, sdp);
        let offer_create_resp = await janusLib.ReOffer(global.callee_session_id, global.callee_handle_id, callee_username, sdp);

        global.call_map[caller_session_id] = global.name_map[callee_username];
        global.call_recieve_map[global.name_map[callee_username]] = caller_session_id;
        global.caller = caller_session_id;

        //new
        global.callerToCallee[caller_session_id] = global.nameToSession[callee_username];
        global.calleeToCaller[global.nameToSession[callee_username]] = caller_session_id;

        outResp.message = "CALL_RE_REQUEST_ACCEPTED";
        outResp.data = offer_create_resp;
    } catch (e) {
        console.log("ERROR_RE_OFFER", e);
    }

    return outResp;
};

///---------------------SIP STUFF-----------------------------------------------------