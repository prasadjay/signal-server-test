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
            "trickle": false,
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

module.exports.CreateAnswer = async (session_id, handle_id, sdp) => {

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