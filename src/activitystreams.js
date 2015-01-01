/**
 * Copyright 2013 OpenSocial Foundation
 * Copyright 2013 International Business Machines Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Utility library for working with Activity Streams Actions
 * Requires underscorejs.
 *
 * @author James M Snell (jasnell@us.ibm.com)
 */

var models = require('./models'),
    Reasoner = require('./reasoner').Reasoner,
    EventEmitter = require('events').EventEmitter,
    as = require('./vocabs').as,
    utils = require('./utils');

exports = module.exports = new EventEmitter();

(function(exports) {

  var merge_types = utils.merge_types;

  new Reasoner(function(reasoner) {
    utils.defineHidden(exports, '_reasoner', reasoner);

    exports.import = function(input, callback) {
      utils.throwif(typeof callback !== 'function', 'A callback function must be given');
      utils.jsonld.import(reasoner, input, function(err, doc) {
        if (err) {
          callback(err);
          return;
        }
        callback(null,doc);
      });
    };

    exports.object = function(types) {
      return models.Object.Builder(reasoner, types);
    };
    exports.actor = function(types) {
      return models.Actor.Builder(reasoner, types);
    };
    exports.activity = function(types) {
      return models.Activity.Builder(reasoner, types);
    };
    exports.collection = function(types) {
      return models.Collection.Builder(reasoner, types);
    };
    exports.orderedCollection = function(types) {
      return models.OrderedCollection.Builder(reasoner, types);
    };
    exports.content = function(types) {
      return models.Content.Builder(reasoner, types);
    };
    exports.link = function(types) {
      return models.Link.Builder(reasoner, types);
    };
    exports.accept = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Accept, types));
    };
    exports.tentativeAccept = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.TentativeAccept, types));
    };
    exports.add = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Add, types));
    };
    exports.arrive = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Arrive, types));
    };
    exports.create = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Create, types));
    };
    exports.delete = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Delete, types));
    };
    exports.favorite = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Favorite, types));
    };
    exports.follow = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Follow, types));
    };
    exports.ignore = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Ignore, types));
    };
    exports.join = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Join, types));
    };
    exports.leave = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Leave, types));
    };
    exports.like = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Like, types));
    };
    exports.offer = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Offer, types));
    };
    exports.connect = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Connect, types));
    };
    exports.friendRequest = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.FriendRequest, types));
    };
    exports.give = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Give, types));
    };
    exports.invite = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.invite, types));
    };
    exports.post = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Post, types));
    };
    exports.reject = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Reject, types));
    };
    exports.tentativeReject = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.TentativeReject, types));
    };
    exports.remove = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Remove, types));
    };
    exports.review = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Review, types));
    };
    exports.save = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Save, types));
    };
    exports.share = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Share, types));
    };
    exports.undo = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Undo, types));
    };
    exports.update = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Update, types));
    };
    exports.experience = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Experience, types));
    };
    exports.view = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.View, types));
    };
    exports.watch = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Watch, types));
    };
    exports.listen = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Listen, types));
    };
    exports.read = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Read, types));
    };
    exports.respond = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Respond, types));
    };
    exports.move = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Move, types));
    };
    exports.travel = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Travel, types));
    };
    exports.announce = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Announce, types));
    };
    exports.block = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Block, types));
    };
    exports.flag = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Flag, types));
    };
    exports.dislike = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Dislike, types));
    };
    exports.confirm = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Confirm, types));
    };
    exports.assign = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Assign, types));
    };
    exports.complete = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Complete, types));
    };
    exports.achieve = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Achieve, types));
    };
    exports.application = function(types) {
      return models.Actor.Builder(reasoner, merge_types(reasoner, as.Application, types));
    };
    exports.content = function(types) {
      return models.Content.Builder(reasoner, types, types);
    };
    exports.device = function(types) {
      return models.Actor.Builder(reasoner, merge_types(reasoner, as.Device, types));
    };
    exports.group = function(types) {
      return models.Actor.Builder(reasoner, merge_types(reasoner, as.Group, types));
    };
    exports.organization = function(types) {
      return models.Actor.Builder(reasoner, merge_types(reasoner, as.Organization, types));
    };
    exports.person = function(types) {
      return models.Actor.Builder(reasoner, merge_types(reasoner, as.Person, types));
    };
    exports.process = function(types) {
      return models.Actor.Builder(reasoner, merge_types(reasoner, as.Process, types));
    };
    exports.role = function(types) {
      return models.Actor.Builder(reasoner, merge_types(reasoner, as.Role, types));
    };
    exports.service = function(types) {
      return models.Actor.Builder(reasoner, merge_types(reasoner, as.Service, types));
    };
    exports.article = function(types) {
      return models.Content.Builder(reasoner, merge_types(reasoner, as.Article, types));
    };
    exports.album = function(types) {
      return models.Collection.Builder(reasoner, merge_types(reasoner, as.Album, types));
    };
    exports.folder = function(types) {
      return models.Collection.Builder(reasoner, merge_types(reasoner, as.Folder, types));
    };
    exports.story = function(types) {
      return models.OrderedCollection.Builder(reasoner, merge_types(reasoner, as.Story, types));
    };
    exports.document = function(types) {
      return models.Content.Builder(reasoner, merge_types(reasoner, as.Document, types));
    };
    exports.audio = function(types) {
      return models.Content.Builder(reasoner, merge_types(reasoner, as.Audio, types));
    };
    exports.image = function(types) {
      return models.Content.Builder(reasoner, merge_types(reasoner, as.Image, types));
    };
    exports.video = function(types) {
      return models.Content.Builder(reasoner, merge_types(reasoner, as.Video, types));
    };
    exports.note = function(types) {
      return models.Content.Builder(reasoner, merge_types(reasoner, as.Note, types));
    };
    exports.page = function(types) {
      return models.Content.Builder(reasoner, merge_types(reasoner, as.Page, types));
    };
    exports.possibleAnswer = function(types) {
      return models.PossibleAnswer.Builder(reasoner, types);
    };
    exports.question = function(types) {
      return models.Question.Builder(reasoner, types);
    };
    exports.event = function(types) {
      return models.Object.Builder(reasoner, merge_types(reasoner, as.Event, types));
    };
    exports.place = function(types) {
      return models.Place.Builder(reasoner, types);
    };
    exports.reservation = function(types) {
      return models.Activity.Builder(reasoner, merge_types(reasoner, as.Reservation, types));
    };
    exports.mention = function(types) {
      return models.Link.Builder(reasoner, merge_types(reasoner, as.Mention, types));
    };
    exports.emit('ready');
  }, function(err) {
    exports.emit('error', err);
  });
})(exports);
