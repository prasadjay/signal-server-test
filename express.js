var app = require('express')();
var httpServer = require('http').createServer(app);
const bodyParser = require('body-parser');
const janusLib = require('./janus');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function (req, res) {
    res.send("SERVER_RUNNING");
});

app.post('/', function (req, res) {
    if (req.body.type !== 128 && req.body.type !== 32) {
        console.log(JSON.stringify(req.body));
        ProcessEvent(req.body);
    }
    res.send(true);
});

httpServer.listen(5000, function () {
    console.log('listening on *:5000');
});


let ProcessEvent = async (event) => {
    //register user
    //{"emitter":"MyJanusInstance","type":64,"timestamp":1571814835334784,"session_id":8208059443368160,"handle_id":7795966642338636,"opaque_id":"videocalltest-eIy9TnE4snGt","event":{"plugin":"janus.plugin.videocall","data":{"event":"registered","username":"aa"}}}
    let outResp = {};
    let connection = null;

    if (event.event.jsep && event.event.jsep.type === "offer" && event.event.owner && event.event.owner === "local") {
        console.log("incoming call alert to callee.. inform callee");
        //connection = global[global.call_map[event.session_id]];
        connection = global[event.session_id];


        //connection = global[global.callerToCallee[event.session_id]];
        outResp.type = "incoming_call";
        outResp.caller_sdp = event.event.jsep.sdp;
        outResp.from = "huehuehue";
    } else if (event.event.jsep && event.event.jsep.type === "answer" && event.event.owner && event.event.owner === "local") {
        console.log("call answered by callee.. inform caller");
        //let caller_session = global.call_recieve_map[event.session_id];
        let caller_session = global.caller;


        //connection = global[global.calleeToCaller[event.session_id]];
        connection = global[caller_session];
        outResp.type = "call_answered";
        outResp.callee_sdp = event.event.jsep.sdp;

        setTimeout(function () {
            if (connection !== null && connection !== undefined) {
                connection.sendUTF(JSON.stringify({key: "test value"}));
            }
        }, 3000);

    } else if (event.event.name && event.event.name === "timeout") {
        console.log("TIMEOUT", global.sessionToName[event.session_id]);
        global[event.session_id] = null;
        global.nameToSession[global.sessionToName[event.session_id]] = "";
        global.sessionToName[event.session_id] = "";
        global.sessionToHandle[event.session_id] = "";
        if (global.callerToCallee[event.session_id]) {
            global.callerToCallee[event.session_id] = "";
        }
        if (global.calleeToCaller[event.session_id]) {
            global.calleeToCaller[event.session_id] = "";
        }
    } else if (event.event.data && event.event.data.event && event.event.data.event === "configured") {
        //{"emitter":"MyJanusInstance","type":64,"timestamp":1572005800137495,"session_id":8292603732019678,"handle_id":161715652591996,"opaque_id":"456456","event":{"plugin":"janus.plugin.videocall","data":{"event":"configured","audio_active":true,"video_active":true,"bitrate":0}}}
        console.log("CONFIGURED EVENT", event);
        // let calleeSession = global.callerToCallee[event.session_id];
        //let calleeHandle = global.sessionToHandle[calleeSession];
        // let offer_create_resp = await janusLib.ReOffer(global.callee_session_id, global.callee_handle_id, "aa", "sdp");
        //console.log("SECOND_SET_COMMAND", offer_create_resp);
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

    if (connection !== null && connection !== undefined) {
        console.log("WS SEND:", JSON.stringify(outResp));
        connection.sendUTF(JSON.stringify(outResp));
    }
};