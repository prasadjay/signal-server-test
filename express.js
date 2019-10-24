var app = require('express')();
var httpServer = require('http').createServer(app);
const bodyParser = require('body-parser');

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


let ProcessEvent = (event) => {
    //register user
    //{"emitter":"MyJanusInstance","type":64,"timestamp":1571814835334784,"session_id":8208059443368160,"handle_id":7795966642338636,"opaque_id":"videocalltest-eIy9TnE4snGt","event":{"plugin":"janus.plugin.videocall","data":{"event":"registered","username":"aa"}}}
    let outResp = {};
    let connection = null;

    if (event.event.jsep && event.event.jsep.type === "offer" && event.event.owner && event.event.owner === "local") {
        console.log("incoming call alert to callee.. inform callee");
        //connection = global[global.call_map[event.session_id]];
        connection = global[event.session_id];
        outResp.type = "incoming_call";
        outResp.caller_sdp = event.event.jsep.sdp;
        outResp.from = "huehuehue";
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