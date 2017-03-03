/**
 * @file
 * Attaches behaviors for cache_debug.
 */

(function ($, Drupal, JSON, document) {

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
        $(this).drupalCacheDebug({});
      });

      // Ensure wrapper exists.
      Drupal.CacheDebugWrapper.wrapper();
    }
  };

  /*
   * jQuery plugin wrapper.
   *
   * @returns {Drupal.CacheDebug}
   */
  $.fn['drupalCacheDebug'] = function (options) {
    var plugin = this.data('plugin_drupalCacheDebug');

    // has plugin instantiated ?
    if (plugin instanceof Drupal.CacheDebug) {
      // if have options arguments, call plugin.init() again
      if (typeof options !== 'undefined') {
        plugin.init(options);
      }
    }
    else {
      plugin = new Drupal.CacheDebug(this, options);
      this.data('plugin_drupalCacheDebug', plugin);
    }

    return plugin;
  };

  /**
   * Cache debug element handling.
   * @param {jQuery} el
   * @constructor
   */
  Drupal.CacheDebug = function (element, options) {
    this.$element = element;
    this.options = {};
    this.data = [];
    this.init(options);
  };

  /**
   * Get comments for the element.
   * @returns {Array}
   */
  Drupal.CacheDebug.prototype.getComments = function() {
    var node = this.$element[0];
    var comments = [];
    // Comments for the element, are those preceeding the element itself, so we
    // run through the previous siblings till we have no siblings anymore or we
    // get another element.
    while (node.previousSibling && node.previousSibling.nodeType !== Node.ELEMENT_NODE) {
      node = node.previousSibling;
      if (node.nodeType == Node.COMMENT_NODE) {
        comments.push(node.data.trim());
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
   * Initialize.
   *
   * @param options
   */
  Drupal.CacheDebug.prototype.init = function(options) {
    $.extend(this.options, options);
    this.buildData();
    var obj = this;

    if (this.data.length) {
      var attrValue = this.buildAttrValue();
      this.$element.attr('data-cache-debug', attrValue);
      this.$element.mouseenter(function(){
        Drupal.CacheDebugWrapper.fill(obj.$element);
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
      cids[item.getKeys()] = 1;
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
      var wrapper = $('<div>', {class: "cache-debug-item", "data-cache-debug-method": item.method});
      $('<div>', {class: 'cache-debug-item__method'}).text(item.method).appendTo(wrapper);
      $('<div>', {class: 'cache-debug-item__keys'}).text(item.getKeys()).appendTo(wrapper);

      if (item.contexts && item.contexts.length) {
        var contexts = $('<ul>', {class:'cache-debug-item__contexts'}).appendTo(wrapper);
        item.contexts.forEach(function(context) {
          $('<li>', {class:'cache-debug-item__contexts'}).text(context).appendTo(contexts);
        });
      };

      if (item.tags && item.tags.length) {
        var tags = $('<ul>', {class:'cache-debug-item__tags'}).appendTo(wrapper);
        item.tags.forEach(function(tag) {
          $('<li>', {class: 'cache-debug-item__tag'}).text(tag).appendTo(tags);
        });
      };
      html.append(wrapper);
    });
    return html;
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
    this.keys = [];
    this.contexts = [];
    this.processCID();
  };

  /**
   * Process CID to fill keys and contexts.
   */
  Drupal.CacheDebugItem.prototype.processCID = function() {
    this.keys = [];
    this.contexts = [];
    var obj = this;

    const regex = /([^\[:]*|\[[^\]]*\]=[^:]*)(:|$)/g;
    var result;

    while ((result = regex.exec(this.cid)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (result.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      // Skip empty results.
      if (!result[1].length) {
        // Nothing
      }
      else if (result[1].indexOf('[') === 0) {
        obj.contexts.push(result[1]);
      }
      else {
        obj.keys.push(result[1]);
      }
    }
  };

  /**
   * Provides the keys without context.
   * @returns {String}
   */
  Drupal.CacheDebugItem.prototype.getKeys = function() {
    return this.keys.join(':');
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

  /**
   * Wrapper element to shoe debug data.
   * @type {{wrapper: Drupal.CacheDebugWrapper.wrapper, baseElement: null, fill: Drupal.CacheDebugWrapper.fill}}
   */
  Drupal.CacheDebugWrapper = {
    wrapper: function() {
      // In case cache debug wrapper is not present, we build it.
      if (!$('#cache-debug').length) {

        var wrapper = $('<div>', {id:'cache-debug', class:'cache-debug-wrapper'}).appendTo('body');
        $('html').attr('data-cache-debug-mode', 'hide');

        // Actions
        var actions = $('<div>', {class:'cache-debug-wrapper__actions'}).appendTo(wrapper);
        $('<span>').text('BOTH').appendTo(actions).on('click', function() {
          $('html').attr('data-cache-debug-mode', 'both');
        });
        $('<span>').text('GET').appendTo(actions).on('click', function() {
          $('html').attr('data-cache-debug-mode', 'get');
        });
        $('<span>').text('SET').appendTo(actions).on('click', function() {
          $('html').attr('data-cache-debug-mode', 'set');
        });
        $('<span>').text('hide').appendTo(actions).on('click', function() {
          $('html').attr('data-cache-debug-mode', 'hide');
        });

        $(document).on('keyup.cache-debug', function(e) {
          // Remove wrapper when escape key is pressed.
          if (e.keyCode == 27) {
            $('#cache-debug').remove();
            $(document).off('keyup.cache-debug');
          }
        });
      }
      return $('#cache-debug');
    },

    /**
     * @type {jQuery}
     */
    baseElement: null,

    /**
     *
     * @param {jQuery} element
     */
    fill: function(element) {
      Drupal.CacheDebugWrapper.baseElement = element;
      var content = element.drupalCacheDebug().buildHtml();
      Drupal.CacheDebugWrapper.wrapper().find('.cache-debug').remove();
      Drupal.CacheDebugWrapper.wrapper().append(content);
    }
  }



})(jQuery, Drupal, window.JSON, document);
