'use strict';
var AWS = require("aws-sdk");

var store = (function() {
  var db = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

  function Store(session, data) {
    if (data) {
      this.data = data;
    } else {
      this.data = {
        names: []
      };
    }
    this._session = session;
  }

  Store.prototype.isEmptyList = function() {
    return this.data.length === 0;
  };

  Store.prototype.save = function(cb) {
    this._session.attributes.currentData = this.data;

    db.putItem({
      TableName: 'ASK',
      Item: {
        userId: {
          S: this._session.user.userId
        },
        appName: {
          S: 'HelloFed'
        },
        data: {
          S: JSON.stringify(this.data)
        }
      }
    }, function(err, data) {
      if (err) {
        console.log('Error: ' + err);
      }
      if (cb) {
        cb();
      }
    });
  };

  return {
    loadData: function(session, cb) {
      if (session.attributes.currentData) {
        console.log('Load data from session=' + session.attributes.currentData);
        cb(new Store(session, session.attributes.currentData));
        return;
      }
      db.getItem({
        TableName: 'ASK',
        Key: {
          userId: {
            S: session.user.userId
          },
          appName: {
            S: 'HelloFed'
          }
        }
      }, function (err, data) {
        var currentData;
        if (err) {
          console.log(err, err.stack);
          store = new Store(session);
          session.attributes.currentData = store.data;
          cb(store);
        } else if (data.Item === undefined) {
          store = new Store(session);
          session.attributes.currentData = store.data;
          cb(store);
        } else {
          console.log('Load data from dynamodb=' + data.Item.data.S);
          store = new Store(session, JSON.parse(data.Item.data.S));
          session.attributes.currentData = store.data;
          cb(store);
        }
      });
    },
    newStore: function(session) {
      return new Store(session);
    }
  };
})();

module.exports = store;
