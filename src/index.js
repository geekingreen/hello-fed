/**
 * App ID for the skill
 */
var APP_ID = 'amzn1.echo-sdk-ams.app.b09b3487-6b1f-4558-babb-ae636f0e1b27';
var APP_NAME = 'HelloFed';

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');
var store = require('./store');

/**
 * HelloWorld is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var ChuckNorris = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
ChuckNorris.prototype = Object.create(AlexaSkill.prototype);
ChuckNorris.prototype.constructor = ChuckNorris;

ChuckNorris.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log(APP_NAME + " onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

ChuckNorris.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log(APP_NAME + " onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    store.loadData(session, function(storage) {
      var speechOutput = '';
      var reprompt;

      if (storage.isEmptyList()) {
        speechOutput += 'Welcome to Hello Fed, Let\'s get started by adding some names...';
        reprompt = 'Please tell me a name of a Fed.';
      } else {
        speechOutput += 'What can I do for you?';
        reprompt = 'You can say something like, add John, or say hello.';
      }
      response.ask(speechOutput, reprompt);
    });
};

ChuckNorris.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log(APP_NAME + " onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

ChuckNorris.prototype.intentHandlers = {
    // register custom intent handlers
    AddName: function (intent, session, response) {
      var name = intent.slots.Name.value;
      store.loadData(session, function(storage) {
        var speechOutput, reprompt;
        if (storage.data.names.some(function(n) { return n === name; })) {
          speechOutput = name + ' has already been added. Would you like to add someone else?';
          response.ask(speechOutput);
          return;
        }
        speechOutput = name + ' has been added. You can say I\'m finished or add another name.';
        reprompt = 'Anyone else?';
        storage.data.names.push(name);
        storage.save(function() {
          response.ask(speechOutput, reprompt);
        });
      });
    },
    SayHello: function(intent, session, response) {
      store.loadData(session, function(storage) {
        var speechOutput = 'Hello ' + storage.data.names.join(', ');
        response.tell(speechOutput);
      });
    },
    Reset: function(intent, session, response) {
      store.newStore(session).save(function() {
        response.ask('All names have been removed, who would you like to add now?');
      });
    },
    Help: function (intent, session, response) {
        response.ask("You can ask me to add a name, or say hello.");
    },
    Exit: function (intent, session, response) {
      response.tell('Okay. Whenever you\'re ready, you can ask me to say hello.');
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HelloWorld skill.
    var chuckNorris = new ChuckNorris();
    chuckNorris.execute(event, context);
};
