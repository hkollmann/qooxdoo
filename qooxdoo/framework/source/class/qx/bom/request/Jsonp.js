/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tristan Koch (tristankoch)

************************************************************************ */

qx.Bootstrap.define("qx.bom.request.Jsonp",
{
  extend : qx.bom.request.Script,

  construct : function()
  {
    // Borrow super-class constructor
    qx.bom.request.Script.apply(this);

    this.__generateId();
  },

  members :
  {
    responseJson: null,

    __id: null,
    __callbackParam: null,
    __callbackName: null,
    __callbackCalled: null,
    __disposed: null,

    open: function(method, url) {
      if (this.__disposed) {
        return;
      }

      var query = {},
          callbackParam,
          callbackName,
          that = this;

      callbackParam = this.__callbackParam || "callback";
      callbackName = this.__callbackName ||
        "qx.bom.request.Jsonp[" + this.__id + "].callback";

      // Default callback
      if (!this.__callbackName) {

        // Store globally available reference to this object
        this.constructor[this.__id] = this;

      // Custom callback
      } else {

        // Dynamically create globally available callback
        // with user defined name. Delegate to this object's
        // callback method.
        window[this.__callbackName] = function(data) {
          that.callback(data);
        };

      }

      if (qx.core.Environment.get("qx.debug.io")) {
        qx.Bootstrap.debug(qx.bom.request.Jsonp,
          "Expecting JavaScript response to call: " + callbackName);
      }

      query[callbackParam] = callbackName;
      url = qx.util.Uri.appendParamsToUrl(url, query);

      this.__callBase("open", [method, url]);
    },

    callback: function(data) {
      if (this.__disposed) {
        return;
      }

      // Signal callback was called
      this.__callbackCalled = true;

      // Sanitize and parse
      if (qx.core.Environment.get("qx.debug")) {
        data = qx.lang.Json.stringify(data);
        data = qx.lang.Json.parse(data);
      }

      // Set response
      this.responseJson = data;

      // Delete reference to this
      delete this.constructor[this.__id];

      // Delete dynamically created callback
      if (window[this.__callbackName]) {
        delete window[this.__callbackName];
      }
    },

    setCallbackParam: function(param) {
      this.__callbackParam = param;
    },

    setCallbackName: function(name) {
      this.__callbackName = name;
    },

    _onNativeLoad: function() {

      // Indicate erroneous status if callback was not called
      this.status = this.__callbackCalled ? 200 : 500;

      this.__callBase("_onNativeLoad");
    },

    __callBase: function(method, args) {
      qx.bom.request.Script.prototype[method].apply(this, args || []);
    },

    __generateId: function() {
      // Add random digits to date to allow immediately following requests
      // that may be send at the same time
      this.__id = (new Date().valueOf()) + ("" + Math.random()).substring(2,5);
    }
  }
});
