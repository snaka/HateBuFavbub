window.HateBuFavbub = (function() {

  let debug = function(msg) dump("HateBuFavbub: " + msg + "\n");

  debug("load subscripts ...");
  loadSubscripts([
    "chrome://HateBuFavbub/content/lib/jquery-1.3.2.js",
    "chrome://HateBuFavbub/content/lib/httpd.js"
  ]);

  function startHttpServer(label, key) {
    debug("start httpd...");
    switchAccessPoint("http://www.reversehttp.net/reversehttp");
    new HttpServer(
        label,
        function(req) {
            req.respond(200, "OK", {}, "ok");
            var param = parse_qs(req.body);
            dump(param.toSource());

            if (param.key != getPref("key")) {
              debug("*** REJECTED ***");
              return;
            }

            if (param.status != "favorite:add"
            &&  param.status != "add"
            &&  param.status != "update")
                return;
            Growl.notify(
                formatTitle(param.username),
                formatComment(param.title, param.comment),
                getUserIcon(param.username),
                param.url,
                function(cookie) {
                  getBrowser().loadOneTab(cookie);
                }
            );
        }, {
            debug: debug
        }
    );
  }

  function formatTitle(user) {
    return user + " \u3055\u3093\u304C\u30D6\u30AF\u30DE\u3057\u307E\u3057\u305F\u3002";
  }

  function formatComment(title, comment) {
    var formatted = convert(title);
    if (comment.length > 0)
      formatted += "\n\"" + convert(comment) + "\"";
    return formatted;
  }

  let Growl = (function() {
    return {
      notify: function (title, message, icon, url, callback) {
        debug("icon:" + icon);
        Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService)
        .showAlertNotification(icon, title, message, true, url, {
          observe : function(subject, topic, url) {
            if (topic != "alertclickcallback") return;
            callback(url);
          }
        });
      }
    };
  })();

  function loadSubscripts(scripts) {
    const loader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
                   .getService(Ci.mozIJSSubScriptLoader);
    scripts.forEach(function(script) {
      debug("load subscript " + script + "...");
      loader.loadSubScript(script);
    });
  }

  function convert(source) {
    return source.replace(/\+/g, " ");
  }

  function getUserIcon(user) {
      var result = "http://www.hatena.ne.jp/users/" + user.substr(0, 2) + "/" + user + "/profile.gif";
      dump(result + "\n");
      return result;
  }

  function getPref(key) {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefService);
    prefs = prefs.getBranch("extensions.hateBuFavbub.");
    return prefs.getCharPref(key);
  }

  return {
    start : startHttpServer,
    get label() getPref("label"),
    get key()   getPref("key"),
    restart : function() {
      this.start(this.label, this.key);
    },
  };
})();

// startup
if (HateBuFavbub.label != "" && HateBuFavbub.key != "")
  HateBuFavbub.start(HateBuFavbub.label, HateBuFavbub.key);
