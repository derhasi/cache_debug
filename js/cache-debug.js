/**
 * @file
 * Attaches behaviors for cache_debug.
 */

(function ($, Drupal, JSON) {

  'use strict';

  /**
   * Attaches outline behavior for regions associated with contextual links.
   *
   * Events
   *   Contextual triggers an event that can be used by other scripts.
   *   - drupalContextualLinkAdded: Triggered when a contextual link is added.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *  Attaches the outline behavior to the right context.
   */
  Drupal.behaviors.CacheDebug = {
    attach: function (context) {

      var $node = $('.recipe');

      $('*', context).once('cache-helper').each(function() {

        var data = Drupal.CacheDebug.getData(this);
        if (data && data.length) {
          Drupal.CacheDebug.buildData(this);
        }
      });
    }
  };


  Drupal.CacheDebug = {

    prefix: 'CACHE_DEBUG:',

    getComments: function(elem) {
      var children = elem.childNodes;
      var comments = [];

      for (var i=0, len=children.length; i<len; i++) {
        if (children[i].nodeType == Node.COMMENT_NODE) {
          comments.push(children[i].data.trim());
        }
      }
      return comments;
    },

    getData: function (el) {
      var comments = Drupal.CacheDebug.getComments(el);
      var data = [];
      for (var i = 0; i < comments.length; i++) {
        if (comments[i].indexOf(Drupal.CacheDebug.prefix) === 0) {
          data.push(
            JSON.parse(comments[i].substr(Drupal.CacheDebug.prefix.length))
          );
        }
      }
      return data;
    },

    buildData: function (el) {
      var data = Drupal.CacheDebug.getData(el);
      var keys = {};
      data.forEach(function(value) {
        var parts = value.cid.split(':[', 2);
        var pureCID = parts[0];
        keys[pureCID] = 1;
      });
      $(el).attr('data-cache-helper', Object.keys(keys).join('\n'));
    },


    buildInterface: function (el) {
      var data = Drupal.CacheDebug.getData(el);

      if (data && data.length) {

        var container = $('<div class="cache-helper"></div>');

        for (var i = 0; i < data.length; i++) {
          var obj = data[i];
          container.append('<span>' + obj.cid + '</span>');
        }

        $(el).append(container);
      }
    }
  }

})(jQuery, Drupal, window.JSON);
