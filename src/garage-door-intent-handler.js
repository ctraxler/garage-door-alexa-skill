/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 *
 */

/**
 * App ID for the skill
 */
 var APP_ID = 'amzn1.ask.skill.74965afb-f41d-4622-afb3-17a097563d46'; 
 

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');
var AWS = require('aws-sdk');

/**
 * GarageDoorIntentHandler is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var GarageDoorIntentHandler = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
GarageDoorIntentHandler.prototype = Object.create(AlexaSkill.prototype);
GarageDoorIntentHandler.prototype.constructor = GarageDoorIntentHandler;

GarageDoorIntentHandler.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("GarageDoorIntentHandler onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

GarageDoorIntentHandler.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("GarageDoorIntentHandler onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to the Automated Garage door for Alexa, you can say open the garage door or close the garage door";
    var repromptText = "You can say open or close the garage door";
    response.ask(speechOutput, repromptText);
};

GarageDoorIntentHandler.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("GarageDoorIntentHandler onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

var that = this; 

GarageDoorIntentHandler.prototype.intentHandlers = {
    
    // register custom intent handlers
    "moveDoorIntent": function (intent, session, response) {
        
        var responseString = ''; 
        
        var iotData = new AWS.IotData({endpoint: "a3riiqm5a27d7f.iot.us-east-1.amazonaws.com"});
        
        var params = { "thingName" : "home-garage-door" };
        
        // get the shadow for the home-garage-door
        console.log('Getting thing shadow');
        
        iotData.getThingShadow(params, function(err, data) {
            console.log('Inside of getThingShadow callback');
            if (err){
                //Handle the error here
                console.log('Problem getting the thing shadow');
                console.log(err, err.stack);
                responseString = "I had trouble contacting the garage door, sorry";
            }
            else {
                console.log("Data back from shadow", JSON.stringify(data));
                handleMoveDoorIntent(intent, JSON.parse(data.payload), iotData, response);
            }
        });
        
    },
    
    "getDoorStateIntent": function (intent, session, response) {
        var responseString = ''; 
        
        var iotData = new AWS.IotData({endpoint: "a3riiqm5a27d7f.iot.us-east-1.amazonaws.com"});
        
        console.log('iotData: ' + JSON.stringify(iotData));
        
        var params = { "thingName" : "home-garage-door" };        
        
        iotData.getThingShadow(params, function(err, data) {
            console.log('Inside of getThingShadow callback');
            if (err){
                //Handle the error here
                console.log('Problem getting the thing shadow');
                console.log(err, err.stack);
                responseString = "I had trouble contacting the garage door, sorry";
            }
            else {
                console.log("Data back from shadow", data);
                
                var payload = JSON.parse(data.payload);
                
                console.log('payload.state.reported.status: ' + payload.state.reported.status);
                
                switch (payload.state.reported.status.toUpperCase()) {
                    
                    case 'OPEN': 
                        responseString = "The garage door is open"; 
                        response.tellWithCard(responseString, "Garage Door", responseString);
                    break;
                    
                    case 'CLOSED': 
                        responseString = "The garage door is closed"; 
                        response.tellWithCard(responseString, "Garage Door", responseString);
                    break;
                    
                    case 'INBETWEEN':
                        responseString = "The garage door is part way open"; 
                        response.tellWithCard(responseString, "Garage Door", responseString);
                    break;
                    
                    default: 
                        responseString = "I am not sure"; 
                        response.tellWithCard(responseString, "Garage Door", responseString);                        
                }
            }
        }); // getThingShadow
    }
};



function handleMoveDoorIntent(thisIntent, thisObjState, thisIotData, thisResponse) {
            
    var responseString = ''; 
        var params = {
            "thingName" : "home-garage-door"
        };
            
    switch(thisIntent.slots.direction.value.toUpperCase()) {

        case 'OPEN':

            console.log('objState: ' + JSON.stringify(thisObjState));
            switch (thisObjState.state.reported.status.toUpperCase()) {
                case 'OPEN': 
                    responseString = "I checked and the door is already open"; 
                    thisResponse.tellWithCard(responseString, "Garage Door", responseString);
                    break;
                case 'CLOSED':
                    params.payload = buildObjectState('desired', 'doorActivated', "true", 'string');
                    console.log('Update Thing payload: ' + params.payload); 
                    thisIotData.updateThingShadow(params, function(err, data) {
                        if (err){
                            //Handle the error here
                            console.log(err, err.stack);
                            responseString = "I had trouble doing that, sorry";
                            thisResponse.tellWithCard(responseString, "Door Open or Close", responseString);
                        }
                        else {
                            responseString = "Ok, I opened the garage door";
                            console.log("Data back from shadow", data);
                            thisResponse.tellWithCard(responseString, "Garage Door", responseString);
                        }
                    });
                    break;
                    
                case 'INBETWEEN': 
                    params.payload = buildObjectState('desired', 'doorActivated', "true", 'string');
                    console.log('Update Thing payload: ' + params.payload); 
                    thisIotData.updateThingShadow(params, function(err, data) {
                        if (err){
                            //Handle the error here
                            console.log(err, err.stack);
                            responseString = "I had trouble doing that, sorry";
                            thisResponse.tellWithCard(responseString, "Garage Door", responseString);
                        }
                        else {
                            responseString = "The door seems to be halfway open, not sure if the door will end up open or closed. You can ask the garage door if it is open or closed.";
                            console.log("Data back from shadow", data);
                            thisResponse.tellWithCard(responseString, "Garage Door", responseString);
                        }
                    });                    
                    
                    break;
                    
                default:
                
            }
            break;

        case 'CLOSE':
        case 'SHUT':
            console.log('objState: ' + JSON.stringify(thisObjState));
            switch (thisObjState.state.reported.status.toUpperCase()) {
                case 'CLOSED': 
                    responseString = "I checked and the door is already closed"; 
                    thisResponse.tellWithCard("responseString", "Garage Door", responseString);
                    break;
                case 'OPEN':
                    responseString = "Ok, I am closing the garage door"; 
                    params.payload = buildObjectState('desired', 'doorActivated', "true", 'string');
                    console.log('Update Thing payload: ' + params.payload); 
                    thisIotData.updateThingShadow(params, function(err, data) {
                        if (err){
                            //Handle the error here
                            console.log(err, err.stack);
                            responseString = "I had trouble doing that, sorry";
                            thisResponse.tellWithCard("responseString", "Garage Door", responseString);
                        }
                        else {
                            responseString = "Ok, I closed the garage door";
                            console.log("Data back from shadow", data);
                            thisResponse.tellWithCard("responseString", "Garage Door", responseString);
                        }
                    });
                    break;
                    
                case 'INBETWEEN': 
                    params.payload = buildObjectState('desired', 'doorActivated', "true", 'string');
                    console.log('Update Thing payload: ' + params.payload); 
                    thisIotData.updateThingShadow(params, function(err, data) {
                        if (err){
                            //Handle the error here
                            console.log(err, err.stack);
                            responseString = "I had trouble doing that, sorry";
                            thisResponse.tellWithCard("responseString", "Door Open or Close", responseString);
                        }
                        else {
                            responseString = "The door seems to be halfway open, not sure if the door will end up open or closed. You can ask the garage door if it is open or closed.";
                            console.log("Data back from shadow", data);
                            thisResponse.tellWithCard("responseString", "Door Open or Close", responseString);
                        }
                    });                    
                    
                    break;
                    
                default:
                
                responseString = "I didn't get that";
                console.log("Unknown intent");
                thisResponse.tellWithCard("responseString", "Garage Door", responseString);
            }

            break;

        default: 
            responseString = "I didn't get that";
            console.log("Unknown intent");
            thisResponse.tellWithCard("responseString", "Garage Door", responseString);
    }
}


/**
*   Helper function to build the state object for the shadow document
**/

function buildObjectState (section, key, value, format) {

    var objState =  {state: {}};

    objState.state[section] = {};
    objState.state[section][key] = value;


    if (format === 'object') {
        return objState;
    } else if (format === 'string') {
        return JSON.stringify(objState);
    } else return; 

}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    
    console.log('received an event'); 
    // Create an instance of the garageDoorIntentHandler.
    var garageDoorIntentHandler = new GarageDoorIntentHandler();
    garageDoorIntentHandler.execute(event, context);
};

