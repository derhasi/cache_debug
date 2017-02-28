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
      // Initialise for each element on the site.
      $('*', context).once('cache-debug').each(function() {
        Drupal.CacheDebug.create(this);
      });
    }
  };

  /**
   *
   * @param el
   * @constructor
   */
  Drupal.CacheDebug = function (el) {
    this.el = el;
    this.data = [];
  };

  /**
   * Creates a cache debug instance for this element.
   * @param el
   */
  Drupal.CacheDebug.create = function (el) {
    var obj = new Drupal.CacheDebug(el);
    obj.bind();
  };

  /**
   * Get comments from the element.
   * @returns {Array}
   */
  Drupal.CacheDebug.prototype.getComments = function() {
    var children = this.el.childNodes;
    var comments = [];

    for (var i=0, len=children.length; i<len; i++) {
      if (children[i].nodeType == Node.COMMENT_NODE) {
        comments.push(children[i].data.trim());
      }
    }
    return comments;
  };

  /**
   * Build data information.
   * @returns {Array}
   */
  Drupal.CacheDebug.prototype.buildData = function () {
    var comments = this.getComments();
    this.data = [];
    for (var i = 0; i < comments.length; i++) {
      if (Drupal.CacheDebugItem.isValid(comments[i])) {
        this.data.push(new Drupal.CacheDebugItem(comments[i]));
      }
    }
    return this;
  };

  /**
   * Binds functionality to the DOM.
   */
  Drupal.CacheDebug.prototype.bind = function() {
    var obj = this;
    this.buildData();
    if (this.data.length) {
      var attrValue = this.buildAttrValue();
      $(this.el).attr('data-cache-debug', attrValue);
      $(this.el).mouseenter(function(){

        var wrapper = obj.prepareWrapper();
        wrapper.html('');
        wrapper.append(obj.buildHtml());
      });
    }
  };

  /**
   * Builds the string for adding to the element.
   * @returns {string}
   */
  Drupal.CacheDebug.prototype.buildAttrValue = function () {
    var cids = {};
    this.data.forEach(function(item) {
      cids[item.pureCID()] = 1;
    });
    return Object.keys(cids).join('\n');
  };

  /**
   * Builds an HTMl representation of the cache debug data.
   * @returns {*|HTMLElement}
   */
  Drupal.CacheDebug.prototype.buildHtml = function () {
    var html = $('<div class="cache-debug"></div>');

    this.data.forEach(function(item) {
      var wrapper = $('<div class="cache-debug-item"></div>');
      $('<div class="cache-debug-item__method"></div>').text(item.method).appendTo(wrapper);
      $('<div class="cache-debug-item__cid"></div>').text(item.cid).appendTo(wrapper);
      $('<div class="cache-debug-item__tags"></div>').text(item.tags).appendTo(wrapper);
      html.append(wrapper);
    });
    return html;
  };

  /**
   * Prepares the wrapper element.
   * @returns {jQuery}
   */
  Drupal.CacheDebug.prototype.prepareWrapper = function() {
    if (!$('#cache-debug').length) {
      $('body').append('<div id="cache-debug"></div>');
    }
    return $('#cache-debug');
  };

  /**
   * Representation of a single cache debug information.
   * @param {String} raw_string
   * @constructor
   */
  Drupal.CacheDebugItem = function (raw_string) {
    var item = JSON.parse(raw_string.trim().substr(Drupal.CacheDebugItem.prefix.length));
    this.cid = item.cid;
    this.method = item.method;
    this.tags = item.tags;
  };

  /**
   * Provides the pure CID without context.
   * @returns {String}
   */
  Drupal.CacheDebugItem.prototype.pureCID = function() {
    var parts = this.cid.split(':[', 2);
    return parts[0];
  };

  /**
   * The prefix fo recognisiing cache debug data.
   * @type {string}
   */
  Drupal.CacheDebugItem.prefix = 'CACHE_DEBUG:';

  /**
   * Checks if the string is a valid cache debut data.
   * @param raw_string
   * @returns {boolean}
   */
  Drupal.CacheDebugItem.isValid = function (raw_string) {
    return (raw_string.trim().indexOf(Drupal.CacheDebugItem.prefix) === 0);
  };


})(jQuery, Drupal, window.JSON);
