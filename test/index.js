/* jshint node: true */
'use strict';

var asms = require('activitystreams');
var assert = require('chai').assert;

var activity;

exports.Activity = {
  beforeEach: function () {
    activity = asms.Activity({
      verb: 'post',
      actor: {
        displayName: 'Joe',
        id: 'acct:joe@example.org'
      },
      object: {
        objectType: 'note',
        content: 'This is a short note'
      },
      updated: new Date()
    });
  },
  '#toString()': {
    'does not throw an exception': function () {
      assert.doesNotThrow(function () {
        activity.toString();
      });
    }
  }
};
