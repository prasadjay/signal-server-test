const request = require('request');
const Promise = require("bluebird");

module.exports.CreateSession = async () => {
    return new Promise(function (resolve, reject) {
        request({
            url: `http://localhost:8088/janus/`,
            headers: {},
            method: 'POST',
            json: {
                "janus": "create",
                "transaction": "123123fdaf"
            }
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log("CREATE_SESSION_RESP", JSON.stringify(body));
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
};

module.exports.AttachPlugin = async (session_id, plugin_name) => {
    return new Promise(function (resolve, reject) {
        request({
            url: `http://localhost:8088/janus/` + session_id,
            headers: {},
            method: 'POST',
            json: {
                "janus": "attach",
                "plugin": plugin_name,
                "transaction": "123123",
                "opaque_id": "456456"
            }
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log("ATTACH_PLUGIN_RESP", JSON.stringify(body));
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
};

module.exports.RegisterUser = async (session_id, handle_id, username) => {
    //{"janus":"message","body":{"request":"register","username":"qq"},"transaction":"Fi7nRgeSW7Jx"}
    return new Promise(function (resolve, reject) {
        request({
            url: `http://localhost:8088/janus/` + session_id + "/" + handle_id,
            headers: {},
            method: 'POST',
            json: {
                "janus": "message",
                "body": {
                    "request": "register",
                    "username": username
                },
                "transaction": "123123"
            }
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log("REG_USER_RESP", username, JSON.stringify(body));
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
};

module.exports.GetUserList = async (session_id, handle_id) => {
//{"janus":"message","body":{"request":"list"},"transaction":"4ne5cSCgQWzh"}
    return new Promise(function (resolve, reject) {
        request({
            url: `http://localhost:8088/janus/` + session_id + "/" + handle_id,
            headers: {},
            method: 'POST',
            json: {
                "janus": "message",
                "body": {
                    "request": "list"
                },
                "transaction": "123123"
            }
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log("GET_USER_LIST_RESP", username, JSON.stringify(body));
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
};

module.exports.CreateOffer = async (session_id, handle_id, recipient, caller_sdp) => {
    //{"janus":"message","body":{"request":"call","username":"vv"},"transaction":"XIndw5DZk9HR","jsep":{"type":"offer","sdp":""}}
    let json_object = {
        "janus": "message",
        "body": {
            "request": "call",
            "username": recipient
        },
        "transaction": "XIndw5DZk9HR",
        "jsep": {
            "type": "offer",
            //"trickle": false,
            "sdp": caller_sdp
        }
    };

    console.log("DO_OFFER_REQ", JSON.stringify(json_object));

    return new Promise(function (resolve, reject) {
        request({
            url: `http://localhost:8088/janus/` + session_id + "/" + handle_id,
            headers: {},
            method: 'POST',
            json: json_object
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log("DO_OFFER", JSON.stringify(body));
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
};

module.exports.DestroySession = async (session_id) => {
    return new Promise(function (resolve, reject) {
        request({
            url: `http://localhost:8088/janus/` + session_id,
            headers: {},
            method: 'POST',
            json: {
                "janus": "destroy",
                "transaction": "123123fdaf"
            }
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log("DESTROY_SESSION_RESP", JSON.stringify(body));
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
};

module.exports.CreateAnswer = async (session_id, handle_id, callee_sdp) => {
    //{"janus":"message","body":{"request":"call","username":"vv"},"transaction":"XIndw5DZk9HR","jsep":{"type":"offer","sdp":""}}
    let json_object = {
        "janus": "message",
        "body": {
            "request": "accept"
        },
        "transaction": "XIndw5DZk9HR",
        "jsep": {
            "type": "answer",
            //  "trickle": false,
            "sdp": callee_sdp
        }
    };

    console.log("DO_ANSWER_REQ", JSON.stringify(json_object));
    console.log("DO_ANSWER_URL", `http://localhost:8088/janus/` + session_id + "/" + handle_id);

    return new Promise(function (resolve, reject) {
        request({
            url: `http://localhost:8088/janus/` + session_id + "/" + handle_id,
            headers: {},
            method: 'POST',
            json: json_object
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log("DO_ANSWER", JSON.stringify(body));
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
};

module.exports.CreateTrickle = async (session_id, handle_id, candidate) => {
    //{"janus":"message","body":{"request":"call","username":"vv"},"transaction":"XIndw5DZk9HR","jsep":{"type":"offer","sdp":""}}
    let json_object = {
        "janus": "trickle",
        "transaction": "hehe83hd8dw12e",
        "candidate": candidate
    };

    console.log("DO_TRICKLE_REQ", JSON.stringify(json_object));
    console.log("DO_TRICKLE_URL", `http://localhost:8088/janus/` + session_id + "/" + handle_id);

    return new Promise(function (resolve, reject) {
        request({
            url: `http://localhost:8088/janus/` + session_id + "/" + handle_id,
            headers: {},
            method: 'POST',
            json: json_object
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log("DO_TRICKLE", JSON.stringify(body));
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
};

module.exports.EndTrickle = async (session_id, handle_id, candidate) => {
    //{"janus":"message","body":{"request":"call","username":"vv"},"transaction":"XIndw5DZk9HR","jsep":{"type":"offer","sdp":""}}
    let json_object = {
        "janus": "trickle",
        "transaction": "hehe83hd8dw12e",
        "candidate": {
            "completed": true
        }
    };

    console.log("DO_TRICKLE_END_REQ", JSON.stringify(json_object));
    console.log("DO_TRICKLE_END_URL", `http://localhost:8088/janus/` + session_id + "/" + handle_id);

    return new Promise(function (resolve, reject) {
        request({
            url: `http://localhost:8088/janus/` + session_id + "/" + handle_id,
            headers: {},
            method: 'POST',
            json: json_object
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log("DO_TRICKLE_END", JSON.stringify(body));
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
};

module.exports.SetRecording = async (session_id, handle_id, type) => {
    //{"janus":"message","body":{"request":"call","username":"vv"},"transaction":"XIndw5DZk9HR","jsep":{"type":"offer","sdp":""}}
    let json_object = {
        "janus": "message",
        "body": {
            "request": "set",
            //   "audio": true,
            //  "video": true,
            // "bitrate": 1024000,
            "record": true,
            "filename": "/home/jay/recordings_raw/" + session_id + "-" + type
        },
        "transaction": "XIndw5DZk9HR"
    };

    console.log("DO_SET_REQ", JSON.stringify(json_object));
    console.log("DO_SET_URL", `http://localhost:8088/janus/` + session_id + "/" + handle_id);

    return new Promise(function (resolve, reject) {
        request({
            url: `http://localhost:8088/janus/` + session_id + "/" + handle_id,
            headers: {},
            method: 'POST',
            json: json_object
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log("DO_SET", JSON.stringify(body));
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
};

module.exports.DisableAudio = async (session_id, handle_id) => {
    //{"janus":"message","body":{"request":"call","username":"vv"},"transaction":"XIndw5DZk9HR","jsep":{"type":"offer","sdp":""}}
    let json_object = {
        "janus": "message",
        "body": {
            "request": "set",
            "audio": false,
            //  "video": true,
        },
        "transaction": "XIndw5DZk9HR"
    };

    console.log("DO_DISABLE_AUDIO_REQ", JSON.stringify(json_object));
    console.log("DO_DISABLE_AUDIO_URL", `http://localhost:8088/janus/` + session_id + "/" + handle_id);

    return new Promise(function (resolve, reject) {
        request({
            url: `http://localhost:8088/janus/` + session_id + "/" + handle_id,
            headers: {},
            method: 'POST',
            json: json_object
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log("DO_DISABLE_AUDIO", JSON.stringify(body));
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
};
