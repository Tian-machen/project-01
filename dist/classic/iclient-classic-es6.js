/*!
 * 
 *          iclient-classic.(https://iclient.supermap.io)
 *          CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd
 *          license: Apache-2.0
 *          version: v10.2.1
 *
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 693:
/***/ (function(module) {

(function(self) {
  'use strict';

  // if __disableNativeFetch is set to true, the it will always polyfill fetch
  // with Ajax.
  if (!self.__disableNativeFetch && self.fetch) {
    return
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob, options) {
    var reader = new FileReader()
    var contentType = options.headers.map['content-type'] ? options.headers.map['content-type'].toString() : ''
    var regex = /charset\=[0-9a-zA-Z\-\_]*;?/
    var _charset = blob.type.match(regex) || contentType.match(regex)
    var args = [blob]

    if(_charset) {
      args.push(_charset[0].replace(/^charset\=/, '').replace(/;$/, ''))
    }

    reader.readAsText.apply(reader, args)
    return fileReaderReady(reader)
  }

  var support = {
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob();
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  function Body() {
    this.bodyUsed = false


    this._initBody = function(body, options) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
        this._options = options
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (!body) {
        this._bodyText = ''
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
        throw new Error('unsupported BodyInit type')
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob, this._options)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = input
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body, options)
  }

  Request.prototype.clone = function() {
    return new Request(this)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = xhr.getAllResponseHeaders().trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this._initBody(bodyInit, options)
    this.type = 'default'
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input
      } else {
        request = new Request(input, init)
      }

      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return;
      }

      var __onLoadHandled = false;

      function onload() {
        if (xhr.readyState !== 4) {
          return
        }
        var status = (xhr.status === 1223) ? 204 : xhr.status
        if (status < 100 || status > 599) {
          if (__onLoadHandled) { return; } else { __onLoadHandled = true; }
          reject(new TypeError('Network request failed'))
          return
        }
        var options = {
          status: status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText;

        if (__onLoadHandled) { return; } else { __onLoadHandled = true; }
        resolve(new Response(body, options))
      }
      xhr.onreadystatechange = onload;
      xhr.onload = onload;
      xhr.onerror = function() {
        if (__onLoadHandled) { return; } else { __onLoadHandled = true; }
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      // `withCredentials` should be setted after calling `.open` in IE10
      // http://stackoverflow.com/a/19667959/1219343
      try {
        if (request.credentials === 'include') {
          if ('withCredentials' in xhr) {
            xhr.withCredentials = true;
          } else {
            console && console.warn && console.warn('withCredentials is not supported, you can ignore this warning');
          }
        }
      } catch (e) {
        console && console.warn && console.warn('set withCredentials error:' + e);
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true

  // Support CommonJS
  if ( true && module.exports) {
    module.exports = self.fetch;
  }
})(typeof self !== 'undefined' ? self : this);


/***/ }),

/***/ 144:
/***/ (function(module, exports) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, module], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else { var mod; }
})(this, function (exports, module) {
  'use strict';

  var defaultOptions = {
    timeout: 5000,
    jsonpCallback: 'callback',
    jsonpCallbackFunction: null
  };

  function generateCallbackFunction() {
    return 'jsonp_' + Date.now() + '_' + Math.ceil(Math.random() * 100000);
  }

  function clearFunction(functionName) {
    // IE8 throws an exception when you try to delete a property on window
    // http://stackoverflow.com/a/1824228/751089
    try {
      delete window[functionName];
    } catch (e) {
      window[functionName] = undefined;
    }
  }

  function removeScript(scriptId) {
    var script = document.getElementById(scriptId);
    if (script) {
      document.getElementsByTagName('head')[0].removeChild(script);
    }
  }

  function fetchJsonp(_url) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    // to avoid param reassign
    var url = _url;
    var timeout = options.timeout || defaultOptions.timeout;
    var jsonpCallback = options.jsonpCallback || defaultOptions.jsonpCallback;

    var timeoutId = undefined;

    return new Promise(function (resolve, reject) {
      var callbackFunction = options.jsonpCallbackFunction || generateCallbackFunction();
      var scriptId = jsonpCallback + '_' + callbackFunction;

      window[callbackFunction] = function (response) {
        resolve({
          ok: true,
          // keep consistent with fetch API
          json: function json() {
            return Promise.resolve(response);
          }
        });

        if (timeoutId) clearTimeout(timeoutId);

        removeScript(scriptId);

        clearFunction(callbackFunction);
      };

      // Check if the user set their own params, and if not add a ? to start a list of params
      url += url.indexOf('?') === -1 ? '?' : '&';

      var jsonpScript = document.createElement('script');
      jsonpScript.setAttribute('src', '' + url + jsonpCallback + '=' + callbackFunction);
      if (options.charset) {
        jsonpScript.setAttribute('charset', options.charset);
      }
      jsonpScript.id = scriptId;
      document.getElementsByTagName('head')[0].appendChild(jsonpScript);

      timeoutId = setTimeout(function () {
        reject(new Error('JSONP request to ' + _url + ' timed out'));

        clearFunction(callbackFunction);
        removeScript(scriptId);
        window[callbackFunction] = function () {
          clearFunction(callbackFunction);
        };
      }, timeout);

      // Caught if got 404/500
      jsonpScript.onerror = function () {
        reject(new Error('JSONP request to ' + _url + ' failed'));

        clearFunction(callbackFunction);
        removeScript(scriptId);
        if (timeoutId) clearTimeout(timeoutId);
      };
    });
  }

  // export as global function
  /*
  let local;
  if (typeof global !== 'undefined') {
    local = global;
  } else if (typeof self !== 'undefined') {
    local = self;
  } else {
    try {
      local = Function('return this')();
    } catch (e) {
      throw new Error('polyfill failed because global object is unavailable in this environment');
    }
  }
  local.fetchJsonp = fetchJsonp;
  */

  module.exports = fetchJsonp;
});

/***/ }),

/***/ 107:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

(function (global, factory) {
	 true ? factory() :
	0;
}(this, (function () { 'use strict';

/**
 * @this {Promise}
 */
function finallyConstructor(callback) {
  var constructor = this.constructor;
  return this.then(
    function(value) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function() {
        return value;
      });
    },
    function(reason) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function() {
        // @ts-ignore
        return constructor.reject(reason);
      });
    }
  );
}

function allSettled(arr) {
  var P = this;
  return new P(function(resolve, reject) {
    if (!(arr && typeof arr.length !== 'undefined')) {
      return reject(
        new TypeError(
          typeof arr +
            ' ' +
            arr +
            ' is not iterable(cannot read property Symbol(Symbol.iterator))'
        )
      );
    }
    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      if (val && (typeof val === 'object' || typeof val === 'function')) {
        var then = val.then;
        if (typeof then === 'function') {
          then.call(
            val,
            function(val) {
              res(i, val);
            },
            function(e) {
              args[i] = { status: 'rejected', reason: e };
              if (--remaining === 0) {
                resolve(args);
              }
            }
          );
          return;
        }
      }
      args[i] = { status: 'fulfilled', value: val };
      if (--remaining === 0) {
        resolve(args);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
}

// Store setTimeout reference so promise-polyfill will be unaffected by
// other code modifying setTimeout (like sinon.useFakeTimers())
var setTimeoutFunc = setTimeout;

function isArray(x) {
  return Boolean(x && typeof x.length !== 'undefined');
}

function noop() {}

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
  return function() {
    fn.apply(thisArg, arguments);
  };
}

/**
 * @constructor
 * @param {Function} fn
 */
function Promise(fn) {
  if (!(this instanceof Promise))
    throw new TypeError('Promises must be constructed via new');
  if (typeof fn !== 'function') throw new TypeError('not a function');
  /** @type {!number} */
  this._state = 0;
  /** @type {!boolean} */
  this._handled = false;
  /** @type {Promise|undefined} */
  this._value = undefined;
  /** @type {!Array<!Function>} */
  this._deferreds = [];

  doResolve(fn, this);
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (self._state === 0) {
    self._deferreds.push(deferred);
    return;
  }
  self._handled = true;
  Promise._immediateFn(function() {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
      return;
    }
    var ret;
    try {
      ret = cb(self._value);
    } catch (e) {
      reject(deferred.promise, e);
      return;
    }
    resolve(deferred.promise, ret);
  });
}

function resolve(self, newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self)
      throw new TypeError('A promise cannot be resolved with itself.');
    if (
      newValue &&
      (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
      var then = newValue.then;
      if (newValue instanceof Promise) {
        self._state = 3;
        self._value = newValue;
        finale(self);
        return;
      } else if (typeof then === 'function') {
        doResolve(bind(then, newValue), self);
        return;
      }
    }
    self._state = 1;
    self._value = newValue;
    finale(self);
  } catch (e) {
    reject(self, e);
  }
}

function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  finale(self);
}

function finale(self) {
  if (self._state === 2 && self._deferreds.length === 0) {
    Promise._immediateFn(function() {
      if (!self._handled) {
        Promise._unhandledRejectionFn(self._value);
      }
    });
  }

  for (var i = 0, len = self._deferreds.length; i < len; i++) {
    handle(self, self._deferreds[i]);
  }
  self._deferreds = null;
}

/**
 * @constructor
 */
function Handler(onFulfilled, onRejected, promise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
  var done = false;
  try {
    fn(
      function(value) {
        if (done) return;
        done = true;
        resolve(self, value);
      },
      function(reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      }
    );
  } catch (ex) {
    if (done) return;
    done = true;
    reject(self, ex);
  }
}

Promise.prototype['catch'] = function(onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.then = function(onFulfilled, onRejected) {
  // @ts-ignore
  var prom = new this.constructor(noop);

  handle(this, new Handler(onFulfilled, onRejected, prom));
  return prom;
};

Promise.prototype['finally'] = finallyConstructor;

Promise.all = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!isArray(arr)) {
      return reject(new TypeError('Promise.all accepts an array'));
    }

    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(
              val,
              function(val) {
                res(i, val);
              },
              reject
            );
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.allSettled = allSettled;

Promise.resolve = function(value) {
  if (value && typeof value === 'object' && value.constructor === Promise) {
    return value;
  }

  return new Promise(function(resolve) {
    resolve(value);
  });
};

Promise.reject = function(value) {
  return new Promise(function(resolve, reject) {
    reject(value);
  });
};

Promise.race = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!isArray(arr)) {
      return reject(new TypeError('Promise.race accepts an array'));
    }

    for (var i = 0, len = arr.length; i < len; i++) {
      Promise.resolve(arr[i]).then(resolve, reject);
    }
  });
};

// Use polyfill for setImmediate for performance gains
Promise._immediateFn =
  // @ts-ignore
  (typeof setImmediate === 'function' &&
    function(fn) {
      // @ts-ignore
      setImmediate(fn);
    }) ||
  function(fn) {
    setTimeoutFunc(fn, 0);
  };

Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
  if (typeof console !== 'undefined' && console) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  }
};

/** @suppress {undefinedVars} */
var globalNS = (function() {
  // the only reliable means to get the global object is
  // `Function('return this')()`
  // However, this causes CSP violations in Chrome apps.
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof __webpack_require__.g !== 'undefined') {
    return __webpack_require__.g;
  }
  throw new Error('unable to locate global object');
})();

// Expose the polyfill if Promise is undefined or set to a
// non-function value. The latter can be due to a named HTMLElement
// being exposed by browsers for legacy reasons.
// https://github.com/taylorhakes/promise-polyfill/issues/114
if (typeof globalNS['Promise'] !== 'function') {
  globalNS['Promise'] = Promise;
} else if (!globalNS.Promise.prototype['finally']) {
  globalNS.Promise.prototype['finally'] = finallyConstructor;
} else if (!globalNS.Promise.allSettled) {
  globalNS.Promise.allSettled = allSettled;
}

})));


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";

// UNUSED EXPORTS: AddressMatchService, BuffersAnalystJobsParameter, DatasetService, DatasourceService, ElasticSearch, GeoCodingParameter, GeoDecodingParameter, KernelDensityJobParameter, MapVLayer, MapVRenderer, MappingParameters, OutputSetting, OverlayGeoJobParameter, ProcessingService, SecurityManager, SingleObjectQueryJobsParameter, SummaryAttributesJobsParameter, SummaryMeshJobParameter, SummaryRegionJobParameter, SuperMap, TopologyValidatorJobsParameter

;// CONCATENATED MODULE: ./src/common/SuperMap.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/
var SuperMap = window.SuperMap = window.SuperMap || {};
SuperMap.Components = window.SuperMap.Components || {};

;// CONCATENATED MODULE: ./src/common/commontypes/Pixel.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/


/**
 * @class SuperMap.Pixel
 * @category BaseTypes Geometry
 * @classdesc ć­¤ç±»ç”¨ x,y ĺť?ć ‡ćŹŹç»?ĺ±Źĺą•ĺť?ć ‡ďĽ?ĺ?Źç´ ç‚ąďĽ‰ă€‚
 * @param {number} [x=0.0] - x ĺť?ć ‡ă€‚
 * @param {number} [y=0.0] - y ĺť?ć ‡ă€‚
 * @param {SuperMap.Pixel.Mode} [mode=SuperMap.Pixel.Mode.LeftTop] - ĺť?ć ‡ć¨ˇĺĽŹă€‚
 *
 * @example
 * //ĺŤ•ç‹¬ĺ?›ĺ»şä¸€ä¸ŞĺŻąč±ˇ
 * var pixcel = new SuperMap.Pixel(100,50);
 *
 * //äľťćŤ® size ĺ?›ĺ»ş
 *  var size = new SuperMap.Size(21,25);
 *  var offset = new SuperMap.Pixel(-(size.w/2), -size.h);
 */
class Pixel {


    constructor(x, y, mode) {
        /**
         * @member {number} [SuperMap.Pixel.prototype.x=0.0]
         * @description x ĺť?ć ‡ă€‚
         */
        this.x = x ? parseFloat(x) : 0.0;

        /**
         * @member {number} [SuperMap.Pixel.prototype.y=0.0]
         * @description y ĺť?ć ‡ă€‚
         */
        this.y = y ? parseFloat(y) : 0.0;

        /**
         * @member {SuperMap.Pixel.Mode} [SuperMap.Pixel.prototype.mode=SuperMap.Pixel.Mode.LeftTop]
         * @description ĺť?ć ‡ć¨ˇĺĽŹďĽŚćś‰ĺ·¦ä¸Šă€?ĺŹłä¸Šă€?ĺŹłä¸‹ă€?ĺ·¦ä¸‹čż™ĺ‡ ç§Ťć¨ˇĺĽŹďĽŚĺ?†ĺ?«čˇ¨ç¤şç›¸ĺŻąäşŽĺ·¦ä¸Šč§’ă€?ĺŹłä¸Šč§’ă€?ĺŹłä¸‹č§’ă€?ĺ·¦ä¸‹č§’çš„ĺť?ć ‡ă€‚ 
         */ 
        this.mode = mode;
        this.CLASS_NAME = "SuperMap.Pixel";
        /**
         * @enum SuperMap.Pixel.Mode
         * @readonly
         * @description ć¨ˇĺĽŹă€‚
         * @type {string}
         */

        SuperMap.Pixel.Mode = {
            /** ĺ·¦ä¸Šć¨ˇĺĽŹă€‚*/
            LeftTop: "lefttop",
            /** ĺŹłä¸Šć¨ˇĺĽŹă€‚ */
            RightTop: "righttop",
            /** ĺŹłä¸‹ć¨ˇĺĽŹă€‚ */
            RightBottom: "rightbottom",
            /** ĺ·¦ä¸‹ć¨ˇĺĽŹă€‚ */
            LeftBottom: "leftbottom"
        };
    }

    /**
     * @function SuperMap.Pixel.prototype.toString
     * @description čż”ĺ›žć­¤ĺŻąč±ˇçš„ĺ­—ç¬¦ä¸˛ĺ˝˘ĺĽŹă€‚
     * @example
     *
     * var pixcel = new SuperMap.Pixel(100,50);
     * var str = pixcel.toString();
     *
     * @returns {string} äľ‹ĺ¦‚: "x=200.4,y=242.2"
     */
    toString() {
        return ("x=" + this.x + ",y=" + this.y);
    }

    /**
     * @function SuperMap.Pixel.prototype.clone
     * @description ĺ…‹éš†ĺ˝“ĺ‰Ťçš„ pixel ĺŻąč±ˇă€‚
     * @example
     * var pixcel = new SuperMap.Pixel(100,50);
     * var pixcel2 = pixcel.clone();
     * @returns {SuperMap.Pixel} čż”ĺ›žä¸€ä¸Şć–°çš„ä¸Žĺ˝“ĺ‰Ť pixel ĺŻąč±ˇćś‰ç›¸ĺ?Ś xă€?y ĺť?ć ‡çš„ pixel ĺŻąč±ˇă€‚
     */
    clone() {
        return new Pixel(this.x, this.y, this.mode);
    }

    /**
     * @function SuperMap.Pixel.prototype.equals
     * @description ćŻ”čľ?ä¸¤ pixel ć?Żĺ?¦ç›¸ç­‰ă€‚
     * @example
     * var pixcel = new SuperMap.Pixel(100,50);
     * var pixcel2 = new SuperMap.Pixel(100,50);
     * var isEquals = pixcel.equals(pixcel2);
     *
     * @param {SuperMap.Pixel} px - ç”¨äşŽćŻ”čľ?ç›¸ç­‰çš„ pixel ĺŻąč±ˇă€‚
     * @returns {boolean} ĺ¦‚ćžśäĽ ĺ…Ąçš„ĺ?Źç´ ç‚ąĺ’Śĺ˝“ĺ‰Ťĺ?Źç´ ç‚ąç›¸ĺ?Śčż”ĺ›ž trueďĽŚĺ¦‚ćžśä¸Ťĺ?Ść?–äĽ ĺ…ĄĺŹ‚ć•°ä¸ş NULL ĺ?™čż”ĺ›ž falseă€‚
     */
    equals(px) {
        var equals = false;
        if (px != null) {
            equals = ((this.x == px.x && this.y == px.y) ||
                (isNaN(this.x) && isNaN(this.y) && isNaN(px.x) && isNaN(px.y)));
        }
        return equals;
    }

    /**
     * @function SuperMap.Pixel.prototype.distanceTo
     * @description čż”ĺ›žä¸¤ä¸Ş pixel çš„č·ťç¦»ă€‚
     * @example
     * var pixcel = new SuperMap.Pixel(100,50);
     * var pixcel2 = new SuperMap.Pixel(110,30);
     * var distance = pixcel.distanceTo(pixcel2);
     *
     * @param {SuperMap.Pixel} px - ç”¨äşŽč®ˇç®—çš„ä¸€ä¸Ş pixelă€‚
     * @returns {float} ä˝śä¸şĺŹ‚ć•°äĽ ĺ…Ąçš„ĺ?Źç´ ä¸Žĺ˝“ĺ‰Ťĺ?Źç´ ç‚ąçš„č·ťç¦»ă€‚
     */
    distanceTo(px) {
        return Math.sqrt(
            Math.pow(this.x - px.x, 2) +
            Math.pow(this.y - px.y, 2)
        );
    }

    /**
     * @function SuperMap.Pixel.prototype.add
     * @description ĺś¨ĺŽźćťĄĺ?Źç´ ĺť?ć ‡ĺźşçˇ€ä¸ŠďĽŚx ĺ€ĽĺŠ ä¸ŠäĽ ĺ…Ąçš„ x ĺŹ‚ć•°ďĽŚy ĺ€ĽĺŠ ä¸ŠäĽ ĺ…Ąçš„ y ĺŹ‚ć•°ă€‚
     * @example
     * var pixcel = new SuperMap.Pixel(100,50);
     * //pixcel2ć?Żć–°çš„ĺŻąč±ˇ
     * var pixcel2 = pixcel.add(20,30);
     *
     * @param {number} x - äĽ ĺ…Ąçš„ x ĺ€Ľă€‚
     * @param {number} y - äĽ ĺ…Ąçš„ y ĺ€Ľă€‚
     * @returns {SuperMap.Pixel} čż”ĺ›žä¸€ä¸Şć–°çš„ pixel ĺŻąč±ˇďĽŚčŻĄ pixel ć?Żç”±ĺ˝“ĺ‰Ťçš„ pixel ä¸ŽäĽ ĺ…Ąçš„ xďĽŚy ç›¸ĺŠ ĺľ—ĺ?°ă€‚
     */
    add(x, y) {
        if ((x == null) || (y == null)) {
            throw new TypeError('Pixel.add cannot receive null values');
        }
        return new Pixel(this.x + x, this.y + y);
    }

    /**
     * @function SuperMap.Pixel.prototype.offset
     * @description é€ščż‡äĽ ĺ…Ąçš„ {@link SuperMap.Pixel} ĺŹ‚ć•°ĺŻąĺŽźĺ±Źĺą•ĺť?ć ‡čż›čˇŚĺ?Źç§»ă€‚
     * @example
     * var pixcel = new SuperMap.Pixel(100,50);
     * var pixcel2 = new SuperMap.Pixel(130,20);
     * //pixcel3 ć?Żć–°çš„ĺŻąč±ˇ
     * var pixcel3 = pixcel.offset(pixcel2);
     *
     * @param {SuperMap.Pixel} px - äĽ ĺ…Ąçš„ <SuperMap.Pixel> ĺŻąč±ˇă€‚
     * @returns {SuperMap.Pixel} čż”ĺ›žä¸€ä¸Şć–°çš„ pixelďĽŚčŻĄ pixel ć?Żç”±ĺ˝“ĺ‰Ťçš„ pixel ĺŻąč±ˇçš„ xďĽŚy ĺ€Ľä¸ŽäĽ ĺ…Ąçš„ Pixel ĺŻąč±ˇçš„ xďĽŚy ĺ€Ľç›¸ĺŠ ĺľ—ĺ?°ă€‚
     */
    offset(px) {
        var newPx = this.clone();
        if (px) {
            newPx = this.add(px.x, px.y);
        }
        return newPx;
    }

    /**
     *
     * @function SuperMap.Pixel.prototype.destroy
     * @description é”€ćŻ?ć­¤ĺŻąč±ˇă€‚é”€ćŻ?ĺ?Žć­¤ĺŻąč±ˇçš„ć‰€ćś‰ĺ±žć€§ä¸ş nullďĽŚč€Śä¸Ťć?Żĺ?ťĺ§‹ĺ€Ľă€‚
     * @example
     * var pixcel = new SuperMap.Pixel(100,50);
     * pixcel.destroy();
     */
    destroy() {
        this.x = null;
        this.y = null;
        this.mode = null;
    }
}

SuperMap.Pixel = Pixel;


;// CONCATENATED MODULE: ./src/common/commontypes/BaseTypes.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/

/**
 *@namespace SuperMap
 *@category BaseTypes Namespace
 */

/**
 * @function SuperMap.inherit
 * @description é™¤äş† C ĺ’Ś P ä¸¤ä¸Şĺż…č¦?ĺŹ‚ć•°ĺ¤–ďĽŚĺŹŻä»ĄäĽ é€’ä»»ć„Źć•°é‡Źçš„ĺŻąč±ˇďĽŚčż™äş›ĺŻąč±ˇé?˝ĺ°†ç»§ć‰żCă€‚
 * @memberOf SuperMap
 * @param {Object} C - ç»§ć‰żçš„ç±»ă€‚
 * @param {Object} P - č˘«ç»§ć‰żçš„ç?¶ç±»ă€‚
 */
SuperMap.inherit = function (C, P) {
    var F = function () {
    };
    F.prototype = P.prototype;
    C.prototype = new F;
    var i, l, o;
    for (i = 2, l = arguments.length; i < l; i++) {
        o = arguments[i];
        if (typeof o === "function") {
            o = o.prototype;
        }
        SuperMap.Util.extend(C.prototype, o);
    }
};


/**
 * @function SuperMap.mixin 
 * @description ĺ®žçŽ°ĺ¤šé‡Ťç»§ć‰żă€‚
 * @memberOf SuperMap
 * @param {Class|Object} ...mixins - ç»§ć‰żçš„ç±»ă€‚
 */
SuperMap.mixin = function (...mixins) {

    class Mix {
        constructor(options) {
            for (var index = 0; index < mixins.length; index++) {
                copyProperties(this, new mixins[index](options));
            }
        }
    }

    for (var index = 0; index < mixins.length; index++) {
        var mixin = mixins[index];
        copyProperties(Mix, mixin);
        copyProperties(Mix.prototype, mixin.prototype);
        copyProperties(Mix.prototype, new mixin());
    }
    return Mix;

    function copyProperties(target, source) {
        var ownKeys = Object.getOwnPropertyNames(source);
        if (Object.getOwnPropertySymbols) {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source));
        }
        for (var index = 0; index < ownKeys.length; index++) {
            var key = ownKeys[index];
            if (key !== "constructor"
                && key !== "prototype"
                && key !== "name" && key !== "length") {
                let desc = Object.getOwnPropertyDescriptor(source, key);
                if (window["ActiveXObject"]) {
                    Object.defineProperty(target, key, desc || {});
                } else {
                    Object.defineProperty(target, key, desc);
                }
            }
        }
    }
};

/**
 * @name String
 * @namespace
 * @memberOf SuperMap
 * @category BaseTypes Util
 * @description ĺ­—ç¬¦ä¸˛ć“Ťä˝śçš„ä¸€çł»ĺ?—ĺ¸¸ç”¨ć‰©ĺ±•ĺ‡˝ć•°ă€‚
 */
var StringExt = SuperMap.String = {

    /**
     * @function SuperMap.String.startsWith
     * @description ĺ?¤ć–­ç›®ć ‡ĺ­—ç¬¦ä¸˛ć?Żĺ?¦ä»ĄćŚ‡ĺ®šçš„ĺ­?ĺ­—ç¬¦ä¸˛ĺĽ€ĺ¤´ă€‚
     * @param {string} str - ç›®ć ‡ĺ­—ç¬¦ä¸˛ă€‚
     * @param {string} sub - ćźĄć‰ľçš„ĺ­?ĺ­—ç¬¦ä¸˛ă€‚
     * @returns {boolean} ç›®ć ‡ĺ­—ç¬¦ä¸˛ä»ĄćŚ‡ĺ®šçš„ĺ­?ĺ­—ç¬¦ä¸˛ĺĽ€ĺ¤´ďĽŚĺ?™čż”ĺ›ž trueďĽ›ĺ?¦ĺ?™čż”ĺ›ž falseă€‚
     */
    startsWith: function (str, sub) {
        return (str.indexOf(sub) == 0);
    },

    /**
     * @function SuperMap.String.contains
     * @description ĺ?¤ć–­ç›®ć ‡ĺ­—ç¬¦ä¸˛ć?Żĺ?¦ĺŚ…ĺ?«ćŚ‡ĺ®šçš„ĺ­?ĺ­—ç¬¦ä¸˛ă€‚
     * @param {string} str - ç›®ć ‡ĺ­—ç¬¦ä¸˛ă€‚
     * @param {string} sub - ćźĄć‰ľçš„ĺ­?ĺ­—ç¬¦ä¸˛ă€‚
     * @returns {boolean} ç›®ć ‡ĺ­—ç¬¦ä¸˛ä¸­ĺŚ…ĺ?«ćŚ‡ĺ®šçš„ĺ­?ĺ­—ç¬¦ä¸˛ďĽŚĺ?™čż”ĺ›ž trueďĽ›ĺ?¦ĺ?™čż”ĺ›ž falseă€‚
     */
    contains: function (str, sub) {
        return (str.indexOf(sub) != -1);
    },

    /**
     * @function SuperMap.String.trim
     * @description ĺ? é™¤ä¸€ä¸Şĺ­—ç¬¦ä¸˛çš„ĺĽ€ĺ¤´ĺ’Śç»“ĺ°ľĺ¤„çš„ć‰€ćś‰ç©şç™˝ĺ­—ç¬¦ă€‚
     * @param {string} str - ďĽ?ĺŹŻč?˝ďĽ‰ĺ­?ĺś¨ç©şç™˝ĺ­—ç¬¦ĺˇ«ĺˇžçš„ĺ­—ç¬¦ä¸˛ă€‚
     * @returns {string} ĺ? é™¤ĺĽ€ĺ¤´ĺ’Śç»“ĺ°ľĺ¤„ç©şç™˝ĺ­—ç¬¦ĺ?Žçš„ĺ­—ç¬¦ä¸˛ă€‚
     */
    trim: function (str) {
        return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    },

    /**
     * @function SuperMap.String.camelize
     * @description éŞ†é©ĽĺĽŹ("-")čżžĺ­—ç¬¦çš„ĺ­—ç¬¦ä¸˛ĺ¤„ç?†ă€‚
     * äľ‹ĺ¦‚ďĽš"chicken-head" becomes "chickenHead",
     *       "-chicken-head" becomes "ChickenHead"ă€‚
     * @param {string} str - č¦?ĺ¤„ç?†çš„ĺ­—ç¬¦ä¸˛ďĽŚĺŽźĺ§‹ĺ†…ĺ®ąä¸Ťĺş”č˘«äż®ć”ąă€‚
     * @returns {string}
     */
    camelize: function (str) {
        var oStringList = str.split('-');
        var camelizedString = oStringList[0];
        for (var i = 1, len = oStringList.length; i < len; i++) {
            var s = oStringList[i];
            camelizedString += s.charAt(0).toUpperCase() + s.substring(1);
        }
        return camelizedString;
    },

    /**
     * @function SuperMap.String.format
     * @description ćŹ?äľ›ĺ¸¦ ${token} ć ‡č®°çš„ĺ­—ç¬¦ä¸˛, čż”ĺ›ž context ĺŻąč±ˇĺ±žć€§ä¸­ćŚ‡ĺ®šć ‡č®°çš„ĺ±žć€§ĺ€Ľă€‚
     * @example
     * ç¤şäľ‹ďĽš
     * (code)
     * 1ă€?template = "${value,getValue}";
     *         context = {value: {getValue:function(){return Math.max.apply(null,argument);}}};
     *         args = [2,23,12,36,21];
     *       čż”ĺ›žĺ€Ľ:36
     * (end)
     * ç¤şäľ‹:
     * (code)
     * 2ă€?template = "$${{value,getValue}}";
     *         context = {value: {getValue:function(){return Math.max.apply(null,argument);}}};
     *         args = [2,23,12,36,21];
     *       čż”ĺ›žĺ€Ľ:"${36}"
     * (end)
     * ç¤şäľ‹:
     * (code)
     * 3ă€?template = "${a,b}";
     *         context = {a: {b:"format"}};
     *         args = null;
     *       čż”ĺ›žĺ€Ľ:"format"
     * (end)
     * ç¤şäľ‹:
     * (code)
     * 3ă€?template = "${a,b}";
     *         context = null;
     *         args = null;
     *       čż”ĺ›žĺ€Ľ:"${a.b}"
     * (end)
     * @param {string} template - ĺ¸¦ć ‡č®°çš„ĺ­—ç¬¦ä¸˛ĺ°†č¦?č˘«ć›żćŤ˘ă€‚ĺŹ‚ć•° template ć ĽĺĽŹä¸ş"${token}"ďĽŚć­¤ĺ¤„çš„ token ć ‡č®°äĽšć›żćŤ˘ä¸ş context["token"] ĺ±žć€§çš„ĺ€Ľă€‚
     * @param {Object} [context=window] - ĺ¸¦ćś‰ĺ±žć€§çš„ĺŹŻé€‰ĺŻąč±ˇçš„ĺ±žć€§ç”¨äşŽĺŚąé…Ťć ĽĺĽŹĺŚ–ĺ­—ç¬¦ä¸˛ä¸­çš„ć ‡č®°ă€‚ĺ¦‚ćžśčŻĄĺŹ‚ć•°ä¸şç©şďĽŚĺ°†ä˝żç”¨ window ĺŻąč±ˇă€‚
     * @param {Array} [args] - ĺŹŻé€‰ĺŹ‚ć•°äĽ é€’ç»™ĺś¨ context ĺŻąč±ˇä¸Šć‰ľĺ?°çš„ĺ‡˝ć•°ă€‚
     * @returns {string} ä»Ž context ĺŻąč±ˇĺ±žć€§ä¸­ć›żćŤ˘ĺ­—ç¬¦ä¸˛ć ‡č®°ä˝Ťçš„ĺ­—ç¬¦ä¸˛ă€‚ 
     */
    format: function (template, context, args) {
        if (!context) {
            context = window;
        }

        // Example matching:
        // str   = ${foo.bar}
        // match = foo.bar
        var replacer = function (str, match) {
            var replacement;

            // Loop through all subs. Example: ${a.b.c}
            // 0 -> replacement = context[a];
            // 1 -> replacement = context[a][b];
            // 2 -> replacement = context[a][b][c];
            var subs = match.split(/\.+/);
            for (var i = 0; i < subs.length; i++) {
                if (i == 0) {
                    replacement = context;
                }

                replacement = replacement[subs[i]];
            }

            if (typeof replacement === "function") {
                replacement = args ?
                    replacement.apply(null, args) :
                    replacement();
            }

            // If replacement is undefined, return the string 'undefined'.
            // This is a workaround for a bugs in browsers not properly
            // dealing with non-participating groups in regular expressions:
            // http://blog.stevenlevithan.com/archives/npcg-javascript
            if (typeof replacement == 'undefined') {
                return 'undefined';
            } else {
                return replacement;
            }
        };

        return template.replace(SuperMap.String.tokenRegEx, replacer);
    },

    /**
     * @member {RegExp} [SuperMap.String.tokenRegEx]
     * @description ĺŻ»ć‰ľĺ¸¦ token çš„ĺ­—ç¬¦ä¸˛ďĽŚé»?č®¤ä¸ş tokenRegEx=/\$\{([\w.]+?)\}/gă€‚
     * @example
     * Examples: ${a}, ${a.b.c}, ${a-b}, ${5}
     */
    tokenRegEx: /\$\{([\w.]+?)\}/g,

    /**
     * @member {RegExp} [SuperMap.String.numberRegEx]
     * @description ĺ?¤ć–­ä¸€ä¸Şĺ­—ç¬¦ä¸˛ć?Żĺ?¦ĺŹŞĺŚ…ĺ?«ä¸€ä¸Şć•°ĺ€ĽďĽŚé»?č®¤ä¸ş numberRegEx=/^([+-]?)(?=\d|\.\d)\d*(\.\d*)?([Ee]([+-]?\d+))?$/ă€‚
     */
    numberRegEx: /^([+-]?)(?=\d|\.\d)\d*(\.\d*)?([Ee]([+-]?\d+))?$/,

    /**
     * @function SuperMap.String.isNumeric
     * @description ĺ?¤ć–­ä¸€ä¸Şĺ­—ç¬¦ä¸˛ć?Żĺ?¦ĺŹŞĺŚ…ĺ?«ä¸€ä¸Şć•°ĺ€Ľă€‚
     * @example
     * (code)
     * SuperMap.String.isNumeric("6.02e23") // true
     * SuperMap.String.isNumeric("12 dozen") // false
     * SuperMap.String.isNumeric("4") // true
     * SuperMap.String.isNumeric(" 4 ") // false
     * (end)
     * @returns {boolean} ĺ­—ç¬¦ä¸˛ĺŚ…ĺ?«ĺ”Żä¸€çš„ć•°ĺ€ĽďĽŚčż”ĺ›ž trueďĽ›ĺ?¦ĺ?™čż”ĺ›ž falseă€‚
     */
    isNumeric: function (value) {
        return SuperMap.String.numberRegEx.test(value);
    },

    /**
     * @function SuperMap.String.numericIf
     * @description ćŠŠä¸€ä¸Şçś‹äĽĽć•°ĺ€Ľĺž‹çš„ĺ­—ç¬¦ä¸˛č˝¬ĺŚ–ä¸şä¸€ä¸Şć•°ĺ€Ľă€‚
     * @returns {(number|string)} ĺ¦‚ćžśč?˝č˝¬ćŤ˘ä¸şć•°ĺ€Ľĺ?™čż”ĺ›žć•°ĺ€ĽďĽŚĺ?¦ĺ?™čż”ĺ›žĺ­—ç¬¦ä¸˛ćś¬čş«ă€‚
     */
    numericIf: function (value) {
        return SuperMap.String.isNumeric(value) ? parseFloat(value) : value;
    }

};

/**
 * @name Number
 * @memberOf SuperMap
 * @namespace
 * @category BaseTypes Util
 * @description ć•°ĺ€Ľć“Ťä˝śçš„ä¸€çł»ĺ?—ĺ¸¸ç”¨ć‰©ĺ±•ĺ‡˝ć•°ă€‚
 */
var NumberExt = SuperMap.Number = {

    /**
     * @member {string} [SuperMap.Number.decimalSeparator='.']
     * @description ć ĽĺĽŹĺŚ–ć•°ĺ­—ć—¶é»?č®¤çš„ĺ°Źć•°ç‚ąĺ?†éš”ç¬¦ă€‚
     * @constant
     */
    decimalSeparator: ".",

    /**
     * @member {string} [SuperMap.Number.thousandsSeparator=',']
     * @description ć ĽĺĽŹĺŚ–ć•°ĺ­—ć—¶é»?č®¤çš„ĺŤ?ä˝Ťĺ?†éš”ç¬¦ă€‚
     * @constant
     */
    thousandsSeparator: ",",

    /**
     * @function SuperMap.Number.limitSigDigs
     * @description é™?ĺ?¶ćµ®ç‚ąć•°çš„ćś‰ć•?ć•°ĺ­—ä˝Ťć•°ă€‚
     * @param {number} num - ćµ®ç‚ąć•°ă€‚
     * @param {integer} sig - ćś‰ć•?ä˝Ťć•°ă€‚
     * @returns {number} ĺ°†ć•°ĺ­—ĺ››č?Ťäş”ĺ…Ąĺ?°ćŚ‡ĺ®šć•°é‡Źçš„ćś‰ć•?ä˝Ťć•°ă€‚
     */
    limitSigDigs: function (num, sig) {
        var fig = 0;
        if (sig > 0) {
            fig = parseFloat(num.toPrecision(sig));
        }
        return fig;
    },

    /**
     * @function SuperMap.Number.format
     * @description ć•°ĺ­—ć ĽĺĽŹĺŚ–čľ“ĺ‡şă€‚
     * @param {number} num - ć•°ĺ­—ă€‚
     * @param {integer} [dec=0]  - ć•°ĺ­—çš„ĺ°Źć•°é?¨ĺ?†ĺ››č?Ťäş”ĺ…Ąĺ?°ćŚ‡ĺ®šçš„ä˝Ťć•°ă€‚č®ľç˝®ä¸ş null ĺ€Ľć—¶ĺ°Źć•°é?¨ĺ?†ä¸ŤĺŹ?ă€‚
     * @param {string} [tsep=','] - ĺŤ?ä˝Ťĺ?†éš”ç¬¦ă€‚
     * @param {string} [dsep='.'] - ĺ°Źć•°ç‚ąĺ?†éš”ç¬¦ă€‚
     * @returns {string} ć•°ĺ­—ć ĽĺĽŹĺŚ–ĺ?Žçš„ĺ­—ç¬¦ä¸˛ă€‚
     */
    format: function (num, dec, tsep, dsep) {
        dec = (typeof dec != "undefined") ? dec : 0;
        tsep = (typeof tsep != "undefined") ? tsep :
            SuperMap.Number.thousandsSeparator;
        dsep = (typeof dsep != "undefined") ? dsep :
            SuperMap.Number.decimalSeparator;

        if (dec != null) {
            num = parseFloat(num.toFixed(dec));
        }

        var parts = num.toString().split(".");
        if (parts.length === 1 && dec == null) {
            // integer where we do not want to touch the decimals
            dec = 0;
        }

        var integer = parts[0];
        if (tsep) {
            var thousands = /(-?[0-9]+)([0-9]{3})/;
            while (thousands.test(integer)) {
                integer = integer.replace(thousands, "$1" + tsep + "$2");
            }
        }

        var str;
        if (dec == 0) {
            str = integer;
        } else {
            var rem = parts.length > 1 ? parts[1] : "0";
            if (dec != null) {
                rem = rem + new Array(dec - rem.length + 1).join("0");
            }
            str = integer + dsep + rem;
        }
        return str;
    }
};

if (!Number.prototype.limitSigDigs) {
    /**
     * APIMethod: Number.limitSigDigs
     * é™?ĺ?¶ćµ®ç‚ąć•°çš„ćś‰ć•?ć•°ĺ­—ä˝Ťć•°.
     * @param {integer} sig -ćś‰ć•?ä˝Ťć•°ă€‚
     * @returns {integer} ĺ°†ć•°ĺ­—ĺ››č?Ťäş”ĺ…Ąĺ?°ćŚ‡ĺ®šć•°é‡Źçš„ćś‰ć•?ä˝Ťć•°ă€‚
     *           ĺ¦‚ćžśäĽ ĺ…Ąĺ€Ľ ä¸ş nullă€?0ă€?ć?–č€…ć?Żč´źć•°, čż”ĺ›žĺ€Ľ 0ă€‚
     */
    Number.prototype.limitSigDigs = function (sig) {
        return NumberExt.limitSigDigs(this, sig);
    };
}

/**
 * @name Function
 * @memberOf SuperMap
 * @namespace
 * @category BaseTypes Util
 * @description ĺ‡˝ć•°ć“Ťä˝śçš„ä¸€çł»ĺ?—ĺ¸¸ç”¨ć‰©ĺ±•ĺ‡˝ć•°ă€‚
 */
var FunctionExt = SuperMap.Function = {
    /**
     * @function SuperMap.Function.bind
     * @description ç»‘ĺ®šĺ‡˝ć•°ĺ?°ĺŻąč±ˇă€‚ć–ąäľżĺ?›ĺ»ş this çš„ä˝śç”¨ĺźźă€‚
     * @param {function} func - čľ“ĺ…Ąĺ‡˝ć•°ă€‚
     * @param {Object} object - ĺŻąč±ˇç»‘ĺ®šĺ?°čľ“ĺ…Ąĺ‡˝ć•°ďĽ?ä˝śä¸şčľ“ĺ…Ąĺ‡˝ć•°çš„ this ĺŻąč±ˇďĽ‰ă€‚
     * @returns {function} object ĺŹ‚ć•°ä˝śä¸ş func ĺ‡˝ć•°çš„ this ĺŻąč±ˇă€‚
     */
    bind: function (func, object) {
        // create a reference to all arguments past the second one
        var args = Array.prototype.slice.apply(arguments, [2]);
        return function () {
            // Push on any additional arguments from the actual function call.
            // These will come after those sent to the bind call.
            var newArgs = args.concat(
                Array.prototype.slice.apply(arguments, [0])
            );
            return func.apply(object, newArgs);
        };
    },

    /**
     * @function SuperMap.Function.bindAsEventListener
     * @description ç»‘ĺ®šĺ‡˝ć•°ĺ?°ĺŻąč±ˇďĽŚĺś¨č°?ç”¨čŻĄĺ‡˝ć•°ć—¶é…Ťç˝®ĺą¶ä˝żç”¨äş‹ä»¶ĺŻąč±ˇä˝śä¸şç¬¬ä¸€ä¸ŞĺŹ‚ć•°ă€‚
     * @param {function} func - ç”¨äşŽç›‘ĺ?¬äş‹ä»¶çš„ĺ‡˝ć•°ă€‚
     * @param {Object} object - this ĺŻąč±ˇçš„ĺĽ•ç”¨ă€‚
     * @returns {function}
     */
    bindAsEventListener: function (func, object) {
        return function (event) {
            return func.call(object, event || window.event);
        };
    },

    /**
     * @function SuperMap.Function.False
     * @description čŻĄĺ‡˝ć•°ä»…ä»…čż”ĺ›ž falseă€‚čŻĄĺ‡˝ć•°ä¸»č¦?ć?Żé?żĺ…Ťĺś¨ IE8 ä»Ąä¸‹ćµŹč§?ä¸­ DOM äş‹ä»¶ĺŹĄćź„çš„ĺŚżĺ?Ťĺ‡˝ć•°é—®é˘?ă€‚
     * @example
     * document.onclick = SuperMap.Function.False;
     * @returns {boolean}
     */
    False: function () {
        return false;
    },

    /**
     * @function SuperMap.Function.True
     * @description čŻĄĺ‡˝ć•°ä»…ä»…čż”ĺ›ž trueă€‚čŻĄĺ‡˝ć•°ä¸»č¦?ć?Żé?żĺ…Ťĺś¨ IE8 ä»Ąä¸‹ćµŹč§?ä¸­ DOM äş‹ä»¶ĺŹĄćź„çš„ĺŚżĺ?Ťĺ‡˝ć•°é—®é˘?ă€‚
     * @example
     * document.onclick = SuperMap.Function.True;
     * @returns {boolean}
     */
    True: function () {
        return true;
    },

    /**
     * @function SuperMap.Function.Void
     * @description ĺŹŻé‡Ťç”¨ĺ‡˝ć•°ďĽŚä»…ä»…čż”ĺ›ž "undefined"ă€‚
     * @returns {undefined}
     */
    Void: function () {
    }

};

/**
 * @name Array
 * @memberOf SuperMap
 * @namespace
 * @category BaseTypes Util
 * @description ć•°ç»„ć“Ťä˝śçš„ä¸€çł»ĺ?—ĺ¸¸ç”¨ć‰©ĺ±•ĺ‡˝ć•°ă€‚
 */
var ArrayExt = SuperMap.Array = {

    /**
     * @function SuperMap.Array.filter
     * @description čż‡ć»¤ć•°ç»„ďĽŚćŹ?äľ›äş† ECMA-262 ć ‡ĺ‡†ä¸­ Array.prototype.filter ĺ‡˝ć•°çš„ć‰©ĺ±•ă€‚čŻ¦č§?ďĽš{@link http://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/filter}
     * @param {Array} array - č¦?čż‡ć»¤çš„ć•°ç»„ă€‚
     * @param {function} callback - ć•°ç»„ä¸­çš„ćŻŹä¸€ä¸Şĺ…?ç´ č°?ç”¨čŻĄĺ‡˝ć•°ă€‚</br>
     *     ĺ¦‚ćžśĺ‡˝ć•°çš„čż”ĺ›žĺ€Ľä¸ş trueďĽŚčŻĄĺ…?ç´ ĺ°†ĺŚ…ĺ?«ĺś¨čż”ĺ›žçš„ć•°ç»„ä¸­ă€‚čŻĄĺ‡˝ć•°ćś‰ä¸‰ä¸ŞĺŹ‚ć•°: ć•°ç»„ä¸­çš„ĺ…?ç´ ďĽŚĺ…?ç´ çš„ç´˘ĺĽ•ďĽŚć•°ç»„č‡Şčş«ă€‚</br>
     *     ĺ¦‚ćžśč®ľç˝®äş†ĺŹŻé€‰ĺŹ‚ć•° callerďĽŚĺś¨č°?ç”¨ callback ć—¶ďĽŚä˝żç”¨ĺŹŻé€‰ĺŹ‚ć•° caller č®ľç˝®ä¸ş callback çš„ĺŹ‚ć•°ă€‚</br>
     * @param {Object} [caller] - ĺś¨č°?ç”¨ callback ć—¶ďĽŚä˝żç”¨ĺŹ‚ć•° caller č®ľç˝®ä¸ş callback çš„ĺŹ‚ć•°ă€‚
     * @returns {Array} callback ĺ‡˝ć•°čż”ĺ›ž true ć—¶çš„ĺ…?ç´ ĺ°†ä˝śä¸şčż”ĺ›žć•°ç»„ä¸­çš„ĺ…?ç´ ă€‚
     */
    filter: function (array, callback, caller) {
        var selected = [];
        if (Array.prototype.filter) {
            selected = array.filter(callback, caller);
        } else {
            var len = array.length;
            if (typeof callback != "function") {
                throw new TypeError();
            }
            for (var i = 0; i < len; i++) {
                if (i in array) {
                    var val = array[i];
                    if (callback.call(caller, val, i, array)) {
                        selected.push(val);
                    }
                }
            }
        }
        return selected;
    }

};

;// CONCATENATED MODULE: ./src/common/commontypes/Util.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/



var Util = SuperMap.Util = SuperMap.Util || {};
/**
 * @name Util
 * @memberOf SuperMap
 * @namespace
 * @category BaseTypes Util
 * @description common ĺ·Ąĺ…·ç±»ă€‚
 */

/**
 * @description ĺ¤Ťĺ?¶ćş?ĺŻąč±ˇçš„ć‰€ćś‰ĺ±žć€§ĺ?°ç›®ć ‡ĺŻąč±ˇä¸ŠďĽŚćş?ĺŻąč±ˇä¸Šçš„ć˛ˇćś‰ĺ®šäą‰çš„ĺ±žć€§ĺś¨ç›®ć ‡ĺŻąč±ˇä¸Šäąźä¸ŤäĽšč˘«č®ľç˝®ă€‚
 * @example
 * č¦?ĺ¤Ťĺ?¶ SuperMap.Size ĺŻąč±ˇçš„ć‰€ćś‰ĺ±žć€§ĺ?°č‡Şĺ®šäą‰ĺŻąč±ˇä¸ŠďĽŚä˝żç”¨ć–ąćł•ĺ¦‚ä¸‹:
 *     var size = new SuperMap.Size(100, 100);
 *     var obj = {}ďĽ›
 *     SuperMap.Util.extend(obj, size);
 * @param {Object} [destination] - ç›®ć ‡ĺŻąč±ˇă€‚
 * @param {Object} source - ćş?ĺŻąč±ˇďĽŚĺ…¶ĺ±žć€§ĺ°†č˘«č®ľç˝®ĺ?°ç›®ć ‡ĺŻąč±ˇä¸Šă€‚
 * @returns {Object} ç›®ć ‡ĺŻąč±ˇă€‚
 */

SuperMap.Util.extend = function (destination, source) {
    destination = destination || {};
    if (source) {
        for (var property in source) {
            var value = source[property];
            if (value !== undefined) {
                destination[property] = value;
            }
        }

        /**
         * IE doesn't include the toString property when iterating over an object's
         * properties with the for(property in object) syntax.  Explicitly check if
         * the source has its own toString property.
         */

        /*
         * FF/Windows < 2.0.0.13 reports "Illegal operation on WrappedNative
         * prototype object" when calling hawOwnProperty if the source object
         * is an instance of window.Event.
         */

        var sourceIsEvt = typeof window.Event === "function"
            && source instanceof window.Event;

        if (!sourceIsEvt
            && source.hasOwnProperty && source.hasOwnProperty("toString")) {
            destination.toString = source.toString;
        }
    }
    return destination;
};
/**
 * @description ĺŻąč±ˇć‹·č´ťă€‚
 * @param {Object} [des] - ç›®ć ‡ĺŻąč±ˇă€‚
 * @param {Object} soc - ćş?ĺŻąč±ˇă€‚
 */
SuperMap.Util.copy = function (des, soc) {
    des = des || {};
    var v;
    if (soc) {
        for (var p in des) {
            v = soc[p];
            if (typeof v !== 'undefined') {
                des[p] = v;
            }
        }
    }
};
/**
 * @description é”€ćŻ?ĺŻąč±ˇďĽŚĺ°†ĺ…¶ĺ±žć€§ç˝®ç©şă€‚
 * @param {Object} [obj] - ç›®ć ‡ĺŻąč±ˇă€‚
 */
SuperMap.Util.reset = function (obj) {
    obj = obj || {};
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            if (typeof obj[p] === "object" && obj[p] instanceof Array) {
                for (var i in obj[p]) {
                    if (obj[p][i].destroy) {
                        obj[p][i].destroy();
                    }
                }
                obj[p].length = 0;
            } else if (typeof obj[p] === "object" && obj[p] instanceof Object) {
                if (obj[p].destroy) {
                    obj[p].destroy();
                }
            }
            obj[p] = null;
        }
    }
};

/**
 * @description čŽ·ĺŹ– HTML ĺ…?ç´ ć•°ç»„ă€‚
 * @returns {Array.<HTMLElement>} HTML ĺ…?ç´ ć•°ç»„ă€‚
 */
SuperMap.Util.getElement = function () {
    var elements = [];

    for (var i = 0, len = arguments.length; i < len; i++) {
        var element = arguments[i];
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (arguments.length === 1) {
            return element;
        }
        elements.push(element);
    }
    return elements;
};

/**
 * @description instance of çš„č·¨ćµŹč§?ĺ™¨ĺ®žçŽ°ă€‚
 * @param {Object} o - ĺŻąč±ˇă€‚
 * @returns {boolean} ć?Żĺ?¦ć?Żéˇµéť˘ĺ…?ç´ ă€‚
 */
SuperMap.Util.isElement = function (o) {
    return !!(o && o.nodeType === 1);
};

/**
 * @description ĺ?¤ć–­ä¸€ä¸ŞĺŻąč±ˇć?Żĺ?¦ć?Żć•°ç»„ă€‚
 * @param {Object} a - ĺŻąč±ˇă€‚
 * @returns {boolean} ć?Żĺ?¦ć?Żć•°ç»„ă€‚
 */
SuperMap.Util.isArray = function (a) {
    return (Object.prototype.toString.call(a) === '[object Array]');
};


/**
 * @description ä»Žć•°ç»„ä¸­ĺ? é™¤ćź?ä¸€éˇąă€‚
 * @param {Array} array - ć•°ç»„ă€‚
 * @param {Object} item - ć•°ç»„ä¸­č¦?ĺ? é™¤çš„ä¸€éˇąă€‚
 * @returns {Array} ć‰§čˇŚĺ? é™¤ć“Ťä˝śĺ?Žçš„ć•°ç»„ă€‚
 */
SuperMap.Util.removeItem = function (array, item) {
    for (var i = array.length - 1; i >= 0; i--) {
        if (array[i] === item) {
            array.splice(i, 1);
            //break;more than once??
        }
    }
    return array;
};

/**
 * @description čŽ·ĺŹ–ćź?ĺŻąč±ˇĺ†Ťć•°ç»„ä¸­çš„ç´˘ĺĽ•ĺ€Ľă€‚
 * @param {Array} array - ć•°ç»„ă€‚
 * @param {Object} obj - ĺŻąč±ˇă€‚
 * @returns {number} ćź?ĺŻąč±ˇĺ†Ťć•°ç»„ä¸­çš„ç´˘ĺĽ•ĺ€Ľă€‚
 */
SuperMap.Util.indexOf = function (array, obj) {
    if (array == null) {
        return -1;
    } else {
        // use the build-in function if available.
        if (typeof array.indexOf === "function") {
            return array.indexOf(obj);
        } else {
            for (var i = 0, len = array.length; i < len; i++) {
                if (array[i] === obj) {
                    return i;
                }
            }
            return -1;
        }
    }
};


/**
 * @description äż®ć”ąćź? DOM ĺ…?ç´ çš„č®¸ĺ¤šĺ±žć€§ă€‚
 * @param {HTMLElement} element - ĺľ…äż®ć”ąçš„ DOM ĺ…?ç´ ă€‚
 * @param {string} [id] - DOM ĺ…?ç´ çš„ IDă€‚
 * @param {SuperMap.Pixel} [px] - ĺŚ…ĺ?« DOM ĺ…?ç´ çš„ style ĺ±žć€§çš„ left ĺ’Ś top ĺ±žć€§ă€‚
 * @param {SuperMap.Size} [sz] - ĺŚ…ĺ?« DOM ĺ…?ç´ çš„ width ĺ’Ś height ĺ±žć€§ă€‚
 * @param {string} [position] - DOM ĺ…?ç´ çš„ position ĺ±žć€§ă€‚
 * @param {string} [border] - DOM ĺ…?ç´ çš„ style ĺ±žć€§çš„ border ĺ±žć€§ă€‚
 * @param {string} [overflow] - DOM ĺ…?ç´ çš„ style ĺ±žć€§çš„ overflow ĺ±žć€§ă€‚
 * @param {number} [opacity] - ä¸Ťé€Źć?Žĺş¦ĺ€Ľă€‚ĺŹ–ĺ€ĽčŚ?ĺ›´ä¸ş(0.0 - 1.0)ă€‚
 */
SuperMap.Util.modifyDOMElement = function (element, id, px, sz, position,
                                           border, overflow, opacity) {

    if (id) {
        element.id = id;
    }
    if (px) {
        element.style.left = px.x + "px";
        element.style.top = px.y + "px";
    }
    if (sz) {
        element.style.width = sz.w + "px";
        element.style.height = sz.h + "px";
    }
    if (position) {
        element.style.position = position;
    }
    if (border) {
        element.style.border = border;
    }
    if (overflow) {
        element.style.overflow = overflow;
    }
    if (parseFloat(opacity) >= 0.0 && parseFloat(opacity) < 1.0) {
        element.style.filter = 'alpha(opacity=' + (opacity * 100) + ')';
        element.style.opacity = opacity;
    } else if (parseFloat(opacity) === 1.0) {
        element.style.filter = '';
        element.style.opacity = '';
    }
};


/**
 * @description Takes an object and copies any properties that don't exist from
 *     another properties, by analogy with SuperMap.Util.extend() from
 *     Prototype.js.
 *
 * @param {Object} [to] - ç›®ć ‡ĺŻąč±ˇă€‚
 * @param {Object} from - ćş?ĺŻąč±ˇă€‚Any properties of this object that
 *     are undefined in the to object will be set on the to object.
 *
 * @returns {Object} A reference to the to object.  Note that the to argument is modified
 *     in place and returned by this function.
 */
SuperMap.Util.applyDefaults = function (to, from) {
    to = to || {};
    /*
     * FF/Windows < 2.0.0.13 reports "Illegal operation on WrappedNative
     * prototype object" when calling hawOwnProperty if the source object is an
     * instance of window.Event.
     */
    var fromIsEvt = typeof window.Event === "function"
        && from instanceof window.Event;

    for (var key in from) {
        if (to[key] === undefined ||
            (!fromIsEvt && from.hasOwnProperty
                && from.hasOwnProperty(key) && !to.hasOwnProperty(key))) {
            to[key] = from[key];
        }
    }
    /**
     * IE doesn't include the toString property when iterating over an object's
     * properties with the for(property in object) syntax.  Explicitly check if
     * the source has its own toString property.
     */
    if (!fromIsEvt && from && from.hasOwnProperty
        && from.hasOwnProperty('toString') && !to.hasOwnProperty('toString')) {
        to.toString = from.toString;
    }

    return to;
};


/**
 * @description ĺ°†ĺŹ‚ć•°ĺŻąč±ˇč˝¬ćŤ˘ä¸ş HTTP çš„ GET čŻ·ć±‚ä¸­çš„ĺŹ‚ć•°ĺ­—ç¬¦ä¸˛ă€‚äľ‹ĺ¦‚ďĽš"key1=value1&key2=value2&key3=value3"ă€‚
 * @param {Object} params - ĺŹ‚ć•°ĺŻąč±ˇă€‚
 * @returns {string} HTTP çš„ GET čŻ·ć±‚ä¸­çš„ĺŹ‚ć•°ĺ­—ç¬¦ä¸˛ă€‚
 */
SuperMap.Util.getParameterString = function (params) {
    var paramsArray = [];

    for (var key in params) {
        var value = params[key];
        if ((value != null) && (typeof value !== 'function')) {
            var encodedValue;
            if (Array.isArray(value) || value.toString() === '[object Object]') {
                encodedValue = encodeURIComponent(JSON.stringify(value));
            } else {
                /* value is a string; simply encode */
                encodedValue = encodeURIComponent(value);
            }
            paramsArray.push(encodeURIComponent(key) + "=" + encodedValue);
        }
    }

    return paramsArray.join("&");
};

/**
 * @description ç»™ URL čż˝ĺŠ ćźĄčŻ˘ĺŹ‚ć•°ă€‚
 * @param {string} url - ĺľ…čż˝ĺŠ ĺŹ‚ć•°çš„ URL ĺ­—ç¬¦ä¸˛ă€‚
 * @param {string} paramStr - ĺľ…čż˝ĺŠ çš„ćźĄčŻ˘ĺŹ‚ć•°ă€‚
 * @returns {string} ć–°çš„ URLă€‚
 */
SuperMap.Util.urlAppend = function (url, paramStr) {
    var newUrl = url;
    if (paramStr) {
        if(paramStr.indexOf('?') === 0){
            paramStr = paramStr.substring(1);
        }
        var parts = (url + " ").split(/[?&]/);
        newUrl += (parts.pop() === " " ?
            paramStr :
            parts.length ? "&" + paramStr : "?" + paramStr);
    }
    return newUrl;
};

/**
 * @description ç»™ URL čż˝ĺŠ  path ĺŹ‚ć•°ă€‚
 * @param {string} url - ĺľ…čż˝ĺŠ ĺŹ‚ć•°çš„ URL ĺ­—ç¬¦ä¸˛ă€‚
 * @param {string} paramStr - ĺľ…čż˝ĺŠ çš„pathĺŹ‚ć•°ă€‚
 * @returns {string} ć–°çš„ URLă€‚
 */
SuperMap.Util.urlPathAppend = function (url, pathStr) {
    let newUrl = url;
    if (!pathStr) {
        return newUrl;
    }
    if (pathStr.indexOf('/') === 0) {
        pathStr = pathStr.substring(1);
    }
    const parts = url.split('?');
    if(parts[0].indexOf('/', parts[0].length - 1) < 0){
        parts[0] += '/'
    }
    newUrl = `${parts[0]}${pathStr}${parts.length > 1 ? `?${parts[1]}` : ''}`;
    return newUrl;
};

/**
 * @description ä¸şäş†é?żĺ…Ťćµ®ç‚ąç˛ľĺş¦é”™čŻŻč€Śäżťç•™çš„ćś‰ć•?ä˝Ťć•°ă€‚
 * @type {number}
 * @default 14
 */
SuperMap.Util.DEFAULT_PRECISION = 14;

/**
 * @description ĺ°†ĺ­—ç¬¦ä¸˛ä»ĄćŽĄčż‘çš„ç˛ľĺş¦č˝¬ćŤ˘ä¸şć•°ĺ­—ă€‚
 * @param {string} number - ĺ­—ç¬¦ä¸˛ă€‚
 * @param {number} [precision=14] - ç˛ľĺş¦ă€‚
 * @returns {number} ć•°ĺ­—ă€‚
 */
SuperMap.Util.toFloat = function (number, precision) {
    if (precision == null) {
        precision = SuperMap.Util.DEFAULT_PRECISION;
    }
    if (typeof number !== "number") {
        number = parseFloat(number);
    }
    return precision === 0 ? number :
        parseFloat(number.toPrecision(precision));
};

/**
 * @description č§’ĺş¦č˝¬ĺĽ§ĺş¦ă€‚
 * @param {number} x - č§’ĺş¦ă€‚
 * @returns {number} ĺĽ§ĺş¦ă€‚
 */
SuperMap.Util.rad = function (x) {
    return x * Math.PI / 180;
};

/**
 * @description ä»Ž URL ĺ­—ç¬¦ä¸˛ä¸­č§Łćž?ĺ‡şĺŹ‚ć•°ĺŻąč±ˇă€‚
 * @param {string} url - URLă€‚
 * @returns {Object} č§Łćž?ĺ‡şçš„ĺŹ‚ć•°ĺŻąč±ˇă€‚
 */
SuperMap.Util.getParameters = function (url) {
    // if no url specified, take it from the location bar
    url = (url === null || url === undefined) ? window.location.href : url;

    //parse out parameters portion of url string
    var paramsString = "";
    if (SuperMap.String.contains(url, '?')) {
        var start = url.indexOf('?') + 1;
        var end = SuperMap.String.contains(url, "#") ?
            url.indexOf('#') : url.length;
        paramsString = url.substring(start, end);
    }

    var parameters = {};
    var pairs = paramsString.split(/[&;]/);
    for (var i = 0, len = pairs.length; i < len; ++i) {
        var keyValue = pairs[i].split('=');
        if (keyValue[0]) {

            var key = keyValue[0];
            try {
                key = decodeURIComponent(key);
            } catch (err) {
                key = unescape(key);
            }

            // being liberal by replacing "+" with " "
            var value = (keyValue[1] || '').replace(/\+/g, " ");

            try {
                value = decodeURIComponent(value);
            } catch (err) {
                value = unescape(value);
            }

            // follow OGC convention of comma delimited values
            value = value.split(",");

            //if there's only one value, do not return as array                    
            if (value.length == 1) {
                value = value[0];
            }

            parameters[key] = value;
        }
    }
    return parameters;
};

/**
 * @description ä¸Ťć–­é€’ĺ˘žč®ˇć•°ĺŹ?é‡ŹďĽŚç”¨äşŽç”źć??ĺ”Żä¸€ IDă€‚
 * @type {number}
 * @default 0
 */
SuperMap.Util.lastSeqID = 0;

/**
 * @description ĺ?›ĺ»şĺ”Żä¸€ ID ĺ€Ľă€‚
 * @param {string} [prefix] - ĺ‰ŤçĽ€ă€‚
 * @returns {string} ĺ”Żä¸€çš„ ID ĺ€Ľă€‚
 */
SuperMap.Util.createUniqueID = function (prefix) {
    if (prefix == null) {
        prefix = "id_";
    }
    SuperMap.Util.lastSeqID += 1;
    return prefix + SuperMap.Util.lastSeqID;
};

/**
 * @memberOf SuperMap
 * @description ćŻŹĺŤ•ä˝Ťçš„č‹±ĺ°şć•°ă€‚
 * @type {Object}
 * @constant
 */
SuperMap.INCHES_PER_UNIT = {
    'inches': 1.0,
    'ft': 12.0,
    'mi': 63360.0,
    'm': 39.3701,
    'km': 39370.1,
    'dd': 4374754,
    'yd': 36
};
SuperMap.INCHES_PER_UNIT["in"] = SuperMap.INCHES_PER_UNIT.inches;
SuperMap.INCHES_PER_UNIT.degrees = SuperMap.INCHES_PER_UNIT.dd;
SuperMap.INCHES_PER_UNIT.nmi = 1852 * SuperMap.INCHES_PER_UNIT.m;

// Units from CS-Map
SuperMap.METERS_PER_INCH = 0.02540005080010160020;
SuperMap.Util.extend(SuperMap.INCHES_PER_UNIT, {
    "Inch": SuperMap.INCHES_PER_UNIT.inches,
    "Meter": 1.0 / SuperMap.METERS_PER_INCH,   //EPSG:9001
    "Foot": 0.30480060960121920243 / SuperMap.METERS_PER_INCH,   //EPSG:9003
    "IFoot": 0.30480000000000000000 / SuperMap.METERS_PER_INCH,   //EPSG:9002
    "ClarkeFoot": 0.3047972651151 / SuperMap.METERS_PER_INCH,   //EPSG:9005
    "SearsFoot": 0.30479947153867624624 / SuperMap.METERS_PER_INCH,   //EPSG:9041
    "GoldCoastFoot": 0.30479971018150881758 / SuperMap.METERS_PER_INCH,   //EPSG:9094
    "IInch": 0.02540000000000000000 / SuperMap.METERS_PER_INCH,
    "MicroInch": 0.00002540000000000000 / SuperMap.METERS_PER_INCH,
    "Mil": 0.00000002540000000000 / SuperMap.METERS_PER_INCH,
    "Centimeter": 0.01000000000000000000 / SuperMap.METERS_PER_INCH,
    "Kilometer": 1000.00000000000000000000 / SuperMap.METERS_PER_INCH,   //EPSG:9036
    "Yard": 0.91440182880365760731 / SuperMap.METERS_PER_INCH,
    "SearsYard": 0.914398414616029 / SuperMap.METERS_PER_INCH,   //EPSG:9040
    "IndianYard": 0.91439853074444079983 / SuperMap.METERS_PER_INCH,   //EPSG:9084
    "IndianYd37": 0.91439523 / SuperMap.METERS_PER_INCH,   //EPSG:9085
    "IndianYd62": 0.9143988 / SuperMap.METERS_PER_INCH,   //EPSG:9086
    "IndianYd75": 0.9143985 / SuperMap.METERS_PER_INCH,   //EPSG:9087
    "IndianFoot": 0.30479951 / SuperMap.METERS_PER_INCH,   //EPSG:9080
    "IndianFt37": 0.30479841 / SuperMap.METERS_PER_INCH,   //EPSG:9081
    "IndianFt62": 0.3047996 / SuperMap.METERS_PER_INCH,   //EPSG:9082
    "IndianFt75": 0.3047995 / SuperMap.METERS_PER_INCH,   //EPSG:9083
    "Mile": 1609.34721869443738887477 / SuperMap.METERS_PER_INCH,
    "IYard": 0.91440000000000000000 / SuperMap.METERS_PER_INCH,   //EPSG:9096
    "IMile": 1609.34400000000000000000 / SuperMap.METERS_PER_INCH,   //EPSG:9093
    "NautM": 1852.00000000000000000000 / SuperMap.METERS_PER_INCH,   //EPSG:9030
    "Lat-66": 110943.316488932731 / SuperMap.METERS_PER_INCH,
    "Lat-83": 110946.25736872234125 / SuperMap.METERS_PER_INCH,
    "Decimeter": 0.10000000000000000000 / SuperMap.METERS_PER_INCH,
    "Millimeter": 0.00100000000000000000 / SuperMap.METERS_PER_INCH,
    "Dekameter": 10.00000000000000000000 / SuperMap.METERS_PER_INCH,
    "Decameter": 10.00000000000000000000 / SuperMap.METERS_PER_INCH,
    "Hectometer": 100.00000000000000000000 / SuperMap.METERS_PER_INCH,
    "GermanMeter": 1.0000135965 / SuperMap.METERS_PER_INCH,   //EPSG:9031
    "CaGrid": 0.999738 / SuperMap.METERS_PER_INCH,
    "ClarkeChain": 20.1166194976 / SuperMap.METERS_PER_INCH,   //EPSG:9038
    "GunterChain": 20.11684023368047 / SuperMap.METERS_PER_INCH,   //EPSG:9033
    "BenoitChain": 20.116782494375872 / SuperMap.METERS_PER_INCH,   //EPSG:9062
    "SearsChain": 20.11676512155 / SuperMap.METERS_PER_INCH,   //EPSG:9042
    "ClarkeLink": 0.201166194976 / SuperMap.METERS_PER_INCH,   //EPSG:9039
    "GunterLink": 0.2011684023368047 / SuperMap.METERS_PER_INCH,   //EPSG:9034
    "BenoitLink": 0.20116782494375872 / SuperMap.METERS_PER_INCH,   //EPSG:9063
    "SearsLink": 0.2011676512155 / SuperMap.METERS_PER_INCH,   //EPSG:9043
    "Rod": 5.02921005842012 / SuperMap.METERS_PER_INCH,
    "IntnlChain": 20.1168 / SuperMap.METERS_PER_INCH,   //EPSG:9097
    "IntnlLink": 0.201168 / SuperMap.METERS_PER_INCH,   //EPSG:9098
    "Perch": 5.02921005842012 / SuperMap.METERS_PER_INCH,
    "Pole": 5.02921005842012 / SuperMap.METERS_PER_INCH,
    "Furlong": 201.1684023368046 / SuperMap.METERS_PER_INCH,
    "Rood": 3.778266898 / SuperMap.METERS_PER_INCH,
    "CapeFoot": 0.3047972615 / SuperMap.METERS_PER_INCH,
    "Brealey": 375.00000000000000000000 / SuperMap.METERS_PER_INCH,
    "ModAmFt": 0.304812252984505969011938 / SuperMap.METERS_PER_INCH,
    "Fathom": 1.8288 / SuperMap.METERS_PER_INCH,
    "NautM-UK": 1853.184 / SuperMap.METERS_PER_INCH,
    "50kilometers": 50000.0 / SuperMap.METERS_PER_INCH,
    "150kilometers": 150000.0 / SuperMap.METERS_PER_INCH
});

//unit abbreviations supported by PROJ.4
SuperMap.Util.extend(SuperMap.INCHES_PER_UNIT, {
    "mm": SuperMap.INCHES_PER_UNIT.Meter / 1000.0,
    "cm": SuperMap.INCHES_PER_UNIT.Meter / 100.0,
    "dm": SuperMap.INCHES_PER_UNIT.Meter * 100.0,
    "km": SuperMap.INCHES_PER_UNIT.Meter * 1000.0,
    "kmi": SuperMap.INCHES_PER_UNIT.nmi,    //International Nautical Mile
    "fath": SuperMap.INCHES_PER_UNIT.Fathom, //International Fathom
    "ch": SuperMap.INCHES_PER_UNIT.IntnlChain,  //International Chain
    "link": SuperMap.INCHES_PER_UNIT.IntnlLink, //International Link
    "us-in": SuperMap.INCHES_PER_UNIT.inches, //U.S. Surveyor's Inch
    "us-ft": SuperMap.INCHES_PER_UNIT.Foot,    //U.S. Surveyor's Foot
    "us-yd": SuperMap.INCHES_PER_UNIT.Yard,    //U.S. Surveyor's Yard
    "us-ch": SuperMap.INCHES_PER_UNIT.GunterChain, //U.S. Surveyor's Chain
    "us-mi": SuperMap.INCHES_PER_UNIT.Mile,   //U.S. Surveyor's Statute Mile
    "ind-yd": SuperMap.INCHES_PER_UNIT.IndianYd37,  //Indian Yard
    "ind-ft": SuperMap.INCHES_PER_UNIT.IndianFt37,  //Indian Foot
    "ind-ch": 20.11669506 / SuperMap.METERS_PER_INCH  //Indian Chain
});

/**
 * @memberOf SuperMap
 * @member [SuperMap.DOTS_PER_INCH=96]
 * @description ĺ?†čľ¨çŽ‡ä¸ŽćŻ”äľ‹ĺ°şäą‹é—´č˝¬ćŤ˘çš„ĺ¸¸é‡Źă€‚
 * @type {Object}
 */
SuperMap.DOTS_PER_INCH = 96;

/**
 * @param {number} scale - ćŻ”äľ‹ĺ°şă€‚
 * @returns {number} čż”ĺ›žć­Łĺ¸¸çš„ scale ĺ€Ľă€‚
 */
SuperMap.Util.normalizeScale = function (scale) {
    var normScale = (scale > 1.0) ? (1.0 / scale) : scale;
    return normScale;
};

/**
 * @description ćŻ”äľ‹ĺ°şč˝¬ĺ?†čľ¨çŽ‡ă€‚
 * @param {number} scale - ćŻ”äľ‹ĺ°şă€‚
 * @param {string} [units='degrees'] - ćŻ”äľ‹ĺ°şĺŤ•ä˝Ťă€‚
 * @returns {number} ĺ?†čľ¨çŽ‡ă€‚
 */
SuperMap.Util.getResolutionFromScale = function (scale, units) {
    var resolution;
    if (scale) {
        if (units == null) {
            units = "degrees";
        }
        var normScale = SuperMap.Util.normalizeScale(scale);
        resolution = 1 / (normScale * SuperMap.INCHES_PER_UNIT[units]
            * SuperMap.DOTS_PER_INCH);
    }
    return resolution;
};

/**
 * @description ĺ?†čľ¨çŽ‡č˝¬ćŻ”äľ‹ĺ°şă€‚
 * @param {number} resolution - ĺ?†čľ¨çŽ‡ă€‚
 * @param {string} [units='degrees'] - ĺ?†čľ¨çŽ‡ĺŤ•ä˝Ťă€‚
 * @returns {number} ćŻ”äľ‹ĺ°şă€‚
 */
SuperMap.Util.getScaleFromResolution = function (resolution, units) {

    if (units == null) {
        units = "degrees";
    }

    var scale = resolution * SuperMap.INCHES_PER_UNIT[units] *
        SuperMap.DOTS_PER_INCH;
    return scale;
};

/**
 * @memberOf SuperMap
 * @description ĺ¦‚ćžś userAgent ćŤ•čŽ·ĺ?°ćµŹč§?ĺ™¨ä˝żç”¨çš„ć?Ż Gecko ĺĽ•ć“Žĺ?™čż”ĺ›ž trueă€‚
 * @constant
 */
SuperMap.IS_GECKO = (function () {
    var ua = navigator.userAgent.toLowerCase();
    return ua.indexOf("webkit") === -1 && ua.indexOf("gecko") !== -1;
})();

/**
 * @memberOf SuperMap
 * @description ćµŹč§?ĺ™¨ĺ?Ťç§°ďĽŚäľťčµ–äşŽ userAgent ĺ±žć€§ďĽŚBROWSER_NAME ĺŹŻä»Ąć?Żç©şďĽŚć?–č€…ä»Ąä¸‹ćµŹč§?ĺ™¨ďĽš
 *     * "opera" -- Opera
 *     * "msie"  -- Internet Explorer
 *     * "safari" -- Safari
 *     * "firefox" -- Firefox
 *     * "mozilla" -- Mozilla
 * @constant
 */
SuperMap.Browser = (function () {
    var name = '', version = '', device = 'pc', uaMatch;
    //ä»Ąä¸‹čż›čˇŚćµ‹čŻ•
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf("msie") > -1 || (ua.indexOf("trident") > -1 && ua.indexOf("rv") > -1)) {
        name = 'msie';
        uaMatch = ua.match(/msie ([\d.]+)/) || ua.match(/rv:([\d.]+)/);
    } else if (ua.indexOf("chrome") > -1) {
        name = 'chrome';
        uaMatch = ua.match(/chrome\/([\d.]+)/);
    } else if (ua.indexOf("firefox") > -1) {
        name = 'firefox';
        uaMatch = ua.match(/firefox\/([\d.]+)/);
    } else if (ua.indexOf("opera") > -1) {
        name = 'opera';
        uaMatch = ua.match(/version\/([\d.]+)/);
    } else if (ua.indexOf("safari") > -1) {
        name = 'safari';
        uaMatch = ua.match(/version\/([\d.]+)/);
    }
    version = uaMatch ? uaMatch[1] : '';

    if (ua.indexOf("ipad") > -1 || ua.indexOf("ipod") > -1 || ua.indexOf("iphone") > -1) {
        device = 'apple';
    } else if (ua.indexOf("android") > -1) {
        uaMatch = ua.match(/version\/([\d.]+)/);
        version = uaMatch ? uaMatch[1] : '';
        device = 'android';
    }
    return {name: name, version: version, device: device};
})();

/**
 * @description čŽ·ĺŹ–ćµŹč§?ĺ™¨ç›¸ĺ…łäżˇć?Żă€‚ć”ŻćŚ?çš„ćµŹč§?ĺ™¨ĺŚ…ć‹¬ďĽšOperaďĽŚInternet ExplorerďĽŚSafariďĽŚFirefoxă€‚
 * @returns {Object} čŽ·ĺŹ–ćµŹč§?ĺ™¨ĺ?Ťç§°ă€?ç‰?ćś¬ă€?č®ľĺ¤‡ĺ?Ťç§°ă€‚ĺŻąĺş”çš„ĺ±žć€§ĺ?†ĺ?«ä¸ş name, version, deviceă€‚
 */
SuperMap.Util.getBrowser = function () {
    return SuperMap.Browser;
};

/**
 * @description ćµŹč§?ĺ™¨ć?Żĺ?¦ć”ŻćŚ? Canvasă€‚
 * @returns {boolean} čŽ·ĺŹ–ĺ˝“ĺ‰ŤćµŹč§?ĺ™¨ć?Żĺ?¦ć”ŻćŚ? HTML5 Canvasă€‚
 */
SuperMap.Util.isSupportCanvas = (function () {
    var checkRes = true, broz = SuperMap.Util.getBrowser();
    if (document.createElement("canvas").getContext) {
        if (broz.name === 'firefox' && parseFloat(broz.version) < 5) {
            checkRes = false;
        }
        if (broz.name === 'safari' && parseFloat(broz.version) < 4) {
            checkRes = false;
        }
        if (broz.name === 'opera' && parseFloat(broz.version) < 10) {
            checkRes = false;
        }
        if (broz.name === 'msie' && parseFloat(broz.version) < 9) {
            checkRes = false;
        }
    } else {
        checkRes = false;
    }
    return checkRes;
})();

/**
 * @description ĺ?¤ć–­ďĽ›ćµŹč§?ĺ™¨ć?Żĺ?¦ć”ŻćŚ? Canvasă€‚
 * @returns {boolean} čŽ·ĺŹ–ĺ˝“ĺ‰ŤćµŹč§?ĺ™¨ć?Żĺ?¦ć”ŻćŚ? HTML5 Canvas ă€‚
 */
SuperMap.Util.supportCanvas = function () {
    return SuperMap.Util.isSupportCanvas;
};

//ĺ°†ćśŤĺŠˇç«Żçš„ĺś°ĺ›ľĺŤ•ä˝Ťč˝¬ć??SuperMapçš„ĺś°ĺ›ľĺŤ•ä˝Ť
SuperMap.INCHES_PER_UNIT.degree = SuperMap.INCHES_PER_UNIT.dd;
SuperMap.INCHES_PER_UNIT.meter = SuperMap.INCHES_PER_UNIT.m;
SuperMap.INCHES_PER_UNIT.foot = SuperMap.INCHES_PER_UNIT.ft;
SuperMap.INCHES_PER_UNIT.inch = SuperMap.INCHES_PER_UNIT.inches;
SuperMap.INCHES_PER_UNIT.mile = SuperMap.INCHES_PER_UNIT.mi;
SuperMap.INCHES_PER_UNIT.kilometer = SuperMap.INCHES_PER_UNIT.km;
SuperMap.INCHES_PER_UNIT.yard = SuperMap.INCHES_PER_UNIT.yd;

/**
 * @description ĺ?¤ć–­ä¸€ä¸Ş URL čŻ·ć±‚ć?Żĺ?¦ĺś¨ĺ˝“ĺ‰Ťĺźźä¸­ă€‚
 * @param {string} url - URL čŻ·ć±‚ĺ­—ç¬¦ä¸˛ă€‚
 * @returns {boolean} URL čŻ·ć±‚ć?Żĺ?¦ĺś¨ĺ˝“ĺ‰Ťĺźźä¸­ă€‚
 */
SuperMap.Util.isInTheSameDomain = function (url) {
    if (!url) {
        return true;
    }
    var index = url.indexOf("//");
    var documentUrl = document.location.toString();
    var documentIndex = documentUrl.indexOf("//");
    if (index === -1) {
        return true;
    } else {
        var protocol;
        var substring = protocol = url.substring(0, index);
        var documentSubString = documentUrl.substring(documentIndex + 2);
        documentIndex = documentSubString.indexOf("/");
        var documentPortIndex = documentSubString.indexOf(":");
        var documentDomainWithPort = documentSubString.substring(0, documentIndex);
        //var documentPort;

        var documentprotocol = document.location.protocol;
        if (documentPortIndex !== -1) {
            // documentPort = +documentSubString.substring(documentPortIndex, documentIndex);
        } else {
            documentDomainWithPort += ':' + (documentprotocol.toLowerCase() === 'http:' ? 80 : 443);
        }
        if (documentprotocol.toLowerCase() !== substring.toLowerCase()) {
            return false;
        }
        substring = url.substring(index + 2);
        var portIndex = substring.indexOf(":");
        index = substring.indexOf("/");
        var domainWithPort = substring.substring(0, index);
        var domain;
        if (portIndex !== -1) {
            domain = substring.substring(0, portIndex);
        } else {
            domain = substring.substring(0, index);
            domainWithPort += ':' + (protocol.toLowerCase() === 'http:' ? 80 : 443);
        }
        var documentDomain = document.domain;
        if (domain === documentDomain && domainWithPort === documentDomainWithPort) {
            return true;
        }
    }
    return false;
};

/**
 * @description č®ˇç®— iServer ćśŤĺŠˇçš„ REST ĺ›ľĺ±‚çš„ć?ľç¤şĺ?†čľ¨çŽ‡ďĽŚéś€č¦?ä»Ž iServer çš„ REST ĺ›ľĺ±‚čˇ¨čż°ä¸­čŽ·ĺŹ– viewBoundsă€?vieweră€?scaleă€?coordUnită€?datumAxis äş”ä¸ŞĺŹ‚ć•°ďĽŚćťĄčż›čˇŚč®ˇç®—ă€‚
 * @param {SuperMap.Bounds} viewBounds - ĺś°ĺ›ľçš„ĺŹ‚ç…§ĺŹŻč§†čŚ?ĺ›´ďĽŚĺŤłĺś°ĺ›ľĺ?ťĺ§‹ĺŚ–ć—¶é»?č®¤çš„ĺś°ĺ›ľć?ľç¤şčŚ?ĺ›´ă€‚
 * @param {SuperMap.Size} viewer - ĺś°ĺ›ľĺ?ťĺ§‹ĺŚ–ć—¶é»?č®¤çš„ĺś°ĺ›ľĺ›ľç‰‡çš„ĺ°şĺŻ¸ă€‚
 * @param {number} scale - ĺś°ĺ›ľĺ?ťĺ§‹ĺŚ–ć—¶é»?č®¤çš„ć?ľç¤şćŻ”äľ‹ĺ°şă€‚
 * @param {string} [coordUnit='degrees'] - ćŠ•ĺ˝±ĺť?ć ‡çł»ç»źçš„ĺś°ĺ›ľĺŤ•ä˝Ťă€‚
 * @param {number} [datumAxis=6378137] - ĺś°ç?†ĺť?ć ‡çł»ç»źć¤­ç??ä˝“é•żĺŤŠč˝´ă€‚ç”¨ć?·č‡Şĺ®šäą‰ĺś°ĺ›ľçš„ Options ć—¶ďĽŚč‹ĄćśŞćŚ‡ĺ®ščŻĄĺŹ‚ć•°çš„ĺ€ĽďĽŚĺ?™çł»ç»źé»?č®¤ä¸ş WGS84 ĺŹ‚č€?çł»çš„ć¤­ç??ä˝“é•żĺŤŠč˝´ 6378137ă€‚
 * @returns {number} čż”ĺ›žĺ›ľĺ±‚ć?ľç¤şĺ?†čľ¨çŽ‡ă€‚
 */
SuperMap.Util.calculateDpi = function (viewBounds, viewer, scale, coordUnit, datumAxis) {
    //10000 ć?Ż 0.1ćŻ«ç±łä¸Žç±łçš„č˝¬ćŤ˘ă€‚DPIçš„č®ˇç®—ĺ…¬ĺĽŹďĽšViewer / DPI *  0.0254 * 10000 = ViewBounds * scale ďĽŚĺ…¬ĺĽŹä¸­çš„10000ć?Żä¸şäş†ćŹ?é«?č®ˇç®—ç»“ćžśçš„ç˛ľĺş¦ďĽŚä»Ąä¸‹ĺ‡şçŽ°çš„ratioçš†ä¸şĺ¦‚ć­¤ă€‚
    if (!viewBounds || !viewer || !scale) {
        return;
    }
    var ratio = 10000,
        rvbWidth = viewBounds.getWidth(),
        rvbHeight = viewBounds.getHeight(),
        rvWidth = viewer.w,
        rvHeight = viewer.h;
    //ç”¨ć?·č‡Şĺ®šäą‰ĺś°ĺ›ľçš„Optionsć—¶ďĽŚč‹ĄćśŞćŚ‡ĺ®ščŻĄĺŹ‚ć•°çš„ĺ€ĽďĽŚĺ?™çł»ç»źé»?č®¤ä¸ş6378137ç±łďĽŚĺŤłWGS84ĺŹ‚č€?çł»çš„ć¤­ç??ä˝“é•żĺŤŠč˝´ă€‚
    datumAxis = datumAxis || 6378137;
    coordUnit = coordUnit || "degrees";
    var dpi;
    if (coordUnit.toLowerCase() === "degree" || coordUnit.toLowerCase() === "degrees" || coordUnit.toLowerCase() === "dd") {
        let num1 = rvbWidth / rvWidth,
            num2 = rvbHeight / rvHeight,
            resolution = num1 > num2 ? num1 : num2;
        dpi = 0.0254 * ratio / resolution / scale / ((Math.PI * 2 * datumAxis) / 360) / ratio;

    } else {
        let resolution = rvbWidth / rvWidth;
        dpi = 0.0254 * ratio / resolution / scale / ratio;
    }
    return dpi;
};

/**
 * @description ĺ°†ĺŻąč±ˇč˝¬ćŤ˘ć?? JSON ĺ­—ç¬¦ä¸˛ă€‚
 * @param {Object} obj - č¦?č˝¬ćŤ˘ć?? JSON çš„ Object ĺŻąč±ˇă€‚
 * @returns {string} čż”ĺ›žč˝¬ćŤ˘ĺ?Žçš„ JSON ĺŻąč±ˇă€‚
 */
SuperMap.Util.toJSON = function (obj) {
    var objInn = obj;
    if (objInn == null) {
        return null;
    }
    switch (objInn.constructor) {
        case String:
            //s = "'" + str.replace(/(["\\])/g, "\\$1") + "'";   stringĺ?«ćś‰ĺŤ•ĺĽ•ĺŹ·ĺ‡şé”™
            objInn = '"' + objInn.replace(/(["\\])/g, '\\$1') + '"';
            objInn = objInn.replace(/\n/g, "\\n");
            objInn = objInn.replace(/\r/g, "\\r");
            objInn = objInn.replace("<", "&lt;");
            objInn = objInn.replace(">", "&gt;");
            objInn = objInn.replace(/%/g, "%25");
            objInn = objInn.replace(/&/g, "%26");
            return objInn;
       case Array:
            var arr = '';
            for (var i = 0, len = objInn.length; i < len; i++) {
              arr += SuperMap.Util.toJSON(objInn[i]);
              if (i !== objInn.length - 1) {
                arr += ',';
              }
            }
            return "[" + arr + "]";
        case Number:
            return isFinite(objInn) ? String(objInn) : null;
        case Boolean:
            return String(objInn);
        case Date:
            var dateStr = "{" + "'__type':\"System.DateTime\"," +
                "'Year':" + objInn.getFullYear() + "," +
                "'Month':" + (objInn.getMonth() + 1) + "," +
                "'Day':" + objInn.getDate() + "," +
                "'Hour':" + objInn.getHours() + "," +
                "'Minute':" + objInn.getMinutes() + "," +
                "'Second':" + objInn.getSeconds() + "," +
                "'Millisecond':" + objInn.getMilliseconds() + "," +
                "'TimezoneOffset':" + objInn.getTimezoneOffset() + "}";
            return dateStr;
        default:
            if (objInn["toJSON"] != null && typeof objInn["toJSON"] === "function") {
                return objInn.toJSON();
            }
            if (typeof objInn === "object") {
                if (objInn.length) {
                    let arr = [];
                    for (let i = 0, len = objInn.length; i < len; i++) {
                        arr.push(SuperMap.Util.toJSON(objInn[i]));
                    }
                    return "[" + arr.join(",") + "]";
                }
                let arr = [];
                for (let attr in objInn) {
                    //ä¸şč§Łĺ†łSuperMap.Geometryç±»ĺž‹ĺ¤´jsonć—¶ĺ †ć ?ćş˘ĺ‡şçš„é—®é˘?ďĽŚattr == "parent"ć—¶ä¸Ťčż›čˇŚjsonč˝¬ćŤ˘
                    if (typeof objInn[attr] !== "function" && attr !== "CLASS_NAME" && attr !== "parent") {
                        arr.push("'" + attr + "':" + SuperMap.Util.toJSON(objInn[attr]));
                    }
                }

                if (arr.length > 0) {
                    return "{" + arr.join(",") + "}";
                } else {
                    return "{}";
                }
            }
            return objInn.toString();
    }
};

/**
 * @description ć ąćŤ®ćŻ”äľ‹ĺ°şĺ’Ś dpi č®ˇç®—ĺ±Źĺą•ĺ?†čľ¨çŽ‡ă€‚
 * @param {number} scale - ćŻ”äľ‹ĺ°şă€‚
 * @param {number} dpi - ĺ›ľĺ?Źĺ?†čľ¨çŽ‡ďĽŚčˇ¨ç¤şćŻŹč‹±ĺŻ¸ĺ†…çš„ĺ?Źç´ ä¸Şć•°ă€‚
 * @param {string} [coordUnit] - ćŠ•ĺ˝±ĺť?ć ‡çł»ç»źçš„ĺś°ĺ›ľĺŤ•ä˝Ťă€‚
 * @param {number} [datumAxis=6378137] - ĺś°ç?†ĺť?ć ‡çł»ç»źć¤­ç??ä˝“é•żĺŤŠč˝´ă€‚ç”¨ć?·č‡Şĺ®šäą‰ĺś°ĺ›ľçš„ Options ć—¶ďĽŚč‹ĄćśŞćŚ‡ĺ®ščŻĄĺŹ‚ć•°çš„ĺ€ĽďĽŚĺ?™ DPI é»?č®¤ćŚ‰ç…§ WGS84 ĺŹ‚č€?çł»çš„ć¤­ç??ä˝“é•żĺŤŠč˝´ 6378137 ćťĄč®ˇç®—ă€‚
 * @returns {number} čż”ĺ›žĺ˝“ĺ‰ŤćŻ”äľ‹ĺ°şä¸‹çš„ĺ±Źĺą•ĺ?†čľ¨çŽ‡ă€‚
 */
SuperMap.Util.getResolutionFromScaleDpi = function (scale, dpi, coordUnit, datumAxis) {
    var resolution = null,
        ratio = 10000;
    //ç”¨ć?·č‡Şĺ®šäą‰ĺś°ĺ›ľçš„Optionsć—¶ďĽŚč‹ĄćśŞćŚ‡ĺ®ščŻĄĺŹ‚ć•°çš„ĺ€ĽďĽŚĺ?™çł»ç»źé»?č®¤ä¸ş6378137ç±łďĽŚĺŤłWGS84ĺŹ‚č€?çł»çš„ć¤­ç??ä˝“é•żĺŤŠč˝´ă€‚
    datumAxis = datumAxis || 6378137;
    coordUnit = coordUnit || "";
    if (scale > 0 && dpi > 0) {
        scale = SuperMap.Util.normalizeScale(scale);
        if (coordUnit.toLowerCase() === "degree" || coordUnit.toLowerCase() === "degrees" || coordUnit.toLowerCase() === "dd") {
            //scale = SuperMap.Util.normalizeScale(scale);
            resolution = 0.0254 * ratio / dpi / scale / ((Math.PI * 2 * datumAxis) / 360) / ratio;
            return resolution;
        } else {
            resolution = 0.0254 * ratio / dpi / scale / ratio;
            return resolution;
        }
    }
    return -1;
};

/**
 * @description ć ąćŤ® resolutionă€?dpiă€?coordUnit ĺ’Ś datumAxis č®ˇç®—ćŻ”äľ‹ĺ°şă€‚
 * @param {number} resolution - ç”¨äşŽč®ˇç®—ćŻ”äľ‹ĺ°şçš„ĺś°ĺ›ľĺ?†čľ¨çŽ‡ă€‚
 * @param {number} dpi - ĺ›ľĺ?Źĺ?†čľ¨çŽ‡ďĽŚčˇ¨ç¤şćŻŹč‹±ĺŻ¸ĺ†…çš„ĺ?Źç´ ä¸Şć•°ă€‚
 * @param {string} [coordUnit] - ćŠ•ĺ˝±ĺť?ć ‡çł»ç»źçš„ĺś°ĺ›ľĺŤ•ä˝Ťă€‚
 * @param {number} [datumAxis=6378137] - ĺś°ç?†ĺť?ć ‡çł»ç»źć¤­ç??ä˝“é•żĺŤŠč˝´ă€‚ç”¨ć?·č‡Şĺ®šäą‰ĺś°ĺ›ľçš„ Options ć—¶ďĽŚč‹ĄćśŞćŚ‡ĺ®ščŻĄĺŹ‚ć•°çš„ĺ€ĽďĽŚĺ?™ DPI é»?č®¤ćŚ‰ç…§ WGS84 ĺŹ‚č€?çł»çš„ć¤­ç??ä˝“é•żĺŤŠč˝´ 6378137 ćťĄč®ˇç®—ă€‚
 * @returns {number} čż”ĺ›žĺ˝“ĺ‰Ťĺ±Źĺą•ĺ?†čľ¨çŽ‡ä¸‹çš„ćŻ”äľ‹ĺ°şă€‚
 */
SuperMap.Util.getScaleFromResolutionDpi = function (resolution, dpi, coordUnit, datumAxis) {
    var scale = null,
        ratio = 10000;
    //ç”¨ć?·č‡Şĺ®šäą‰ĺś°ĺ›ľçš„Optionsć—¶ďĽŚč‹ĄćśŞćŚ‡ĺ®ščŻĄĺŹ‚ć•°çš„ĺ€ĽďĽŚĺ?™çł»ç»źé»?č®¤ä¸ş6378137ç±łďĽŚĺŤłWGS84ĺŹ‚č€?çł»çš„ć¤­ç??ä˝“é•żĺŤŠč˝´ă€‚
    datumAxis = datumAxis || 6378137;
    coordUnit = coordUnit || "";
    if (resolution > 0 && dpi > 0) {
        if (coordUnit.toLowerCase() === "degree" || coordUnit.toLowerCase() === "degrees" || coordUnit.toLowerCase() === "dd") {
            scale = 0.0254 * ratio / dpi / resolution / ((Math.PI * 2 * datumAxis) / 360) / ratio;
            return scale;
        } else {
            scale = 0.0254 * ratio / dpi / resolution / ratio;
            return scale;
        }
    }
    return -1;
};

/**
 * @description č˝¬ćŤ˘ćźĄčŻ˘ç»“ćžśă€‚
 * @param {Object} result - ćźĄčŻ˘ç»“ćžśă€‚
 * @returns {Object} č˝¬ćŤ˘ĺ?Žçš„ćźĄčŻ˘ç»“ćžśă€‚
 */
SuperMap.Util.transformResult = function (result) {
    if (result.responseText && typeof result.responseText === "string") {
        result = JSON.parse(result.responseText);
    }
    return result;
};

/**
 * @description ĺ±žć€§ć‹·č´ťďĽŚä¸Ťć‹·č´ťć–ąćł•ç±»ĺ?Ť(CLASS_NAME)ç­‰ă€‚
 * @param {Object} [destination] - ć‹·č´ťç›®ć ‡ă€‚
 * @param {Object} source - ćş?ĺŻąč±ˇă€‚
 *
 */
SuperMap.Util.copyAttributes = function (destination, source) {
    destination = destination || {};
    if (source) {
        for (var property in source) {
            var value = source[property];
            if (value !== undefined && property !== "CLASS_NAME" && typeof value !== "function") {
                destination[property] = value;
            }
        }
    }
    return destination;
};

/**
 * @description ĺ°†ćş?ĺŻąč±ˇä¸Šçš„ĺ±žć€§ć‹·č´ťĺ?°ç›®ć ‡ĺŻąč±ˇä¸Šă€‚ďĽ?ä¸Ťć‹·č´ť CLASS_NAME ĺ’Ść–ąćł•ďĽ‰
 * @param {Object} [destination] - ç›®ć ‡ĺŻąč±ˇă€‚
 * @param {Object} source - ćş?ĺŻąč±ˇă€‚
 * @param {Array.<string>} clip - ćş?ĺŻąč±ˇä¸­ç¦?ć­˘ć‹·č´ťĺ?°ç›®ć ‡ĺŻąč±ˇçš„ĺ±žć€§ďĽŚç›®çš„ć?Żé?˛ć­˘ç›®ć ‡ĺŻąč±ˇä¸Šä¸ŤĺŹŻäż®ć”ąçš„ĺ±žć€§č˘«çŻˇć”ąă€‚
 *
 */
SuperMap.Util.copyAttributesWithClip = function (destination, source, clip) {
    destination = destination || {};
    if (source) {
        for (var property in source) {
            //ĺŽ»ćŽ‰ç¦?ć­˘ć‹·č´ťçš„ĺ±žć€§
            var isInClip = false;
            if (clip && clip.length) {
                for (var i = 0, len = clip.length; i < len; i++) {
                    if (property === clip[i]) {
                        isInClip = true;
                        break;
                    }
                }
            }
            if (isInClip === true) {
                continue;
            }

            var value = source[property];
            if (value !== undefined && property !== "CLASS_NAME" && typeof value !== "function") {
                destination[property] = value;
            }
        }
    }
    return destination;
};

/**
 * @description ĺ…‹éš†ä¸€ä¸Ş Object ĺŻąč±ˇ
 * @param {Object} obj - éś€č¦?ĺ…‹éš†çš„ĺŻąč±ˇă€‚
 * @returns {Object} čż”ĺ›žĺŻąč±ˇçš„ć‹·č´ťĺŻąč±ˇďĽŚćł¨ć„Źć?Żć–°çš„ĺŻąč±ˇďĽŚä¸Ťć?ŻćŚ‡ĺ?‘ă€‚
 */
SuperMap.Util.cloneObject = function (obj) {
    // Handle the 3 simple types, and null or undefined
    if (null === obj || "object" !== typeof obj) {
        return obj;
    }

    // Handle Date
    if (obj instanceof Date) {
        let copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        let copy = obj.slice(0);
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        let copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                copy[attr] = SuperMap.Util.cloneObject(obj[attr]);
            }
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
};

/**
 * @description ĺ?¤ć–­ä¸¤ćťˇçşżć®µć?Żä¸Ťć?Żćś‰äş¤ç‚ąă€‚
 * @param {SuperMap.Geometry.Point} a1 - ç¬¬ä¸€ćťˇçşżć®µçš„čµ·ĺ§‹čŠ‚ç‚ąă€‚
 * @param {SuperMap.Geometry.Point} a2 - ç¬¬ä¸€ćťˇçşżć®µçš„ç»“ćťźčŠ‚ç‚ąă€‚
 * @param {SuperMap.Geometry.Point} b1 - ç¬¬äşŚćťˇçşżć®µçš„čµ·ĺ§‹čŠ‚ç‚ąă€‚
 * @param {SuperMap.Geometry.Point} b2 - ç¬¬äşŚćťˇçşżć®µçš„ç»“ćťźčŠ‚ç‚ąă€‚
 * @returns {Object} ĺ¦‚ćžśç›¸äş¤čż”ĺ›žäş¤ç‚ąďĽŚĺ¦‚ćžśä¸Ťç›¸äş¤čż”ĺ›žä¸¤ćťˇçşżć®µçš„ä˝Ťç˝®ĺ…łçł»ă€‚
 */
SuperMap.Util.lineIntersection = function (a1, a2, b1, b2) {
    var intersectValue = null;
    var k1;
    var k2;
    var b = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
    var a = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
    var ab = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
    //ab==0ä»Łčˇ¨ä¸¤ćťˇçşżć–­çš„ć–śçŽ‡ä¸€ć ·
    if (ab != 0) {
        k1 = b / ab;
        k2 = a / ab;

        if (k1 >= 0 && k2 <= 1 && k1 <= 1 && k2 >= 0) {
            intersectValue = new SuperMap.Geometry.Point(a1.x + k1 * (a2.x - a1.x), a1.y + k1 * (a2.y - a1.y));
        } else {
            intersectValue = "No Intersection";
        }
    } else {

        if (b == 0 && a == 0) {
            var maxy = Math.max(a1.y, a2.y);
            var miny = Math.min(a1.y, a2.y);
            var maxx = Math.max(a1.x, a2.x);
            var minx = Math.min(a1.x, a2.x);
            if (((b1.y >= miny && b1.y <= maxy) || (b2.y >= miny && b2.y <= maxy)) &&
                (b1.x >= minx && b1.x <= maxx) || (b2.x >= minx && b2.x <= maxx)) {
                intersectValue = "Coincident";//é‡Ťĺ??
            } else {
                intersectValue = "Parallel";//ĺąłčˇŚ
            }

        } else {
            intersectValue = "Parallel";//ĺąłčˇŚ
        }
    }
    return intersectValue;
};

/**
 * @description čŽ·ĺŹ–ć–‡ćś¬ĺ¤–ćŽĄçź©ĺ˝˘ĺ®˝ĺş¦ä¸Žé«?ĺş¦ă€‚
 * @param {SuperMap.ThemeStyle} style - ć–‡ćś¬ć ·ĺĽŹă€‚
 * @param {string} text - ć–‡ćś¬ĺ†…ĺ®ąă€‚
 * @param {Object} element - DOM ĺ…?ç´ ă€‚
 * @returns {Object} čż”ĺ›žčŁ?ĺ‰Şĺ?Žçš„ĺ®˝ĺş¦ďĽŚé«?ĺş¦äżˇć?Żă€‚
 */
SuperMap.Util.getTextBounds = function (style, text, element) {
    document.body.appendChild(element);
    element.style.width = 'auto';
    element.style.height = 'auto';
    if (style.fontSize) {
        element.style.fontSize = style.fontSize;
    }
    if (style.fontFamily) {
        element.style.fontFamily = style.fontFamily;
    }
    if (style.fontWeight) {
        element.style.fontWeight = style.fontWeight;
    }
    element.style.position = 'relative';
    element.style.visibility = 'hidden';
    //fix ĺś¨ćź?äş›ć?…ĺ†µä¸‹ďĽŚelementĺ†…çš„ć–‡ćś¬ĺŹ?ć??ç«–čµ·ćŽ’ĺ?—ďĽŚĺŻĽč‡´ĺ®˝ĺş¦č®ˇç®—ä¸Ťć­Łçˇ®çš„bug
    element.style.display = 'inline-block';
    element.innerHTML = text;
    var textWidth = element.clientWidth;
    var textHeight = element.clientHeight;
    document.body.removeChild(element);
    return {
        textWidth: textWidth,
        textHeight: textHeight
    };
};
/**
 * @description čŽ·ĺŹ–č˝¬ćŤ˘ĺ?Žçš„pathč·Żĺľ„ă€‚
 * @param {string} path - ĺľ…č˝¬ćŤ˘çš„path, ĺŚ…ĺ?«`{param}`ă€‚
 * @param {Object} pathParams - pathä¸­ĺľ…ć›żćŤ˘çš„ĺŹ‚ć•°ă€‚
 * @returns {string} čż”ĺ›žč˝¬ćŤ˘ĺ?Žçš„pathč·Żĺľ„
 */
SuperMap.Util.convertPath = function (path, pathParams) {
  if (!pathParams) {
      return path;
  }
  return path.replace(/\{([\w-\.]+)\}/g, (fullMatch, key) => {
      var value;
      if (pathParams.hasOwnProperty(key)) {
          value = paramToString(pathParams[key]);
      } else {
          value = fullMatch;
      }
      return encodeURIComponent(value);
  });
};

function paramToString(param) {
  if (param == undefined || param == null) {
      return '';
  }
  if (param instanceof Date) {
      return param.toJSON();
  }
  if (canBeJsonified(param)) {
      return JSON.stringify(param);
  }

  return param.toString();
}

function canBeJsonified(str) {
  if (typeof str !== 'string' && typeof str !== 'object') {
      return false;
  }
  try {
      const type = str.toString();
      return type === '[object Object]' || type === '[object Array]';
  } catch (err) {
      return false;
  }
}

;// CONCATENATED MODULE: ./src/common/commontypes/Event.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/



/**
 * @name Event
 * @memberOf SuperMap
 * @namespace
 * @description äş‹ä»¶ĺ¤„ç?†ĺ‡˝ć•°.
 */
var Event = SuperMap.Event = {

    /**
     * @description  A hash table cache of the event observers. Keyed by element._eventCacheID
     * @type {boolean}
     * @default false
     */
    observers: false,

    /**
     * @description KEY_SPACE
     * @type {number}
     * @default 32
     */
    KEY_SPACE: 32,

    /**
     * @description KEY_BACKSPACE
     * @type {number}
     * @default 8
     */
    KEY_BACKSPACE: 8,

    /**
     * @description KEY_TAB
     * @type {number}
     * @default 9
     */
    KEY_TAB: 9,

    /**
     * @description KEY_RETURN
     * @type {number}
     * @default 13
     */
    KEY_RETURN: 13,

    /**
     * @description KEY_ESC
     * @type {number}
     * @default 27
     */
    KEY_ESC: 27,

    /**
     * @description KEY_LEFT
     * @type {number}
     * @default 37
     */
    KEY_LEFT: 37,

    /**
     * @description KEY_UP
     * @type {number}
     * @default 38
     */
    KEY_UP: 38,

    /**
     * @description KEY_RIGHT
     * @type {number}
     * @default 39
     */
    KEY_RIGHT: 39,

    /**
     * @description KEY_DOWN
     * @type {number}
     * @default 40
     */
    KEY_DOWN: 40,

    /**
     * @description KEY_DELETE
     * @type {number}
     * @default 46
     */
    KEY_DELETE: 46,


    /**
     * @description Cross browser event element detection.
     * @param {Event} event - The event
     * @returns {HTMLElement} The element that caused the event
     */
    element: function (event) {
        return event.target || event.srcElement;
    },

    /**
     * @description Determine whether event was caused by a single touch
     * @param {Event} event - The event
     * @returns {boolean}
     */
    isSingleTouch: function (event) {
        return event.touches && event.touches.length === 1;
    },

    /**
     * @description Determine whether event was caused by a multi touch
     * @param {Event} event - The event
     * @returns {boolean}
     */
    isMultiTouch: function (event) {
        return event.touches && event.touches.length > 1;
    },

    /**
     * @description Determine whether event was caused by a left click.
     * @param {Event} event - The event
     * @returns {boolean}
     */
    isLeftClick: function (event) {
        return (((event.which) && (event.which === 1)) ||
            ((event.button) && (event.button === 1)));
    },

    /**
     * @description Determine whether event was caused by a right mouse click.
     * @param {Event} event - The event
     * @returns {boolean}
     */
    isRightClick: function (event) {
        return (((event.which) && (event.which === 3)) ||
            ((event.button) && (event.button === 2)));
    },

    /**
     * @description Stops an event from propagating.
     * @param {Event} event - The event
     * @param {boolean} allowDefault - If true, we stop the event chain but still allow the default browser  behaviour (text selection, radio-button clicking, etc) Default false
     */
    stop: function (event, allowDefault) {

        if (!allowDefault) {
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        }

        if (event.stopPropagation) {
            event.stopPropagation();
        } else {
            event.cancelBubble = true;
        }
    },

    /**
     * @param {Event} event - The eventă€‚
     * @param {string} tagName - html ć ‡ç­ľĺ?Ťă€‚
     * @returns {HTMLElement} The first node with the given tagName, starting from the node the event was triggered on and traversing the DOM upwards
     */
    findElement: function (event, tagName) {
        var element = SuperMap.Event.element(event);
        while (element.parentNode && (!element.tagName ||
            (element.tagName.toUpperCase() != tagName.toUpperCase()))) {
            element = element.parentNode;
        }
        return element;
    },

    /**
     * @description ç›‘ĺ?¬äş‹ä»¶ďĽŚćł¨ĺ†Śäş‹ä»¶ĺ¤„ç?†ć–ąćł•ă€‚
     * @param {(HTMLElement|string)} elementParam - ĺľ…ç›‘ĺ?¬çš„ DOM ĺŻąč±ˇć?–č€…ĺ…¶ ID ć ‡čŻ†ă€‚
     * @param {string} name - ç›‘ĺ?¬äş‹ä»¶çš„ç±»ĺ?«ĺ?Ťç§°ă€‚
     * @param {function} observer - ćł¨ĺ†Śçš„äş‹ä»¶ĺ¤„ç?†ć–ąćł•ă€‚
     * @param {boolean} [useCapture=false] - ć?Żĺ?¦ćŤ•čŽ·ă€‚
     */
    observe: function (elementParam, name, observer, useCapture) {
        var element = Util.getElement(elementParam);
        useCapture = useCapture || false;

        if (name === 'keypress' &&
            (navigator.appVersion.match(/Konqueror|Safari|KHTML/)
                || element.attachEvent)) {
            name = 'keydown';
        }

        //if observers cache has not yet been created, create it
        if (!this.observers) {
            this.observers = {};
        }

        //if not already assigned, make a new unique cache ID
        if (!element._eventCacheID) {
            var idPrefix = "eventCacheID_";
            if (element.id) {
                idPrefix = element.id + "_" + idPrefix;
            }
            element._eventCacheID = Util.createUniqueID(idPrefix);
        }

        var cacheID = element._eventCacheID;

        //if there is not yet a hash entry for this element, add one
        if (!this.observers[cacheID]) {
            this.observers[cacheID] = [];
        }

        //add a new observer to this element's list
        this.observers[cacheID].push({
            'element': element,
            'name': name,
            'observer': observer,
            'useCapture': useCapture
        });

        //add the actual browser event listener
        if (element.addEventListener) {
            if(name === 'mousewheel'){
                // https://www.chromestatus.com/features/6662647093133312
                element.addEventListener(name, observer, {useCapture: useCapture, passive: false} );
            } else {
                element.addEventListener(name, observer, useCapture);
            }
        } else if (element.attachEvent) {
            element.attachEvent('on' + name, observer);
        }
    },

    /**
     * @description Given the id of an element to stop observing, cycle through the
     *   element's cached observers, calling stopObserving on each one,
     *   skipping those entries which can no longer be removed.
     *
     * @param {(HTMLElement|string)} elementParam - 
     */
    stopObservingElement: function (elementParam) {
        var element = Util.getElement(elementParam);
        var cacheID = element._eventCacheID;

        this._removeElementObservers(SuperMap.Event.observers[cacheID]);
    },

    /**
     * @param {Array.<Object>} elementObservers - Array of (element, name,
     *                                         observer, usecapture) objects,
     *                                         taken directly from hashtable
     */
    _removeElementObservers: function (elementObservers) {
        if (elementObservers) {
            for (var i = elementObservers.length - 1; i >= 0; i--) {
                var entry = elementObservers[i];
                var args = new Array(entry.element, entry.name, entry.observer, entry.useCapture);
                SuperMap.Event.stopObserving.apply(this, args);
            }
        }
    },

    /**
     * @description ç§»é™¤äş‹ä»¶ç›‘ĺ?¬ĺ’Śćł¨ĺ†Śçš„äş‹ä»¶ĺ¤„ç?†ć–ąćł•ă€‚ćł¨ć„ŹďĽšäş‹ä»¶çš„ç§»é™¤ĺ’Śç›‘ĺ?¬ç›¸ĺŻąĺş”ďĽŚç§»é™¤ć—¶çš„ĺ?„ĺ±žć€§äżˇć?Żĺż…éˇ»ç›‘ĺ?¬ć—¶
     * äżťćŚ?ä¸€č‡´ć‰Ťč?˝çˇ®äżťäş‹ä»¶ç§»é™¤ć??ĺŠźă€‚
     * @param {(HTMLElement|string)} elementParam - č˘«ç›‘ĺ?¬çš„ DOM ĺ…?ç´ ć?–č€…ĺ…¶ IDă€‚
     * @param {string} name - éś€č¦?ç§»é™¤çš„č˘«ç›‘ĺ?¬äş‹ä»¶ĺ?Ťç§°ă€‚
     * @param {function} observer - éś€č¦?ç§»é™¤çš„äş‹ä»¶ĺ¤„ç?†ć–ąćł•ă€‚
     * @param {boolean} [useCapture=false] - ć?Żĺ?¦ćŤ•čŽ·ă€‚
     * @returns {boolean} Whether or not the event observer was removed
     */
    stopObserving: function (elementParam, name, observer, useCapture) {
        useCapture = useCapture || false;

        var element = Util.getElement(elementParam);
        var cacheID = element._eventCacheID;

        if (name === 'keypress') {
            if (navigator.appVersion.match(/Konqueror|Safari|KHTML/) ||
                element.detachEvent) {
                name = 'keydown';
            }
        }

        // find element's entry in this.observers cache and remove it
        var foundEntry = false;
        var elementObservers = SuperMap.Event.observers[cacheID];
        if (elementObservers) {

            // find the specific event type in the element's list
            var i = 0;
            while (!foundEntry && i < elementObservers.length) {
                var cacheEntry = elementObservers[i];

                if ((cacheEntry.name === name) &&
                    (cacheEntry.observer === observer) &&
                    (cacheEntry.useCapture === useCapture)) {

                    elementObservers.splice(i, 1);
                    if (elementObservers.length == 0) {
                        delete SuperMap.Event.observers[cacheID];
                    }
                    foundEntry = true;
                    break;
                }
                i++;
            }
        }

        //actually remove the event listener from browser
        if (foundEntry) {
            if (element.removeEventListener) {
                element.removeEventListener(name, observer, useCapture);
            } else if (element && element.detachEvent) {
                element.detachEvent('on' + name, observer);
            }
        }
        return foundEntry;
    },

    /**
     * @description Cycle through all the element entries in the events cache and call
     *   stopObservingElement on each.
     */
    unloadCache: function () {
        // check for SuperMap.Event before checking for observers, because
        // SuperMap.Event may be undefined in IE if no map instance was
        // created
        if (SuperMap.Event && SuperMap.Event.observers) {
            for (var cacheID in SuperMap.Event.observers) {
                var elementObservers = SuperMap.Event.observers[cacheID];
                SuperMap.Event._removeElementObservers.apply(this,
                    [elementObservers]);
            }
            SuperMap.Event.observers = false;
        }
    },

    CLASS_NAME: "SuperMap.Event"
};
SuperMap.Event = Event;
/* prevent memory leaks in IE */
SuperMap.Event.observe(window, 'unload', SuperMap.Event.unloadCache, false);


;// CONCATENATED MODULE: ./src/common/commontypes/Events.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/






/**
 * @class SuperMap.Events
 * @classdesc äş‹ä»¶ç±»ă€‚
 * @param {Object} object - ĺ˝“ĺ‰Ťäş‹ä»¶ĺŻąč±ˇč˘«ć·»ĺŠ ĺ?°çš„ JS ĺŻąč±ˇă€‚
 * @param {HTMLElement} element - ĺ“Ťĺş”ćµŹč§?ĺ™¨äş‹ä»¶çš„ DOM ĺ…?ç´ ă€‚
 * @param {Array.<string>} eventTypes - č‡Şĺ®šäą‰ĺş”ç”¨äş‹ä»¶çš„ć•°ç»„ă€‚
 * @param {boolean} [fallThrough=false] - ć?Żĺ?¦ĺ…?č®¸äş‹ä»¶ĺ¤„ç?†äą‹ĺ?Žĺ?‘ä¸ŠäĽ é€’ďĽ?ĺ†’ćłˇďĽ‰ďĽŚä¸ş false çš„ć—¶ĺ€™é?»ć­˘äş‹ä»¶ĺ†’ćłˇă€‚
 * @param {Object} options - äş‹ä»¶ĺŻąč±ˇé€‰éˇąă€‚
 */
class Events {


    constructor(object, element, eventTypes, fallThrough, options) {
        /**
         * @member {Array.<string>} SuperMap.Events.prototype.BROWSER_EVENTS
         * @description ć”ŻćŚ?çš„äş‹ä»¶ă€‚
         * @constant
         * @default [
         "mouseover", "mouseout","mousedown", "mouseup", "mousemove",
         "click", "dblclick", "rightclick", "dblrightclick","resize",
         "focus", "blur","touchstart", "touchmove", "touchend","keydown",
         "MSPointerDown", "MSPointerUp", "pointerdown", "pointerup",
         "MSGestureStart", "MSGestureChange", "MSGestureEnd","contextmenu"
         ]
         */
        this.BROWSER_EVENTS = [
            "mouseover", "mouseout",
            "mousedown", "mouseup", "mousemove",
            "click", "dblclick", "rightclick", "dblrightclick",
            "resize", "focus", "blur",
            "touchstart", "touchmove", "touchend",
            "keydown", "MSPointerDown", "MSPointerUp", "pointerdown", "pointerup",
            "MSGestureStart", "MSGestureChange", "MSGestureEnd",
            "contextmenu"
        ];

        /**
         * @member {Object} SuperMap.Events.prototype.listeners
         * @description Hashtable of Array(function): events listener functions
         */
        this.listeners = {};

        /**
         * @member {Object} SuperMap.Events.prototype.object
         * @description  ĺŹ‘ĺ¸?ĺş”ç”¨ç¨‹ĺşŹäş‹ä»¶çš„ĺŻąč±ˇă€‚
         */
        this.object = object;

        /**
         * @member {HTMLElement} SuperMap.Events.prototype.element
         * @description ćŽĄĺŹ—ćµŹč§?ĺ™¨äş‹ä»¶çš„ DOM čŠ‚ç‚ąă€‚
         */
        this.element = null;

        /**
         * @member {Array.<string>} SuperMap.Events.prototype.eventTypes
         * @description ć”ŻćŚ?çš„äş‹ä»¶ç±»ĺž‹ĺ?—čˇ¨ă€‚
         */
        this.eventTypes = [];

        /**
         * @member {function} SuperMap.Events.prototype.eventHandler
         * @description ç»‘ĺ®šĺś¨ĺ…?ç´ ä¸Šçš„äş‹ä»¶ĺ¤„ç?†ĺ™¨ĺŻąč±ˇă€‚
         */
        this.eventHandler = null;

        /**
         * @member {boolean} [SuperMap.Events.prototype.fallThrough=false]
         * @description ć?Żĺ?¦ĺ…?č®¸äş‹ä»¶ĺ¤„ç?†äą‹ĺ?Žĺ?‘ä¸ŠäĽ é€’ďĽ?ĺ†’ćłˇďĽ‰ďĽŚä¸ş false çš„ć—¶ĺ€™é?»ć­˘äş‹ä»¶ĺ†’ćłˇă€‚
         */
        this.fallThrough = fallThrough;

        /**
         * @member {boolean} [SuperMap.Events.prototype.includeXY=false]
         * @description ĺ?¤ć–­ć?Żĺ?¦č®© xy ĺ±žć€§č‡ŞĺŠ¨ĺ?›ĺ»şĺ?°ćµŹč§?ĺ™¨ä¸Šçš„éĽ ć ‡äş‹ä»¶ďĽŚä¸€č?¬č®ľç˝®ä¸ş falseďĽŚĺ¦‚ćžśč®ľç˝®ä¸ş trueďĽŚéĽ ć ‡äş‹ä»¶ĺ°†äĽšĺś¨äş‹ä»¶äĽ é€’čż‡ç¨‹ä¸­č‡ŞĺŠ¨äş§ç”ź xy ĺ±žć€§ă€‚
         *              ĺŹŻć ąćŤ®äş‹ä»¶ĺŻąč±ˇçš„ 'evt.object' ĺ±žć€§ĺś¨ç›¸ĺ…łçš„äş‹ä»¶ĺŹĄćź„ä¸Šč°?ç”¨ getMousePosition ĺ‡˝ć•°ă€‚čż™ä¸Şé€‰éˇąäą ć?Żé»?č®¤ä¸ş false çš„ĺŽźĺ› ĺś¨äşŽďĽŚĺ˝“ĺ?›ĺ»şä¸€ä¸Ş
         *              äş‹ä»¶ĺŻąč±ˇďĽŚĺ…¶ä¸»č¦?ç›®çš„ć?Żç®ˇç?†ă€‚ĺś¨ä¸€ä¸Ş div çš„ç›¸ĺŻąĺ®šä˝Ťçš„éĽ ć ‡äş‹ä»¶ďĽŚĺ°†ĺ…¶č®ľä¸ş true äąźć?Żćś‰ć„Źäą‰çš„ă€‚čż™ä¸Şé€‰éˇąäąźĺŹŻä»Ąç”¨ćťĄćŽ§ĺ?¶ć?Żĺ?¦ćŠµć¶?çĽ“ĺ­?ă€‚ĺ¦‚ćžś
         *              č®ľä¸ş false ä¸ŤćŠµć¶?ďĽŚĺ¦‚ćžśč®ľä¸ş trueďĽŚç”¨ this.clearMouseCache() ć¸…é™¤çĽ“ĺ­?ĺ?Źç§»ďĽ?čľąç•Śĺ…?ç´ ĺ?Źç§»ďĽŚĺ…?ç´ ĺś¨éˇµéť˘çš„ä˝Ťç˝®ĺ?Źç§»ďĽ‰ă€‚
         * @example
         *  function named(evt) {
         *        this.xy = this.object.events.getMousePosition(evt);
         *  }
         */
        this.includeXY = false;

        /**
         * @member {Object} SuperMap.Events.prototype.extensions
         * @description äş‹ä»¶ć‰©ĺ±•ă€‚Keys ä»Łčˇ¨äş‹ä»¶ç±»ĺž‹ďĽŚvalues ä»Łčˇ¨äş‹ä»¶ĺŻąč±ˇă€‚
         * @example
         * ä»Ąć‰©ĺ±• "foostart" ĺ’Ś "fooend" äş‹ä»¶ä¸şäľ‹ă€‚ĺ±•ç¤şć›żćŤ˘ css ĺ±žć€§ä¸ş foo çš„ĺ…?ç´ çš„ click äş‹ä»¶ă€‚
         *
         *   SuperMap.Events.foostart = SuperMap.Class({
     *       initialize: function(target) {
     *           this.target = target;
     *           this.target.register("click", this, this.doStuff, {extension: true});
     *           // only required if extension provides more than one event type
     *           this.target.extensions["foostart"] = true;
     *           this.target.extensions["fooend"] = true;
     *       },
     *       destroy: function() {
     *           var target = this.target;
     *           target.unregister("click", this, this.doStuff);
     *           delete this.target;
     *           // only required if extension provides more than one event type
     *           delete target.extensions["foostart"];
     *           delete target.extensions["fooend"];
     *       },
     *       doStuff: function(evt) {
     *           var propagate = true;
     *           if (SuperMap.Event.element(evt).className === "foo") {
     *               propagate = false;
     *               var target = this.target;
     *               target.triggerEvent("foostart");
     *               window.setTimeout(function() {
     *                   target.triggerEvent("fooend");
     *               }, 1000);
     *           }
     *           return propagate;
     *       }
     *   });
         *   // only required if extension provides more than one event type
         *   SuperMap.Events.fooend = SuperMap.Events.foostart;
         */
        this.extensions = {};

        /**
         * @member {Object} SuperMap.Events.prototype.extensionCount
         */
        this.extensionCount = {};
        /**
         * @member {Object} SuperMap.Events.prototype.clearMouseListener
         */
        this.clearMouseListener = null;

        Util.extend(this, options);

        if (eventTypes != null) {
            for (var i = 0, len = eventTypes.length; i < len; i++) {
                this.addEventType(eventTypes[i]);
            }
        }

        if (element != null) {
            this.attachToElement(element);
        }

        this.CLASS_NAME = "SuperMap.Events";
    }

    /**
     * @function SuperMap.Events.prototype.destroy
     * @description ç§»é™¤ĺ˝“ĺ‰Ťč¦?ç´  element ä¸Šçš„ć‰€ćś‰äş‹ä»¶ç›‘ĺ?¬ĺ’Śĺ¤„ç?†ă€‚
     */
    destroy() {
        for (var e in this.extensions) {
            if (typeof this.extensions[e] !== "boolean") {
                this.extensions[e].destroy();
            }
        }
        this.extensions = null;
        if (this.element) {
            Event.stopObservingElement(this.element);
            if (this.element.hasScrollEvent) {
                Event.stopObserving(
                    window, "scroll", this.clearMouseListener
                );
            }
        }
        this.element = null;

        this.listeners = null;
        this.object = null;
        this.eventTypes = null;
        this.fallThrough = null;
        this.eventHandler = null;
    }

    /**
     * @function SuperMap.Events.prototype.addEventType
     * @description ĺś¨ć­¤äş‹ä»¶ĺŻąč±ˇä¸­ć·»ĺŠ ć–°çš„äş‹ä»¶ç±»ĺž‹ďĽŚĺ¦‚ćžśčż™ä¸Şäş‹ä»¶ç±»ĺž‹ĺ·˛ç»Źć·»ĺŠ čż‡äş†ďĽŚĺ?™ä¸Ťĺ?šä»»ä˝•äş‹ć?…ă€‚
     * @param {string} eventName - äş‹ä»¶ĺ?Ťă€‚
     */
    addEventType(eventName) {
        if (!this.listeners[eventName]) {
            this.eventTypes.push(eventName);
            this.listeners[eventName] = [];
        }
    }

    /**
     * @function SuperMap.Events.prototype.attachToElement
     * @description ç»™ DOM ĺ…?ç´ ç»‘ĺ®šćµŹč§?ĺ™¨äş‹ä»¶ă€‚
     * @param {HTMLDOMElement} element - ç»‘ĺ®šćµŹč§?ĺ™¨äş‹ä»¶çš„ DOM ĺ…?ç´ ă€‚
     */
    attachToElement(element) {
        if (this.element) {
            Event.stopObservingElement(this.element);
        } else {
            // keep a bound copy of handleBrowserEvent() so that we can
            // pass the same function to both Event.observe() and .stopObserving()
            this.eventHandler = FunctionExt.bindAsEventListener(
                this.handleBrowserEvent, this
            );

            // to be used with observe and stopObserving
            this.clearMouseListener = FunctionExt.bind(
                this.clearMouseCache, this
            );
        }
        this.element = element;
        for (var i = 0, len = this.BROWSER_EVENTS.length; i < len; i++) {
            var eventType = this.BROWSER_EVENTS[i];

            // every browser event has a corresponding application event
            // (whether it's listened for or not).
            this.addEventType(eventType);

            // use Prototype to register the event cross-browser
            Event.observe(element, eventType, this.eventHandler);
        }
        // disable dragstart in IE so that mousedown/move/up works normally
        Event.observe(element, "dragstart", Event.stop);
    }


    /**
     * @function SuperMap.Events.prototype.on
     * @description ĺś¨ä¸€ä¸Şç›¸ĺ?Śçš„čŚ?ĺ›´ĺ†…ćł¨ĺ†Śç›‘ĺ?¬ĺ™¨çš„ć–ąćł•ďĽŚć­¤ć–ąćł•č°?ç”¨ register ĺ‡˝ć•°ă€‚
     * @example
     * // ćł¨ĺ†Śä¸€ä¸Ş "loadstart" ç›‘ĺ?¬äş‹ä»¶
     * events.on({"loadstart": loadStartListener});
     *
     * // ĺ?Ść ·ćł¨ĺ†Śä¸€ä¸Ş "loadstart" ç›‘ĺ?¬äş‹ä»¶
     * events.register("loadstart", undefined, loadStartListener);
     *
     * // ĺ?Ść—¶ä¸şĺŻąč±ˇćł¨ĺ†Śĺ¤šä¸Şç›‘ĺ?¬äş‹ä»¶
     * events.on({
     *     "loadstart": loadStartListener,
     *     "loadend": loadEndListener,
     *     scope: object
     * });
     *
     * // ĺ?Ść—¶ä¸şĺŻąč±ˇćł¨ĺ†Śĺ¤šä¸Şç›‘ĺ?¬äş‹ä»¶ďĽŚĺ¤šć¬ˇč°?ç”¨ register ć–ąćł•
     * events.register("loadstart", object, loadStartListener);
     * events.register("loadend", object, loadEndListener);
     *
     *
     * @param {Object} object - ć·»ĺŠ ç›‘ĺ?¬çš„ĺŻąč±ˇă€‚
     */
    on(object) {
        for (var type in object) {
            if (type !== "scope" && object.hasOwnProperty(type)) {
                this.register(type, object.scope, object[type]);
            }
        }
    }


    /**
     * @function SuperMap.Events.prototype.register
     * @description ĺś¨äş‹ä»¶ĺŻąč±ˇä¸Šćł¨ĺ†Śä¸€ä¸Şäş‹ä»¶ă€‚ĺ˝“äş‹ä»¶č˘«č§¦ĺŹ‘ć—¶ďĽŚ'func' ĺ‡˝ć•°č˘«č°?ç”¨ďĽŚĺ?‡č®ľć?‘ä»¬č§¦ĺŹ‘ä¸€ä¸Şäş‹ä»¶ďĽŚ
     *              ćŚ‡ĺ®š SuperMap.Bounds ä˝śä¸ş "obj"ďĽŚĺ˝“äş‹ä»¶č˘«č§¦ĺŹ‘ć—¶ďĽŚĺ›žč°?ĺ‡˝ć•°çš„ä¸Šä¸‹ć–‡ä˝śä¸ş Bounds ĺŻąč±ˇă€‚
     * @param {string} type - äş‹ä»¶ćł¨ĺ†Śč€…çš„ĺ?Ťĺ­—ă€‚
     * @param {Object} [obj=this.object] - ĺŻąč±ˇç»‘ĺ®šçš„ĺ›žč°?ă€‚
     * @param {function} [func] - ĺ›žč°?ĺ‡˝ć•°ďĽŚĺ¦‚ćžść˛ˇćś‰ç‰ąĺ®šçš„ĺ›žč°?ďĽŚĺ?™čż™ä¸Şĺ‡˝ć•°ä¸Ťĺ?šä»»ä˝•äş‹ć?…ă€‚
     * @param {(boolean|Object)} [priority] - ĺ˝“ä¸ş true ć—¶ĺ°†ć–°çš„ç›‘ĺ?¬ĺŠ ĺś¨äş‹ä»¶é?źĺ?—çš„ĺ‰Ťéť˘ă€‚
     */
    register(type, obj, func, priority) {
        if (type in Events && !this.extensions[type]) {
            this.extensions[type] = new Events[type](this);
        }
        if ((func != null) &&
            (Util.indexOf(this.eventTypes, type) !== -1)) {

            if (obj == null) {
                obj = this.object;
            }
            var listeners = this.listeners[type];
            if (!listeners) {
                listeners = [];
                this.listeners[type] = listeners;
                this.extensionCount[type] = 0;
            }
            var listener = {obj: obj, func: func};
            if (priority) {
                listeners.splice(this.extensionCount[type], 0, listener);
                if (typeof priority === "object" && priority.extension) {
                    this.extensionCount[type]++;
                }
            } else {
                listeners.push(listener);
            }
        }
    }

    /**
     * @function SuperMap.Events.prototype.registerPriority
     * @description ç›¸ĺ?Śçš„ćł¨ĺ†Ść–ąćł•ďĽŚä˝†ć?Żĺś¨ĺ‰Ťéť˘ĺ˘žĺŠ ć–°çš„ç›‘ĺ?¬č€…äş‹ä»¶ćźĄčŻ˘č€Śä»Łć›żĺ?°ć–ąćł•çš„ç»“ćťźă€‚
     * @param {string} type - äş‹ä»¶ćł¨ĺ†Śč€…çš„ĺ?Ťĺ­—ă€‚
     * @param {Object} [obj=this.object] - ĺŻąč±ˇç»‘ĺ®šć–ąéť˘çš„ĺ›žč°?ă€‚
     * @param {function} [func] - ĺ›žč°?ĺ‡˝ć•°ďĽŚĺ¦‚ćžść˛ˇćś‰ç‰ąĺ®šçš„ĺ›žč°?ďĽŚĺ?™čż™ä¸Şĺ‡˝ć•°ä¸Ťĺ?šä»»ä˝•äş‹ć?…ă€‚
     */
    registerPriority(type, obj, func) {
        this.register(type, obj, func, true);
    }


    /**
     * @function SuperMap.Events.prototype.un
     * @description ĺś¨ä¸€ä¸Şç›¸ĺ?Śçš„čŚ?ĺ›´ĺ†…ĺŹ–ć¶?ćł¨ĺ†Śç›‘ĺ?¬ĺ™¨çš„ć–ąćł•ďĽŚć­¤ć–ąćł•č°?ç”¨ unregister ĺ‡˝ć•°ă€‚
     * @example
     * // ç§»é™¤ "loadstart" äş‹ä»¶ç›‘ĺ?¬
     * events.un({"loadstart": loadStartListener});
     *
     * // ä˝żç”¨ "unregister" ć–ąćł•ç§»é™¤ "loadstart" äş‹ä»¶ç›‘ĺ?¬
     * events.unregister("loadstart", undefined, loadStartListener);
     *
     * // ĺŹ–ć¶?ĺŻąč±ˇĺ¤šä¸Şäş‹ä»¶ç›‘ĺ?¬
     * events.un({
     *     "loadstart": loadStartListener,
     *     "loadend": loadEndListener,
     *     scope: object
     * });
     *
     * // ĺŹ–ć¶?ĺŻąč±ˇĺ¤šä¸Şäş‹ä»¶ç›‘ĺ?¬ďĽŚĺ¤šć¬ˇč°?ç”¨unregisterć–ąćł•ă€‚
     * events.unregister("loadstart", object, loadStartListener);
     * events.unregister("loadend", object, loadEndListener);
     *
     * @param {Object} object - ç§»é™¤ç›‘ĺ?¬çš„ĺŻąč±ˇă€‚
     */
    un(object) {
        for (var type in object) {
            if (type !== "scope" && object.hasOwnProperty(type)) {
                this.unregister(type, object.scope, object[type]);
            }
        }
    }

    /**
     * @function SuperMap.Events.prototype.unregister
     * @description ĺŹ–ć¶?ćł¨ĺ†Śă€‚
     * @param {string} type - äş‹ä»¶ç±»ĺž‹ă€‚
     * @param {Object} [obj=this.object] - ĺŻąč±ˇç»‘ĺ®šć–ąéť˘çš„ĺ›žč°?ă€‚
     * @param {function} [func] - ĺ›žč°?ĺ‡˝ć•°ďĽŚĺ¦‚ćžść˛ˇćś‰ç‰ąĺ®šçš„ĺ›žč°?ďĽŚĺ?™čż™ä¸Şĺ‡˝ć•°ä¸Ťĺ?šä»»ä˝•äş‹ć?…ă€‚
     */
    unregister(type, obj, func) {
        if (obj == null) {
            obj = this.object;
        }
        var listeners = this.listeners[type];
        if (listeners != null) {
            for (var i = 0, len = listeners.length; i < len; i++) {
                if (listeners[i].obj === obj && listeners[i].func === func) {
                    listeners.splice(i, 1);
                    break;
                }
            }
        }
    }


    /**
     * @function SuperMap.Events.prototype.remove
     * @description ĺ? é™¤ćź?ä¸Şäş‹ä»¶ç±»ĺž‹çš„ć‰€ćś‰ç›‘ĺ?¬ďĽŚĺ¦‚ćžśčŻĄäş‹ä»¶ç±»ĺž‹ć˛ˇćś‰ćł¨ĺ†ŚďĽŚĺ?™ä¸Ťĺ?šä»»ä˝•ć“Ťä˝śă€‚
     * @param {string} type - äş‹ä»¶ç±»ĺž‹ă€‚
     */
    remove(type) {
        if (this.listeners[type] != null) {
            this.listeners[type] = [];
        }
    }

    /**
     * @function SuperMap.Events.prototype.triggerEvent
     * @description č§¦ĺŹ‘ä¸€ä¸Şç‰ąĺ®šçš„ćł¨ĺ†Śäş‹ä»¶ă€‚
     * @param {string} type - č§¦ĺŹ‘äş‹ä»¶ç±»ĺž‹ă€‚
     * @param {Event} evt - äş‹ä»¶ĺŻąč±ˇă€‚
     * @returns {boolean} čż”ĺ›žç›‘ĺ?¬ĺŻąč±ˇďĽŚĺ¦‚ćžśčż”ĺ›žć?Ż falseďĽŚĺ?™ĺ?ść­˘ç›‘ĺ?¬ă€‚
     */
    triggerEvent(type, evt) {
        var listeners = this.listeners[type];

        // fast path
        if (!listeners || listeners.length == 0) {
            return undefined;
        }

        // prep evt object with object & div references
        if (evt == null) {
            evt = {};
        }
        evt.object = this.object;
        evt.element = this.element;
        if (!evt.type) {
            evt.type = type;
        }

        // execute all callbacks registered for specified type
        // get a clone of the listeners array to
        // allow for splicing during callbacks
        listeners = listeners.slice();
        var continueChain;
        for (var i = 0, len = listeners.length; i < len; i++) {
            var callback = listeners[i];
            // bind the context to callback.obj
            continueChain = callback.func.apply(callback.obj, [evt]);

            if ((continueChain != undefined) && (continueChain === false)) {
                // if callback returns false, execute no more callbacks.
                break;
            }
        }
        // don't fall through to other DOM elements
        if (!this.fallThrough) {
            Event.stop(evt, true);
        }
        return continueChain;
    }


    /**
     * @function SuperMap.Events.prototype.handleBrowserEvent
     * @description ĺŻą triggerEvent ĺ‡˝ć•°çš„ĺŚ…čŁ…ďĽŚç»™äş‹ä»¶ĺŻąč±ˇč®ľç˝®äş† xy ĺ±žć€§ďĽ?ĺŤłĺ˝“ĺ‰ŤéĽ ć ‡ç‚ąçš„ xy ĺť?ć ‡ďĽ‰ă€‚
     * @param {Event} evt - äş‹ä»¶ĺŻąč±ˇă€‚
     */
    handleBrowserEvent(evt) {
        var type = evt.type, listeners = this.listeners[type];
        if (!listeners || listeners.length == 0) {
            // noone's listening, bail out
            return;
        }
        // add clientX & clientY to all events - corresponds to average x, y
        var touches = evt.touches;
        if (touches && touches[0]) {
            var x = 0;
            var y = 0;
            var num = touches.length;
            var touch;
            for (var i = 0; i < num; ++i) {
                touch = touches[i];
                x += touch.clientX;
                y += touch.clientY;
            }
            evt.clientX = x / num;
            evt.clientY = y / num;
        }
        if (this.includeXY) {
            evt.xy = this.getMousePosition(evt);
        }
        this.triggerEvent(type, evt);
    }


    /**
     * @function SuperMap.Events.prototype.clearMouseCache
     * @description ć¸…é™¤éĽ ć ‡çĽ“ĺ­?ă€‚
     */
    clearMouseCache() {
        this.element.scrolls = null;
        this.element.lefttop = null;
        var body = document.body;
        if (body && !((body.scrollTop != 0 || body.scrollLeft != 0) &&
                navigator.userAgent.match(/iPhone/i))) {
            this.element.offsets = null;
        }
    }

    /**
     * @function SuperMap.Events.prototype.getMousePosition
     * @param {Event} evt - äş‹ä»¶ĺŻąč±ˇă€‚
     * @returns {SuperMap.Pixel} ĺ˝“ĺ‰Ťçš„éĽ ć ‡çš„ xy ĺť?ć ‡ç‚ąă€‚
     */
    getMousePosition(evt) {
        if (!this.includeXY) {
            this.clearMouseCache();
        } else if (!this.element.hasScrollEvent) {
            Event.observe(window, "scroll", this.clearMouseListener);
            this.element.hasScrollEvent = true;
        }

        if (!this.element.scrolls) {
            var viewportElement = Util.getViewportElement();
            this.element.scrolls = [
                viewportElement.scrollLeft,
                viewportElement.scrollTop
            ];
        }

        if (!this.element.lefttop) {
            this.element.lefttop = [
                (document.documentElement.clientLeft || 0),
                (document.documentElement.clientTop || 0)
            ];
        }

        if (!this.element.offsets) {
            this.element.offsets = Util.pagePosition(this.element);
        }

        return new Pixel(
            (evt.clientX + this.element.scrolls[0]) - this.element.offsets[0]
            - this.element.lefttop[0],
            (evt.clientY + this.element.scrolls[1]) - this.element.offsets[1]
            - this.element.lefttop[1]
        );
    }

}

SuperMap.Events = Events;
SuperMap.Events.prototype.BROWSER_EVENTS = [
    "mouseover", "mouseout",
    "mousedown", "mouseup", "mousemove",
    "click", "dblclick", "rightclick", "dblrightclick",
    "resize", "focus", "blur",
    "touchstart", "touchmove", "touchend",
    "keydown", "MSPointerDown", "MSPointerUp", "pointerdown", "pointerup",
    "MSGestureStart", "MSGestureChange", "MSGestureEnd",
    "contextmenu"
];
;// CONCATENATED MODULE: external "function(){try{return elasticsearch}catch(e){return {}}}()"
const external_function_try_return_elasticsearch_catch_e_return_namespaceObject = function(){try{return elasticsearch}catch(e){return {}}}();
var external_function_try_return_elasticsearch_catch_e_return_default = /*#__PURE__*/__webpack_require__.n(external_function_try_return_elasticsearch_catch_e_return_namespaceObject);
;// CONCATENATED MODULE: ./src/common/thirdparty/elasticsearch/ElasticSearch.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/





/**
 * @class SuperMap.ElasticSearch
 * @classdesc ElasticSearchćśŤĺŠˇç±»ă€‚
 * @category ElasticSearch
 * @param {string} url - ElasticSearchćśŤĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {function} [options.change] - ćśŤĺŠˇĺ™¨čż”ĺ›žć•°ćŤ®ĺ?Žć‰§čˇŚçš„ĺ‡˝ć•°ă€‚ĺşźĺĽ?,ä¸Ťĺ»şč®®ä˝żç”¨ă€‚ä˝żç”¨searchć?–msearchć–ąćł•ă€‚
 * @param {boolean} [options.openGeoFence=false] - ć?Żĺ?¦ĺĽ€ĺ?Żĺś°ç?†ĺ›´ć ŹéŞŚčŻ?ďĽŚé»?č®¤ä¸şä¸ŤĺĽ€ĺ?Żă€‚
 * @param {function} [options.outOfGeoFence] - ć•°ćŤ®č¶…ĺ‡şĺś°ç?†ĺ›´ć Źĺ?Žć‰§čˇŚçš„ĺ‡˝ć•°ă€‚
 * @param {Object} [options.geoFence] - ĺś°ç?†ĺ›´ć Źă€‚
 */

class ElasticSearch {

    constructor(url, options) {
        options = options || {};
        /**
         *  @member {string} SuperMap.ElasticSearch.prototype.url 
         *  @description ElasticSearchćśŤĺŠˇĺś°ĺť€
         */
        this.url = url;
        /**
         *  @member {Object} SuperMap.ElasticSearch.prototype.client
         *  @description client ESĺ®˘ć?·ç«Ż
         */
        this.client = new (external_function_try_return_elasticsearch_catch_e_return_default()).Client({
            host: this.url
        });
        /**
         *  @deprecated
         *  @member {function} [SuperMap.ElasticSearch.prototype.change]
         *  @description ćśŤĺŠˇĺ™¨čż”ĺ›žć•°ćŤ®ĺ?Žć‰§čˇŚçš„ĺ‡˝ć•°ă€‚ĺşźĺĽ?,ä¸Ťĺ»şč®®ä˝żç”¨ă€‚ä˝żç”¨searchć?–msearchć–ąćł•ă€‚
         */
        this.change = null;
        /**
         *  @member {boolean} [SuperMap.ElasticSearch.prototype.openGeoFence=false]
         *  @description ć?Żĺ?¦ĺĽ€ĺ?Żĺś°ç?†ĺ›´ć ŹéŞŚčŻ?ďĽŚé»?č®¤ä¸şä¸ŤĺĽ€ĺ?Żă€‚
         */
        this.openGeoFence = false;
        /**
         *  @member {function} [SuperMap.ElasticSearch.prototype.outOfGeoFence]
         *  @description ć•°ćŤ®č¶…ĺ‡şĺś°ç?†ĺ›´ć Źĺ?Žć‰§čˇŚçš„ĺ‡˝ć•°
         */
        this.outOfGeoFence = null;

        /**
         * @member {Object} [SuperMap.ElasticSearch.prototype.geoFence]
         * @description ĺś°ç?†ĺ›´ć Ź
         * @example {
     *    radius: 1000,//ĺŤ•ä˝Ťć?Żm
     *    center: [104.40, 30.43],
     *    unit: 'meter|degree'
     *  }
         */
        this.geoFence = null;

        /*
         * Constant: EVENT_TYPES
         * {Array.<String>}
         * ć­¤ç±»ć”ŻćŚ?çš„äş‹ä»¶ç±»ĺž‹ă€‚
         *
         */
        this.EVENT_TYPES = ['change', 'error', 'outOfGeoFence'];

        /**
         * @member {SuperMap.Events} SuperMap.ElasticSearch.prototype.events
         * @description äş‹ä»¶
         */
        this.events = new Events(this, null, this.EVENT_TYPES);

        /**
         * @member {Object} SuperMap.ElasticSearch.prototype.eventListeners
         * @description ĺ?¬ĺ™¨ĺŻąč±ˇďĽŚĺś¨ćž„é€ ĺ‡˝ć•°ä¸­č®ľç˝®ć­¤ĺŹ‚ć•°ďĽ?ĺŹŻé€‰ďĽ‰ďĽŚĺŻą MapService ć”ŻćŚ?çš„ä¸¤ä¸Şäş‹ä»¶ processCompleted ă€?processFailed čż›čˇŚç›‘ĺ?¬ďĽŚ
         * ç›¸ĺ˝“äşŽč°?ç”¨ SuperMap.Events.on(eventListeners)ă€‚
         */
        this.eventListeners = null;
        Util.extend(this, options);
        if (this.eventListeners instanceof Object) {
            this.events.on(this.eventListeners);
        }
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.setGeoFence
     * @description č®ľç˝®ĺś°ç?†ĺ›´ć ŹďĽŚopenGeoFenceĺŹ‚ć•°ä¸ştrueçš„ć—¶ĺ€™ďĽŚč®ľç˝®çš„ĺś°ç?†ĺ›´ć Źć‰Ťç”źć•?ă€‚
     * @param {SuperMap.Geometry} geoFence - ĺś°ç?†ĺ›´ć Źă€‚
     */

    setGeoFence(geoFence) {
        this.geoFence = geoFence;
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.bulk
     * @description ć‰ąé‡Źć“Ťä˝śAPIďĽŚĺ…?č®¸ć‰§čˇŚĺ¤šä¸Şç´˘ĺĽ•/ĺ? é™¤ć“Ťä˝śă€‚
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-bulk}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    bulk(params, callback) {
        return this.client.bulk(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.clearScroll
     * @description é€ščż‡ćŚ‡ĺ®šscrollĺŹ‚ć•°čż›čˇŚćźĄčŻ˘ćťĄć¸…é™¤ĺ·˛ç»Źĺ?›ĺ»şçš„scrollčŻ·ć±‚ă€‚
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-clearscroll}</br>
     *ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-scroll.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    clearScroll(params, callback) {
        return this.client.clearScroll(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.count
     * @description čŽ·ĺŹ–é›†çľ¤ă€?ç´˘ĺĽ•ă€?ç±»ĺž‹ć?–ćźĄčŻ˘çš„ć–‡ćˇŁä¸Şć•°ă€‚
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-count}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/search-count.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    count(params, callback) {
        return this.client.count(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.count
     * @description ĺś¨ç‰ąĺ®šç´˘ĺĽ•ä¸­ć·»ĺŠ ä¸€ä¸Şç±»ĺž‹ĺŚ–çš„JSONć–‡ćˇŁďĽŚä˝żĺ…¶ĺŹŻć?śç´˘ă€‚ĺ¦‚ćžśĺ…·ćś‰ç›¸ĺ?ŚindexďĽŚtypeä¸”idĺ·˛ç»Źĺ­?ĺś¨çš„ć–‡ćˇŁĺ°†ĺŹ‘ç”źé”™čŻŻă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-create}
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-index_.html}
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    create(params, callback) {
        return this.client.create(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.delete
     * @description ć ąćŤ®ĺ…¶IDä»Žç‰ąĺ®šç´˘ĺĽ•ä¸­ĺ? é™¤é”®ĺ…Ąçš„JSONć–‡ćˇŁă€‚
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-delete}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-delete.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    delete(params, callback) {
        return this.client.delete(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.delete
     * @description ć ąćŤ®ĺ…¶IDä»Žç‰ąĺ®šç´˘ĺĽ•ä¸­ĺ? é™¤é”®ĺ…Ąçš„JSONć–‡ćˇŁă€‚
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-deletebyquery}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-delete-by-query.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    deleteByQuery(params, callback) {
        return this.client.deleteByQuery(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.delete
     * @description ć ąćŤ®ĺ…¶IDĺ? é™¤č„šćś¬ă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-deletescript}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-scripting.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    deleteScript(params, callback) {
        return this.client.deleteScript(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.deleteTemplate
     * @description ć ąćŤ®ĺ…¶IDĺ? é™¤ć¨ˇćťżă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-deletetemplate}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/search-template.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    deleteTemplate(params, callback) {
        return this.client.deleteTemplate(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.exists
     * @description ćŁ€ćźĄç»™ĺ®šć–‡ćˇŁć?Żĺ?¦ĺ­?ĺś¨ă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-exists}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-get.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    exists(params, callback) {
        return this.client.exists(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.existsSource
     * @description ćŁ€ćźĄčµ„ćş?ć?Żĺ?¦ĺ­?ĺś¨ă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-existssource}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-get.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */

    existsSource(params, callback) {
        return this.client.existsSource(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.explain
     * @description ćŹ?äľ›ä¸Žç‰ąĺ®šćźĄčŻ˘ç›¸ĺ…łçš„ç‰ąĺ®šć–‡ćˇŁĺ?†ć•°çš„čŻ¦ç»†äżˇć?Żă€‚ĺ®?čż?äĽšĺ‘ŠčŻ‰ć‚¨ć–‡ćˇŁć?Żĺ?¦ä¸ŽćŚ‡ĺ®šçš„ćźĄčŻ˘ĺŚąé…Ťă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-explain}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/search-explain.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    explain(params, callback) {
        return this.client.explain(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.fieldCaps
     * @description ĺ…?č®¸ćŁ€ç´˘ĺ¤šä¸Şç´˘ĺĽ•äą‹é—´çš„ĺ­—ć®µçš„ĺŠźč?˝ă€‚(ĺ®žéŞŚć€§APIďĽŚĺŹŻč?˝äĽšĺś¨ćśŞćťĄç‰?ćś¬ä¸­ĺ? é™¤)</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-fieldcaps}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/search-field-caps.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    fieldCaps(params, callback) {
        return this.client.fieldCaps(params, callback);
    }


    /**
     * @function  SuperMap.ElasticSearch.prototype.get
     * @description ä»Žç´˘ĺĽ•čŽ·ĺŹ–ä¸€ä¸ŞĺźşäşŽĺ…¶idçš„ç±»ĺž‹çš„JSONć–‡ćˇŁă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-get}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-get.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    get(params, callback) {
        return this.client.get(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.getScript
     * @description čŽ·ĺŹ–č„šćś¬ă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-getscript}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-scripting.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    getScript(params, callback) {
        return this.client.getScript(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.getSource
     * @description é€ščż‡ç´˘ĺĽ•ďĽŚç±»ĺž‹ĺ’ŚIDčŽ·ĺŹ–ć–‡ćˇŁçš„ćş?ă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-getsource}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-get.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    getSource(params, callback) {
        return this.client.getSource(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.getTemplate
     * @description čŽ·ĺŹ–ć¨ˇćťżă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-gettemplate}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/search-template.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    getTemplate(params, callback) {
        return this.client.getTemplate(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.index
     * @description ĺś¨ç´˘ĺĽ•ä¸­ĺ­?ĺ‚¨ä¸€ä¸Şé”®ĺ…Ąçš„JSONć–‡ćˇŁďĽŚä˝żĺ…¶ĺŹŻć?śç´˘ă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-index}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-index_.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    index(params, callback) {
        return this.client.index(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.info
     * @description ä»Žĺ˝“ĺ‰Ťé›†çľ¤čŽ·ĺŹ–ĺźşćś¬äżˇć?Żă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-info}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/index.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    info(params, callback) {
        return this.client.info(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.mget
     * @description ć ąćŤ®ç´˘ĺĽ•ďĽŚç±»ĺž‹ďĽ?ĺŹŻé€‰ďĽ‰ĺ’ŚidsćťĄčŽ·ĺŹ–ĺ¤šä¸Şć–‡ćˇŁă€‚mgetć‰€éś€çš„ä¸»ä˝“ĺŹŻä»Ąé‡‡ç”¨ä¸¤ç§Ťĺ˝˘ĺĽŹďĽšć–‡ćˇŁä˝Ťç˝®ć•°ç»„ć?–ć–‡ćˇŁIDć•°ç»„ă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-mget}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-multi-get.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    mget(params, callback) {
        return this.client.mget(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.msearch
     * @description ĺś¨ĺ?Śä¸€čŻ·ć±‚ä¸­ć‰§čˇŚĺ¤šä¸Şć?śç´˘čŻ·ć±‚ă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-msearch}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/search-multi-search.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - čŻ·ć±‚čż”ĺ›žçš„ĺ›žč°?ĺ‡˝ć•°ă€‚äąźĺŹŻä»Ąä˝żç”¨thenčˇ¨čľľĺĽŹčŽ·ĺŹ–čż”ĺ›žç»“ćžśă€‚
     *     ĺ›žč°?ĺŹ‚ć•°ďĽšerror,responseă€‚ç»“ćžśĺ­?ĺ‚¨ĺś¨response.responsesä¸­
     */
    msearch(params, callback) {
        let me = this;

        return me.client.msearch(params)
            .then(function (resp) {
                me._update(resp.responses, callback);
                return resp;
            }, function (err) {
                callback(err);
                me.events.triggerEvent('error', {error: err});
                return err;
            });
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.msearchTemplate
     * @description ĺś¨ĺ?Śä¸€čŻ·ć±‚ä¸­ć‰§čˇŚĺ¤šä¸Şć?śç´˘ć¨ˇćťżčŻ·ć±‚ă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-msearchtemplate}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/search-template.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    msearchTemplate(params, callback) {
        return this.client.msearchTemplate(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.mtermvectors
     * @description ĺ¤štermvectors APIĺ…?č®¸ä¸€ć¬ˇčŽ·ĺľ—ĺ¤šä¸Ştermvectorsă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-mtermvectors}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-multi-termvectors.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    mtermvectors(params, callback) {
        return this.client.mtermvectors(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.ping
     * @description ćµ‹čŻ•čżžćŽĄă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-ping}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/index.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    ping(params, callback) {
        return this.client.ping(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.putScript
     * @description ć·»ĺŠ č„šćś¬ă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-putscript}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-scripting.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    putScript(params, callback) {
        return this.client.putScript(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.putTemplate
     * @description ć·»ĺŠ ć¨ˇćťżă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-puttemplate}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/search-template.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    putTemplate(params, callback) {
        return this.client.putTemplate(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.reindex
     * @description é‡Ťć–°ç´˘ĺĽ•ă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-reindex}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-reindex.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    reindex(params, callback) {
        return this.client.reindex(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.reindexRessrottle
     * @description é‡Ťć–°ç´˘ĺĽ•ă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-reindexrethrottle}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-reindex.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    reindexRessrottle(params, callback) {
        return this.client.reindexRessrottle(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.renderSearchTemplate
     * @description ć?śç´˘ć¨ˇćťżă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-rendersearchtemplate}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/search-template.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    renderSearchTemplate(params, callback) {
        return this.client.renderSearchTemplate(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.scroll
     * @description  ĺś¨search()č°?ç”¨ä¸­ćŚ‡ĺ®šć»šĺŠ¨ĺŹ‚ć•°äą‹ĺ?ŽďĽŚć»šĺŠ¨ć?śç´˘čŻ·ć±‚ďĽ?ćŁ€ç´˘ä¸‹ä¸€ç»„ç»“ćžśďĽ‰ă€‚</br>
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-scroll}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-scroll.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    scroll(params, callback) {
        return this.client.scroll(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.search
     * @description  ĺś¨search()č°?ç”¨ä¸­ćŚ‡ĺ®šć»šĺŠ¨ĺŹ‚ć•°äą‹ĺ?ŽďĽŚć»šĺŠ¨ć?śç´˘čŻ·ć±‚ďĽ?ćŁ€ç´˘ä¸‹ä¸€ç»„ç»“ćžśďĽ‰ă€‚
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-search}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - čŻ·ć±‚čż”ĺ›žçš„ĺ›žč°?ĺ‡˝ć•°ă€‚äąźĺŹŻä»Ąä˝żç”¨thenčˇ¨čľľĺĽŹčŽ·ĺŹ–čż”ĺ›žç»“ćžśă€‚
     *     ĺ›žč°?ĺŹ‚ć•°ďĽšerror,response,ç»“ćžśĺ­?ĺ‚¨ĺś¨response.responsesä¸­
     */
    search(params, callback) {
        let me = this;
        return me.client.search(params)
            .then(function (resp) {
                me._update(resp.responses, callback);
                return resp;
            }, function (err) {
                callback(err);
                me.events.triggerEvent('error', {error: err});
                return err;
            });
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.searchShards
     * @description  čż”ĺ›žč¦?ć‰§čˇŚć?śç´˘čŻ·ć±‚çš„ç´˘ĺĽ•ĺ’Śĺ?†ç‰‡ă€‚
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-searchshards}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/search-shards.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    searchShards(params, callback) {
        return this.client.searchShards(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.searchTemplate
     * @description  ć?śç´˘ć¨ˇćťżă€‚
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-searchtemplate}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    searchTemplate(params, callback) {
        return this.client.searchTemplate(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.suggest
     * @description čŻĄĺ»şč®®ĺŠźč?˝é€ščż‡ä˝żç”¨ç‰ąĺ®šçš„ĺ»şč®®č€…ďĽŚĺźşäşŽć‰€ćŹ?äľ›çš„ć–‡ćś¬ćťĄĺ»şč®®ç±»äĽĽçš„ćśŻčŻ­ă€‚
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-suggest}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    suggest(params, callback) {
        return this.client.suggest(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.termvectors
     * @description čż”ĺ›žćś‰ĺ…łç‰ąĺ®šć–‡ćˇŁĺ­—ć®µä¸­çš„ćśŻčŻ­çš„äżˇć?Żĺ’Śç»źč®ˇäżˇć?Żă€‚
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-termvectors}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-termvectors.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    termvectors(params, callback) {
        return this.client.termvectors(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.update
     * @description ć›´ć–°ć–‡ćˇŁçš„é?¨ĺ?†ă€‚
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-update}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-update.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    update(params, callback) {
        return this.client.update(params, callback);
    }

    /**
     * @function  SuperMap.ElasticSearch.prototype.update
     * @description é€ščż‡ćźĄčŻ˘APIćťĄć›´ć–°ć–‡ćˇŁă€‚
     * ĺŹ‚ć•°č®ľç˝®ĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-updatebyquery}</br>
     * ć›´ĺ¤šäżˇć?ŻĺŹ‚č€? {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-update-by-query.html}</br>
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     * @param {function} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    updateByQuery(params, callback) {
        return this.client.updateByQuery(params, callback);
    }

    _update(data, callback) {
        let me = this;
        if (!data) {
            return;
        }
        me.data = data;
        if (me.openGeoFence && me.geoFence) {
            me._validateDatas(data);
        }
        me.events.triggerEvent('change', {data: me.data});
        //changeć–ąćł•ĺ·˛ĺşźĺĽ?ďĽŚä¸Ťĺ»şč®®ä˝żç”¨ă€‚ĺ»şč®®ä˝żç”¨searchć–ąćł•çš„ç¬¬äşŚä¸ŞĺŹ‚ć•°äĽ ĺ…ĄčŻ·ć±‚ć??ĺŠźçš„ĺ›žč°?
        if (me.change) {
            me.change && me.change(data);
        } else {
            //ĺŠ responsesć?Żä¸şäş†äżťćŚ?č·źĺŽźćťĄesč‡Şčş«çš„ć•°ćŤ®ç»“ćž„ä¸€č‡´
            callback && callback(undefined, {responses: data});
        }
    }

    _validateDatas(datas) {
        if (!datas) {
            return;
        }
        if (!(datas instanceof Array)) {
            datas = [datas];
        }
        var i, len = datas.length;
        for (i = 0; i < len; i++) {
            this._validateData(datas[i]);
        }
    }

    _validateData(data) {
        let me = this;
        data.hits.hits.map(function (source) {
            let content = source._source;
            let meterUnit = me._getMeterPerMapUnit(me.geoFence.unit);
            let geoFenceCX = me.geoFence.center[0] * meterUnit;
            let geoFenceCY = me.geoFence.center[1] * meterUnit;
            let contentX = content.x * meterUnit;
            let contentY = content.y * meterUnit;
            let distance = me._distance(contentX, contentY, geoFenceCX, geoFenceCY);
            let radius = me.geoFence.radius;
            if (distance > radius) {
                me.outOfGeoFence && me.outOfGeoFence(data);
                me.events.triggerEvent('outOfGeoFence', {data: data});
            }
            return source;
        });
    }

    _distance(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    }

    _getMeterPerMapUnit(mapUnit) {
        let earchRadiusInMeters = 6378137;
        let meterPerMapUnit;
        if (mapUnit === 'meter') {
            meterPerMapUnit = 1;
        } else if (mapUnit === 'degree') {
            // ćŻŹĺş¦čˇ¨ç¤şĺ¤šĺ°‘ç±łă€‚
            meterPerMapUnit = Math.PI * 2 * earchRadiusInMeters / 360;
        }
        return meterPerMapUnit;
    }

}

SuperMap.ElasticSearch = ElasticSearch;

// EXTERNAL MODULE: ./node_modules/promise-polyfill/dist/polyfill.js
var polyfill = __webpack_require__(107);
// EXTERNAL MODULE: ./node_modules/fetch-ie8/fetch.js
var fetch = __webpack_require__(693);
// EXTERNAL MODULE: ./node_modules/fetch-jsonp/build/fetch-jsonp.js
var fetch_jsonp = __webpack_require__(144);
var fetch_jsonp_default = /*#__PURE__*/__webpack_require__.n(fetch_jsonp);
;// CONCATENATED MODULE: ./src/common/util/FetchRequest.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/






let FetchRequest_fetch = window.fetch;
var setFetch = function (newFetch) {
    FetchRequest_fetch = newFetch;
}
/**
 * @function SuperMap.setCORS
 * @description č®ľç˝®ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ďĽŚĺ…¨ĺ±€é…Ťç˝®ďĽŚäĽ?ĺ…?çş§ä˝ŽäşŽ service ä¸‹çš„ crossOring ĺŹ‚ć•°ă€‚
 * @param {boolean} cors - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 */
var setCORS = SuperMap.setCORS = function (cors) {
    SuperMap.CORS = cors;
}
/**
 * @function SuperMap.isCORS
 * @description ć?Żć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @returns {boolean} ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 */
var isCORS = SuperMap.isCORS = function () {
    if (SuperMap.CORS != undefined) {
        return SuperMap.CORS;
    }
    return window.XMLHttpRequest && 'withCredentials' in new window.XMLHttpRequest();
}
/**
 * @function SuperMap.setRequestTimeout
 * @description č®ľç˝®čŻ·ć±‚č¶…ć—¶ć—¶é—´ă€‚
 * @param {number} [timeout=45] - čŻ·ć±‚č¶…ć—¶ć—¶é—´ďĽŚĺŤ•ä˝Ťç§’ă€‚
 */
var setRequestTimeout = SuperMap.setRequestTimeout = function (timeout) {
    return SuperMap.RequestTimeout = timeout;
}
/**
 * @function SuperMap.getRequestTimeout
 * @description čŽ·ĺŹ–čŻ·ć±‚č¶…ć—¶ć—¶é—´ă€‚
 * @returns {number} čŻ·ć±‚č¶…ć—¶ć—¶é—´ă€‚
 */
var getRequestTimeout = SuperMap.getRequestTimeout = function () {
    return SuperMap.RequestTimeout || 45000;
}
var FetchRequest = SuperMap.FetchRequest = {
    commit: function (method, url, params, options) {
        method = method ? method.toUpperCase() : method;
        switch (method) {
            case 'GET':
                return this.get(url, params, options);
            case 'POST':
                return this.post(url, params, options);
            case 'PUT':
                return this.put(url, params, options);
            case 'DELETE':
                return this.delete(url, params, options);
            default:
                return this.get(url, params, options);
        }
    },
    supportDirectRequest: function (url, options) {
        if (Util.isInTheSameDomain(url)) {
            return true;
        }
        if (options.crossOrigin != undefined) {
            return options.crossOrigin;
        } else {
            return isCORS() || options.proxy;
        }
    },
    get: function (url, params, options) {
        options = options || {};
        var type = 'GET';
        url = Util.urlAppend(url, this._getParameterString(params || {}));
        url = this._processUrl(url, options);
        if (!this.supportDirectRequest(url, options)) {
            url = url.replace('.json', '.jsonp');
            var config = {
                url: url,
                data: params
            };
            return SuperMap.Util.RequestJSONPPromise.GET(config);
        }
        if (!this.urlIsLong(url)) {
            return this._fetch(url, params, options, type);
        } else {
            return this._postSimulatie(type, url.substring(0, url.indexOf('?') - 1), params, options);
        }
    },

    delete: function (url, params, options) {
        options = options || {};
        var type = 'DELETE';
        url = Util.urlAppend(url, this._getParameterString(params || {}));
        url = this._processUrl(url, options);
        if (!this.supportDirectRequest(url, options)) {
            url = url.replace('.json', '.jsonp');
            var config = {
                url: url += "&_method=DELETE",
                data: params
            };
            return SuperMap.Util.RequestJSONPPromise.DELETE(config);
        }
        if (this.urlIsLong(url)) {
            return this._postSimulatie(type, url.substring(0, url.indexOf('?') - 1), params, options);
        }
        return this._fetch(url, params, options, type);
    },
    post: function (url, params, options) {
        options = options || {};
        if (!this.supportDirectRequest(url, options)) {
            url = url.replace('.json', '.jsonp');
            var config = {
                url: url += "&_method=POST",
                data: params
            };
            return SuperMap.Util.RequestJSONPPromise.POST(config);
        }
        return this._fetch(this._processUrl(url, options), params, options, 'POST');
    },

    put: function (url, params, options) {
        options = options || {};
        url = this._processUrl(url, options);
        if (!this.supportDirectRequest(url, options)) {
            url = url.replace('.json', '.jsonp');
            var config = {
                url: url += "&_method=PUT",
                data: params
            };
            return SuperMap.Util.RequestJSONPPromise.PUT(config);
        }
        return this._fetch(url, params, options, 'PUT');
    },
    urlIsLong: function (url) {
        //ĺ˝“ĺ‰Ťurlçš„ĺ­—čŠ‚é•żĺş¦ă€‚
        var totalLength = 0,
            charCode = null;
        for (var i = 0, len = url.length; i < len; i++) {
            //č˝¬ĺŚ–ä¸şUnicodeçĽ–ç ?
            charCode = url.charCodeAt(i);
            if (charCode < 0x007f) {
                totalLength++;
            } else if ((0x0080 <= charCode) && (charCode <= 0x07ff)) {
                totalLength += 2;
            } else if ((0x0800 <= charCode) && (charCode <= 0xffff)) {
                totalLength += 3;
            }
        }
        return totalLength < 2000 ? false : true;
    },
    _postSimulatie: function (type, url, params, options) {
        var separator = url.indexOf('?') > -1 ? '&' : '?';
        url += separator + '_method=' + type;
        if (typeof params !== 'string') {
            params = JSON.stringify(params);
        }
        return this.post(url, params, options);
    },

    _processUrl: function (url, options) {
        if (this._isMVTRequest(url)) {
            return url;
        }

        if (url.indexOf('.json') === -1 && !options.withoutFormatSuffix) {
            if (url.indexOf('?') < 0) {
                url += '.json';
            } else {
                var urlArrays = url.split('?');
                if (urlArrays.length === 2) {
                    url = urlArrays[0] + '.json?' + urlArrays[1];
                }
            }
        }
        if (options && options.proxy) {
            if (typeof options.proxy === 'function') {
                url = options.proxy(url);
            } else {
                url = decodeURIComponent(url);
                url = options.proxy + encodeURIComponent(url);
            }
        }
        return url;
    },

    _fetch: function (url, params, options, type) {
        options = options || {};
        options.headers = options.headers || {};
        if (!options.headers['Content-Type'] && !FormData.prototype.isPrototypeOf(params)) {
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
        }
        if (options.timeout) {
            return this._timeout(
                options.timeout,
                FetchRequest_fetch(url, {
                    method: type,
                    headers: options.headers,
                    body: type === 'PUT' || type === 'POST' ? params : undefined,
                    credentials: this._getWithCredentials(options),
                    mode: 'cors',
                    timeout: getRequestTimeout()
                }).then(function (response) {
                    return response;
                })
            );
        }
        return FetchRequest_fetch(url, {
            method: type,
            body: type === 'PUT' || type === 'POST' ? params : undefined,
            headers: options.headers,
            credentials: this._getWithCredentials(options),
            mode: 'cors',
            timeout: getRequestTimeout()
        }).then(function (response) {
            return response;
        });
    },

    _getWithCredentials: function (options) {
        if (options.withCredentials === true) {
            return 'include';
        }
        if (options.withCredentials === false) {
            return 'omit';
        }
        return 'same-origin';
    },

    _fetchJsonp: function (url, options) {
        options = options || {};
        return fetch_jsonp_default()(url, {
            method: 'GET',
            timeout: options.timeout
        }).then(function (response) {
            return response;
        });
    },

    _timeout: function (seconds, promise) {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                reject(new Error('timeout'));
            }, seconds);
            promise.then(resolve, reject);
        });
    },

    _getParameterString: function (params) {
        var paramsArray = [];
        for (var key in params) {
            var value = params[key];
            if (value != null && typeof value !== 'function') {
                var encodedValue;
                if (Array.isArray(value) || value.toString() === '[object Object]') {
                    encodedValue = encodeURIComponent(JSON.stringify(value));
                } else {
                    encodedValue = encodeURIComponent(value);
                }
                paramsArray.push(encodeURIComponent(key) + '=' + encodedValue);
            }
        }
        return paramsArray.join('&');
    },

    _isMVTRequest: function (url) {
        return url.indexOf('.mvt') > -1 || url.indexOf('.pbf') > -1;
    }
}
SuperMap.Util.RequestJSONPPromise = {
    limitLength: 1500,
    queryKeys: [],
    queryValues: [],
    supermap_callbacks: {},
    addQueryStrings: function (values) {
        var me = this;
        for (var key in values) {
            me.queryKeys.push(key);
            if (typeof values[key] !== 'string') {
                values[key] = SuperMap.Util.toJSON(values[key]);
            }
            var tempValue = encodeURIComponent(values[key]);
            me.queryValues.push(tempValue);
        }
    },
    issue: function (config) {
        var me = this,
            uid = me.getUid(),
            url = config.url,
            splitQuestUrl = [];
        var p = new Promise(function (resolve) {
            me.supermap_callbacks[uid] = function (response) {
                delete me.supermap_callbacks[uid];
                resolve(response);
            };
        });

        // me.addQueryStrings({
        //     callback: "SuperMap.Util.RequestJSONPPromise.supermap_callbacks[" + uid + "]"
        // });
        var sectionURL = url,
            keysCount = 0; //ć­¤ć¬ˇsectionURLä¸­ćś‰ĺ¤šĺ°‘ä¸Şkey
        var length = me.queryKeys ? me.queryKeys.length : 0;
        for (var i = 0; i < length; i++) {
            if (sectionURL.length + me.queryKeys[i].length + 2 >= me.limitLength) {
                //+2 for ("&"or"?")and"="
                if (keysCount == 0) {
                    return false;
                }
                splitQuestUrl.push(sectionURL);
                sectionURL = url;
                keysCount = 0;
                i--;
            } else {
                if (sectionURL.length + me.queryKeys[i].length + 2 + me.queryValues[i].length > me.limitLength) {
                    var leftValue = me.queryValues[i];
                    while (leftValue.length > 0) {
                        var leftLength = me.limitLength - sectionURL.length - me.queryKeys[i].length - 2; //+2 for ("&"or"?")and"="
                        if (sectionURL.indexOf('?') > -1) {
                            sectionURL += '&';
                        } else {
                            sectionURL += '?';
                        }
                        var tempLeftValue = leftValue.substring(0, leftLength);
                        //é?żĺ…Ť ć?Şć–­sectionURLć—¶ďĽŚĺ°†ç±»äĽĽäşŽ%22čż™ć ·çš„ç¬¦ĺŹ·ć?Şć??ä¸¤ĺŤŠďĽŚä»Žč€ŚĺŻĽč‡´ćśŤĺŠˇç«Żç»„čŁ…sectionURLć—¶ĺŹ‘ç”źé”™čŻŻ
                        if (tempLeftValue.substring(leftLength - 1, leftLength) === '%') {
                            leftLength -= 1;
                            tempLeftValue = leftValue.substring(0, leftLength);
                        } else if (tempLeftValue.substring(leftLength - 2, leftLength - 1) === '%') {
                            leftLength -= 2;
                            tempLeftValue = leftValue.substring(0, leftLength);
                        }

                        sectionURL += me.queryKeys[i] + '=' + tempLeftValue;
                        leftValue = leftValue.substring(leftLength);
                        if (tempLeftValue.length > 0) {
                            splitQuestUrl.push(sectionURL);
                            sectionURL = url;
                            keysCount = 0;
                        }
                    }
                } else {
                    keysCount++;
                    if (sectionURL.indexOf('?') > -1) {
                        sectionURL += '&';
                    } else {
                        sectionURL += '?';
                    }
                    sectionURL += me.queryKeys[i] + '=' + me.queryValues[i];
                }
            }
        }
        splitQuestUrl.push(sectionURL);
        me.send(
            splitQuestUrl,
            'SuperMap.Util.RequestJSONPPromise.supermap_callbacks[' + uid + ']',
            config && config.proxy
        );
        return p;
    },

    getUid: function () {
        var uid = new Date().getTime(),
            random = Math.floor(Math.random() * 1e17);
        return uid * 1000 + random;
    },

    send: function (splitQuestUrl, callback, proxy) {
        var len = splitQuestUrl.length;
        if (len > 0) {
            var jsonpUserID = new Date().getTime();
            for (var i = 0; i < len; i++) {
                var url = splitQuestUrl[i];
                if (url.indexOf('?') > -1) {
                    url += '&';
                } else {
                    url += '?';
                }
                url += 'sectionCount=' + len;
                url += '&sectionIndex=' + i;
                url += '&jsonpUserID=' + jsonpUserID;
                if (proxy) {
                    url = decodeURIComponent(url);
                    url = proxy + encodeURIComponent(url);
                }
                fetch_jsonp_default()(url, {
                    jsonpCallbackFunction: callback,
                    timeout: 30000
                });
            }
        }
    },

    GET: function (config) {
        var me = this;
        me.queryKeys.length = 0;
        me.queryValues.length = 0;
        me.addQueryStrings(config.params);
        return me.issue(config);
    },

    POST: function (config) {
        var me = this;
        me.queryKeys.length = 0;
        me.queryValues.length = 0;
        me.addQueryStrings({
            requestEntity: config.data
        });
        return me.issue(config);
    },

    PUT: function (config) {
        var me = this;
        me.queryKeys.length = 0;
        me.queryValues.length = 0;
        me.addQueryStrings({
            requestEntity: config.data
        });
        return me.issue(config);
    },
    DELETE: function (config) {
        var me = this;
        me.queryKeys.length = 0;
        me.queryValues.length = 0;
        me.addQueryStrings({
            requestEntity: config.data
        });
        return me.issue(config);
    }
};

;// CONCATENATED MODULE: ./src/common/commontypes/Credential.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/


/**
 * @class SuperMap.Credential
 * @category Security
 * @classdesc SuperMap çš„ĺ®‰ĺ…¨čŻ?äą¦ç±»ďĽŚĺ…¶ä¸­ĺŚ…ć‹¬ token ç­‰ĺ®‰ĺ…¨éŞŚčŻ?äżˇć?Żă€‚</br>
 * éś€č¦?ä˝żç”¨ç”¨ć?·ĺ?Ťĺ’ŚĺŻ†ç ?ĺś¨ďĽš"http://localhost:8090/iserver/services/security/tokens" ä¸‹ç”łčŻ· valueă€‚</br>
 * čŽ·ĺľ—ĺ˝˘ĺ¦‚ďĽš"2OMwGmcNlrP2ixqv1Mk4BuQMybOGfLOrljruX6VcYMDQKc58Sl9nMHsqQaqeBx44jRvKSjkmpZKK1L596y7skQ.." çš„ valueă€‚</br>
 * ç›®ĺ‰Ťć”ŻćŚ?çš„ĺŠźč?˝ĺŚ…ć‹¬ďĽšĺś°ĺ›ľćśŤĺŠˇă€?ä¸“é˘?ĺ›ľă€?é‡Źç®—ă€?ćźĄčŻ˘ă€?ĺ…¬äş¤ćŤ˘äą?ă€?ç©şé—´ĺ?†ćž?ă€?ç˝‘ç»śĺ?†ćž?ďĽŚä¸Ťć”ŻćŚ?č˝®čŻ˘ĺŠźč?˝ă€‚</br>
 * @param {string} value - č®żé—®ĺŹ—ĺ®‰ĺ…¨é™?ĺ?¶çš„ćśŤĺŠˇć—¶ç”¨äşŽé€ščż‡ĺ®‰ĺ…¨č®¤čŻ?çš„éŞŚčŻ?äżˇć?Żă€‚
 * @param {string} [name='token'] - éŞŚčŻ?äżˇć?Żĺ‰ŤçĽ€ďĽŚname=value é?¨ĺ?†çš„ name é?¨ĺ?†ă€‚
 * @example
 * var pixcel = new SuperMap.Credential("valueString","token");
 * pixcel.destroy();
 */
class Credential {


    constructor(value, name) {

        /**
         * @member {string} SuperMap.Bounds.prototype.value
         * @description č®żé—®ĺŹ—ĺ®‰ĺ…¨é™?ĺ?¶çš„ćśŤĺŠˇć—¶ç”¨äşŽé€ščż‡ĺ®‰ĺ…¨č®¤čŻ?çš„éŞŚčŻ?äżˇć?Żă€‚
         */
        this.value = value ? value : "";

        /**
         * @member {string} [SuperMap.Bounds.prototype.name='token']
         * @description éŞŚčŻ?äżˇć?Żĺ‰ŤçĽ€ďĽŚname=value é?¨ĺ?†çš„ name é?¨ĺ?†ă€‚
         */
        this.name = name ? name : "token";
        this.CLASS_NAME = "SuperMap.Credential";
    }

    /**
     * @function SuperMap.Credential.prototype.getUrlParameters
     * @example
     * var credential = new SuperMap.Credential("valueString","token");
     * //čż™é‡Ś str = "token=valueString";
     * var str = credential.getUrlParameters();
     * @returns {string} čż”ĺ›žĺ®‰ĺ…¨äżˇć?Żç»„ć??çš„ url ç‰‡ć®µă€‚
     */
    getUrlParameters() {
        //ĺ˝“éś€č¦?ĺ…¶ä»–ĺ®‰ĺ…¨äżˇć?Żçš„ć—¶ĺ€™ďĽŚĺ?™éś€č¦?return this.name + "=" + this.value + "&" + "...";çš„ĺ˝˘ĺĽŹć·»ĺŠ ă€‚
        return this.name + "=" + this.value;
    }


    /**
     * @function SuperMap.Bounds.prototype.getValue
     * @description čŽ·ĺŹ– valueă€‚
     * @example
     * var credential = new SuperMap.Credential("2OMwGmcNlrP2ixqv1Mk4BuQMybOGfLOrljruX6VcYMDQKc58Sl9nMHsqQaqeBx44jRvKSjkmpZKK1L596y7skQ..","token");
     * //čż™é‡Ś str = "2OMwGmcNlrP2ixqv1Mk4BuQMybOGfLOrljruX6VcYMDQKc58Sl9nMHsqQaqeBx44jRvKSjkmpZKK1L596y7skQ..";
     * var str = credential.getValue();
     * @returns {string} čż”ĺ›ž value ĺ­—ç¬¦ä¸˛ďĽŚĺś¨ iServer ćśŤĺŠˇä¸‹čŻĄ value ĺ€ĽĺŤłä¸ş token ĺ€Ľă€‚
     */
    getValue() {
        return this.value;
    }

    /**
     *
     * @function SuperMap.Credential.prototype.destroy
     * @description é”€ćŻ?ć­¤ĺŻąč±ˇă€‚é”€ćŻ?ĺ?Žć­¤ĺŻąč±ˇçš„ć‰€ćś‰ĺ±žć€§ä¸ş nullďĽŚč€Śä¸Ťć?Żĺ?ťĺ§‹ĺ€Ľă€‚
     * @example
     * var credential = new SuperMap.Credential("valueString","token");
     * credential.destroy();
     */
    destroy() {
        this.value = null;
        this.name = null;
    }

}

/**
 * @member {SuperMap.Credential} SuperMap.Credential.CREDENTIAL
 * @description čż™ä¸ŞĺŻąč±ˇäżťĺ­?ä¸€ä¸Şĺ®‰ĺ…¨ç±»çš„ĺ®žäľ‹ďĽŚĺś¨ćśŤĺŠˇç«Żéś€č¦?ĺ®‰ĺ…¨éŞŚčŻ?çš„ć—¶ĺ€™ĺż…éˇ»čż›čˇŚč®ľç˝®ă€‚
 * @constant
 * @example
 * ä»Łç ?ĺ®žäľ‹:
 *  // ĺ˝“iServerĺ?Żç”¨ćśŤĺŠˇĺ®‰ĺ…¨çš„ć—¶ĺ€™ďĽŚä¸‹čľąçš„ä»Łç ?ć?Żĺż…éˇ»çš„ă€‚ĺ®‰ĺ…¨čŻ?äą¦ç±»č?˝ĺ¤źćŽĄć”¶ä¸€ä¸Şvalueĺ’Śä¸€ä¸ŞnameĺŹ‚ć•°ă€‚
 *  var value = "(ä»ĄiServerä¸şäľ‹ďĽŚčż™é‡Ść?Żç”łčŻ·çš„tokenĺ€Ľ)";
 *  var name = "token";
 *  // é»?č®¤nameĺŹ‚ć•°ä¸ştokenďĽŚć‰€ä»Ąĺ˝“ä˝żç”¨iServerćśŤĺŠˇçš„ć—¶ĺ€™ĺŹŻä»Ąä¸Ťčż›čˇŚč®ľç˝®ă€‚
 *  SuperMap.Credential.CREDENTIAL = new SuperMap.Credential(value, name);
 *
 */

Credential.CREDENTIAL = null;
SuperMap.Credential = Credential;

;// CONCATENATED MODULE: ./src/common/security/SecurityManager.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/




/**
 * @name SecurityManager
 * @memberOf SuperMap
 * @namespace
 * @category Security
 * @description ĺ®‰ĺ…¨ç®ˇç?†ä¸­ĺż?ďĽŚćŹ?äľ› iServer,iPortal,Online ç»źä¸€ćť?é™?č®¤čŻ?ç®ˇç?†ă€‚
 *  > ä˝żç”¨čŻ´ć?ŽďĽš
 *  > ĺ?›ĺ»şä»»ä˝•ä¸€ä¸ŞćśŤĺŠˇäą‹ĺ‰Ťč°?ç”¨ {@link SuperMap.SecurityManager.registerToken}ć?–
 *  > {@link SuperMap.SecurityManager.registerKey}ćł¨ĺ†Śĺ‡­ćŤ®ă€‚
 *  > ĺŹ‘é€?čŻ·ć±‚ć—¶ć ąćŤ® url ć?–č€…ćśŤĺŠˇ id čŽ·ĺŹ–ç›¸ĺş”çš„ key ć?–č€… token ĺą¶č‡ŞĺŠ¨ć·»ĺŠ ĺ?°ćśŤĺŠˇĺś°ĺť€ä¸­ă€‚
 */
class SecurityManager {
    /**
     * @description ä»ŽćśŤĺŠˇĺ™¨čŽ·ĺŹ–ä¸€ä¸Ştoken,ĺś¨ć­¤äą‹ĺ‰Ťč¦?ćł¨ĺ†ŚćśŤĺŠˇĺ™¨äżˇć?Żă€‚
     * @function SuperMap.SecurityManager.generateToken
     * @param {string} url - ćśŤĺŠˇĺ™¨ĺźźĺ?Ť+ç«ŻĺŹŁďĽŚĺ¦‚ďĽšhttp://localhost:8092ă€‚
     * @param {SuperMap.TokenServiceParameter} tokenParam - token ç”łčŻ·ĺŹ‚ć•°ă€‚
     * @returns {Promise} čż”ĺ›žĺŚ…ĺ?« token äżˇć?Żçš„ Promise ĺŻąč±ˇă€‚
     */

    static generateToken(url, tokenParam) {
        var serverInfo = this.servers[url];
        if (!serverInfo) {
            return;
        }
        return FetchRequest.post(serverInfo.tokenServiceUrl, JSON.stringify(tokenParam.toJSON())).then(function(
            response
        ) {
            return response.text();
        });
    }

    /**
     * @description ćł¨ĺ†Śĺ®‰ĺ…¨ćśŤĺŠˇĺ™¨ç›¸ĺ…łäżˇć?Żă€‚
     * @function SuperMap.SecurityManager.registerServers
     * @param {SuperMap.ServerInfo} serverInfos - ćśŤĺŠˇĺ™¨äżˇć?Żă€‚
     */
    static registerServers(serverInfos) {
        this.servers = this.servers || {};
        if (!Util.isArray(serverInfos)) {
            serverInfos = [serverInfos];
        }
        for (var i = 0; i < serverInfos.length; i++) {
            var serverInfo = serverInfos[i];
            this.servers[serverInfo.server] = serverInfo;
        }
    }

    /**
     * @description ćśŤĺŠˇčŻ·ć±‚é?˝äĽšč‡ŞĺŠ¨ĺ¸¦ä¸Ščż™ä¸Ş tokenă€‚
     * @function SuperMap.SecurityManager.registerToken
     * @param {string} url -ćśŤĺŠˇĺ™¨ĺźźĺ?Ť+ç«ŻĺŹŁďĽšĺ¦‚http://localhost:8090ă€‚
     * @param {string} token - token
     */
    static registerToken(url, token) {
        this.tokens = this.tokens || {};
        if (!url || !token) {
            return;
        }
        var domain = this._getTokenStorageKey(url);
        this.tokens[domain] = token;
    }

    /**
     * @description ćł¨ĺ†Ś key,ids ä¸şć•°ç»„(ĺ­?ĺś¨ä¸€ä¸Ş key ĺŻąĺş”ĺ¤šä¸ŞćśŤĺŠˇ)ă€‚
     * @function SuperMap.SecurityManager.registerKey
     * @param {Array} ids - ĺŹŻä»Ąć?ŻćśŤĺŠˇ id ć•°ç»„ć?–č€… url ĺś°ĺť€ć•°ç»„ć?–č€… webAPI ç±»ĺž‹ć•°ç»„ă€‚
     * @param {string} key - key
     */
    static registerKey(ids, key) {
        this.keys = this.keys || {};
        if (!ids || ids.length < 1 || !key) {
            return;
        }

        ids = Util.isArray(ids) ? ids : [ids];
        for (var i = 0; i < ids.length; i++) {
            var id = this._getUrlRestString(ids[0]) || ids[0];
            this.keys[id] = key;
        }
    }

    /**
     * @description čŽ·ĺŹ–ćśŤĺŠˇĺ™¨äżˇć?Żă€‚
     * @function SuperMap.SecurityManager.getServerInfo
     * @param {string} url - ćśŤĺŠˇĺ™¨ĺźźĺ?Ť+ç«ŻĺŹŁďĽŚĺ¦‚ďĽšhttp://localhost:8092ă€‚
     * @returns {SuperMap.ServerInfo} ćśŤĺŠˇĺ™¨äżˇć?Żă€‚
     */
    static getServerInfo(url) {
        this.servers = this.servers || {};
        return this.servers[url];
    }

    /**
     * @description ć ąćŤ® Url čŽ·ĺŹ–tokenă€‚
     * @function SuperMap.SecurityManager.getToken
     * @param {string} url - ćśŤĺŠˇĺ™¨ĺźźĺ?Ť+ç«ŻĺŹŁďĽŚĺ¦‚ďĽšhttp://localhost:8092ă€‚
     * @returns {string} token
     */
    static getToken(url) {
        if (!url) {
            return;
        }
        this.tokens = this.tokens || {};
        var domain = this._getTokenStorageKey(url);
        return this.tokens[domain];
    }

    /**
     * @description ć ąćŤ® Url čŽ·ĺŹ– keyă€‚
     * @function SuperMap.SecurityManager.getKey
     * @param {string} id - id
     * @returns {string} key
     */
    static getKey(id) {
        this.keys = this.keys || {};
        var key = this._getUrlRestString(id) || id;
        return this.keys[key];
    }

    /**
     * @description iServer ç™»ĺ˝•éŞŚčŻ?ă€‚
     * @function SuperMap.SecurityManager.loginiServer
     * @param {string} url - iServer é¦–éˇµĺś°ĺť€ďĽŚĺ¦‚ďĽšhttp://localhost:8090/iserveră€‚
     * @param {string} username - ç”¨ć?·ĺ?Ťă€‚
     * @param {string} password - ĺŻ†ç ?ă€‚
     * @param {boolean} [rememberme=false] - ć?Żĺ?¦č®°ä˝Źă€‚
     * @returns {Promise} čż”ĺ›žĺŚ…ĺ?« iServer ç™»ĺ˝•čŻ·ć±‚ç»“ćžśçš„ Promise ĺŻąč±ˇă€‚
     */
    static loginiServer(url, username, password, rememberme) {
        url = Util.urlPathAppend(url, 'services/security/login');
        var loginInfo = {
            username: username && username.toString(),
            password: password && password.toString(),
            rememberme: rememberme
        };
        loginInfo = JSON.stringify(loginInfo);
        var requestOptions = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        };
        return FetchRequest.post(url, loginInfo, requestOptions).then(function(response) {
            return response.json();
        });
    }

    /**
     * @description iServerç™»ĺ‡şă€‚
     * @function SuperMap.SecurityManager.logoutiServer
     * @param {string} url - iServer é¦–éˇµĺś°ĺť€,ĺ¦‚ďĽšhttp://localhost:8090/iserveră€‚
     * @returns {Promise} ć?Żĺ?¦ç™»ĺ‡şć??ĺŠźă€‚
     */
    static logoutiServer(url) {
        url = Util.urlPathAppend(url, 'services/security/logout');
        var requestOptions = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            withoutFormatSuffix: true
        };
        return FetchRequest.get(url, '', requestOptions)
            .then(function() {
                return true;
            })
            .catch(function() {
                return false;
            });
    }

    /**
     * @description Online ç™»ĺ˝•éŞŚčŻ?ă€‚
     * @function SuperMap.SecurityManager.loginOnline
     * @param {string} callbackLocation - č·łč˝¬ä˝Ťç˝®ă€‚
     * @param {boolean} [newTab=true] - ć?Żĺ?¦ć–°çŞ—ĺŹŁć‰“ĺĽ€ă€‚
     */
    static loginOnline(callbackLocation, newTab) {
        var loginUrl = SecurityManager.SSO + '/login?service=' + callbackLocation;
        this._open(loginUrl, newTab);
    }

    /**
     * @description iPortalç™»ĺ˝•éŞŚčŻ?ă€‚
     * @function SuperMap.SecurityManager.loginiPortal
     * @param {string} url - iportal é¦–éˇµĺś°ĺť€,ĺ¦‚ďĽšhttp://localhost:8092/iportal.
     * @param {string} username - ç”¨ć?·ĺ?Ťă€‚
     * @param {string} password - ĺŻ†ç ?ă€‚
     * @returns {Promise} čż”ĺ›žĺŚ…ĺ?« iPortal ç™»ĺ˝•čŻ·ć±‚ç»“ćžśçš„ Promise ĺŻąč±ˇă€‚
     */
    static loginiPortal(url, username, password) {
        url = Util.urlPathAppend(url, 'web/login');
        var loginInfo = {
            username: username && username.toString(),
            password: password && password.toString()
        };
        loginInfo = JSON.stringify(loginInfo);
        var requestOptions = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            withCredentials: true
        };
        return FetchRequest.post(url, loginInfo, requestOptions).then(function(response) {
            return response.json();
        });
    }

    /**
     * @description iPortal ç™»ĺ‡şă€‚
     * @function SuperMap.SecurityManager.logoutiPortal
     * @param {string} url - iportal é¦–éˇµĺś°ĺť€,ĺ¦‚ďĽšhttp://localhost:8092/iportal.
     * @returns {Promise} ĺ¦‚ćžśç™»ĺ‡şć??ĺŠźďĽŚčż”ĺ›ž true;ĺ?¦ĺ?™čż”ĺ›ž falseă€‚
     */
    static logoutiPortal(url) {
        url = Util.urlPathAppend(url, 'services/security/logout');
        var requestOptions = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            withCredentials: true,
            withoutFormatSuffix: true
        };
        return FetchRequest.get(url, '', requestOptions)
            .then(function() {
                return true;
            })
            .catch(function() {
                return false;
            });
    }

    /**
     * @description iManager ç™»ĺ˝•éŞŚčŻ?ă€‚
     * @function SuperMap.SecurityManager.loginManager
     * @param {string} url - iManager ĺś°ĺť€ă€‚ĺś°ĺť€ĺŹ‚ć•°ä¸ş iManager é¦–éˇµĺś°ĺť€ďĽŚĺ¦‚ďĽš http://localhost:8390/imanageră€‚
     * @param {Object} [loginInfoParams] - iManager ç™»ĺ˝•ĺŹ‚ć•°ă€‚
     * @param {string} loginInfoParams.userName - ç”¨ć?·ĺ?Ťă€‚
     * @param {string} loginInfoParams.password - ĺŻ†ç ?ă€‚
     * @param {Object} options
     * @param {boolean} [options.isNewTab=true] - ä¸Ťĺ?Śĺźźć—¶ć?Żĺ?¦ĺś¨ć–°çŞ—ĺŹŁć‰“ĺĽ€ç™»ĺ˝•éˇµéť˘ă€‚
     * @returns {Promise} čż”ĺ›žĺŚ…ĺ?« iManager ç™»ĺ˝•čŻ·ć±‚ç»“ćžśçš„ Promise ĺŻąč±ˇă€‚
     */
    static loginManager(url, loginInfoParams, options) {
        if (!Util.isInTheSameDomain(url)) {
            var isNewTab = options ? options.isNewTab : true;
            this._open(url, isNewTab);
            return;
        }
        var requestUrl = Util.urlPathAppend(url, 'icloud/security/tokens');
        var params = loginInfoParams || {};
        var loginInfo = {
            username: params.userName && params.userName.toString(),
            password: params.password && params.password.toString()
        };
        loginInfo = JSON.stringify(loginInfo);
        var requestOptions = {
            headers: {
                Accept: '*/*',
                'Content-Type': 'application/json'
            }
        };
        var me = this;
        return FetchRequest.post(requestUrl, loginInfo, requestOptions).then(function(response) {
            response.text().then(function(result) {
                me.imanagerToken = result;
                return result;
            });
        });
    }

    /**
     * @description ć¸…ç©şĺ…¨é?¨éŞŚčŻ?äżˇć?Żă€‚
     * @function SuperMap.SecurityManager.destroyAllCredentials
     */
    static destroyAllCredentials() {
        this.keys = null;
        this.tokens = null;
        this.servers = null;
    }

    /**
     * @description ć¸…ç©şä»¤ç‰Śäżˇć?Żă€‚
     * @function SuperMap.SecurityManager.destroyToken
     * @param {string} url - iportal é¦–éˇµĺś°ĺť€,ĺ¦‚ďĽšhttp://localhost:8092/iportal.
     */
    static destroyToken(url) {
        if (!url) {
            return;
        }
        var domain = this._getTokenStorageKey(url);
        this.tokens = this.tokens || {};
        if (this.tokens[domain]) {
            delete this.tokens[domain];
        }
    }

    /**
     * @description ć¸…ç©şćśŤĺŠˇćŽ?ćť?ç ?ă€‚
     * @function SuperMap.SecurityManager.destroyKey
     * @param {string} url - iServer é¦–éˇµĺś°ĺť€,ĺ¦‚ďĽšhttp://localhost:8090/iserveră€‚
     */
    static destroyKey(url) {
        if (!url) {
            return;
        }
        this.keys = this.keys || {};
        var key = this._getUrlRestString(url) || url;
        if (this.keys[key]) {
            delete this.keys[key];
        }
    }

    /**
     * @description ćśŤĺŠˇURLčż˝ĺŠ ćŽ?ćť?äżˇć?ŻďĽŚćŽ?ćť?äżˇć?Żéś€ĺ…?é€ščż‡SecurityManager.registerKeyć?–SecurityManager.registerTokenćł¨ĺ†Śă€‚
     * @version 10.1.2
     * @function SuperMap.SecurityManager.appendCredential
     * @param {string} url - ćśŤĺŠˇURL
     * @returns {string} - čż”ĺ›žç»‘ĺ®šäş†tokenć?–č€…keyçš„ćśŤĺŠˇURL
     */
    static appendCredential(url) {
        var newUrl = url;
        var value = this.getToken(url);
        var credential = value ? new Credential(value, 'token') : null;
		if (!credential) {
            value = this.getKey(url);
            credential = value ? new Credential(value, 'key') : null;
          }
        if (credential) {
            newUrl = Util.urlAppend(newUrl, credential.getUrlParameters());
        }
        return newUrl;
    }

    static _open(url, newTab) {
        newTab = newTab != null ? newTab : true;
        var offsetX = window.screen.availWidth / 2 - this.INNER_WINDOW_WIDTH / 2;
        var offsetY = window.screen.availHeight / 2 - this.INNER_WINDOW_HEIGHT / 2;
        var options =
            'height=' +
            this.INNER_WINDOW_HEIGHT +
            ', width=' +
            this.INNER_WINDOW_WIDTH +
            ',top=' +
            offsetY +
            ', left=' +
            offsetX +
            ',toolbar=no, menubar=no, scrollbars=no, resizable=no, location=no, status=no';
        if (newTab) {
            window.open(url, 'login');
        } else {
            window.open(url, 'login', options);
        }
    }

    static _getTokenStorageKey(url) {
        var patten = /(.*?):\/\/([^\/]+)/i;
        var result = url.match(patten);
        if (!result) {
            return url;
        }
        return result[0];
    }

    static _getUrlRestString(url) {
        if (!url) {
            return url;
        }
        // var patten = /http:\/\/(.*\/rest)/i;
        var patten = /(http|https):\/\/(.*\/rest)/i;
        var result = url.match(patten);
        if (!result) {
            return url;
        }
        return result[0];
    }
}
SecurityManager.INNER_WINDOW_WIDTH = 600;
SecurityManager.INNER_WINDOW_HEIGHT = 600;
SecurityManager.SSO = 'https://sso.supermap.com';
SecurityManager.ONLINE = 'https://www.supermapol.com';
SuperMap.SecurityManager = SecurityManager;

;// CONCATENATED MODULE: ./src/common/REST.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/


/**
 * @enum DataFormat
 * @memberOf SuperMap
 * @description ćśŤĺŠˇčŻ·ć±‚čż”ĺ›žç»“ćžść•°ćŤ®ç±»ĺž‹
 * @type {string}
 */
var DataFormat = SuperMap.DataFormat = {
    /** GEOJSON */
    GEOJSON: "GEOJSON",
    /** ISERVER */
    ISERVER: "ISERVER"
};


/**
 * @enum ServerType
 * @memberOf SuperMap
 * @description ćśŤĺŠˇĺ™¨ç±»ĺž‹
 * @type {string}
 */
var ServerType = SuperMap.ServerType = {
    /** ISERVER */
    ISERVER: "ISERVER",
    /** IPORTAL */
    IPORTAL: "IPORTAL",
    /** ONLINE */
    ONLINE: "ONLINE"
};


/**
 * @enum GeometryType
 * @memberOf SuperMap
 * @description ĺ‡ ä˝•ĺŻąč±ˇćžšä¸ľ,ĺ®šäą‰äş†ä¸€çł»ĺ?—ĺ‡ ä˝•ĺŻąč±ˇç±»ĺž‹ă€‚
 * @type {string}
 */
var GeometryType = SuperMap.GeometryType = {
    /** LINE */
    LINE: "LINE",
    /** LINEM */
    LINEM: "LINEM",
    /** POINT */
    POINT: "POINT",
    /** REGION */
    REGION: "REGION",
    /** POINTEPS */
    POINTEPS: "POINTEPS",
    /** LINEEPS */
    LINEEPS: "LINEEPS",
    /** REGIONEPS */
    REGIONEPS: "REGIONEPS",
    /** ELLIPSE */
    ELLIPSE: "ELLIPSE",
    /** CIRCLE */
    CIRCLE: "CIRCLE",
    /** TEXT */
    TEXT: "TEXT",
    /** RECTANGLE */
    RECTANGLE: "RECTANGLE",
    /** UNKNOWN */
    UNKNOWN: "UNKNOWN",
    /** GEOCOMPOUND */
    GEOCOMPOUND:"GEOCOMPOUND"
};


/**
 * @enum QueryOption
 * @memberOf SuperMap
 * @description ćźĄčŻ˘ç»“ćžśç±»ĺž‹ćžšä¸ľ,ćŹŹčż°ćźĄčŻ˘ç»“ćžśčż”ĺ›žç±»ĺž‹ďĽŚĺŚ…ć‹¬ĺŹŞčż”ĺ›žĺ±žć€§ă€?ĺŹŞčż”ĺ›žĺ‡ ä˝•ĺ®žä˝“ä»ĄĺŹŠčż”ĺ›žĺ±žć€§ĺ’Śĺ‡ ä˝•ĺ®žä˝“ă€‚
 * @type {string}
 */
var QueryOption = SuperMap.QueryOption = {
    /** ĺ±žć€§ */
    ATTRIBUTE: "ATTRIBUTE",
    /** ĺ±žć€§ĺ’Śĺ‡ ä˝•ĺŻąč±ˇ */
    ATTRIBUTEANDGEOMETRY: "ATTRIBUTEANDGEOMETRY",
    /** ĺ‡ ä˝•ĺŻąč±ˇ */
    GEOMETRY: "GEOMETRY"
};


/**
 * @enum JoinType
 * @memberOf SuperMap
 * @description ĺ…łč?”ćźĄčŻ˘ć—¶çš„ĺ…łč?”ç±»ĺž‹ĺ¸¸é‡Źă€‚
 * čŻĄç±»ĺ®šäą‰äş†ä¸¤ä¸Şčˇ¨äą‹é—´çš„čżžćŽĄç±»ĺž‹ĺ¸¸é‡ŹďĽŚĺ†łĺ®šäş†ĺŻąä¸¤ä¸Şčˇ¨äą‹é—´čż›čˇŚčżžćŽĄćźĄčŻ˘ć—¶ďĽŚćźĄčŻ˘ç»“ćžśä¸­ĺľ—ĺ?°çš„č®°ĺ˝•çš„ć?…ĺ†µă€‚
 * @type {string}
 */
var JoinType = SuperMap.JoinType = {
    /** INNERJOIN */
    INNERJOIN: "INNERJOIN",
    /** LEFTJOIN */
    LEFTJOIN: "LEFTJOIN"
};



/**
 * @enum SpatialQueryMode
 * @memberOf SuperMap
 * @description  ç©şé—´ćźĄčŻ˘ć¨ˇĺĽŹćžšä¸ľă€‚čŻĄç±»ĺ®šäą‰äş†ç©şé—´ćźĄčŻ˘ć“Ťä˝ść¨ˇĺĽŹĺ¸¸é‡Źă€‚
 * @type {string}
 */
var SpatialQueryMode = SuperMap.SpatialQueryMode = {
    /** ĺŚ…ĺ?«ç©şé—´ćźĄčŻ˘ć¨ˇĺĽŹ */
    CONTAIN: "CONTAIN",
    /** äş¤ĺŹ‰ç©şé—´ćźĄčŻ˘ć¨ˇĺĽŹ */
    CROSS: "CROSS",
    /** ĺ?†ç¦»ç©şé—´ćźĄčŻ˘ć¨ˇĺĽŹ */
    DISJOINT: "DISJOINT",
    /** é‡Ťĺ??ç©şé—´ćźĄčŻ˘ć¨ˇĺĽŹ */
    IDENTITY: "IDENTITY",
    /** ç›¸äş¤ç©şé—´ćźĄčŻ˘ć¨ˇĺĽŹ */
    INTERSECT: "INTERSECT",
    /** ć— ç©şé—´ćźĄčŻ˘ */
    NONE: "NONE",
    /** ĺŹ ĺŠ ç©şé—´ćźĄčŻ˘ć¨ˇĺĽŹ */
    OVERLAP: "OVERLAP",
    /** é‚»ćŽĄç©şé—´ćźĄčŻ˘ć¨ˇĺĽŹ */
    TOUCH: "TOUCH",
    /** č˘«ĺŚ…ĺ?«ç©şé—´ćźĄčŻ˘ć¨ˇĺĽŹ */
    WITHIN: "WITHIN"
};

/**
 * @enum SpatialRelationType
 * @memberOf SuperMap
 * @description  ć•°ćŤ®é›†ĺŻąč±ˇé—´çš„ç©şé—´ĺ…łçł»ćžšä¸ľă€‚
 * čŻĄç±»ĺ®šäą‰äş†ć•°ćŤ®é›†ĺŻąč±ˇé—´çš„ç©şé—´ĺ…łçł»ç±»ĺž‹ĺ¸¸é‡Źă€‚
 * @type {string}
 */
var SpatialRelationType = SuperMap.SpatialRelationType = {
    /** ĺŚ…ĺ?«ĺ…łçł» */
    CONTAIN: "CONTAIN",
    /** ç›¸äş¤ĺ…łçł» */
    INTERSECT: "INTERSECT",
    /** č˘«ĺŚ…ĺ?«ĺ…łçł» */
    WITHIN: "WITHIN"
};


/**
 * @enum MeasureMode
 * @memberOf SuperMap
 * @type {string}
 * @description  é‡Źç®—ć¨ˇĺĽŹćžšä¸ľă€‚
 * čŻĄç±»ĺ®šäą‰äş†ä¸¤ç§Ťćµ‹é‡Źć¨ˇĺĽŹďĽšč·ťç¦»ćµ‹é‡Źĺ’Śéť˘ç§Żćµ‹é‡Źă€‚
 */
var MeasureMode = SuperMap.MeasureMode = {
    /** č·ťç¦»ćµ‹é‡Ź */
    DISTANCE: "DISTANCE",
    /** éť˘ç§Żćµ‹é‡Ź */
    AREA: "AREA"
};


/**
 * @enum Unit
 * @memberOf SuperMap
 * @description  č·ťç¦»ĺŤ•ä˝Ťćžšä¸ľă€‚
 * čŻĄç±»ĺ®šäą‰äş†ä¸€çł»ĺ?—č·ťç¦»ĺŤ•ä˝Ťç±»ĺž‹ă€‚
 * @type {string}
 */
var Unit = SuperMap.Unit = {
    /**  ç±ł */
    METER: "METER",
    /**  ĺŤ?ç±ł */
    KILOMETER: "KILOMETER",
    /**  č‹±é‡Ś */
    MILE: "MILE",
    /**  ç ? */
    YARD: "YARD",
    /**  ĺş¦ */
    DEGREE: "DEGREE",
    /**  ćŻ«ç±ł */
    MILLIMETER: "MILLIMETER",
    /**  ĺŽ?ç±ł */
    CENTIMETER: "CENTIMETER",
    /**  č‹±ĺŻ¸ */
    INCH: "INCH",
    /**  ĺ?†ç±ł */
    DECIMETER: "DECIMETER",
    /**  č‹±ĺ°ş */
    FOOT: "FOOT",
    /**  ç§’ */
    SECOND: "SECOND",
    /**  ĺ?† */
    MINUTE: "MINUTE",
    /**  ĺĽ§ĺş¦ */
    RADIAN: "RADIAN"
};


/**
 * @enum BufferRadiusUnit
 * @memberOf SuperMap
 * @description  çĽ“ĺ†˛ĺŚşč·ťç¦»ĺŤ•ä˝Ťćžšä¸ľă€‚
 * čŻĄç±»ĺ®šäą‰äş†ä¸€çł»ĺ?—çĽ“ĺ†˛č·ťç¦»ĺŤ•ä˝Ťç±»ĺž‹ă€‚
 * @type {string}
 */
var BufferRadiusUnit = SuperMap.BufferRadiusUnit = {
    /**  ĺŽ?ç±ł */
    CENTIMETER: "CENTIMETER",
    /**  ĺ?†ç±ł */
    DECIMETER: "DECIMETER",
    /**  č‹±ĺ°ş */
    FOOT: "FOOT",
    /**  č‹±ĺŻ¸ */
    INCH: "INCH",
    /**  ĺŤ?ç±ł */
    KILOMETER: "KILOMETER",
    /**  ç±ł */
    METER: "METER",
    /**  č‹±é‡Ś */
    MILE: "MILE",
    /**  ćŻ«ç±ł */
    MILLIMETER: "MILLIMETER",
    /**  ç ? */
    YARD: "YARD"
}


/**
 * @enum EngineType
 * @memberOf SuperMap
 * @description  ć•°ćŤ®ćş?ĺĽ•ć“Žç±»ĺž‹ćžšä¸ľă€‚
 * @type {string}
 */
var EngineType = SuperMap.EngineType = {
    /** ĺ˝±ĺ?ŹĺŹŞčŻ»ĺĽ•ć“Žç±»ĺž‹ďĽŚć–‡ä»¶ĺĽ•ć“ŽďĽŚé’?ĺŻąé€šç”¨ĺ˝±ĺ?Źć ĽĺĽŹĺ¦‚ BMPďĽŚJPGďĽŚTIFF ä»ĄĺŹŠč¶…ĺ›ľč‡Şĺ®šäą‰ĺ˝±ĺ?Źć ĽĺĽŹ SIT ç­‰ă€‚ */
    IMAGEPLUGINS: "IMAGEPLUGINS",
    /**  OGC ĺĽ•ć“Žç±»ĺž‹ďĽŚé’?ĺŻąäşŽ Web ć•°ćŤ®ćş?ďĽŚWeb ĺĽ•ć“ŽďĽŚç›®ĺ‰Ťć”ŻćŚ?çš„ç±»ĺž‹ćś‰ WMSďĽŚWFSďĽŚWCSă€‚ */
    OGC: "OGC",
    /**  Oracle ĺĽ•ć“Žç±»ĺž‹ďĽŚé’?ĺŻą Oracle ć•°ćŤ®ćş?ďĽŚć•°ćŤ®ĺş“ĺĽ•ć“Žă€‚ */
    ORACLEPLUS: "ORACLEPLUS",
    /**  SDB ĺĽ•ć“Žç±»ĺž‹ďĽŚć–‡ä»¶ĺĽ•ć“ŽďĽŚĺŤł SDB ć•°ćŤ®ćş?ă€‚ */
    SDBPLUS: "SDBPLUS",
    /**  SQL Server ĺĽ•ć“Žç±»ĺž‹ďĽŚé’?ĺŻą SQL Server ć•°ćŤ®ćş?ďĽŚć•°ćŤ®ĺş“ĺĽ•ć“Ž */
    SQLPLUS: "SQLPLUS",
    /**  UDB ĺĽ•ć“Žç±»ĺž‹ďĽŚć–‡ä»¶ĺĽ•ć“Žă€‚ */
    UDB: "UDB"
};


/**
 * @enum ThemeGraphTextFormat
 * @memberOf SuperMap
 * @description  ç»źč®ˇä¸“é˘?ĺ›ľć–‡ćś¬ć?ľç¤şć ĽĺĽŹćžšä¸ľă€‚
 * @type {string}
 */
var ThemeGraphTextFormat = SuperMap.ThemeGraphTextFormat = {
    /**  ć ‡é˘?ă€‚ä»Ąĺ?„ĺ­?éˇąçš„ć ‡é˘?ćťĄčż›čˇŚć ‡ćł¨ă€‚ */
    CAPTION: "CAPTION",
    /**  ć ‡é˘? + ç™ľĺ?†ć•°ă€‚ä»Ąĺ?„ĺ­?éˇąçš„ć ‡é˘?ĺ’Ść‰€ĺŤ çš„ç™ľĺ?†ćŻ”ćťĄčż›čˇŚć ‡ćł¨ă€‚ */
    CAPTION_PERCENT: "CAPTION_PERCENT",
    /**  ć ‡é˘? + ĺ®žé™…ć•°ĺ€Ľă€‚ä»Ąĺ?„ĺ­?éˇąçš„ć ‡é˘?ĺ’Śçśźĺ®žć•°ĺ€ĽćťĄčż›čˇŚć ‡ćł¨ă€‚ */
    CAPTION_VALUE: "CAPTION_VALUE",
    /**  ç™ľĺ?†ć•°ă€‚ä»Ąĺ?„ĺ­?éˇąć‰€ĺŤ çš„ç™ľĺ?†ćŻ”ćťĄčż›čˇŚć ‡ćł¨ă€‚ */
    PERCENT: "PERCENT",
    /**  ĺ®žé™…ć•°ĺ€Ľă€‚ä»Ąĺ?„ĺ­?éˇąçš„çśźĺ®žć•°ĺ€ĽćťĄčż›čˇŚć ‡ćł¨ă€‚ */
    VALUE: "VALUE"

};


/**
 * @enum ThemeGraphType
 * @memberOf SuperMap
 * @description  ç»źč®ˇä¸“é˘?ĺ›ľç±»ĺž‹ćžšä¸ľă€‚
 * @type {string}
 */
var ThemeGraphType = SuperMap.ThemeGraphType = {
    /**  éť˘ç§Żĺ›ľă€‚ */
    AREA: "AREA",
    /**  ćź±çŠ¶ĺ›ľă€‚ */
    BAR: "BAR",
    /**  ä¸‰ç»´ćź±çŠ¶ĺ›ľă€‚ */
    BAR3D: "BAR3D",
    /**  ćŠ?çşżĺ›ľă€‚ */
    LINE: "LINE",
    /**  éĄĽĺ›ľă€‚ */
    PIE: "PIE",
    /**  ä¸‰ç»´éĄĽĺ›ľă€‚ */
    PIE3D: "PIE3D",
    /**  ç‚ąçŠ¶ĺ›ľă€‚ */
    POINT: "POINT",
    /**  çŽŻçŠ¶ĺ›ľă€‚ */
    RING: "RING",
    /**  çŽ«ç‘°ĺ›ľă€‚ */
    ROSE: "ROSE",
    /**  ä¸‰ç»´çŽ«ç‘°ĺ›ľă€‚ */
    ROSE3D: "ROSE3D",
    /**  ĺ †ĺŹ ćź±çŠ¶ĺ›ľă€‚ */
    STACK_BAR: "STACK_BAR",
    /**  ä¸‰ç»´ĺ †ĺŹ ćź±çŠ¶ĺ›ľă€‚ */
    STACK_BAR3D: "STACK_BAR3D",
    /**  é?¶ć˘Żĺ›ľă€‚ */
    STEP: "STEP"
};


/**
 * @enum GraphAxesTextDisplayMode
 * @memberOf SuperMap
 * @description  ç»źč®ˇä¸“é˘?ĺ›ľĺť?ć ‡č˝´ć–‡ćś¬ć?ľç¤şć¨ˇĺĽŹă€‚
 * @type {string}
 */
var GraphAxesTextDisplayMode = SuperMap.GraphAxesTextDisplayMode = {
    /**  ć?ľç¤şĺ…¨é?¨ć–‡ćś¬ă€‚ */
    ALL: "ALL",
    /**  ä¸Ťć?ľç¤şă€‚ */
    NONE: "NONE",
    /**  ć?ľç¤şYč˝´çš„ć–‡ćś¬ă€‚ */
    YAXES: "YAXES"
};


/**
 * @enum GraduatedMode
 * @memberOf SuperMap
 * @description  ä¸“é˘?ĺ›ľĺ?†çş§ć¨ˇĺĽŹćžšä¸ľă€‚
 *
 * @type {string}
 */
var GraduatedMode = SuperMap.GraduatedMode = {
    /**  ĺ¸¸é‡Źĺ?†çş§ć¨ˇĺĽŹă€‚ */
    CONSTANT: "CONSTANT",
    /** ĺŻąć•°ĺ?†çş§ć¨ˇĺĽŹă€‚ */
    LOGARITHM: "LOGARITHM",
    /**  ĺąłć–ąć ąĺ?†çş§ć¨ˇĺĽŹă€‚ */
    SQUAREROOT: "SQUAREROOT"
};


/**
 * @enum RangeMode
 * @memberOf SuperMap
 * @description  čŚ?ĺ›´ĺ?†ć®µä¸“é˘?ĺ›ľĺ?†ć®µć–ąĺĽŹćžšä¸ľă€‚
 * @type {string}
 */
var RangeMode = SuperMap.RangeMode = {
    /**  č‡Şĺ®šäą‰ĺ?†ć®µćł•ă€‚ */
    CUSTOMINTERVAL: "CUSTOMINTERVAL",
    /**  ç­‰č·ťç¦»ĺ?†ć®µćł•ă€‚ */
    EQUALINTERVAL: "EQUALINTERVAL",
    /**  ĺŻąć•°ĺ?†ć®µćł•ă€‚ */
    LOGARITHM: "LOGARITHM",
    /**  ç­‰č®ˇć•°ĺ?†ć®µćł•ă€‚ */
    QUANTILE: "QUANTILE",
    /**  ĺąłć–ąć ąĺ?†ć®µćł•ă€‚ */
    SQUAREROOT: "SQUAREROOT",
    /**  ć ‡ĺ‡†ĺ·®ĺ?†ć®µćł•ă€‚ */
    STDDEVIATION: "STDDEVIATION"
};


/**
 * @enum ThemeType
 * @memberOf SuperMap
 * @description  ä¸“é˘?ĺ›ľç±»ĺž‹ćžšä¸ľă€‚
 * @type {string}
 */
var ThemeType = SuperMap.ThemeType = {
    /** ç‚ąĺŻ†ĺş¦ä¸“é˘?ĺ›ľă€‚ */
    DOTDENSITY: "DOTDENSITY",
    /** ç­‰çş§ç¬¦ĺŹ·ä¸“é˘?ĺ›ľă€‚ */
    GRADUATEDSYMBOL: "GRADUATEDSYMBOL",
    /** ç»źč®ˇä¸“é˘?ĺ›ľă€‚ */
    GRAPH: "GRAPH",
    /** ć ‡ç­ľä¸“é˘?ĺ›ľă€‚ */
    LABEL: "LABEL",
    /** ĺ?†ć®µä¸“é˘?ĺ›ľă€‚ */
    RANGE: "RANGE",
    /** ĺŤ?ĺ€Ľä¸“é˘?ĺ›ľă€‚ */
    UNIQUE: "UNIQUE"
};


/**
 * @enum ColorGradientType
 * @memberOf SuperMap
 * @description  ć¸?ĺŹ?é˘śč‰˛ćžšä¸ľă€‚
 * @type {string}
 */
var ColorGradientType = SuperMap.ColorGradientType = {
    /** é»‘ç™˝ć¸?ĺŹ?č‰˛ă€‚ */
    BLACK_WHITE: "BLACKWHITE",
    /** č“ťé»‘ć¸?ĺŹ?č‰˛ă€‚ */
    BLUE_BLACK: "BLUEBLACK",
    /** č“ťçş˘ć¸?ĺŹ?č‰˛ă€‚ */
    BLUE_RED: "BLUERED",
    /** č“ťç™˝ć¸?ĺŹ?č‰˛ă€‚ */
    BLUE_WHITE: "BLUEWHITE",
    /** éť’é»‘ć¸?ĺŹ?č‰˛ă€‚ */
    CYAN_BLACK: "CYANBLACK",
    /** éť’č“ťć¸?ĺŹ?č‰˛ă€‚ */
    CYAN_BLUE: "CYANBLUE",
    /** éť’ç»żć¸?ĺŹ?č‰˛ă€‚ */
    CYAN_GREEN: "CYANGREEN",
    /** éť’ç™˝ć¸?ĺŹ?č‰˛ă€‚ */
    CYAN_WHITE: "CYANWHITE",
    /** ç»żé»‘ć¸?ĺŹ?č‰˛ă€‚ */
    GREEN_BLACK: "GREENBLACK",
    /** ç»żč“ťć¸?ĺŹ?č‰˛ă€‚ */
    GREEN_BLUE: "GREENBLUE",
    /** ç»żć©™ç´«ć¸?ĺŹ?č‰˛ă€‚ */
    GREEN_ORANGE_VIOLET: "GREENORANGEVIOLET",
    /** ç»żçş˘ć¸?ĺŹ?č‰˛ă€‚ */
    GREEN_RED: "GREENRED",
    /** č“ťçş˘ć¸?ĺŹ?č‰˛ă€‚ */
    GREEN_WHITE: "GREENWHITE",
    /** ç˛‰é»‘ć¸?ĺŹ?č‰˛ă€‚ */
    PINK_BLACK: "PINKBLACK",
    /** ç˛‰č“ťć¸?ĺŹ?č‰˛ă€‚ */
    PINK_BLUE: "PINKBLUE",
    /** ç˛‰çş˘ć¸?ĺŹ?č‰˛ă€‚ */
    PINK_RED: "PINKRED",
    /** ç˛‰ç™˝ć¸?ĺŹ?č‰˛ă€‚ */
    PINK_WHITE: "PINKWHITE",
    /** ĺ˝©č™ąč‰˛ă€‚ */
    RAIN_BOW: "RAINBOW",
    /** çş˘é»‘ć¸?ĺŹ?č‰˛ă€‚ */
    RED_BLACK: "REDBLACK",
    /** çş˘ç™˝ć¸?ĺŹ?č‰˛ă€‚ */
    RED_WHITE: "REDWHITE",
    /** ĺ…‰č°±ć¸?ĺŹ?ă€‚ */
    SPECTRUM: "SPECTRUM",
    /** ĺś°ĺ˝˘ć¸?ĺŹ?,ç”¨äşŽä¸‰ç»´ć?ľç¤şć•?ćžśčľ?ĺĄ˝ă€‚ */
    TERRAIN: "TERRAIN",
    /** é»„é»‘ć¸?ĺŹ?č‰˛ă€‚ */
    YELLOW_BLACK: "YELLOWBLACK",
    /** é»„č“ťć¸?ĺŹ?č‰˛ă€‚ */
    YELLOW_BLUE: "YELLOWBLUE",
    /** é»„ç»żć¸?ĺŹ?č‰˛ă€‚ */
    YELLOW_GREEN: "YELLOWGREEN",
    /** é»„çş˘ć¸?ĺŹ?č‰˛ă€‚ */
    YELLOW_RED: "YELLOWRED",
    /** é»„ç™˝ć¸?ĺŹ?č‰˛ă€‚ */
    YELLOW_WHITE: "YELLOWWHITE"
};


/**
 * @enum TextAlignment
 * @memberOf SuperMap
 * @description  ć–‡ćś¬ĺŻąé˝?ćžšä¸ľă€‚
 * @type {string}
 */
var TextAlignment = SuperMap.TextAlignment = {
    /** ĺ·¦ä¸Šč§’ĺŻąé˝?ă€‚ */
    TOPLEFT: "TOPLEFT",
    /** éˇ¶é?¨ĺ±…ä¸­ĺŻąé˝?ă€‚ */
    TOPCENTER: "TOPCENTER",
    /** ĺŹłä¸Šč§’ĺŻąé˝?ă€‚ */
    TOPRIGHT: "TOPRIGHT",
    /** ĺźşĺ‡†çşżĺ·¦ĺŻąé˝?ă€‚ */
    BASELINELEFT: "BASELINELEFT",
    /** ĺźşĺ‡†çşżĺ±…ä¸­ĺŻąé˝?ă€‚ */
    BASELINECENTER: "BASELINECENTER",
    /** ĺźşĺ‡†çşżĺŹłĺŻąé˝?ă€‚ */
    BASELINERIGHT: "BASELINERIGHT",
    /** ĺ·¦ä¸‹č§’ĺŻąé˝?ă€‚ */
    BOTTOMLEFT: "BOTTOMLEFT",
    /** ĺş•é?¨ĺ±…ä¸­ĺŻąé˝?ă€‚ */
    BOTTOMCENTER: "BOTTOMCENTER",
    /** ĺŹłä¸‹č§’ĺŻąé˝?ă€‚ */
    BOTTOMRIGHT: "BOTTOMRIGHT",
    /** ĺ·¦ä¸­ĺŻąé˝?ă€‚ */
    MIDDLELEFT: "MIDDLELEFT",
    /** ä¸­ĺż?ĺŻąé˝?ă€‚ */
    MIDDLECENTER: "MIDDLECENTER",
    /** ĺŹłä¸­ĺŻąé˝?ă€‚ */
    MIDDLERIGHT: "MIDDLERIGHT"
};

/**
 * @enum FillGradientMode
 * @memberOf SuperMap
 * @description  ć¸?ĺŹ?ĺˇ«ĺ……éŁŽć Ľçš„ć¸?ĺŹ?ç±»ĺž‹ćžšä¸ľă€‚
 * @type {string}
 */
var FillGradientMode = SuperMap.FillGradientMode = {
    /** ć— ć¸?ĺŹ?ă€‚ */
    NONE: "NONE",
    /** çşżć€§ć¸?ĺŹ?ĺˇ«ĺ……ă€‚ */
    LINEAR: "LINEAR",
    /** čľ?ĺ°„ć¸?ĺŹ?ĺˇ«ĺ……ă€‚ */
    RADIAL: "RADIAL",
    /** ĺś†é”Ąć¸?ĺŹ?ĺˇ«ĺ……ă€‚ */
    CONICAL: "CONICAL",
    /** ĺ››č§’ć¸?ĺŹ?ĺˇ«ĺ……ă€‚ */
    SQUARE: "SQUARE"
};


/**
 * @enum AlongLineDirection
 * @memberOf SuperMap
 * @description  ć ‡ç­ľć˛żçşżć ‡ćł¨ć–ąĺ?‘ćžšä¸ľă€‚
 * @type {string}
 */
var AlongLineDirection = SuperMap.AlongLineDirection = {
    /** ć˛żçşżçš„ćł•çşżć–ąĺ?‘ć”ľç˝®ć ‡ç­ľă€‚ */
    NORMAL: "ALONG_LINE_NORMAL",
    /** ä»Žä¸‹ĺ?°ä¸ŠďĽŚä»Žĺ·¦ĺ?°ĺŹłć”ľç˝®ă€‚ */
    LB_TO_RT: "LEFT_BOTTOM_TO_RIGHT_TOP",
    /** ä»Žä¸Šĺ?°ä¸‹ďĽŚä»Žĺ·¦ĺ?°ĺŹłć”ľç˝®ă€‚ */
    LT_TO_RB: "LEFT_TOP_TO_RIGHT_BOTTOM",
    /** ä»Žä¸‹ĺ?°ä¸ŠďĽŚä»ŽĺŹłĺ?°ĺ·¦ć”ľç˝®ă€‚ */
    RB_TO_LT: "RIGHT_BOTTOM_TO_LEFT_TOP",
    /** ä»Žä¸Šĺ?°ä¸‹ďĽŚä»ŽĺŹłĺ?°ĺ·¦ć”ľç˝®ă€‚ */
    RT_TO_LB: "RIGHT_TOP_TO_LEFT_BOTTOM"
};


/**
 * @enum LabelBackShape
 * @memberOf SuperMap
 * @description  ć ‡ç­ľä¸“é˘?ĺ›ľä¸­ć ‡ç­ľč?Ść™Żçš„ĺ˝˘çŠ¶ćžšä¸ľă€‚
 * @type {string}
 */
var LabelBackShape = SuperMap.LabelBackShape = {
    /** čŹ±ĺ˝˘č?Ść™ŻďĽŚĺŤłć ‡ç­ľč?Ść™Żçš„ĺ˝˘çŠ¶ä¸şčŹ±ĺ˝˘ă€‚ */
    DIAMOND: "DIAMOND",
    /** ć¤­ĺś†ĺ˝˘č?Ść™ŻďĽŚĺŤłć ‡ç­ľč?Ść™Żçš„čˇŚçŠ¶ä¸şć¤­ĺś†ĺ˝˘ă€‚ */
    ELLIPSE: "ELLIPSE",
    /** ç¬¦ĺŹ·č?Ść™ŻďĽŚĺŤłć ‡ç­ľč?Ść™Żçš„ĺ˝˘çŠ¶ä¸şč®ľĺ®šçš„ç¬¦ĺŹ·ă€‚ */
    MARKER: "MARKER",
    /** ç©şč?Ść™ŻďĽŚĺŤłä¸Ťä˝żç”¨ä»»ä˝•ĺ˝˘çŠ¶ä˝śä¸şć ‡ç­ľçš„č?Ść™Żă€‚ */
    NONE: "NONE",
    /** çź©ĺ˝˘č?Ść™ŻďĽŚĺŤłć ‡ç­ľč?Ść™Żçš„ĺ˝˘çŠ¶ä¸şçź©ĺ˝˘ă€‚ */
    RECT: "RECT",
    /** ĺś†č§’çź©ĺ˝˘č?Ść™ŻďĽŚĺŤłć ‡ç­ľč?Ść™Żçš„ĺ˝˘çŠ¶ä¸şĺś†č§’çź©ĺ˝˘ă€‚ */
    ROUNDRECT: "ROUNDRECT",
    /** ä¸‰č§’ĺ˝˘č?Ść™ŻďĽŚĺŤłć ‡ç­ľč?Ść™Żçš„ĺ˝˘çŠ¶ä¸şä¸‰č§’ĺ˝˘ă€‚ */
    TRIANGLE: "TRIANGLE"
};


/**
 * @enum LabelOverLengthMode
 * @memberOf SuperMap
 * @description  ć ‡ç­ľä¸“é˘?ĺ›ľä¸­č¶…é•żć ‡ç­ľçš„ĺ¤„ç?†ć¨ˇĺĽŹćžšä¸ľă€‚
 * @type {string}
 */
var LabelOverLengthMode = SuperMap.LabelOverLengthMode = {
    /** ćŤ˘čˇŚć?ľç¤şă€‚ */
    NEWLINE: "NEWLINE",
    /** ĺŻąč¶…é•żć ‡ç­ľä¸Ťčż›čˇŚĺ¤„ç?†ă€‚ */
    NONE: "NONE",
    /** çś?ç•Ąč¶…ĺ‡şé?¨ĺ?†ă€‚ */
    OMIT: "OMIT"
};


/**
 * @enum DirectionType
 * @memberOf SuperMap
 * @description  ç˝‘ç»śĺ?†ćž?ä¸­ć–ąĺ?‘ćžšä¸ľă€‚
 * ĺś¨čˇŚé©¶ĺĽ•ĺŻĽĺ­?éˇąä¸­ä˝żç”¨ă€‚
 * @type {string}
 */
var DirectionType = SuperMap.DirectionType = {
    /** ä¸śă€‚ */
    EAST: "EAST",
    /** ć— ć–ąĺ?‘ă€‚ */
    NONE: "NONE",
    /** ĺŚ—ă€‚ */
    NORTH: "NORTH",
    /** ĺŤ—ă€‚ */
    SOURTH: "SOURTH",
    /** čĄżă€‚ */
    WEST: "WEST"
};



/**
 * @enum SideType
 * @memberOf SuperMap
 * @description  čˇŚé©¶ä˝Ťç˝®ćžšä¸ľă€‚
 * čˇ¨ç¤şĺś¨čˇŚé©¶ĺś¨č·Żçš„ĺ·¦čľąă€?ĺŹłčľąć?–č€…č·Żä¸Šçš„ćžšä¸ľ,čŻĄç±»ç”¨ĺś¨čˇŚé©¶ĺŻĽĺĽ•ĺ­?éˇąç±»ä¸­ă€‚
 * @type {string}
 */
var SideType = SuperMap.SideType = {
    /** č·Żçš„ĺ·¦äľ§ă€‚ */
    LEFT: "LEFT",
    /** ĺś¨č·Żä¸ŠďĽ?ĺŤłč·Żçš„ä¸­é—´ďĽ‰ă€‚ */
    MIDDLE: "MIDDLE",
    /** ć— ć•?ĺ€Ľă€‚ */
    NONE: "NONE",
    /** č·Żçš„ĺŹłäľ§ă€‚ */
    RIGHT: "RIGHT"
};


/**
 * @enum SupplyCenterType
 * @memberOf SuperMap
 * @description  čµ„ćş?äľ›ç»™ä¸­ĺż?ç±»ĺž‹ćžšä¸ľă€‚
 * čŻĄćžšä¸ľĺ®šäą‰äş†ç˝‘ç»śĺ?†ćž?ä¸­čµ„ćş?ä¸­ĺż?ç‚ąçš„ç±»ĺž‹ďĽŚä¸»č¦?ç”¨äşŽčµ„ćş?ĺ?†é…Ťĺ’Śé€‰ĺť€ĺ?†ĺŚşă€‚
 * čµ„ćş?äľ›ç»™ä¸­ĺż?ç‚ąçš„ç±»ĺž‹ĺŚ…ć‹¬éťžä¸­ĺż?ďĽŚĺ›şĺ®šä¸­ĺż?ĺ’ŚĺŹŻé€‰ä¸­ĺż?ă€‚ĺ›şĺ®šä¸­ĺż?ç”¨äşŽčµ„ćş?ĺ?†é…Ťĺ?†ćž?ďĽ› ĺ›şĺ®šä¸­ĺż?ĺ’ŚĺŹŻé€‰ä¸­ĺż?ç”¨äşŽé€‰ĺť€ĺ?†ćž?ďĽ›éťžä¸­ĺż?ĺś¨ä¸¤ç§Ťç˝‘ç»śĺ?†ćž?ć—¶é?˝ä¸Ťäş?č€?č™‘ă€‚
 * @type {string}
 */
var SupplyCenterType = SuperMap.SupplyCenterType = {
    /** ĺ›şĺ®šä¸­ĺż?ç‚ąă€‚ */
    FIXEDCENTER: "FIXEDCENTER",
    /** éťžä¸­ĺż?ç‚ąă€‚ */
    NULL: "NULL",
    /** ĺŹŻé€‰ä¸­ĺż?ç‚ąă€‚ */
    OPTIONALCENTER: "OPTIONALCENTER"
};


/**
 * @enum TurnType
 * @memberOf SuperMap
 * @description  č˝¬ĺĽŻć–ąĺ?‘ćžšä¸ľă€‚
 * ç”¨ĺś¨čˇŚé©¶ĺĽ•ĺŻĽĺ­?éˇąç±»ä¸­ďĽŚčˇ¨ç¤şč˝¬ĺĽŻçš„ć–ąĺ?‘ă€‚
 * @type {string}
 */
var TurnType = SuperMap.TurnType = {
    /** ĺ?‘ĺ‰Ťç›´čˇŚă€‚ */
    AHEAD: "AHEAD",
    /** ćŽ‰ĺ¤´ă€‚ */
    BACK: "BACK",
    /** ç»?ç‚ąďĽŚä¸Ťć‹?ĺĽŻă€‚ */
    END: "END",
    /** ĺ·¦č˝¬ĺĽŻă€‚ */
    LEFT: "LEFT",
    /** ć— ć•?ĺ€Ľă€‚ */
    NONE: "NONE",
    /** ĺŹłč˝¬ĺĽŻă€‚ */
    RIGHT: "RIGHT"
};


/**
 * @enum BufferEndType
 * @memberOf SuperMap
 * @description  çĽ“ĺ†˛ĺŚşĺ?†ćž?BufferEndç±»ĺž‹ă€‚
 * @type {string}
 */
var BufferEndType = SuperMap.BufferEndType = {
    /** FLAT */
    FLAT: "FLAT",
    /** ROUND */
    ROUND: "ROUND"
};

/**
 * @enum OverlayOperationType
 * @memberOf SuperMap
 * @description  ĺŹ ĺŠ ĺ?†ćž?ç±»ĺž‹ćžšä¸ľă€‚
 * @type {string}
 */
var OverlayOperationType = SuperMap.OverlayOperationType = {
    /** ć“Ťä˝ść•°ćŤ®é›†ďĽ?ĺ‡ ä˝•ĺŻąč±ˇďĽ‰čŁ?ĺ‰Şč˘«ć“Ťä˝ść•°ćŤ®é›†ďĽ?ĺ‡ ä˝•ĺŻąč±ˇďĽ‰ă€‚ */
    CLIP: "CLIP",
    /** ĺś¨č˘«ć“Ťä˝ść•°ćŤ®é›†ďĽ?ĺ‡ ä˝•ĺŻąč±ˇďĽ‰ä¸Šć“¦é™¤ćŽ‰ä¸Žć“Ťä˝ść•°ćŤ®é›†ďĽ?ĺ‡ ä˝•ĺŻąč±ˇďĽ‰ç›¸é‡Ťĺ??çš„é?¨ĺ?†ă€‚ */
    ERASE: "ERASE",
    /**ĺŻąč˘«ć“Ťä˝ść•°ćŤ®é›†ďĽ?ĺ‡ ä˝•ĺŻąč±ˇďĽ‰čż›čˇŚĺ?Śä¸€ć“Ťä˝śďĽŚĺŤłć“Ťä˝ść‰§čˇŚĺ?ŽďĽŚč˘«ć“Ťä˝ść•°ćŤ®é›†ďĽ?ĺ‡ ä˝•ĺŻąč±ˇďĽ‰ĺŚ…ĺ?«ćťĄč‡Şć“Ťä˝ść•°ćŤ®é›†ďĽ?ĺ‡ ä˝•ĺŻąč±ˇďĽ‰çš„ĺ‡ ä˝•ĺ˝˘çŠ¶ă€‚ */
    IDENTITY: "IDENTITY",
    /** ĺŻąä¸¤ä¸Şć•°ćŤ®é›†ďĽ?ĺ‡ ä˝•ĺŻąč±ˇďĽ‰ć±‚äş¤ďĽŚčż”ĺ›žä¸¤ä¸Şć•°ćŤ®é›†ďĽ?ĺ‡ ä˝•ĺŻąč±ˇďĽ‰çš„äş¤é›†ă€‚ */
    INTERSECT: "INTERSECT",
    /** ĺŻąä¸¤ä¸Şéť˘ć•°ćŤ®é›†ďĽ?ĺ‡ ä˝•ĺŻąč±ˇďĽ‰čż›čˇŚĺ??ĺą¶ć“Ťä˝śă€‚ */
    UNION: "UNION",
    /** ĺŻąä¸¤ä¸Şéť˘ć•°ćŤ®é›†ďĽ?ĺ‡ ä˝•ĺŻąč±ˇďĽ‰čż›čˇŚć›´ć–°ć“Ťä˝śă€‚ */
    UPDATE: "UPDATE",
    /** ĺŻąä¸¤ä¸Şéť˘ć•°ćŤ®é›†ďĽ?ĺ‡ ä˝•ĺŻąč±ˇďĽ‰čż›čˇŚĺŻąç§°ĺ·®ć“Ťä˝śă€‚ */
    XOR: "XOR"
};


/**
 * @enum OutputType
 * @memberOf SuperMap
 * @description  ĺ?†ĺ¸?ĺĽŹĺ?†ćž?čľ“ĺ‡şç±»ĺž‹ćžšä¸ľă€‚
 * @type {string}
 */
var OutputType = SuperMap.OutputType = {
    /** INDEXEDHDFS */
    INDEXEDHDFS: "INDEXEDHDFS",
    /** UDB */
    UDB: "UDB",
    /** MONGODB */
    MONGODB: "MONGODB",
    /** PG */
    PG: "PG"
};


/**
 * @enum SmoothMethod
 * @memberOf SuperMap
 * @description  ĺ…‰ć»‘ć–ąćł•ćžšä¸ľă€‚
 * ç”¨äşŽä»ŽGrid ć?–DEMć•°ćŤ®ç”źć??ç­‰ĺ€Ľçşżć?–ç­‰ĺ€Ľéť˘ć—¶ĺŻąç­‰ĺ€Ľçşżć?–č€…ç­‰ĺ€Ľéť˘çš„čľąç•Śçşżčż›čˇŚĺąłć»‘ĺ¤„ç?†çš„ć–ąćł•ă€‚
 * @type {string}
 */
var SmoothMethod = SuperMap.SmoothMethod = {
    /** B ć ·ćťˇćł•ă€‚ */
    BSPLINE: "BSPLINE",
    /** çŁ¨č§’ćł•ă€‚ */
    POLISH: "POLISH"
};

/**
 * @enum SurfaceAnalystMethod
 * @memberOf SuperMap
 * @description  čˇ¨éť˘ĺ?†ćž?ć–ąćł•ćžšä¸ľă€‚
 * é€ščż‡ĺŻąć•°ćŤ®čż›čˇŚčˇ¨éť˘ĺ?†ćž?ďĽŚč?˝ĺ¤źćŚ–ćŽ?ĺŽźĺ§‹ć•°ćŤ®ć‰€ĺŚ…ĺ?«çš„äżˇć?ŻďĽŚä˝żćź?äş›ç»†čŠ‚ć?Žć?ľĺŚ–ďĽŚć?“äşŽĺ?†ćž?ă€‚
 * @type {string}
 */
var SurfaceAnalystMethod = SuperMap.SurfaceAnalystMethod = {
    /** ç­‰ĺ€ĽçşżćŹ?ĺŹ–ă€‚ */
    ISOLINE: "ISOLINE",
    /** ç­‰ĺ€Ľéť˘ćŹ?ĺŹ–ă€‚ */
    ISOREGION: "ISOREGION"
};

/**
 * @enum DataReturnMode
 * @memberOf SuperMap
 * @description  ć•°ćŤ®čż”ĺ›žć¨ˇĺĽŹćžšä¸ľă€‚
 * čŻĄćžšä¸ľç”¨äşŽćŚ‡ĺ®šç©şé—´ĺ?†ćž?čż”ĺ›žç»“ćžść¨ˇĺĽŹ,ĺŚ…ĺ?«čż”ĺ›žć•°ćŤ®é›†ć ‡čŻ†ĺ’Śč®°ĺ˝•é›†ă€?ĺŹŞčż”ĺ›žć•°ćŤ®é›†ć ‡čŻ†(ć•°ćŤ®é›†ĺ?Ťç§°@ć•°ćŤ®ćş?ĺ?Ťç§°)ĺŹŠĺŹŞčż”ĺ›žč®°ĺ˝•é›†ä¸‰ç§Ťć¨ˇĺĽŹă€‚
 * @type {string}
 */
var DataReturnMode = SuperMap.DataReturnMode = {
    /** čż”ĺ›žç»“ćžść•°ćŤ®é›†ć ‡čŻ†(ć•°ćŤ®é›†ĺ?Ťç§°@ć•°ćŤ®ćş?ĺ?Ťç§°)ĺ’Śč®°ĺ˝•é›†ďĽ?RecordSetďĽ‰ă€‚ */
    DATASET_AND_RECORDSET: "DATASET_AND_RECORDSET",
    /** ĺŹŞčż”ĺ›žć•°ćŤ®é›†ć ‡čŻ†ďĽ?ć•°ćŤ®é›†ĺ?Ťç§°@ć•°ćŤ®ćş?ĺ?Ťç§°ďĽ‰ă€‚ */
    DATASET_ONLY: "DATASET_ONLY",
    /** ĺŹŞčż”ĺ›žč®°ĺ˝•é›†ďĽ?RecordSetďĽ‰ă€‚ */
    RECORDSET_ONLY: "RECORDSET_ONLY"
};

/**
 * @enum EditType
 * @memberOf SuperMap
 * @description  č¦?ç´ é›†ć›´ć–°ć¨ˇĺĽŹćžšä¸ľă€‚
 * čŻĄćžšä¸ľç”¨äşŽćŚ‡ĺ®šć•°ćŤ®ćśŤĺŠˇä¸­č¦?ç´ é›†ć›´ć–°ć¨ˇĺĽŹ,ĺŚ…ĺ?«ć·»ĺŠ č¦?ç´ é›†ă€?ć›´ć–°č¦?ç´ é›†ĺ’Śĺ? é™¤č¦?ç´ é›†ă€‚
 * @type {string}
 */
var EditType = SuperMap.EditType = {
    /** ĺ˘žĺŠ ć“Ťä˝śă€‚ */
    ADD: "add",
    /** äż®ć”ąć“Ťä˝śă€‚ */
    UPDATE: "update",
    /** ĺ? é™¤ć“Ťä˝śă€‚ */
    DELETE: "delete"
};


/**
 * @enum TransferTactic
 * @memberOf SuperMap
 * @description  ĺ…¬äş¤ćŤ˘äą?ç­–ç•Ąćžšä¸ľă€‚
 * čŻĄćžšä¸ľç”¨äşŽćŚ‡ĺ®šĺ…¬äş¤ćśŤĺŠˇä¸­č¦?ç´ é›†ć›´ć–°ć¨ˇĺĽŹ,ĺŚ…ĺ?«ć·»ĺŠ č¦?ç´ é›†ă€?ć›´ć–°č¦?ç´ é›†ĺ’Śĺ? é™¤č¦?ç´ é›†ă€‚
 * @type {string}
 */
var TransferTactic = SuperMap.TransferTactic = {
    /** ć—¶é—´çź­ă€‚ */
    LESS_TIME: "LESS_TIME",
    /** ĺ°‘ćŤ˘äą?ă€‚ */
    LESS_TRANSFER: "LESS_TRANSFER",
    /** ĺ°‘ć­ĄčˇŚă€‚ */
    LESS_WALK: "LESS_WALK",
    /** č·ťç¦»ćś€çź­ă€‚ */
    MIN_DISTANCE: "MIN_DISTANCE"
};


/**
 * @enum TransferPreference
 * @memberOf SuperMap
 * @description  ĺ…¬äş¤ćŤ˘äą?ç­–ç•Ąćžšä¸ľă€‚
 * čŻĄćžšä¸ľç”¨äşŽćŚ‡ĺ®šäş¤é€šćŤ˘äą?ćśŤĺŠˇä¸­č®ľç˝®ĺś°é“?äĽ?ĺ…?ă€?ĺ…¬äş¤äĽ?ĺ…?ă€?ä¸Ťäą?ĺś°é“?ă€?ć— ĺ?ŹĺĄ˝ç­‰ĺ?ŹĺĄ˝č®ľç˝®ă€‚
 * @type {string}
 */
var TransferPreference = SuperMap.TransferPreference = {
    /** ĺ…¬äş¤ć±˝č˝¦äĽ?ĺ…?ă€‚ */
    BUS: "BUS",
    /** ĺś°é“?äĽ?ĺ…?ă€‚ */
    SUBWAY: "SUBWAY",
    /** ä¸Ťäą?ĺť?ĺś°é“?ă€‚ */
    NO_SUBWAY: "NO_SUBWAY",
    /** ć— äą?č˝¦ĺ?ŹĺĄ˝ă€‚ */
    NONE: "NONE"
};


/**
 * @enum GridType
 * @memberOf SuperMap
 * @description  ĺś°ĺ›ľč?Ść™Żć Ľç˝‘ç±»ĺž‹ćžšä¸ľă€‚
 * @type {string}
 */
var GridType = SuperMap.GridType = {
    /** ĺŤ?ĺ­—ĺŹ‰ä¸ťă€‚ */
    CROSS: "CROSS",
    /** ç˝‘ć Ľçşżă€‚ */
    GRID: "GRID",
    /** ç‚ąă€‚ */
    POINT: "POINT"
};


/**
 * @enum ColorSpaceType
 * @memberOf SuperMap
 * @description  č‰˛ĺ˝©ç©şé—´ćžšä¸ľă€‚
 * ç”±äşŽć??č‰˛ĺŽźç?†çš„ä¸Ťĺ?ŚďĽŚĺ†łĺ®šäş†ć?ľç¤şĺ™¨ă€?ćŠ•ĺ˝±ä»Şčż™ç±»éť č‰˛ĺ…‰ç›´ćŽĄĺ??ć??é˘śč‰˛çš„é˘śč‰˛č®ľĺ¤‡ĺ’Ść‰“ĺŤ°ćśşă€?
 * ĺŤ°ĺ?·ćśşčż™ç±»éť ä˝żç”¨é˘ść–™çš„ĺŤ°ĺ?·č®ľĺ¤‡ĺś¨ç”źć??é˘śč‰˛ć–ąĺĽŹä¸Šçš„ĺŚşĺ?«ă€‚
 * é’?ĺŻąä¸Ščż°ä¸Ťĺ?Ść??č‰˛ć–ąĺĽŹďĽŚSuperMap ćŹ?äľ›ä¸¤ç§Ťč‰˛ĺ˝©ç©şé—´ďĽŚ
 * ĺ?†ĺ?«ä¸ş RGB ĺ’Ś CMYKă€‚RGB ä¸»č¦?ç”¨äşŽć?ľç¤şçł»ç»źä¸­ďĽŚCMYK ä¸»č¦?ç”¨äşŽĺŤ°ĺ?·çł»ç»źä¸­ă€‚
 * @type {string}
 */
var ColorSpaceType = SuperMap.ColorSpaceType = {
    /** čŻĄç±»ĺž‹ä¸»č¦?ĺś¨ĺŤ°ĺ?·çł»ç»źä˝żç”¨ă€‚ */
    CMYK: "CMYK",
    /** čŻĄç±»ĺž‹ä¸»č¦?ĺś¨ć?ľç¤şçł»ç»źä¸­ä˝żç”¨ă€‚ */
    RGB: "RGB"
};

/**
 * @enum LayerType
 * @memberOf SuperMap
 * @description  ĺ›ľĺ±‚ç±»ĺž‹ă€‚
 * @type {string}
 */
var LayerType = SuperMap.LayerType = {
    /** SuperMap UGC ç±»ĺž‹ĺ›ľĺ±‚ă€‚ĺ¦‚çź˘é‡Źĺ›ľĺ±‚ă€?ć …ć Ľ(Grid)ĺ›ľĺ±‚ă€?ĺ˝±ĺ?Źĺ›ľĺ±‚ă€‚ */
    UGC: "UGC",
    /** WMS ĺ›ľĺ±‚ă€‚ */
    WMS: "WMS",
    /** WFS ĺ›ľĺ±‚ă€‚ */
    WFS: "WFS",
    /** č‡Şĺ®šäą‰ĺ›ľĺ±‚ă€‚ */
    CUSTOM: "CUSTOM"
};


/**
 * @enum UGCLayerType
 * @memberOf SuperMap
 * @description  UGCĺ›ľĺ±‚ç±»ĺž‹ă€‚
 * @type {string}
 */
var UGCLayerType = SuperMap.UGCLayerType = {
    /** ä¸“é˘?ĺ›ľĺ±‚ă€‚ */
    THEME: "THEME",
    /** çź˘é‡Źĺ›ľĺ±‚ă€‚ */
    VECTOR: "VECTOR",
    /** ć …ć Ľĺ›ľĺ±‚ă€‚ă€‚ */
    GRID: "GRID",
    /** ĺ˝±ĺ?Źĺ›ľĺ±‚ă€‚ */
    IMAGE: "IMAGE"
};


/**
 * @enum StatisticMode
 * @memberOf SuperMap
 * @description  ĺ­—ć®µç»źč®ˇć–ąćł•ç±»ĺž‹ă€‚
 * @type {string}
 */
var StatisticMode = SuperMap.StatisticMode = {
    /** ç»źč®ˇć‰€é€‰ĺ­—ć®µçš„ĺąłĺť‡ĺ€Ľă€‚ */
    AVERAGE: "AVERAGE",
    /** ç»źč®ˇć‰€é€‰ĺ­—ć®µçš„ćś€ĺ¤§ĺ€Ľă€‚ */
    MAX: "MAX",
    /** ç»źč®ˇć‰€é€‰ĺ­—ć®µçš„ćś€ĺ°Źĺ€Ľă€‚ */
    MIN: "MIN",
    /** ç»źč®ˇć‰€é€‰ĺ­—ć®µçš„ć ‡ĺ‡†ĺ·® */
    STDDEVIATION: "STDDEVIATION",
    /** ç»źč®ˇć‰€é€‰ĺ­—ć®µçš„ć€»ĺ’Śă€‚ */
    SUM: "SUM",
    /** ç»źč®ˇć‰€é€‰ĺ­—ć®µçš„ć–ąĺ·®ă€‚ */
    VARIANCE: "VARIANCE"
};


/**
 * @enum PixelFormat
 * @memberOf SuperMap
 * @description  ć …ć Ľä¸Žĺ˝±ĺ?Źć•°ćŤ®ĺ­?ĺ‚¨çš„ĺ?Źç´ ć ĽĺĽŹćžšä¸ľă€‚
 * @type {string}
 */
var PixelFormat = SuperMap.PixelFormat = {
    /** ćŻŹä¸Şĺ?Źĺ…?ç”¨16ä¸ŞćŻ”ç‰ą(ĺŤł2ä¸Şĺ­—čŠ‚)čˇ¨ç¤şă€‚ */
    BIT16: "BIT16",
    /** ćŻŹä¸Şĺ?Źĺ…?ç”¨32ä¸ŞćŻ”ç‰ą(ĺŤł4ä¸Şĺ­—čŠ‚)čˇ¨ç¤şă€‚ */
    BIT32: "BIT32",
    /** ćŻŹä¸Şĺ?Źĺ…?ç”¨64ä¸ŞćŻ”ç‰ą(ĺŤł8ä¸Şĺ­—čŠ‚)čˇ¨ç¤şďĽŚĺŹŞćŹ?äľ›ç»™ć …ć Ľć•°ćŤ®é›†ä˝żç”¨ă€‚ */
    BIT64: "BIT64",
    /** ćŻŹä¸Şĺ?Źĺ…?ç”¨4ä¸Şĺ­—čŠ‚ćťĄčˇ¨ç¤şďĽŚĺŹŞćŹ?äľ›ç»™ć …ć Ľć•°ćŤ®é›†ä˝żç”¨ă€‚ */
    SINGLE: "SINGLE",
    /** ćŻŹä¸Şĺ?Źĺ…?ç”¨8ä¸Şĺ­—čŠ‚ćťĄčˇ¨ç¤şďĽŚĺŹŞćŹ?äľ›ç»™ć …ć Ľć•°ćŤ®é›†ä˝żç”¨ă€‚ */
    DOUBLE: "DOUBLE",
    /** ćŻŹä¸Şĺ?Źĺ…?ç”¨1ä¸ŞćŻ”ç‰ąčˇ¨ç¤şă€‚ */
    UBIT1: "UBIT1",
    /** ćŻŹä¸Şĺ?Źĺ…?ç”¨4ä¸ŞćŻ”ç‰ąćťĄčˇ¨ç¤şă€‚ */
    UBIT4: "UBIT4",
    /** ćŻŹä¸Şĺ?Źĺ…?ç”¨8ä¸ŞćŻ”ç‰ą(ĺŤł1ä¸Şĺ­—čŠ‚)ćťĄčˇ¨ç¤şă€‚ */
    UBIT8: "UBIT8",
    /** ćŻŹä¸Şĺ?Źĺ…?ç”¨24ä¸ŞćŻ”ç‰ą(ĺŤł3ä¸Şĺ­—čŠ‚)ćťĄčˇ¨ç¤şă€‚ */
    UBIT24: "UBIT24",
    /** ćŻŹä¸Şĺ?Źĺ…?ç”¨32ä¸ŞćŻ”ç‰ą(ĺŤł4ä¸Şĺ­—čŠ‚)ćťĄčˇ¨ç¤şă€‚ */
    UBIT32: "UBIT32"
};


/**
 * @enum SearchMode
 * @memberOf SuperMap
 * @description  ĺ†…ćŹ’ć—¶ä˝żç”¨çš„ć ·ćś¬ç‚ąçš„ćźĄć‰ľć–ąĺĽŹćžšä¸ľ
 * @type {string}
 */
var SearchMode = SuperMap.SearchMode = {
    /** ä˝żç”¨ KDTREE çš„ĺ›şĺ®šç‚ąć•°ć–ąĺĽŹćźĄć‰ľĺŹ‚ä¸Žĺ†…ćŹ’ĺ?†ćž?çš„ç‚ąă€‚ */
    KDTREE_FIXED_COUNT: "KDTREE_FIXED_COUNT",
    /** ä˝żç”¨ KDTREE çš„ĺ®šé•żć–ąĺĽŹćźĄć‰ľĺŹ‚ä¸Žĺ†…ćŹ’ĺ?†ćž?çš„ç‚ąă€‚ */
    KDTREE_FIXED_RADIUS: "KDTREE_FIXED_RADIUS",
    /** ä¸Ťčż›čˇŚćźĄć‰ľďĽŚä˝żç”¨ć‰€ćś‰çš„čľ“ĺ…Ąç‚ąčż›čˇŚĺ†…ćŹ’ĺ?†ćž?ă€‚ */
    NONE: "NONE",
    /** ä˝żç”¨ QUADTREE ć–ąĺĽŹćźĄć‰ľĺŹ‚ä¸Žĺ†…ćŹ’ĺ?†ćž?çš„ç‚ąďĽŚä»…ĺŻąć ·ćťˇďĽ?RBFďĽ‰ćŹ’ĺ€Ľĺ’Ść™®é€šĺ…‹ĺ?•é‡‘ďĽ?KrigingďĽ‰ćś‰ç”¨ă€‚ */
    QUADTREE: "QUADTREE"
};


/**
 * @enum InterpolationAlgorithmType
 * @memberOf SuperMap
 * @description  ćŹ’ĺ€Ľĺ?†ćž?çš„ç®—ćł•çš„ç±»ĺž‹
 * @type {string}
 */
var InterpolationAlgorithmType = SuperMap.InterpolationAlgorithmType = {
    /** ć™®é€šĺ…‹ĺ?•é‡‘ćŹ’ĺ€Ľćł•ă€‚ */
    KRIGING: "KRIGING",
    /** ç®€ĺŤ•ĺ…‹ĺ?•é‡‘ćŹ’ĺ€Ľćł•ă€‚ */
    SimpleKriging: "SimpleKriging",
    /** ćł›ĺ…‹ĺ?•é‡‘ćŹ’ĺ€Ľćł•ă€‚ */
    UniversalKriging: "UniversalKriging"
};


/**
 * @enum VariogramMode
 * @memberOf SuperMap
 * @description  ĺ…‹ĺ?•é‡‘ďĽ?KrigingďĽ‰ćŹ’ĺ€Ľć—¶çš„ĺŤŠĺŹ?ĺ‡˝ć•°ç±»ĺž‹ćžšä¸ľ
 * @type {string}
 */
var VariogramMode = SuperMap.VariogramMode = {
    /** ćŚ‡ć•°ĺ‡˝ć•°ă€‚ */
    EXPONENTIAL: "EXPONENTIAL",
    /** é«?ć–Żĺ‡˝ć•°ă€‚ */
    GAUSSIAN: "GAUSSIAN",
    /** ç??ĺž‹ĺ‡˝ć•°ă€‚ */
    SPHERICAL: "SPHERICAL"
};


/**
 * @enum Exponent
 * @memberOf SuperMap
 * @description  ĺ®šäą‰äş†ćł›ĺ…‹ĺ?•é‡‘ďĽ?UniversalKrigingďĽ‰ćŹ’ĺ€Ľć—¶ć ·ç‚ąć•°ćŤ®ä¸­č¶‹ĺŠżéť˘ć–ąç¨‹çš„é?¶ć•°
 * @type {string}
 */
var Exponent = SuperMap.Exponent = {
    /** é?¶ć•°ä¸ş1ă€‚ */
    EXP1: "EXP1",
    /** é?¶ć•°ä¸ş2ă€‚ */
    EXP2: "EXP2"
};


/**
 * @enum ClientType
 * @memberOf SuperMap
 * @description tokenç”łčŻ·çš„ĺ®˘ć?·ç«Żć ‡čŻ†ç±»ĺž‹
 * @type {string}
 */
var ClientType = SuperMap.ClientType = {
    /** ćŚ‡ĺ®šçš„ IP ĺś°ĺť€ă€‚ */
    IP: "IP",
    /** ćŚ‡ĺ®šçš„ URLă€‚ */
    REFERER: "Referer",
    /** ĺŹ‘é€?ç”łčŻ·ä»¤ç‰ŚčŻ·ć±‚çš„ĺ®˘ć?·ç«Ż IPă€‚ */
    REQUESTIP: "RequestIP",
    /** ä¸Ťĺ?šä»»ä˝•éŞŚčŻ?ă€‚ */
    NONE: "NONE",
    /** SERVERă€‚ */
    SERVER: "SERVER",
    /** WEBă€‚ */
    WEB: "WEB"
};


/**
 * @enum ChartType
 * @memberOf SuperMap
 * @description ĺ®˘ć?·ç«Żä¸“é˘?ĺ›ľĺ›ľčˇ¨ç±»ĺž‹
 * @type {string}
 */
var ChartType = SuperMap.ChartType = {
    /** ćź±çŠ¶ĺ›ľă€‚ */
    BAR: "Bar",
    /** ä¸‰ç»´ćź±çŠ¶ĺ›ľă€‚ */
    BAR3D: "Bar3D",
    /** ĺś†ĺ˝˘ĺ›ľă€‚ */
    CIRCLE: "Circle",
    /** éĄĽĺ›ľă€‚ */
    PIE: "Pie",
    /** ć•Łç‚ąĺ›ľă€‚ */
    POINT: "Point",
    /** ćŠ?çşżĺ›ľă€‚ */
    LINE: "Line",
    /** çŽŻçŠ¶ĺ›ľă€‚ */
    RING: "Ring"
};


/**
 * @enum ClipAnalystMode
 * @memberOf SuperMap
 * @description  čŁ?ĺ‰Şĺ?†ćž?ć¨ˇĺĽŹ
 * @type {string}
 */
var ClipAnalystMode = SuperMap.ClipAnalystMode = {
    /** CLIPă€‚ */
    CLIP: "clip",
    /** INTERSECTă€‚ */
    INTERSECT: "intersect"
};

/**
 * @enum AnalystAreaUnit
 * @memberOf SuperMap
 * @description ĺ?†ĺ¸?ĺĽŹĺ?†ćž?éť˘ç§ŻĺŤ•ä˝Ť
 * @type {string}
 */
var AnalystAreaUnit = SuperMap.AnalystAreaUnit = {
    /** ĺąłć–ąç±łă€‚ */
    "SQUAREMETER": "SquareMeter",
    /** ĺąłć–ąĺŤ?ç±łă€‚ */
    "SQUAREKILOMETER": "SquareKiloMeter",
    /** ĺ…¬éˇ·ă€‚ */
    "HECTARE": "Hectare",
    /** ĺ…¬äş©ă€‚ */
    "ARE": "Are",
    /** č‹±äş©ă€‚ */
    "ACRE": "Acre",
    /** ĺąłć–ąč‹±ĺ°şă€‚ */
    "SQUAREFOOT": "SquareFoot",
    /** ĺąłć–ąç ?ă€‚ */
    "SQUAREYARD": "SquareYard",
    /** ĺąłć–ąč‹±é‡Śă€‚ */
    "SQUAREMILE": "SquareMile"
};

/**
 * @enum AnalystSizeUnit
 * @memberOf SuperMap
 * @description ĺ?†ĺ¸?ĺĽŹĺ?†ćž?ĺŤ•ä˝Ť
 * @type {string}
 */
var AnalystSizeUnit = SuperMap.AnalystSizeUnit = {
    /** ç±łă€‚ */
    "METER": "Meter",
    /** ĺŤ?ç±łă€‚ */
    "KILOMETER": "Kilometer",
    /** ç ?ă€‚ */
    "YARD": "Yard",
    /** č‹±ĺ°şă€‚ */
    "FOOT": "Foot",
    /** č‹±é‡Śă€‚ */
    "MILE": "Mile"
};


/**
 * @enum StatisticAnalystMode
 * @memberOf SuperMap
 * @description ĺ?†ĺ¸?ĺĽŹĺ?†ćž?ç»źč®ˇć¨ˇĺĽŹ
 * @type {string}
 */
var StatisticAnalystMode = SuperMap.StatisticAnalystMode = {
    /** ç»źč®ˇć‰€é€‰ĺ­—ć®µçš„ćś€ĺ¤§ĺ€Ľă€‚ */
    "MAX": "max",
    /** ç»źč®ˇć‰€é€‰ĺ­—ć®µçš„ćś€ĺ°Źĺ€Ľă€‚ */
    "MIN": "min",
    /** ç»źč®ˇć‰€é€‰ĺ­—ć®µçš„ĺąłĺť‡ĺ€Ľă€‚ */
    "AVERAGE": "average",
    /** ç»źč®ˇć‰€é€‰ĺ­—ć®µçš„ć€»ĺ’Śă€‚ */
    "SUM": "sum",
    /** ç»źč®ˇć‰€é€‰ĺ­—ć®µçš„ć–ąĺ·®ă€‚ */
    "VARIANCE": "variance",
    /** ç»źč®ˇć‰€é€‰ĺ­—ć®µçš„ć ‡ĺ‡†ĺ·® */
    "STDDEVIATION": "stdDeviation"
};

/**
 * @enum SummaryType
 * @memberOf SuperMap
 * @description ĺ?†ĺ¸?ĺĽŹĺ?†ćž?č?šĺ??ç±»ĺž‹
 * @type {string}
 */
var SummaryType = SuperMap.SummaryType = {
    /** ć Ľç˝‘č?šĺ??ă€‚ */
    "SUMMARYMESH": "SUMMARYMESH",
    /** ĺ¤ščľąĺ˝˘č?šĺ??ă€‚ */
    "SUMMARYREGION": "SUMMARYREGION"
};

/**
 * @enum TopologyValidatorRule
 * @memberOf SuperMap
 * @description  ć‹“ć‰‘ćŁ€ćźĄć¨ˇĺĽŹćžšä¸ľă€‚čŻĄç±»ĺ®šäą‰äş†ć‹“ć‰‘ćŁ€ćźĄć“Ťä˝ść¨ˇĺĽŹĺ¸¸é‡Źă€‚
 * @type {string}
 */
var TopologyValidatorRule = SuperMap.TopologyValidatorRule = {
    /** éť˘ĺ†…ć— é‡ŤĺŹ ďĽŚç”¨äşŽĺŻąéť˘ć•°ćŤ®čż›čˇŚć‹“ć‰‘ćŁ€ćźĄă€‚ */
    REGIONNOOVERLAP: "REGIONNOOVERLAP",
    /** éť˘ä¸Žéť˘ć— é‡ŤĺŹ ďĽŚç”¨äşŽĺŻąéť˘ć•°ćŤ®čż›čˇŚć‹“ć‰‘ćŁ€ćźĄă€‚ */
    REGIONNOOVERLAPWITH: "REGIONNOOVERLAPWITH",
    /** éť˘č˘«éť˘ĺŚ…ĺ?«ďĽŚç”¨äşŽĺŻąéť˘ć•°ćŤ®čż›čˇŚć‹“ć‰‘ćŁ€ćźĄă€‚ */
    REGIONCONTAINEDBYREGION: "REGIONCONTAINEDBYREGION",
    /** éť˘č˘«éť˘č¦†ç›–ďĽŚç”¨äşŽĺŻąéť˘ć•°ćŤ®čż›čˇŚć‹“ć‰‘ćŁ€ćźĄă€‚ */
    REGIONCOVEREDBYREGION: "REGIONCOVEREDBYREGION",
    /** çşżä¸Žçşżć— é‡ŤĺŹ ďĽŚç”¨äşŽĺŻąçşżć•°ćŤ®čż›čˇŚć‹“ć‰‘ćŁ€ćźĄă€‚ */
    LINENOOVERLAP: "LINENOOVERLAP",
    /** çşżĺ†…ć— é‡ŤĺŹ ďĽŚç”¨äşŽĺŻąçşżć•°ćŤ®čż›čˇŚć‹“ć‰‘ćŁ€ćźĄă€‚ */
    LINENOOVERLAPWITH: "LINENOOVERLAPWITH",
    /** ç‚ąä¸Ťç›¸ĺ?ŚďĽŚç”¨äşŽĺŻąç‚ąć•°ćŤ®čż›čˇŚć‹“ć‰‘ćŁ€ćźĄă€‚ */
    POINTNOIDENTICAL: "POINTNOIDENTICAL"
};


/**
 * @enum BucketAggType
 * @memberOf SuperMap
 * @description  ć Ľç˝‘č?šĺ??ćźĄčŻ˘ćžšä¸ľç±»ďĽŚčŻĄç±»ĺ®šäą‰äş†Elasticsearchć•°ćŤ®ćśŤĺŠˇä¸­č?šĺ??ćźĄčŻ˘ć¨ˇĺĽŹĺ¸¸é‡Ź
 * @type {string}
 */
var BucketAggType = SuperMap.BucketAggType = {
    /** ć Ľç˝‘č?šĺ??ç±»ĺž‹ */
    GEOHASH_GRID: "geohash_grid"
};

/**
 * @enum MetricsAggType
 * @memberOf SuperMap
 * @description  ćŚ‡ć ‡č?šĺ??ç±»ĺž‹ćžšä¸ľç±»ďĽŚčŻĄç±»ĺ®šäą‰äş†Elasticsearchć•°ćŤ®ćśŤĺŠˇä¸­č?šĺ??ćźĄčŻ˘ć¨ˇĺĽŹĺ¸¸é‡Ź
 * @type {string}
 */
var MetricsAggType = SuperMap.MetricsAggType = {
  /** ĺąłĺť‡ĺ€Ľč?šĺ??ç±»ĺž‹ */
  AVG:'avg',
  /** ćś€ĺ¤§ĺ€Ľč?šĺ??ç±»ĺž‹ */
  MAX:'max',
  /** ćś€ĺ°Źĺ€Ľč?šĺ??ç±»ĺž‹ */
  MIN:'min',
  /** ć±‚ĺ’Śč?šĺ??ç±»ĺž‹ */
  SUM:'sum'
};


/**
 * @enum GetFeatureMode
 * @memberOf SuperMap
 * @description feature ćźĄčŻ˘ć–ąĺĽŹă€‚
 * @type {string}
 */
var GetFeatureMode = SuperMap.GetFeatureMode = {
    /** é€ščż‡čŚ?ĺ›´ćźĄčŻ˘ćťĄčŽ·ĺŹ–č¦?ç´ ă€‚ */
    BOUNDS: "BOUNDS",
    /** é€ščż‡ĺ‡ ä˝•ĺŻąč±ˇçš„çĽ“ĺ†˛ĺŚşćťĄčŽ·ĺŹ–č¦?ç´ ă€‚ */
    BUFFER: "BUFFER",
    /** é€ščż‡ ID ćťĄčŽ·ĺŹ–č¦?ç´ ă€‚ */
    ID: "ID",
    /** é€ščż‡ç©şé—´ćźĄčŻ˘ć¨ˇĺĽŹćťĄčŽ·ĺŹ–č¦?ç´ ă€‚ */
    SPATIAL: "SPATIAL",
    /** é€ščż‡ SQL ćźĄčŻ˘ćťĄčŽ·ĺŹ–č¦?ç´ ă€‚ */
    SQL: 'SQL'
}


/**
 * @enum RasterFunctionType
 * @memberOf SuperMap
 * @description ć …ć Ľĺ?†ćž?ć–ąćł•ă€‚
 * @type {string}
 */
var RasterFunctionType = SuperMap.RasterFunctionType = {
    /** ĺ˝’ä¸€ĺŚ–ć¤Ťč˘«ćŚ‡ć•°ă€‚ */
    NDVI: "NDVI",
    /** é?´ĺ˝±éť˘ĺ?†ćž?ă€‚ */
    HILLSHADE: "HILLSHADE"
}


/**
 * @enum ResourceType
 * @memberOf SuperMap
 * @description iportalčµ„ćş?ç±»ĺž‹ă€‚
 * @version 10.0.1
 * @type {string}
 */
var ResourceType = SuperMap.ResourceType = {
    /** ĺś°ĺ›ľă€‚ */
    MAP: "MAP",
    /** ćśŤĺŠˇă€‚ */
    SERVICE: "SERVICE",
    /** ĺśşć™Żă€‚ */
    SCENE: "SCENE",
    /** ć•°ćŤ®ă€‚ */
    DATA: "DATA",
    /** ć´žĺŻźă€‚ */
    INSIGHTS_WORKSPACE: "INSIGHTS_WORKSPACE",
    /** ĺ¤§ĺ±Źă€‚ */
    MAP_DASHBOARD: "MAP_DASHBOARD"
}


/**
 * @enum OrderBy
 * @memberOf SuperMap
 * @description iportalčµ„ćş?ćŽ’ĺşŹĺ­—ć®µă€‚
 * @version 10.0.1
 * @type {string}
 */
var OrderBy = SuperMap.OrderBy = {
    /** ćŚ‰ć›´ć–°ć—¶é—´ćŽ’ĺşŹ */
    UPDATETIME: "UPDATETIME",
    /** ćŚ‰ç?­ĺş¦(ĺŹŻč?˝ć?Żč®żé—®é‡Źă€?ä¸‹č˝˝é‡Ź)ćŽ’ĺşŹ */
    HEATLEVEL: "HEATLEVEL",
    /** ćŚ‰ç›¸ĺ…łć€§ćŽ’ĺşŹ */
    RELEVANCE: "RELEVANCE"
}


/**
 * @enum OrderType
 * @memberOf SuperMap
 * @description iportalčµ„ćş?ĺŤ‡ĺşŹčż?ć?Żé™ŤĺşŹčż‡ć»¤
 * @version 10.0.1
 * @type {string}
 */
var OrderType = SuperMap.OrderType = {
    /** ĺŤ‡ĺşŹ */
    ASC: "ASC",
    /** é™ŤĺşŹ */
    DESC: "DESC"
}


/**
 * @enum SearchType
 * @memberOf SuperMap
 * @description iportalčµ„ćş?ćźĄčŻ˘çš„čŚ?ĺ›´čż›čˇŚčż‡ć»¤
 * @version 10.0.1
 * @type {string}
 */
var SearchType = SuperMap.SearchType = {
    /** ĺ…¬ĺĽ€čµ„ćş?ă€‚ */
    PUBLIC: "PUBLIC",
    /** ć?‘çš„čµ„ćş?ă€‚ */
    MY_RES: "MY_RES",
    /** ć?‘çš„çľ¤ç»„čµ„ćş?ă€‚ */
    MYGROUP_RES: "MYGROUP_RES",
    /** ć?‘çš„é?¨é—¨čµ„ćş?ă€‚ */
    MYDEPARTMENT_RES: "MYDEPARTMENT_RES",
    /** ĺ?†äş«ç»™ć?‘çš„čµ„ćş?ă€‚ */
    SHARETOME_RES: "SHARETOME_RES"
}


/**
 * @enum AggregationTypes
 * @memberOf SuperMap
 * @description iportalčµ„ćş?č?šĺ??ćźĄčŻ˘çš„ç±»ĺž‹
 * @version 10.0.1
 * @type {string}
 */
var AggregationTypes = SuperMap.AggregationTypes = {
    /** ć ‡ç­ľ */
    TAG: "TAG",
    /** čµ„ćş?ç±»ĺž‹ */
    TYPE: "TYPE"
}


/**
 * @enum PermissionType
 * @memberOf SuperMap
 * @description iportalčµ„ćş?ćť?é™?ç±»ĺž‹ă€‚
 * @version 10.0.1
 * @type {string}
 */
var PermissionType = SuperMap.PermissionType = {
    /** ĺŹŻćŁ€ç´˘ */
    SEARCH:"SEARCH",
    /** ĺŹŻćźĄçś‹ */
    READ: "READ",
    /** ĺŹŻçĽ–čľ‘ */
    READWRITE: "READWRITE",
    /** ĺŹŻĺ? é™¤ */
    DELETE: "DELETE",
    /** ĺŹŻä¸‹č˝˝ďĽŚĺŚ…ć‹¬ĺŹŻčŻ»ă€?ĺŹŻćŁ€ç´˘ */
    DOWNLOAD:"DOWNLOAD"
}


/**
 * @enum EntityType
 * @memberOf SuperMap
 * @description iportalčµ„ćş?ĺ®žä˝“ç±»ĺž‹ă€‚
 * @version 10.0.1
 * @type {string}
 */
var EntityType = SuperMap.EntityType = {
    /** é?¨é—¨ */
    DEPARTMENT: "DEPARTMENT",
    /** ç”¨ć?·ç»„ */
    GROUP: "GROUP",
    /** çľ¤ç»„ */
    IPORTALGROUP: "IPORTALGROUP",
    /** č§’č‰˛ */
    ROLE: "ROLE",
    /** ç”¨ć?· */
    USER: "USER"
}


/**
 * @enum DataItemType
 * @memberOf SuperMap
 * @description iportalć•°ćŤ®ç±»ĺž‹ă€‚
 * @version 10.0.1
 * @type {string}
 */
var DataItemType = SuperMap.DataItemType = {
    /** ĺ·Ąä˝śç©şé—´ sxwu, smwu, sxw, smw */
    WORKSPACE: "WORKSPACE",
    /** udb ć•°ćŤ®ćş? */
    UDB: "UDB",
    /** shpç©şé—´ć•°ćŤ® */
    SHP: "SHP",
    /** excelć•°ćŤ® */
    EXCEL: "EXCEL",
    /** csvć•°ćŤ® */
    CSV: "CSV",
    /** geojsonć•°ćŤ®ă€‚ */
    GEOJSON: "GEOJSON",
    /** smtiles */
    SMTILES: "SMTILES",
    /** svtiles */
    SVTILES: "SVTILES",
    /** mbtiles */
    MBTILES: "MBTILES",
    /** tpk */
    TPK: "TPK",
    /** ugc v5 */
    UGCV5: "UGCV5",
    /** UGCV5_MVT  */
    UGCV5_MVT: "UGCV5_MVT",
    /** jsonć•°ćŤ®  */
    JSON: "JSON"
}


/**
 * @enum WebExportFormatType
 * @memberOf SuperMap
 * @description Web ć‰“ĺŤ°čľ“ĺ‡şçš„ć ĽĺĽŹă€‚
 * @version 10.0.1
 * @type {string}
 */
var WebExportFormatType = SuperMap.WebExportFormatType = {
    /** png */
    PNG: "PNG",
    /** pdf */
    PDF: "PDF"
}


/**
 * @enum WebScaleOrientationType
 * @memberOf SuperMap
 * @description Web ćŻ”äľ‹ĺ°şçš„ć–ąä˝Ťć ·ĺĽŹă€‚
 * @version 10.0.1
 * @type {string}
 */
var WebScaleOrientationType = SuperMap.WebScaleOrientationType = {
    /** horizontal labels below */
    HORIZONTALLABELSBELOW: "HORIZONTALLABELSBELOW",
    /** horizontal labels above */
    HORIZONTALLABELSABOVE: "HORIZONTALLABELSABOVE",
    /** vertical labels left */
    VERTICALLABELSLEFT: "VERTICALLABELSLEFT",
    /** vertical labels right */
    VERTICALLABELSRIGHT: "VERTICALLABELSRIGHT"
}


/**
 * @enum WebScaleType
 * @memberOf SuperMap
 * @description Web ćŻ”äľ‹ĺ°şçš„ć ·ĺĽŹă€‚
 * @version 10.0.1
 * @type {string}
 */
var WebScaleType = SuperMap.WebScaleType = {
    /** line */
    LINE: "LINE",
    /** bar */
    BAR: "BAR",
    /** bar sub */
    BAR_SUB: "BAR_SUB"
}


/**
 * @enum WebScaleUnit
 * @memberOf SuperMap
 * @description Web ćŻ”äľ‹ĺ°şçš„ĺŤ•ä˝Ťĺ?¶ă€‚
 * @version 10.0.1
 * @type {string}
 */
var WebScaleUnit = SuperMap.WebScaleUnit = {
    /** meter */
    METER: "METER",
    /** foot */
    FOOT: "FOOT",
    /** degrees */
    DEGREES: "DEGREES"
}


;// CONCATENATED MODULE: ./src/common/iServer/DatasourceConnectionInfo.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/


 // eslint-disable-line no-unused-vars

/**
 * @class SuperMap.DatasourceConnectionInfo
 * @category  iServer Data
 * @classdesc ć•°ćŤ®ćş?čżžćŽĄäżˇć?Żç±»ă€‚čŻĄç±»ĺŚ…ć‹¬äş†čż›čˇŚć•°ćŤ®ćş?čżžćŽĄçš„ć‰€ćś‰äżˇć?ŻďĽŚĺ¦‚ć‰€č¦?čżžćŽĄçš„ćśŤĺŠˇĺ™¨ĺ?Ťç§°ă€?ć•°ćŤ®ĺş“ĺ?Ťç§°ă€?ç”¨ć?·ĺ?Ťä»ĄĺŹŠĺŻ†ç ?ç­‰ă€‚
 *            ĺ˝“äżťĺ­?ä¸şĺ·Ąä˝śç©şé—´ć—¶ďĽŚ ĺ·Ąä˝śç©şé—´ä¸­çš„ć•°ćŤ®ćş?çš„čżžćŽĄäżˇć?Żé?˝ĺ°†ĺ­?ĺ‚¨ĺ?°ĺ·Ąä˝śç©şé—´ć–‡ä»¶ä¸­ă€‚ĺŻąäşŽä¸Ťĺ?Śç±»ĺž‹çš„ć•°ćŤ®ćş?ďĽŚĺ…¶čżžćŽĄäżˇć?Żćś‰ć‰€ĺŚşĺ?«ă€‚
 *            ć‰€ä»Ąĺś¨ä˝ż ç”¨čŻĄç±»ć‰€ĺŚ…ĺ?«çš„ć??ĺ‘?ć—¶ďĽŚčŻ·ćł¨ć„ŹčŻĄć??ĺ‘?ć‰€é€‚ç”¨çš„ć•°ćŤ®ćş?ç±»ĺž‹ă€‚ĺŻąäşŽä»Žć•°ćŤ®ćş?ĺŻąč±ˇä¸­čż”ĺ›žçš„ć•°ćŤ®čżžćŽĄäżˇć?ŻĺŻąč±ˇďĽŚĺŹŞćś‰ connect ć–ąćł•ĺŹŻä»Ąč˘«äż®ć”ąďĽŚ
 *            ĺ…¶ä»–ĺ†…ĺ®ąć?Żä¸ŤĺŹŻä»Ąč˘«äż®ć”ąçš„ă€‚ĺŻąäşŽç”¨ć?·ĺ?›ĺ»şçš„ć•°ćŤ®ćş?čżžćŽĄäżˇć?ŻĺŻąč±ˇďĽŚĺ…¶ĺ†…ĺ®ąé?˝ĺŹŻä»Ąäż®ć”ąă€‚
 * @category iServer Data
 * @param {Object} options - ĺŹ‚ć•°ă€‚ 
 * @param {string} options.alias - ć•°ćŤ®ćş?ĺ?«ĺ?Ťă€‚ 
 * @param {string} options.dataBase - ć•°ćŤ®ćş?čżžćŽĄçš„ć•°ćŤ®ĺş“ĺ?Ťă€‚ 
 * @param {boolean} [options.connect] - ć•°ćŤ®ćş?ć?Żĺ?¦č‡ŞĺŠ¨čżžćŽĄć•°ćŤ®ă€‚ 
 * @param {string} [options.driver] - ä˝żç”¨ ODBC(Open Database ConnectivityďĽŚĺĽ€ć”ľć•°ćŤ®ĺş“äş’čżž)çš„ć•°ćŤ®ĺş“çš„é©±ĺŠ¨ç¨‹ĺşŹĺ?Ťă€‚ 
 * @param {SuperMap.EngineType} [options.engineType] - ć•°ćŤ®ćş?čżžćŽĄçš„ĺĽ•ć“Žç±»ĺž‹ă€‚ 
 * @param {boolean} [options.exclusive] - ć?Żĺ?¦ä»Ąç‹¬ĺŤ ć–ąĺĽŹć‰“ĺĽ€ć•°ćŤ®ćş?ă€‚ 
 * @param {boolean} [options.OpenLinkTable] - ć?Żĺ?¦ćŠŠć•°ćŤ®ĺş“ä¸­çš„ĺ…¶ä»–éťž SuperMap ć•°ćŤ®čˇ¨ä˝śä¸ş LinkTable ć‰“ĺĽ€ă€‚ 
 * @param {string} [options.password] - ç™»ĺ˝•ć•°ćŤ®ćş?čżžćŽĄçš„ć•°ćŤ®ĺş“ć?–ć–‡ä»¶çš„ĺŻ†ç ?ă€‚ 
 * @param {boolean} [options.readOnly] - ć?Żĺ?¦ä»ĄĺŹŞčŻ»ć–ąĺĽŹć‰“ĺĽ€ć•°ćŤ®ćş?ă€‚ 
 * @param {string} [options.server] - ć•°ćŤ®ĺş“ćśŤĺŠˇĺ™¨ĺ?Ťć?– SDB ć–‡ä»¶ĺ?Ťă€‚ 
 * @param {string} [options.user] - ç™»ĺ˝•ć•°ćŤ®ĺş“çš„ç”¨ć?·ĺ?Ťă€‚ 
 */
class DatasourceConnectionInfo {


    constructor(options) {

        /**
         * @member {string} SuperMap.DatasourceConnectionInfo.prototype.alias
         * @description ć•°ćŤ®ćş?ĺ?«ĺ?Ťă€‚
         */
        this.alias = null;

        /**
         * @member {boolean} [SuperMap.DatasourceConnectionInfo.prototype.connect]
         * @description ć•°ćŤ®ćş?ć?Żĺ?¦č‡ŞĺŠ¨čżžćŽĄć•°ćŤ®ă€‚
         */
        this.connect = null;

        /**
         * @member {string} SuperMap.DatasourceConnectionInfo.prototype.dataBase
         * @description ć•°ćŤ®ćş?čżžćŽĄçš„ć•°ćŤ®ĺş“ĺ?Ťă€‚
         */
        this.dataBase = null;

        /**
         * @member {string} [SuperMap.DatasourceConnectionInfo.prototype.driver]
         * @description ä˝żç”¨ ODBC(Open Database ConnectivityďĽŚĺĽ€ć”ľć•°ćŤ®ĺş“äş’čżž) çš„ć•°ćŤ®ĺş“çš„é©±ĺŠ¨ç¨‹ĺşŹĺ?Ťă€‚
         * ĺ…¶ä¸­ďĽŚĺŻąäşŽ SQL Server ć•°ćŤ®ĺş“ä¸Ž iServer ĺŹ‘ĺ¸?çš„ WMTS ćśŤĺŠˇďĽŚć­¤ä¸şĺż…č®ľĺŹ‚ć•°ă€‚
         * ĺŻąäşŽ SQL Server ć•°ćŤ®ĺş“ďĽŚĺ®?ä˝żç”¨ ODBC čżžćŽĄďĽŚć‰€č®ľç˝®çš„é©±ĺŠ¨ç¨‹ĺşŹĺ?Ťä¸ş "SQL Server" ć?– "SQL Native Client"ďĽ›
         * ĺŻąäşŽ iServer ĺŹ‘ĺ¸?çš„ WMTS ćśŤĺŠˇďĽŚč®ľç˝®çš„é©±ĺŠ¨ĺ?Ťç§°ä¸ş "WMTS"ă€‚
         */
        this.driver = null;

        /**
         * @member {SuperMap.EngineType} [SuperMap.DatasourceConnectionInfo.prototype.engineType]
         * @description ć•°ćŤ®ćş?čżžćŽĄçš„ĺĽ•ć“Žç±»ĺž‹ă€‚
         */
        this.engineType = null;

        /**
         * @member {boolean} [SuperMap.DatasourceConnectionInfo.prototype.exclusive]
         * @description ć?Żĺ?¦ä»Ąç‹¬ĺŤ ć–ąĺĽŹć‰“ĺĽ€ć•°ćŤ®ćş?ă€‚
         */
        this.exclusive = null;

        /**
         * @member {boolean} [SuperMap.DatasourceConnectionInfo.prototype.OpenLinkTable]
         * @description ć?Żĺ?¦ćŠŠć•°ćŤ®ĺş“ä¸­çš„ĺ…¶ä»–éťž SuperMap ć•°ćŤ®čˇ¨ä˝śä¸ş LinkTable ć‰“ĺĽ€ă€‚
         */
        this.OpenLinkTable = null;

        /**
         * @member {string} [SuperMap.DatasourceConnectionInfo.prototype.password]
         * @description ç™»ĺ˝•ć•°ćŤ®ćş?čżžćŽĄçš„ć•°ćŤ®ĺş“ć?–ć–‡ä»¶çš„ĺŻ†ç ?ă€‚
         */
        this.password = null;

        /**
         * @member {boolean} [SuperMap.DatasourceConnectionInfo.prototype.readOnly]
         * @description ć?Żĺ?¦ä»ĄĺŹŞčŻ»ć–ąĺĽŹć‰“ĺĽ€ć•°ćŤ®ćş?ă€‚
         */
        this.readOnly = null;

        /**
         * @member {string} [SuperMap.DatasourceConnectionInfo.prototype.server]
         * @description ć•°ćŤ®ĺş“ćśŤĺŠˇĺ™¨ĺ?Ťă€?ć–‡ä»¶ĺ?Ťć?–ćśŤĺŠˇĺś°ĺť€ă€‚
         * 1.ĺŻąäşŽ SDB ĺ’Ś UDB ć–‡ä»¶ďĽŚä¸şĺ…¶ć–‡ä»¶çš„ç»ťĺŻąč·Żĺľ„ă€‚ćł¨ć„ŹďĽšĺ˝“ç»ťĺŻąč·Żĺľ„çš„é•żĺş¦č¶…čż‡ UTF-8 çĽ–ç ?ć ĽĺĽŹçš„ 260 ĺ­—čŠ‚é•żĺş¦ďĽŚčŻĄć•°ćŤ®ćş?ć— ćł•ć‰“ĺĽ€ă€‚
         * 2.ĺŻąäşŽ Oracle ć•°ćŤ®ĺş“ďĽŚĺ…¶ćśŤĺŠˇĺ™¨ĺ?Ťä¸şĺ…¶ TNS ćśŤĺŠˇĺ?Ťç§°ă€‚
         * 3.ĺŻąäşŽ SQL Server ć•°ćŤ®ĺş“ďĽŚĺ…¶ćśŤĺŠˇĺ™¨ĺ?Ťä¸şĺ…¶çł»ç»źçš„ DSN(Database Source Name) ĺ?Ťç§°ă€‚
         * 4.ĺŻąäşŽ PostgreSQL ć•°ćŤ®ĺş“ďĽŚĺ…¶ćśŤĺŠˇĺ™¨ĺ?Ťä¸ş â€śIP:ç«ŻĺŹŁĺŹ·â€ťďĽŚé»?č®¤çš„ç«ŻĺŹŁĺŹ·ć?Ż 5432ă€‚
         * 5.ĺŻąäşŽ DB2 ć•°ćŤ®ĺş“ďĽŚĺ·˛ç»Źčż›čˇŚäş†çĽ–ç›®ďĽŚć‰€ä»Ąä¸Ťéś€č¦?čż›čˇŚćśŤĺŠˇĺ™¨çš„č®ľç˝®ă€‚
         * 6.ĺŻąäşŽ Kingbase ć•°ćŤ®ĺş“ďĽŚĺ…¶ćśŤĺŠˇĺ™¨ĺ?Ťä¸şĺ…¶ IP ĺś°ĺť€ă€‚
         * 7.ĺŻąäşŽ GoogleMaps ć•°ćŤ®ćş?ďĽŚĺ…¶ćśŤĺŠˇĺ™¨ĺś°ĺť€ďĽŚé»?č®¤č®ľç˝®ä¸ş â€ś{@link http://maps.google.com}â€ťďĽŚä¸”ä¸ŤĺŹŻć›´ć”ąă€‚
         * 8.ĺŻąäşŽ SuperMapCould ć•°ćŤ®ćş?ďĽŚä¸şĺ…¶ćśŤĺŠˇĺś°ĺť€ă€‚
         * 9.ĺŻąäşŽ MAPWORLD ć•°ćŤ®ćş?ďĽŚä¸şĺ…¶ćśŤĺŠˇĺś°ĺť€ďĽŚé»?č®¤č®ľç˝®ä¸ş â€ś{@link http://www.tianditu.cn}â€ťďĽŚä¸”ä¸ŤĺŹŻć›´ć”ąă€‚
         * 10.ĺŻąäşŽ OGC ĺ’Ś REST ć•°ćŤ®ćş?ďĽŚä¸şĺ…¶ćśŤĺŠˇĺś°ĺť€ă€‚
         */
        this.server = null;

        /**
         * @member {string} SuperMap.DatasourceConnectionInfo.prototype.user
         * @description ç™»ĺ˝•ć•°ćŤ®ĺş“çš„ç”¨ć?·ĺ?Ťă€‚
         */
        this.user = null;

        if (options) {
            Util.extend(this, options);
        }

        this.CLASS_NAME = "SuperMap.DatasourceConnectionInfo";
    }

    /**
     * @function SuperMap.DatasourceConnectionInfo.prototype.destroy
     * @description é‡Šć”ľčµ„ćş?ďĽŚĺ°†ĺĽ•ç”¨čµ„ćş?çš„ĺ±žć€§ç˝®ç©şă€‚
     */
    destroy() {
        var me = this;
        me.alias = null;
        me.connect = null;
        me.dataBase = null;
        me.driver = null;
        me.engineType = null;
        me.exclusive = null;
        me.OpenLinkTable = null;
        me.password = null;
        me.readOnly = null;
        me.server = null;
        me.user = null;
    }

}

SuperMap.DatasourceConnectionInfo = DatasourceConnectionInfo;
;// CONCATENATED MODULE: ./src/common/iServer/OutputSetting.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/





/**
 * @class SuperMap.OutputSetting
 * @category  iServer ProcessingService
 * @classdesc ĺ?†ĺ¸?ĺĽŹĺ?†ćž?čľ“ĺ‡şç±»ĺž‹č®ľç˝®ç±»ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {SuperMap.DatasourceConnectionInfo} options.datasourceInfo - ć•°ćŤ®ćş?čżžćŽĄäżˇć?Żă€‚
 * @param {string} [options.datasetName='analystResult'] - ç»“ćžść•°ćŤ®é›†ĺ?Ťç§°ă€‚
 * @param {SuperMap.OutputType} [options.type=SuperMap.OutputType.UDB] - čľ“ĺ‡şç±»ĺž‹ă€‚
 * @param {string} [options.outputPath] - ĺ?†ćž?ç»“ćžśčľ“ĺ‡şč·Żĺľ„ă€‚
 */
class OutputSetting {

    constructor(options) {

        /**
         * @member {SuperMap.OutputType} SuperMap.OutputSetting.prototype.type
         * @description ĺ?†ĺ¸?ĺĽŹĺ?†ćž?çš„čľ“ĺ‡şç±»ĺž‹ă€‚
         */
        this.type = OutputType.UDB;

        /**
         * @member {string} [SuperMap.OutputSetting.prototype.datasetName='analystResult']
         * @description ĺ?†ĺ¸?ĺĽŹĺ?†ćž?çš„čľ“ĺ‡şç»“ćžść•°ćŤ®é›†ĺ?Ťç§°ă€‚
         */
        this.datasetName = "analystResult";

        /**
         * @member {SuperMap.DatasourceConnectionInfo} SuperMap.OutputSetting.prototype.datasourceInfo
         * @description ĺ?†ĺ¸?ĺĽŹĺ?†ćž?çš„čľ“ĺ‡şç»“ćžść•°ćŤ®ćş?čżžćŽĄäżˇć?Żă€‚
         */
        this.datasourceInfo = null;

        /**
         * @member {string} [SuperMap.OutputSetting.prototype.outputPath]
         * @description ĺ?†ĺ¸?ĺĽŹĺ?†ćž?çš„ĺ?†ćž?ç»“ćžśčľ“ĺ‡şč·Żĺľ„ă€‚
         */
        this.outputPath = "";

        Util.extend(this, options);
        this.CLASS_NAME = "SuperMap.OutputSetting";
    }

    /**
     * @function SuperMap.OutputSetting.prototype.destroy
     * @description é‡Šć”ľčµ„ćş?ďĽŚĺ°†ĺĽ•ç”¨čµ„ćş?çš„ĺ±žć€§ç˝®ç©şă€‚
     */
    destroy() {
        var me = this;
        me.type = null;
        me.datasetName = null;
        me.outputPath = null;
        if (me.datasourceInfo instanceof DatasourceConnectionInfo) {
            me.datasourceInfo.destroy();
            me.datasourceInfo = null;
        }
    }

}

SuperMap.OutputSetting = OutputSetting;
;// CONCATENATED MODULE: ./src/common/iServer/MappingParameters.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/




/**
 * @class SuperMap.MappingParameters
 * @category  iServer ProcessingService
 * @classdesc ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {Array.<SuperMap.ThemeGridRangeItem>} [options.items] - ć …ć Ľĺ?†ć®µä¸“é˘?ĺ›ľĺ­?éˇąć•°ç»„ă€‚
 * @param {number} [options.numericPrecision=1] - ç˛ľĺş¦ďĽŚć­¤ĺ­—ć®µç”¨äşŽč®ľç˝®ĺ?†ćž?ç»“ćžść ‡ç­ľä¸“é˘?ĺ›ľä¸­ć ‡ç­ľć•°ĺ€Ľçš„ç˛ľĺş¦ďĽŚĺ¦‚â€ś1â€ťčˇ¨ç¤şç˛ľçˇ®ĺ?°ĺ°Źć•°ç‚ąçš„ĺ?Žä¸€ä˝Ťă€‚
 * @param {SuperMap.RangeMode} [options.rangeMode=SuperMap.RangeMode.EQUALINTERVAL] - ä¸“é˘?ĺ›ľĺ?†ć®µć¨ˇĺĽŹă€‚
 * @param {number} [options.rangeCount] - ä¸“é˘?ĺ›ľĺ?†ć®µä¸Şć•°ă€‚
 * @param {SuperMap.ColorGradientType} [options.colorGradientType=SuperMap.ColorGradientType.YELLOW_RED] - ä¸“é˘?ĺ›ľé˘śč‰˛ć¸?ĺŹ?ć¨ˇĺĽŹă€‚
 */
class MappingParameters {

    constructor(options) {

        /**
         * @member {Array.<SuperMap.ThemeGridRangeItem>} [SuperMap.MappingParameters.prototype.items]
         * @description ć …ć Ľĺ?†ć®µä¸“é˘?ĺ›ľĺ­?éˇąć•°ç»„ă€‚
         */
        this.items = null;

        /**
         * @member {number} [SuperMap.MappingParameters.prototype.numericPrecision=1]
         * @description ç˛ľĺş¦ďĽŚć­¤ĺ­—ć®µç”¨äşŽč®ľç˝®ĺ?†ćž?ç»“ćžść ‡ç­ľä¸“é˘?ĺ›ľä¸­ć ‡ç­ľć•°ĺ€Ľçš„ç˛ľĺş¦ďĽŚĺ¦‚â€ś1â€ťčˇ¨ç¤şç˛ľçˇ®ĺ?°ĺ°Źć•°ç‚ąçš„ĺ?Žä¸€ä˝Ťă€‚
         */
        this.numericPrecision = 1;

        /**
         * @member {SuperMap.RangeMode} [SuperMap.MappingParameters.prototype.RangeMode=SuperMap.RangeMode.EQUALINTERVAL]
         * @description ä¸“é˘?ĺ›ľĺ?†ć®µć¨ˇĺĽŹă€‚
         */
        this.rangeMode = RangeMode.EQUALINTERVAL;

        /**
         * @member {number} [SuperMap.MappingParameters.prototype.rangeCount]
         * @description ä¸“é˘?ĺ›ľĺ?†ć®µä¸Şć•°ă€‚
         */
        this.rangeCount = "";

        /**
         * @member {SuperMap.ColorGradientType} [SuperMap.MappingParameters.prototype.colorGradientType=SuperMap.ColorGradientType.YELLOW_RED]
         * @description ä¸“é˘?ĺ›ľé˘śč‰˛ć¸?ĺŹ?ć¨ˇĺĽŹă€‚
         */
        this.colorGradientType = ColorGradientType.YELLOW_RED;

        Util.extend(this, options);
        this.CLASS_NAME = "SuperMap.MappingParameters";
    }

    /**
     * @function SuperMap.MappingParameters.prototype.destroy
     * @description é‡Šć”ľčµ„ćş?ďĽŚĺ°†ĺĽ•ç”¨čµ„ćş?çš„ĺ±žć€§ç˝®ç©şă€‚
     */
    destroy() {
        var me = this;
        if (me.items) {
            if (me.items.length > 0) {
                for (var item in me.items) {
                    me.items[item].destroy();
                    me.items[item] = null;
                }
            }
            me.items = null;
        }
        me.numericPrecision = null;
        me.rangeMode = null;
        me.rangeCount = null;
        me.colorGradientType = null;
    }

}

SuperMap.MappingParameters = MappingParameters;
;// CONCATENATED MODULE: ./src/common/iServer/KernelDensityJobParameter.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/







/**
 * @class SuperMap.KernelDensityJobParameter
 * @category iServer ProcessingService DensityAnalyst
 * @classdesc ĺŻ†ĺş¦ĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ç±»ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚ 
 * @param {string} options.datasetName - ć•°ćŤ®é›†ĺ?Ťă€‚ 
 * @param {string} options.fields - ćť?é‡Ťç´˘ĺĽ•ă€‚ 
 * @param {(SuperMap.Bounds|L.Bounds|ol.extent)} [options.query] - ĺ?†ćž?čŚ?ĺ›´ďĽ?é»?č®¤ä¸şĺ…¨ĺ›ľčŚ?ĺ›´ďĽ‰ă€‚ 
 * @param {number} [options.resolution=80] - ĺ?†čľ¨çŽ‡ă€‚ 
 * @param {number} [options.method=0] - ĺ?†ćž?ć–ąćł•ă€‚ 
 * @param {number} [options.meshType=0] - ĺ?†ćž?ç±»ĺž‹ă€‚ 
 * @param {number} [options.radius=300] - ĺ?†ćž?çš„ĺ˝±ĺ“ŤĺŤŠĺľ„ă€‚
 * @param {SuperMap.OutputSetting} [options.output] - čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ă€‚
 * @param {SuperMap.MappingParameters} [options.mappingParameters] - ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚   
 */
class KernelDensityJobParameter {

    constructor(options) {
        if (!options) {
            return;
        }
        /**
         * @member {string} SuperMap.KernelDensityJobParameter.prototype.datasetName
         * @description ć•°ćŤ®é›†ĺ?Ťă€‚
         */
        this.datasetName = "";

        /**
         * @member {SuperMap.Bounds|L.Bounds|ol.extent} [SuperMap.KernelDensityJobParameter.prototype.query]
         * @description ĺ?†ćž?čŚ?ĺ›´ă€‚ 
         */
        this.query = "";

        /**
         * @member {number} [SuperMap.KernelDensityJobParameter.prototype.resolution=80]
         * @description ç˝‘ć Ľĺ¤§ĺ°Źă€‚
         */
        this.resolution = 80;

        /**
         * @member {number} [SuperMap.KernelDensityJobParameter.prototype.method=0]
         * @description ĺ?†ćž?ć–ąćł•ă€‚
         */
        this.method = 0;

        /**
         * @member {number} [SuperMap.KernelDensityJobParameter.prototype.meshType=0]
         * @description ĺ?†ćž?ç±»ĺž‹ă€‚
         */
        this.meshType = 0;

        /**
         * @member {string} SuperMap.KernelDensityJobParameter.prototype.fields
         * @description ćť?é‡Ťç´˘ĺĽ•ă€‚
         */
        this.fields = "";

        /**
         * @member {number} [SuperMap.KernelDensityJobParameter.prototype.radius=300]
         * @description ĺ?†ćž?çš„ĺ˝±ĺ“ŤĺŤŠĺľ„ă€‚
         */
        this.radius = 300;

        /**
         * @member {SuperMap.AnalystSizeUnit} [SuperMap.KernelDensityJobParameter.prototype.meshSizeUnit=SuperMap.AnalystSizeUnit.METER]
         * @description ç˝‘ć Ľĺ¤§ĺ°ŹĺŤ•ä˝Ťă€‚
         */
        this.meshSizeUnit = AnalystSizeUnit.METER;

        /**
         * @member {SuperMap.AnalystSizeUnit} [SuperMap.KernelDensityJobParameter.prototype.radiusUnit=SuperMap.AnalystSizeUnit.METER]
         * @description ć?śç´˘ĺŤŠĺľ„ĺŤ•ä˝Ťă€‚
         */
        this.radiusUnit = AnalystSizeUnit.METER;

        /**
         * @member {SuperMap.AnalystAreaUnit} [SuperMap.KernelDensityJobParameter.prototype.areaUnit=SuperMap.AnalystAreaUnit.SQUAREMILE]
         * @description éť˘ç§ŻĺŤ•ä˝Ťă€‚
         */
        this.areaUnit = AnalystAreaUnit.SQUAREMILE;

        /**
         * @member {SuperMap.OutputSetting} SuperMap.KernelDensityJobParameter.prototype.output
         * @description čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ç±»
         */
        this.output = null;

        /**
         * @member {SuperMap.MappingParameters} [SuperMap.KernelDensityJobParameter.prototype.mappingParameters]
         * @description ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚
         */
        this.mappingParameters = null;

        Util.extend(this, options);

        this.CLASS_NAME = "SuperMap.KernelDensityJobParameter";
    }

    /**
     * @function SuperMap.KernelDensityJobParameter.prototype.destroy
     * @description é‡Šć”ľčµ„ćş?ďĽŚĺ°†ĺĽ•ç”¨čµ„ćş?çš„ĺ±žć€§ç˝®ç©şă€‚
     */
    destroy() {
        this.datasetName = null;
        this.query = null;
        this.resolution = null;
        this.method = null;
        this.radius = null;
        this.meshType = null;
        this.fields = null;
        this.meshSizeUnit = null;
        this.radiusUnit = null;
        this.areaUnit = null;
        if (this.output instanceof OutputSetting) {
            this.output.destroy();
            this.output = null;
        }
        if (this.mappingParameters instanceof MappingParameters) {
            this.mappingParameters.destroy();
            this.mappingParameters = null;
        }
    }

    /**
     * @function SuperMap.KernelDensityJobParameter.toObject
     * @param {SuperMap.KernelDensityJobParameter} kernelDensityJobParameter - ĺŻ†ĺş¦ĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ç±»ă€‚
     * @param {SuperMap.KernelDensityJobParameter} tempObj - ĺŻ†ĺş¦ĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ĺŻąč±ˇă€‚
     * @description ĺ°†ĺŻ†ĺş¦ĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ĺŻąč±ˇč˝¬ćŤ˘ä¸ş JSON ĺŻąč±ˇă€‚
     * @returns JSON ĺŻąč±ˇă€‚
     */
    static toObject(kernelDensityJobParameter, tempObj) {
        for (var name in kernelDensityJobParameter) {
            if (name === "datasetName") {
                tempObj['input'] = tempObj['input'] || {};
                tempObj['input'][name] = kernelDensityJobParameter[name];
                continue;
            }
            if (name === "output") {
                tempObj['output'] = tempObj['output'] || {};
                tempObj['output'] = kernelDensityJobParameter[name];
                continue;
            }

            tempObj['analyst'] = tempObj['analyst'] || {};
            if (name === 'query' && kernelDensityJobParameter[name]) {
                tempObj['analyst'][name] = kernelDensityJobParameter[name].toBBOX();
            } else {
                tempObj['analyst'][name] = kernelDensityJobParameter[name];
            }
            if (name === 'mappingParameters') {
                tempObj['analyst'][name] = tempObj['analyst'][name] || {};
                tempObj['analyst']['mappingParameters'] = kernelDensityJobParameter[name];
            }
        }
    }
}
SuperMap.KernelDensityJobParameter = KernelDensityJobParameter;
;// CONCATENATED MODULE: ./src/common/iServer/SingleObjectQueryJobsParameter.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/






/**
 * @class SuperMap.SingleObjectQueryJobsParameter
 * @category  iServer ProcessingService Query
 * @classdesc ĺŤ•ĺŻąč±ˇç©şé—´ćźĄčŻ˘ĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ç±»ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {string} options.datasetName - ć•°ćŤ®é›†ĺ?Ťă€‚
 * @param {string} options.datasetQuery - ćźĄčŻ˘ĺŻąč±ˇć‰€ĺś¨çš„ć•°ćŤ®é›†ĺ?Ťç§°ă€‚
 * @param {SuperMap.SpatialQueryMode} [options.mode=SuperMap.SpatialQueryMode.CONTAIN] - ç©şé—´ćźĄčŻ˘ć¨ˇĺĽŹă€‚
 * @param {SuperMap.OutputSetting} [options.output] - čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ă€‚
 * @param {SuperMap.MappingParameters} [options.mappingParameters] - ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚   
 */
class SingleObjectQueryJobsParameter {

    constructor(options) {
        if (!options) {
            return;
        }
        /**
         * @member {string} SuperMap.SingleObjectQueryJobsParameter.prototype.datasetName
         * @description ć•°ćŤ®é›†ĺ?Ťă€‚
         */
        this.datasetName = "";

        /**
         * @member {string} SuperMap.SingleObjectQueryJobsParameter.prototype.datasetQuery
         * @description ćźĄčŻ˘ĺŻąč±ˇć‰€ĺś¨çš„ć•°ćŤ®é›†ĺ?Ťç§°ă€‚
         */
        this.datasetQuery = "";

        /**
         * @member {string} SuperMap.SingleObjectQueryJobsParameter.prototype.geometryQuery
         * @description ćźĄčŻ˘ĺŻąč±ˇć‰€ĺś¨çš„ĺ‡ ä˝•ĺŻąč±ˇă€‚
         */
        this.geometryQuery = "";

        /**
         * @member {SuperMap.SpatialQueryMode} [SuperMap.SingleObjectQueryJobsParameter.prototype.mode=SuperMap.SpatialQueryMode.CONTAIN]
         * @description ç©şé—´ćźĄčŻ˘ć¨ˇĺĽŹ ă€‚
         */
        this.mode = SpatialQueryMode.CONTAIN;

        /**
         * @member {SuperMap.OutputSetting} [SuperMap.SingleObjectQueryJobsParameter.prototype.output]
         * @description čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ç±»ă€‚
         */
        this.output = null;

        /**
         * @member {SuperMap.MappingParameters} [SuperMap.SingleObjectQueryJobsParameter.prototype.mappingParameters]
         * @description ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚   
         */
        this.mappingParameters = null;

        Util.extend(this, options);

        this.CLASS_NAME = "SuperMap.SingleObjectQueryJobsParameter";
    }

    /**
     * @function SuperMap.SingleObjectQueryJobsParameter.prototype.destroy
     * @description é‡Šć”ľčµ„ćş?ďĽŚĺ°†ĺĽ•ç”¨čµ„ćş?çš„ĺ±žć€§ç˝®ç©şă€‚
     */
    destroy() {
        this.datasetName = null;
        this.datasetQuery = null;
        this.geometryQuery = null;
        this.mode = null;
        if (this.output instanceof OutputSetting) {
            this.output.destroy();
            this.output = null;
        }
        if (this.mappingParameters instanceof MappingParameters){
            this.mappingParameters.destroy();
            this.mappingParameters = null;
        }
    }

    /**
     * @function SuperMap.SingleObjectQueryJobsParameter.toObject
     * @param {Object} singleObjectQueryJobsParameter - ĺŤ•ĺŻąč±ˇç©şé—´ćźĄčŻ˘ĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ă€‚
     * @param {Object} tempObj - ç›®ć ‡ĺŻąč±ˇă€‚
     * @description ç”źć??ĺŤ•ĺŻąč±ˇç©şé—´ćźĄčŻ˘ĺ?†ćž?ä»»ĺŠˇĺŻąč±ˇă€‚
     */
    static toObject(singleObjectQueryJobsParameter, tempObj) {
        for (var name in singleObjectQueryJobsParameter) {
            if (name === "datasetName") {
                tempObj['input'] = tempObj['input'] || {};
                tempObj['input'][name] = singleObjectQueryJobsParameter[name];
                continue;
            }
            if (name === "output"){
                tempObj['output'] = tempObj['output'] || {};
                tempObj['output'] = singleObjectQueryJobsParameter[name];
                continue;
            }
            
            tempObj['analyst'] = tempObj['analyst'] || {};
            tempObj['analyst'][name] = singleObjectQueryJobsParameter[name];
            if(name === 'mappingParameters'){
                tempObj['analyst'][name] = tempObj['analyst'][name] || {};
                tempObj['analyst']['mappingParameters'] = singleObjectQueryJobsParameter[name];
            }
        }
    }

}

SuperMap.SingleObjectQueryJobsParameter = SingleObjectQueryJobsParameter;

;// CONCATENATED MODULE: ./src/common/iServer/SummaryAttributesJobsParameter.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/





/**
 * @class SuperMap.SummaryAttributesJobsParameter
 * @category  iServer ProcessingService SummaryAttributes
 * @classdesc ĺ±žć€§ć±‡ć€»ĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ç±»
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {string} options.datasetName - ć•°ćŤ®é›†ĺ?Ťă€‚
 * @param {string} options.groupField - ĺ?†ç»„ĺ­—ć®µă€‚
 * @param {string} options.attributeField - ĺ±žć€§ĺ­—ć®µă€‚
 * @param {string} options.statisticModes - ç»źč®ˇć¨ˇĺĽŹă€‚
 * @param {SuperMap.OutputSetting} [options.output] -čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ă€‚
 * @param {SuperMap.MappingParameters} [options.mappingParameters] - ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚   
 */
class SummaryAttributesJobsParameter {

    constructor(options) {
        if (!options) {
            return;
        }
        /**
         * @member {string} SuperMap.SummaryAttributesJobsParameter.prototype.datasetName
         * @description ć±‡ć€»ć•°ćŤ®é›†ĺ?Ťç§°ă€‚
         */
        this.datasetName = "";
        /**
         * @member {string} SuperMap.SummaryAttributesJobsParameter.prototype.groupField
         * @description ĺ?†ç»„ĺ­—ć®µă€‚
         */
        this.groupField = "";
        /**
         * @member {string} SuperMap.SummaryAttributesJobsParameter.prototype.attributeField
         * @description ĺ±žć€§ĺ­—ć®µă€‚
         */
        this.attributeField = "";
        /**
         * @member {string} SuperMap.SummaryAttributesJobsParameter.prototype.statisticModes
         * @description ĺ±žć€§ć±‡ć€»ç»źč®ˇć¨ˇĺĽŹă€‚
         */
        this.statisticModes = "";
        /**
         * @member {SuperMap.OutputSetting} SuperMap.SummaryAttributesJobsParameter.prototype.output
         * @description čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ç±»ă€‚
         */
        this.output = null;
        /**
         * @member {SuperMap.MappingParameters} [SuperMap.SummaryAttributesJobsParameter.prototype.mappingParameters]
         * @description ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚   
         */
        this.mappingParameters = null;

        Util.extend(this, options);
        this.CLASS_NAME = "SuperMap.SummaryAttributesJobsParameter";
    }

    /**
     * @function SuperMap.SummaryAttributesJobsParameter.destroy
     * @override
     */
    destroy() {
        this.datasetName = null;
        this.groupField = null;
        this.attributeField = null;
        this.statisticModes = null;
        if (this.output instanceof OutputSetting) {
            this.output.destroy();
            this.output = null;
        }
        if (this.mappingParameters instanceof MappingParameters){
            this.mappingParameters.destroy();
            this.mappingParameters = null;
        }
    }

    /**
     * @function SuperMap.SummaryAttributesJobsParameter.toObject
     * @param {Object} SummaryAttributesJobsParameter - ĺ±žć€§ć±‡ć€»ä»»ĺŠˇĺŹ‚ć•°ă€‚
     * @param {Object} tempObj - ç›®ć ‡ĺŻąč±ˇă€‚
     * @description ç”źć??ĺ±žć€§ć±‡ć€»ĺ?†ćž?ä»»ĺŠˇĺŻąč±ˇă€‚
     */
    static toObject(SummaryAttributesJobsParameter, tempObj) {
        for (var name in SummaryAttributesJobsParameter) {
            if (name === "datasetName") {
                tempObj['input'] = tempObj['input'] || {};
                tempObj['input'][name] = SummaryAttributesJobsParameter[name];
                continue;
            }
            if (name === "output") {
                tempObj['output'] = tempObj['output'] || {};
                tempObj['output'] = SummaryAttributesJobsParameter[name];
                continue;
            }
            
            tempObj['analyst'] = tempObj['analyst'] || {};
            tempObj['analyst'][name] = SummaryAttributesJobsParameter[name];
            if(name === 'mappingParameters'){
                tempObj['analyst'][name] = tempObj['analyst'][name] || {};
                tempObj['analyst']['mappingParameters'] = SummaryAttributesJobsParameter[name];
            }
        }
    }

}
SuperMap.SummaryAttributesJobsParameter = SummaryAttributesJobsParameter;
;// CONCATENATED MODULE: ./src/common/iServer/SummaryMeshJobParameter.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/







/**
 * @class SuperMap.SummaryMeshJobParameter
 * @category  iServer ProcessingService AggregatePoints
 * @classdesc ç‚ąč?šĺ??ĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ç±»ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {string} options.datasetName - ć•°ćŤ®é›†ĺ?Ťă€‚
 * @param {(SuperMap.Bounds|L.Bounds|ol.extent)} [options.query] - ĺ?†ćž?čŚ?ĺ›´ďĽ?é»?č®¤ä¸şĺ…¨ĺ›ľčŚ?ĺ›´ďĽ‰ă€‚
 * @param {number} options.fields - ćť?é‡Ťç´˘ĺĽ•ă€‚
 * @param {number} [options.resolution=100] - ĺ?†čľ¨çŽ‡ă€‚
 * @param {SuperMap.StatisticAnalystMode} [options.statisticModes=SuperMap.StatisticAnalystMode.AVERAGE] - ĺ?†ćž?ć¨ˇĺĽŹă€‚
 * @param {number} [options.meshType=0] - ĺ?†ćž?ç±»ĺž‹ă€‚
 * @param {SuperMap.SummaryType} [options.type=SuperMap.SummaryType.SUMMARYMESH] - č?šĺ??ç±»ĺž‹ă€‚
 * @param {SuperMap.OutputSetting} [options.output] - čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ă€‚
 * @param {SuperMap.MappingParameters} [options.mappingParameters] - ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚   
 */
class SummaryMeshJobParameter {

    constructor(options) {
        if (!options) {
            return;
        }
        /**
         * @member {string} SuperMap.SummaryMeshJobParameter.prototype.datasetName
         * @description ć•°ćŤ®é›†ĺ?Ťă€‚
         */
        this.datasetName = "";

        /**
         * @member {string} SuperMap.SummaryMeshJobParameter.prototype.regionDataset
         * @description č?šĺ??éť˘ć•°ćŤ®é›†ďĽ?č?šĺ??ç±»ĺž‹ä¸şĺ¤ščľąĺ˝˘č?šĺ??ć—¶ä˝żç”¨çš„ĺŹ‚ć•°ďĽ‰ă€‚
         */
        this.regionDataset = "";

        /**
         * @member {(SuperMap.Bounds|L.Bounds|ol.extent)} SuperMap.SummaryMeshJobParameter.prototype.query
         * @description ĺ?†ćž?čŚ?ĺ›´ďĽ?č?šĺ??ç±»ĺž‹ä¸şç˝‘ć Ľéť˘č?šĺ??ć—¶ä˝żç”¨çš„ĺŹ‚ć•°ďĽ‰ă€‚
         */
        this.query = "";

        /**
         * @member {number} [SuperMap.SummaryMeshJobParameter.prototype.resolution=100]
         * @description ĺ?†čľ¨çŽ‡ďĽ?č?šĺ??ç±»ĺž‹ä¸şç˝‘ć Ľéť˘č?šĺ??ć—¶ä˝żç”¨çš„ĺŹ‚ć•°ďĽ‰ă€‚
         */
        this.resolution = 100;

        /**
         * @member {number} [SuperMap.SummaryMeshJobParameter.prototype.meshType=0]
         * @description  ç˝‘ć Ľéť˘ç±»ĺž‹ďĽ?č?šĺ??ç±»ĺž‹ä¸şç˝‘ć Ľéť˘č?šĺ??ć—¶ä˝żç”¨çš„ĺŹ‚ć•°ďĽ‰ďĽŚĺŹ–ĺ€ĽďĽš0 ć?– 1ă€‚
         */
        this.meshType = 0;

        /**
         * @member {SuperMap.StatisticAnalystMode} [SuperMap.SummaryMeshJobParameter.prototype.statisticModes=SuperMap.StatisticAnalystMode.AVERAGE]
         * @description ç»źč®ˇć¨ˇĺĽŹă€‚
         */
        this.statisticModes = StatisticAnalystMode.AVERAGE;

        /**
         * @member {number} SuperMap.SummaryMeshJobParameter.prototype.fields
         * @description ćť?é‡Ťĺ­—ć®µă€‚
         */
        this.fields = "";

        /**
         * @member {SuperMap.SummaryType} [SuperMap.SummaryMeshJobParameter.prototype.type=SuperMap.SummaryType.SUMMARYMESH]
         * @description č?šĺ??ç±»ĺž‹ă€‚
         */
        this.type = SummaryType.SUMMARYMESH;

        /**
         * @member {SuperMap.OutputSetting} [SuperMap.SummaryMeshJobParameter.prototype.output]
         * @description čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ç±»ă€‚
         */
        this.output = null;

        /**
         * @member {SuperMap.MappingParameters} [SuperMap.SummaryMeshJobParameter.prototype.mappingParameters]
         * @description ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚   
         */
        this.mappingParameters = null;

        Util.extend(this, options);

        this.CLASS_NAME = "SuperMap.SummaryMeshJobParameter";
    }


    /**
     * @function SuperMap.SummaryMeshJobParameter.destroy
     * @override
     */
    destroy() {
        this.datasetName = null;
        this.query = null;
        this.resolution = null;
        this.statisticModes = null;
        this.meshType = null;
        this.fields = null;
        this.regionDataset = null;
        this.type = null;
        if (this.output instanceof OutputSetting) {
            this.output.destroy();
            this.output = null;
        }
        if (this.mappingParameters instanceof MappingParameters){
            this.mappingParameters.destroy();
            this.mappingParameters = null;
        }
    }

    /**
     * @function SuperMap.SummaryMeshJobParameter.toObject
     * @param {Object} summaryMeshJobParameter - ç‚ąč?šĺ??ĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ă€‚
     * @param {Object} tempObj - ç›®ć ‡ĺŻąč±ˇă€‚
     * @description ç”źć??ç‚ąč?šĺ??ĺ?†ćž?ä»»ĺŠˇĺŻąč±ˇă€‚
     */
    static toObject(summaryMeshJobParameter, tempObj) {
        for (var name in summaryMeshJobParameter) {
            if (name === "datasetName") {
                tempObj['input'] = tempObj['input'] || {};
                tempObj['input'][name] = summaryMeshJobParameter[name];
                continue;
            }
            if (name === "type") {
                tempObj['type'] = summaryMeshJobParameter[name];
                continue;
            }
            if (name === "output") {
                tempObj['output'] = tempObj['output'] || {};
                tempObj['output'] = summaryMeshJobParameter[name];
                continue;
            }     
            if (summaryMeshJobParameter.type === 'SUMMARYMESH' && name !== 'regionDataset' || summaryMeshJobParameter.type === 'SUMMARYREGION' && !contains(['meshType', 'resolution', 'query'], name)) {
                tempObj['analyst'] = tempObj['analyst'] || {};
                if (name === 'query' && summaryMeshJobParameter[name]) {
                    tempObj['analyst'][name] = summaryMeshJobParameter[name].toBBOX();
                } else {
                    tempObj['analyst'][name] = summaryMeshJobParameter[name];
                }
                if(name === 'mappingParameters'){
                    tempObj['analyst'][name] = tempObj['analyst'][name] || {};
                    tempObj['analyst']['mappingParameters'] = summaryMeshJobParameter[name];
                }
            }

        }

        function contains(arr, obj) {
            var i = arr.length;
            while (i--) {
                if (arr[i] === obj) {
                    return true;
                }
            }
            return false;
        }
    }

}

SuperMap.SummaryMeshJobParameter = SummaryMeshJobParameter;

;// CONCATENATED MODULE: ./src/common/iServer/SummaryRegionJobParameter.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/






/**
 * @class SuperMap.SummaryRegionJobParameter
 * @category  iServer ProcessingService SummaryRegion
 * @classdesc ĺŚşĺźźć±‡ć€»ĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ç±»ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {string} options.datasetName - ć•°ćŤ®é›†ĺ?Ťă€‚
 * @param {(SuperMap.Bounds|L.Bounds|ol.extent)} [options.query] - ĺ?†ćž?čŚ?ĺ›´ďĽ?é»?č®¤ä¸şĺ…¨ĺ›ľčŚ?ĺ›´ďĽ‰ă€‚
 * @param {string} [options.standardFields] - ć ‡ĺ‡†ĺ±žć€§ĺ­—ć®µĺ?Ťç§°ă€‚
 * @param {string} [options.weightedFields] - ćť?é‡Ťĺ­—ć®µĺ?Ťç§°ă€‚
 * @param {SuperMap.StatisticAnalystMode} [options.standardStatisticModes] - ć ‡ĺ‡†ĺ±žć€§ĺ­—ć®µçš„ç»źč®ˇć¨ˇĺĽŹă€‚standardSummaryFields ä¸ş true ć—¶ĺż…ĺˇ«ă€‚
 * @param {SuperMap.StatisticAnalystMode} [options.weightedStatisticModes] - ćť?é‡Ťĺ­—ć®µçš„ç»źč®ˇć¨ˇĺĽŹă€‚weightedSummaryFields ä¸ş true ć—¶ĺż…ĺˇ«ă€‚ 
 * @param {boolean} [options.sumShape=true] - ć?Żĺ?¦ç»źč®ˇé•żĺş¦ć?–éť˘ç§Żă€‚
 * @param {boolean} [options.standardSummaryFields=false] - ć?Żĺ?¦ä»Ąć ‡ĺ‡†ĺ±žĺ­—ć®µç»źč®ˇă€‚
 * @param {boolean} [options.weightedSummaryFields=false] - ć?Żĺ?¦ä»Ąćť?é‡Ťĺ­—ć®µç»źč®ˇă€‚
 * @param {number} [options.resolution=100] - ç˝‘ć Ľĺ¤§ĺ°Źă€‚
 * @param {number} [options.meshType=0] - ç˝‘ć Ľéť˘ć±‡ć€»ç±»ĺž‹ă€‚
 * @param {SuperMap.AnalystSizeUnit} [options.meshSizeUnit=SuperMap.AnalystSizeUnit.METER] - ç˝‘ć Ľĺ¤§ĺ°ŹĺŤ•ä˝Ťă€‚
 * @param {SuperMap.SummaryType} [options.type=SuperMap.SummaryType.SUMMARYMESH] - ć±‡ć€»ç±»ĺž‹ă€‚
 * @param {SuperMap.OutputSetting} [options.output] - čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ă€‚
 * @param {SuperMap.MappingParameters} [options.mappingParameters] - ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚   
 */
class SummaryRegionJobParameter {

    constructor(options) {
        if (!options) {
            return;
        }

        /**
         * @member {string} SuperMap.SummaryRegionJobParameter.prototype.datasetName
         * @description ć•°ćŤ®é›†ĺ?Ťă€‚
         */
        this.datasetName = "";

        /**
         * @member {string} SuperMap.SummaryRegionJobParameter.prototype.regionDataset
         * @description ć±‡ć€»ć•°ćŤ®ćş?ďĽ?ĺ¤ščľąĺ˝˘ć±‡ć€»ć—¶ç”¨ĺ?°çš„ĺŹ‚ć•°ďĽ‰ă€‚
         */
        this.regionDataset = "";

        /**
         * @member {boolean} [SuperMap.SummaryRegionJobParameter.prototype.sumShape=true]
         * @description ć?Żĺ?¦ç»źč®ˇé•żĺş¦ć?–éť˘ç§Żă€‚
         */
        this.sumShape = true;

        /**
         * @member {(SuperMap.Bounds|L.Bounds|ol.extent)} SuperMap.SummaryRegionJobParameter.prototype.query
         * @description ĺ?†ćž?čŚ?ĺ›´ă€‚
         */
        this.query = "";

        /**
         * @member {boolean} [SuperMap.SummaryRegionJobParameter.prototype.standardSummaryFields=false]
         * @description ć?Żĺ?¦ä»Ąć ‡ĺ‡†ĺ±žĺ­—ć®µç»źč®ˇă€‚
         */
        this.standardSummaryFields = false;

        /**
         * @member {string} SuperMap.SummaryRegionJobParameter.prototype.standardFields
         * @description ć ‡ĺ‡†ĺ±žć€§ĺ­—ć®µĺ?Ťç§°ă€‚ä»…ć”ŻćŚ?çł»ç»źĺ­—ć®µä»Ąĺ¤–çš„ć•´ĺ˝˘ă€?é•żć•´ĺ˝˘ă€?ćµ®ç‚ąĺž‹çš„ĺ­—ć®µçš„ĺ?Ťç§°ă€‚standardSummaryFields ä¸ş true ć—¶ĺż…ĺˇ«ă€‚ 
         */
        this.standardFields = "";

        /**
         * @member {SuperMap.StatisticAnalystMode} SuperMap.SummaryRegionJobParameter.prototype.standardStatisticModes
         * @description ć ‡ĺ‡†ĺ±žć€§ĺ­—ć®µçš„ç»źč®ˇć¨ˇĺĽŹă€‚standardSummaryFields ä¸ş true ć—¶ĺż…ĺˇ«ă€‚
         */
        this.standardStatisticModes = "";

        /**
         * @member {boolean} [SuperMap.SummaryRegionJobParameter.prototype.weightedSummaryFields=false]
         * @description ć?Żĺ?¦ä»Ąćť?é‡Ťĺ­—ć®µç»źč®ˇă€‚
         */
        this.weightedSummaryFields = false;

        /**
         * @member {string} SuperMap.SummaryRegionJobParameter.prototype.weightedFields
         * @description ćť?é‡Ťĺ­—ć®µĺ?Ťç§°ă€‚ä»…ć”ŻćŚ?çł»ç»źĺ­—ć®µä»Ąĺ¤–çš„ć•´ĺ˝˘ă€?é•żć•´ĺ˝˘ă€?ćµ®ç‚ąĺž‹çš„ĺ­—ć®µçš„ĺ?Ťç§°ă€‚weightedSummaryFields ä¸ş true ć—¶ĺż…ĺˇ«ă€‚ 
         */
        this.weightedFields = "";

        /**
         * @member {SuperMap.StatisticAnalystMode} SuperMap.SummaryRegionJobParameter.prototype.weightedStatisticModes
         * @description ä»Ąćť?é‡Ťĺ­—ć®µç»źč®ˇçš„ç»źč®ˇć¨ˇĺĽŹă€‚ćť?é‡Ťĺ­—ć®µçš„ç»źč®ˇć¨ˇĺĽŹă€‚weightedSummaryFields ä¸ş true ć—¶ĺż…ĺˇ«ă€‚ 
         */
        this.weightedStatisticModes = "";

        /**
         * @member {number} [SuperMap.SummaryRegionJobParameter.prototype.meshType=0]
         * @description ç˝‘ć Ľéť˘ć±‡ć€»ç±»ĺž‹ă€‚
         */
        this.meshType = 0;

        /**
         * @member {number} [SuperMap.SummaryRegionJobParameter.prototype.resolution=100]
         * @description ç˝‘ć Ľĺ¤§ĺ°Źă€‚
         */
        this.resolution = 100;

        /**
         * @member {SuperMap.AnalystSizeUnit} [SuperMap.SummaryRegionJobParameter.prototype.meshSizeUnit=SuperMap.AnalystSizeUnit.METER]
         * @description ç˝‘ć Ľĺ¤§ĺ°ŹĺŤ•ä˝Ťă€‚
         */
        this.meshSizeUnit = AnalystSizeUnit.METER;

        /**
         * @member {SuperMap.SummaryType} [SuperMap.SummaryRegionJobParameter.prototype.type=SuperMap.SummaryType.SUMMARYMESH]
         * @description ć±‡ć€»ç±»ĺž‹ă€‚
         */
        this.type = SummaryType.SUMMARYMESH;

        /**
         * @member {SuperMap.OutputSetting} SuperMap.SummaryRegionJobParameter.prototype.output
         * @description čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ç±»
         */
        this.output = null;

        /**
         * @member {SuperMap.MappingParameters} [SuperMap.SummaryRegionJobParameter.prototype.mappingParameters]
         * @description ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚   
         */
        this.mappingParameters = null;

        Util.extend(this, options);

        this.CLASS_NAME = "SuperMap.SummaryRegionJobParameter";
    }

    /**
     * @function SuperMap.SummaryRegionJobParameter.prototype.destroy
     * @description é‡Šć”ľčµ„ćş?ďĽŚĺ°†ĺĽ•ç”¨čµ„ćş?çš„ĺ±žć€§ç˝®ç©şă€‚
     */
    destroy() {
        this.datasetName = null;
        this.sumShape = null;
        this.regionDataset = null;
        this.query = null;
        this.standardSummaryFields = null;
        this.standardFields = null;
        this.standardStatisticModes = null;
        this.weightedSummaryFields = null;
        this.weightedFields = null;
        this.weightedStatisticModes = null;
        this.meshType = null;
        this.resolution = null;
        this.meshSizeUnit = null;
        this.type = null;
        if (this.output instanceof OutputSetting) {
            this.output.destroy();
            this.output = null;
        }
        if (this.mappingParameters instanceof MappingParameters){
            this.mappingParameters.destroy();
            this.mappingParameters = null;
        }
    }

    /**
     * @function SuperMap.SummaryRegionJobParameter.toObject
     * @param {Object} summaryRegionJobParameter - çź˘é‡ŹčŁ?ĺ‰Şĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ă€‚
     * @param {Object} tempObj - ç›®ć ‡ĺŻąč±ˇă€‚
     * @description ç”źć??ĺŚşĺźźć±‡ć€»ĺ?†ćž?ćśŤĺŠˇĺŻąč±ˇă€‚
     */
    static toObject(summaryRegionJobParameter, tempObj) {
        for (var name in summaryRegionJobParameter) {
            if (name === "datasetName") {
                tempObj['input'] = tempObj['input'] || {};
                tempObj['input'][name] = summaryRegionJobParameter[name];
                continue;
            }
            if (name === "type") {
                tempObj['type'] = summaryRegionJobParameter[name];
                continue;
            }
            if (name === "type") {
                tempObj['type'] = summaryRegionJobParameter[name];
                continue;
            }
            if (name === "output") {
                tempObj['output'] = tempObj['output'] || {};
                tempObj['output'] = summaryRegionJobParameter[name];
                continue;
            }
            if (summaryRegionJobParameter.type === "SUMMARYREGION" || summaryRegionJobParameter.type === "SUMMARYMESH" && name !== "regionDataset") {
                tempObj['analyst'] = tempObj['analyst'] || {};
                if (name === 'query' && summaryRegionJobParameter[name]) {
                    tempObj['analyst'][name] = summaryRegionJobParameter[name].toBBOX();
                } else {
                    tempObj['analyst'][name] = summaryRegionJobParameter[name];
                }
                if(name === 'mappingParameters'){
                    tempObj['analyst'][name] = tempObj['analyst'][name] || {};
                    tempObj['analyst']['mappingParameters'] = summaryRegionJobParameter[name];
                }

            }
        }
    }

}

SuperMap.SummaryRegionJobParameter = SummaryRegionJobParameter;

;// CONCATENATED MODULE: ./src/common/iServer/OverlayGeoJobParameter.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/





/**
 * @class SuperMap.OverlayGeoJobParameter
 * @category iServer ProcessingService OverlayAnalyst
 * @classdesc ĺŹ ĺŠ ĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ç±»ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {string} options.datasetName - ć•°ćŤ®é›†ĺ?Ťă€‚
 * @param {string} options.datasetOverlay - ĺŹ ĺŠ ĺŻąč±ˇć‰€ĺś¨çš„ć•°ćŤ®é›†ĺ?Ťç§°ă€‚
 * @param {string} options.srcFields - čľ“ĺ…Ąć•°ćŤ®éś€č¦?äżťç•™çš„ĺ­—ć®µă€‚
 * @param {string} [options.overlayFields] - ĺŹ ĺŠ ć•°ćŤ®éś€č¦?äżťç•™çš„ĺ­—ć®µă€‚ĺŻąĺ?†ćž?ć¨ˇĺĽŹä¸ş clipă€?updateă€?erase ć—¶ďĽŚć­¤ĺŹ‚ć•°ć— ć•?ă€‚
 * @param {string} [options.mode] - ĺŹ ĺŠ ĺ?†ćž?ć¨ˇĺĽŹă€‚
 * @param {SuperMap.OutputSetting} [options.output] - čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ă€‚
 * @param {SuperMap.MappingParameters} [options.mappingParameters] - ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚   
 */
class OverlayGeoJobParameter {

    constructor(options) {
        if (!options) {
            return;
        }
        /**
         * @member {string} SuperMap.OverlayGeoJobParameter.prototype.datasetName
         * @description ć•°ćŤ®é›†ĺ?Ťă€‚
         */
        this.datasetName = "";

        /**
         * @member {string} SuperMap.OverlayGeoJobParameter.prototype.datasetOverlay
         * @description ĺŹ ĺŠ ĺŻąč±ˇć‰€ĺś¨çš„ć•°ćŤ®é›†ĺ?Ťç§°ă€‚
         */
        this.datasetOverlay = "";

        /**
         * @member {string} [SuperMap.OverlayGeoJobParameter.prototype.mode]
         * @description ĺŹ ĺŠ ĺ?†ćž?ć¨ˇĺĽŹă€‚
         */
        this.mode = "";

        /**
         * @member {string} SuperMap.OverlayGeoJobParameter.prototype.srcFields
         * @description čľ“ĺ…Ąć•°ćŤ®éś€č¦?äżťç•™çš„ĺ­—ć®µă€‚
         */
        this.srcFields = "";

        /**
         * @member {string} SuperMap.OverlayGeoJobParameter.prototype.overlayFields
         * @description ĺŹ ĺŠ ć•°ćŤ®éś€č¦?äżťç•™çš„ĺ­—ć®µďĽŚĺŻąĺ?†ćž?ć¨ˇĺĽŹä¸ş clipă€?updateă€?erase ć—¶ďĽŚć­¤ĺŹ‚ć•°ć— ć•?ă€‚
         */
        this.overlayFields = "";

        /**
         * @member {SuperMap.OutputSetting} [SuperMap.OverlayGeoJobParameter.prototype.output]
         * @description čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ç±»ă€‚
         */
        this.output = null;

        /**
        * @member {SuperMap.MappingParameters} [SuperMap.OverlayGeoJobParameter.prototype.mappingParameters]
        * @description ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚   
        */
        this.mappingParameters = null;

        Util.extend(this, options);
        this.CLASS_NAME = "SuperMap.OverlayGeoJobParameter";
    }

    /**
     * @function SuperMap.OverlayGeoJobParameter.destroy
     * @override
     */
    destroy() {
        this.datasetName = null;
        this.datasetOverlay = null;
        this.mode = null;
        this.srcFields = null;
        this.overlayFields = null;
        if (this.output instanceof OutputSetting) {
            this.output.destroy();
            this.output = null;
        }
        if (this.mappingParameters instanceof MappingParameters) {
            this.mappingParameters.destroy();
            this.mappingParameters = null;
        }
    }

    /**
     * @function SuperMap.OverlayGeoJobParameter.toObject
     * @param {Object} OverlayGeoJobParameter - ç‚ąč?šĺ??ĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ă€‚
     * @param {Object} tempObj - ç›®ć ‡ĺŻąč±ˇă€‚
     * @description ç”źć??ç‚ąč?šĺ??ĺ?†ćž?ä»»ĺŠˇĺŻąč±ˇă€‚
     */
    static toObject(OverlayGeoJobParameter, tempObj) {
        for (var name in OverlayGeoJobParameter) {
            if (name == "datasetName") {
                tempObj['input'] = tempObj['input'] || {};
                tempObj['input'][name] = OverlayGeoJobParameter[name];
                continue;
            }
            if (name === "output") {
                tempObj['output'] = tempObj['output'] || {};
                tempObj['output'] = OverlayGeoJobParameter[name];
                continue;
            }
            
            tempObj['analyst'] = tempObj['analyst'] || {};
            tempObj['analyst'][name] = OverlayGeoJobParameter[name];
            if(name === 'mappingParameters'){
                tempObj['analyst'][name] = tempObj['analyst'][name] || {};
                tempObj['analyst']['mappingParameters'] = OverlayGeoJobParameter[name];
            }
        }
    }

}

SuperMap.OverlayGeoJobParameter = OverlayGeoJobParameter;
;// CONCATENATED MODULE: ./src/common/iServer/BuffersAnalystJobsParameter.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/






/**
 * @class SuperMap.BuffersAnalystJobsParameter
 * @category iServer ProcessingService BufferAnalyst
 * @classdesc çĽ“ĺ†˛ĺŚşĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ç±»ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {string} options.datasetName - ć•°ćŤ®é›†ĺ?Ťă€‚
 * @param {(SuperMap.Bounds|L.Bounds|ol.extent)} [options.bounds] - ĺ?†ćž?čŚ?ĺ›´ďĽ?é»?č®¤ä¸şĺ…¨ĺ›ľčŚ?ĺ›´ďĽ‰ă€‚
 * @param {string} [options.distance='15'] - çĽ“ĺ†˛č·ťç¦»ďĽŚć?–çĽ“ĺ†˛ĺŚşĺŤŠĺľ„ă€‚
 * @param {string} [options.distanceField='pickup_latitude'] - çĽ“ĺ†˛ĺŚşĺ?†ćž?č·ťç¦»ĺ­—ć®µă€‚
 * @param {SuperMap.AnalystSizeUnit} [options.distanceUnit=SuperMap.AnalystSizeUnit.METER] - çĽ“ĺ†˛č·ťç¦»ĺŤ•ä˝ŤĺŤ•ä˝Ťă€‚
 * @param {SuperMap.OutputSetting} [options.output] - čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ă€‚
 * @param {SuperMap.MappingParameters} [options.mappingParameters] - ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚
 */
class BuffersAnalystJobsParameter {
    constructor(options) {
        /**
         * @member {string} SuperMap.BuffersAnalystJobsParameter.prototype.datasetName
         * @description ć•°ćŤ®é›†ĺ?Ťă€‚
         */
        this.datasetName = '';

        /**
         * @member {(SuperMap.Bounds|L.Bounds|ol.extent)} SuperMap.BuffersAnalystJobsParameter.prototype.bounds
         * @description ĺ?†ćž?čŚ?ĺ›´ă€‚
         */
        this.bounds = '';

        /**
         * @member {string} [SuperMap.BuffersAnalystJobsParameter.prototype.distance='15']
         * @description çĽ“ĺ†˛č·ťç¦»ďĽŚć?–ç§°ä¸şçĽ“ĺ†˛ĺŚşĺŤŠĺľ„ă€‚ĺ˝“çĽ“ĺ†˛č·ťç¦»ĺ­—ć®µä˝Ťç©şć—¶ďĽŚć­¤ĺŹ‚ć•°ćś‰ć•?ă€‚
         */
        this.distance = '';

        /**
         * @member {string} [SuperMap.BuffersAnalystJobsParameter.prototype.distanceField='pickup_latitude']
         * @description çĽ“ĺ†˛č·ťç¦»ĺ­—ć®µă€‚
         */
        this.distanceField = '';

        /**
         * @member {SuperMap.AnalystSizeUnit} [SuperMap.BuffersAnalystJobsParameter.prototype.distanceUnit=SuperMap.AnalystSizeUnit.METER]
         * @description çĽ“ĺ†˛č·ťç¦»ĺŤ•ä˝Ťă€‚
         */
        this.distanceUnit = AnalystSizeUnit.METER;

        /**
         * @member {string} SuperMap.BuffersAnalystJobsParameter.prototype.dissolveField
         * @description čžŤĺ??ĺ­—ć®µďĽŚć ąćŤ®ĺ­—ć®µĺ€ĽĺŻąçĽ“ĺ†˛ĺŚşç»“ćžśéť˘ĺŻąč±ˇčż›čˇŚčžŤĺ??ă€‚
         */
        this.dissolveField = '';

        /**
         * @member {SuperMap.OutputSetting} [SuperMap.BuffersAnalystJobsParameter.prototype.output]
         * @description čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ç±»ă€‚
         */
        this.output = null;

        /**
         * @member {SuperMap.MappingParameters} [SuperMap.BuffersAnalystJobsParameter.prototype.mappingParameters]
         * @description ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚
         */
        this.mappingParameters = null;

        if (!options) {
            return this;
        }
        Util.extend(this, options);

        this.CLASS_NAME = 'SuperMap.BuffersAnalystJobsParameter';
    }

    /**
     * @function SuperMap.BuffersAnalystJobsParameter.prototype.destroy
     * @description é‡Šć”ľčµ„ćş?ďĽŚĺ°†ĺĽ•ç”¨čµ„ćş?çš„ĺ±žć€§ç˝®ç©şă€‚
     */
    destroy() {
        this.datasetName = null;
        this.bounds = null;
        this.distance = null;
        this.distanceField = null;
        this.distanceUnit = null;
        this.dissolveField = null;
        if (this.output instanceof OutputSetting) {
            this.output.destroy();
            this.output = null;
        }
        if (this.mappingParameters instanceof MappingParameters) {
            this.mappingParameters.destroy();
            this.mappingParameters = null;
        }
    }

    /**
     * @function SuperMap.BuffersAnalystJobsParameter.toObject
     * @param {SuperMap.BuffersAnalystJobsParameter} BuffersAnalystJobsParameter - çĽ“ĺ†˛ĺŚşĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ă€‚
     * @param {Object} tempObj - ç›®ć ‡ĺŻąč±ˇă€‚
     * @description ç”źć??çĽ“ĺ†˛ĺŚşĺ?†ćž?ä»»ĺŠˇĺŻąč±ˇă€‚
     */
    static toObject(BuffersAnalystJobsParameter, tempObj) {
        for (var name in BuffersAnalystJobsParameter) {
            if (name === 'datasetName') {
                tempObj['input'] = tempObj['input'] || {};
                tempObj['input'][name] = BuffersAnalystJobsParameter[name];
                continue;
            }
            if (name === 'output') {
                tempObj['output'] = tempObj['output'] || {};
                tempObj['output'] = BuffersAnalystJobsParameter[name];
                continue;
            }

            tempObj['analyst'] = tempObj['analyst'] || {};
            if (name === 'bounds' && BuffersAnalystJobsParameter[name]) {
                tempObj['analyst'][name] = BuffersAnalystJobsParameter[name].toBBOX();
            } else {
                tempObj['analyst'][name] = BuffersAnalystJobsParameter[name];
            }
            if (name === 'mappingParameters') {
                tempObj['analyst'][name] = tempObj['analyst'][name] || {};
                tempObj['analyst']['mappingParameters'] = BuffersAnalystJobsParameter[name];
            }
        }
    }
}

SuperMap.BuffersAnalystJobsParameter = BuffersAnalystJobsParameter;

;// CONCATENATED MODULE: ./src/common/iServer/TopologyValidatorJobsParameter.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/






/**
 * @class SuperMap.TopologyValidatorJobsParameter
 * @category  iServer ProcessingService TopologyValidator
 * @classdesc ć‹“ć‰‘ćŁ€ćźĄĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ç±»ă€‚
 * @param {Object} options - ĺż…ĺˇ«ĺŹ‚ć•°ă€‚
 * @param {string} options.datasetName - ć•°ćŤ®é›†ĺ?Ťă€‚
 * @param {string} options.datasetTopology -ćŁ€ćźĄĺŻąč±ˇć‰€ĺś¨çš„ć•°ćŤ®é›†ĺ?Ťç§°ă€‚
 * @param {SuperMap.TopologyValidatorRule} [options.rule=SuperMap.TopologyValidatorRule.REGIONNOOVERLAP] - ć‹“ć‰‘ćŁ€ćźĄč§„ĺ?™ă€‚
 * @param {string} [options.tolerance] - ĺ®ąé™?ă€‚
 * @param {SuperMap.OutputSetting} [options.output] - čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ă€‚
 * @param {SuperMap.MappingParameters} [options.mappingParameters] - ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚   
 */
class TopologyValidatorJobsParameter {

    constructor(options) {
        if (!options) {
            return;
        }
        /**
         * @member {string} SuperMap.TopologyValidatorJobsParameter.prototype.datasetName
         * @description ć•°ćŤ®é›†ĺ?Ťă€‚
         */
        this.datasetName = "";

        /**
         * @member {string} SuperMap.TopologyValidatorJobsParameter.prototype.datasetTopology
         * @description ć‹“ć‰‘ćŁ€ćźĄĺŻąč±ˇć‰€ĺś¨çš„ć•°ćŤ®é›†ĺ?Ťç§°ă€‚
         */
        this.datasetTopology = "";

        /**
         * @member {string} [SuperMap.TopologyValidatorJobsParameter.prototype.tolerance]
         * @description ĺ®ąé™?ďĽŚćŚ‡ĺ®šçš„ć‹“ć‰‘é”™čŻŻćŁ€ćźĄć—¶ä˝żç”¨çš„ĺ®ąé™?ă€‚
         */
        this.tolerance = "";

        /**
         * @member {SuperMap.TopologyValidatorRule} [SuperMap.TopologyValidatorJobsParameter.prototype.rule=SuperMap.TopologyValidatorRule.REGIONNOOVERLAP]
         * @description ć‹“ć‰‘ćŁ€ćźĄć¨ˇĺĽŹă€‚
         */
        this.rule = TopologyValidatorRule.REGIONNOOVERLAP;

        /**
         * @member {SuperMap.OutputSetting} [SuperMap.TopologyValidatorJobsParameter.prototype.output]
         * @description čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ç±»ă€‚
         */
        this.output = null;

        /**
         * @member {SuperMap.MappingParameters} [SuperMap.TopologyValidatorJobsParameter.prototype.mappingParameters]
         * @description ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚   
         */
        this.mappingParameters = null;

        Util.extend(this, options);

        this.CLASS_NAME = "SuperMap.TopologyValidatorJobsParameter";
    }

    /**
     * @function SuperMap.TopologyValidatorJobsParameter.prototype.destroy
     * @description é‡Šć”ľčµ„ćş?ďĽŚĺ°†ĺĽ•ç”¨čµ„ćş?çš„ĺ±žć€§ç˝®ç©şă€‚
     */
    destroy() {
        this.datasetName = null;
        this.datasetTopology = null;
        this.tolerance = null;
        this.rule = null;
        if (this.output instanceof OutputSetting) {
            this.output.destroy();
            this.output = null;
        }
        if (this.mappingParameters instanceof MappingParameters) {
            this.mappingParameters.destroy();
            this.mappingParameters = null;
        }
    }

    /**
     * @function SuperMap.TopologyValidatorJobsParameter.toObject
     * @param {Object} TopologyValidatorJobsParameter -ć‹“ć‰‘ćŁ€ćźĄĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ă€‚
     * @param {Object} tempObj - ç›®ć ‡ĺŻąč±ˇă€‚
     * @description ç”źć??ć‹“ć‰‘ćŁ€ćźĄĺ?†ćž?ä»»ĺŠˇĺŻąč±ˇă€‚
     */
    static toObject(TopologyValidatorJobsParameter, tempObj) {
        for (var name in TopologyValidatorJobsParameter) {
            if (name === "datasetName") {
                tempObj['input'] = tempObj['input'] || {};
                tempObj['input'][name] = TopologyValidatorJobsParameter[name];
                continue;
            }
            if (name === "output") {
                tempObj['output'] = tempObj['output'] || {};
                tempObj['output'] = TopologyValidatorJobsParameter[name];
                continue;
            }
            tempObj['analyst'] = tempObj['analyst'] || {};
            tempObj['analyst'][name] = TopologyValidatorJobsParameter[name];
            if(name === 'mappingParameters'){
                tempObj['analyst'][name] = tempObj['analyst'][name] || {};
                tempObj['analyst']['mappingParameters'] = TopologyValidatorJobsParameter[name];
            }
        }
    }
}

SuperMap.TopologyValidatorJobsParameter = TopologyValidatorJobsParameter;
;// CONCATENATED MODULE: ./src/common/iServer/GeoCodingParameter.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/



/**
 * @class SuperMap.GeoCodingParameter
 * @category  iServer AddressMatch
 * @classdesc ĺś°ç?†ć­Łĺ?‘ĺŚąé…ŤĺŹ‚ć•°ç±»ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚ 
 * @param {string} options.address - ĺś°ç‚ąĺ…łé”®čŻŤă€‚ 
 * @param {number} [options.fromIndex] - č®ľç˝®čż”ĺ›žĺŻąč±ˇçš„čµ·ĺ§‹ç´˘ĺĽ•ĺ€Ľă€‚ 
 * @param {number} [options.toIndex] - č®ľç˝®čż”ĺ›žĺŻąč±ˇçš„ç»“ćťźç´˘ĺĽ•ĺ€Ľă€‚ 
 * @param {Array.<string>} [options.filters] - čż‡ć»¤ĺ­—ć®µďĽŚé™?ĺ®šćźĄčŻ˘ĺŚşĺźźă€‚ 
 * @param {string} [options.prjCoordSys] - ćźĄčŻ˘ç»“ćžśçš„ĺť?ć ‡çł»ă€‚ 
 * @param {number} [options.maxReturn] - ćś€ĺ¤§čż”ĺ›žç»“ćžść•°ă€‚
 */
class GeoCodingParameter {
    constructor(options) {
        if (options.filters && typeof(options.filters) === 'string') {        
            options.filters =  options.filters.split(',');
        }
        /**
         * @member {string} SuperMap.GeoCodingParameter.prototype.address
         * @description ĺś°ç‚ąĺ…łé”®čŻŤă€‚
         */
        this.address = null;

        /**
         * @member {number} [SuperMap.GeoCodingParameter.prototype.fromIndex]
         * @description č®ľç˝®čż”ĺ›žĺŻąč±ˇçš„čµ·ĺ§‹ç´˘ĺĽ•ĺ€Ľă€‚
         */
        this.fromIndex = null;

        /**
         * @member {number} [SuperMap.GeoCodingParameter.prototype.toIndex]
         * @description č®ľç˝®čż”ĺ›žĺŻąč±ˇçš„ç»“ćťźç´˘ĺĽ•ĺ€Ľă€‚
         */
        this.toIndex = null;

        /**
         * @member {Array.<string>} [SuperMap.GeoCodingParameter.prototype.filters]
         * @description čż‡ć»¤ĺ­—ć®µďĽŚé™?ĺ®šćźĄčŻ˘ĺŚşĺźźă€‚
         */
        this.filters = null;

        /**
         * @member {string} [SuperMap.GeoCodingParameter.prototype.prjCoordSys]
         * @description  ćźĄčŻ˘ç»“ćžśçš„ĺť?ć ‡çł»ă€‚
         */
        this.prjCoordSys = null;

        /**
         * @member {number} [SuperMap.GeoCodingParameter.prototype.maxReturn]
         * @description ćś€ĺ¤§čż”ĺ›žç»“ćžść•°ă€‚
         */
        this.maxReturn = null;
        Util.extend(this, options);
    }

    /**
     * @function SuperMap.GeoCodingParameter.prototype.destroy
     * @description é‡Šć”ľčµ„ćş?ďĽŚĺ°†ĺĽ•ç”¨čµ„ćş?çš„ĺ±žć€§ç˝®ç©şă€‚
     */
    destroy() {
        this.address = null;
        this.fromIndex = null;
        this.toIndex = null;
        this.filters = null;
        this.prjCoordSys = null;
        this.maxReturn = null;
    }

}

SuperMap.GeoCodingParameter = GeoCodingParameter;
;// CONCATENATED MODULE: ./src/common/iServer/GeoDecodingParameter.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/



/**
 * @class SuperMap.GeoDecodingParameter
 * @category iServer AddressMatch
 * @classdesc ĺś°ç?†ĺŹŤĺ?‘ĺŚąé…ŤĺŹ‚ć•°ç±»ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚ 
 * @param {number} options.x - ćźĄčŻ˘ä˝Ťç˝®çš„ć¨Şĺť?ć ‡ă€‚ 
 * @param {number} options.y - ćźĄčŻ˘ä˝Ťç˝®çš„çşµĺť?ć ‡ă€‚ 
 * @param {number} [options.fromIndex] - č®ľç˝®čż”ĺ›žĺŻąč±ˇçš„čµ·ĺ§‹ç´˘ĺĽ•ĺ€Ľă€‚ 
 * @param {Array.<string>} [options.filters] - čż‡ć»¤ĺ­—ć®µďĽŚé™?ĺ®šćźĄčŻ˘ĺŚşĺźźă€‚ 
 * @param {string} [options.prjCoordSys] - ćźĄčŻ˘ç»“ćžśçš„ĺť?ć ‡çł»ă€‚ 
 * @param {number} [options.maxReturn] - ćś€ĺ¤§čż”ĺ›žç»“ćžść•°ă€‚ 
 * @param {number} [options.geoDecodingRadius] - ćźĄčŻ˘ĺŤŠĺľ„ă€‚
 */
class GeoDecodingParameter {


    constructor(options) {

        if (options.filters) {
            options.filters = options.filters.split(',');
        }
        /**
         * @member {number} SuperMap.GeoDecodingParameter.prototype.x
         * @description ćźĄčŻ˘ä˝Ťç˝®çš„ć¨Şĺť?ć ‡ă€‚
         */
        this.x = null;

        /**
         * @member {number} SuperMap.GeoDecodingParameter.prototype.y
         * @description ćźĄčŻ˘ä˝Ťç˝®çš„çşµĺť?ć ‡ă€‚
         */
        this.y = null;
        /**
         * @member {number} [SuperMap.GeoDecodingParameter.prototype.fromIndex]
         * @description  č®ľç˝®čż”ĺ›žĺŻąč±ˇçš„čµ·ĺ§‹ç´˘ĺĽ•ĺ€Ľă€‚
         */
        this.fromIndex = null;

        /**
         * @member {number} [SuperMap.GeoDecodingParameter.prototype.toIndex]
         * @description č®ľç˝®čż”ĺ›žĺŻąč±ˇçš„ç»“ćťźç´˘ĺĽ•ĺ€Ľă€‚
         */
        this.toIndex = null;

        /**
         * @member {Array.<string>} [SuperMap.GeoDecodingParameter.prototype.filters]
         * @description čż‡ć»¤ĺ­—ć®µďĽŚé™?ĺ®šćźĄčŻ˘ĺŚşĺźźă€‚
         */
        this.filters = null;

        /**
         * @member {string} [SuperMap.GeoDecodingParameter.prototype.prjCoordSys]
         * @description ćźĄčŻ˘ç»“ćžśçš„ĺť?ć ‡çł»ă€‚
         */
        this.prjCoordSys = null;

        /**
         *  @member {number} [SuperMap.GeoDecodingParameter.prototype.maxReturn]
         *  @description ćś€ĺ¤§čż”ĺ›žç»“ćžść•°ă€‚
         */
        this.maxReturn = null;

        /**
         * @member {number} SuperMap.GeoDecodingParameter.prototype.geoDecodingRadius
         * @description ćźĄčŻ˘ĺŤŠĺľ„ă€‚
         */
        this.geoDecodingRadius = null;
        Util.extend(this, options);
    }

    /**
     * @function SuperMap.GeoDecodingParameter.prototype.destroy
     * @description é‡Šć”ľčµ„ćş?ďĽŚĺ°†ĺĽ•ç”¨čµ„ćş?çš„ĺ±žć€§ç˝®ç©şă€‚
     */
    destroy() {
        this.x = null;
        this.y = null;
        this.fromIndex = null;
        this.toIndex = null;
        this.filters = null;
        this.prjCoordSys = null;
        this.maxReturn = null;
        this.geoDecodingRadius = null;
    }

}

SuperMap.GeoDecodingParameter = GeoDecodingParameter;
;// CONCATENATED MODULE: ./src/classic/SuperMap.js
var SuperMap_SuperMap = window.SuperMap = window.SuperMap || {};
SuperMap_SuperMap.REST = SuperMap_SuperMap.REST || {};

;// CONCATENATED MODULE: external "function(){try{return mapv}catch(e){return {}}}()"
const external_function_try_return_mapv_catch_e_return_namespaceObject = function(){try{return mapv}catch(e){return {}}}();
;// CONCATENATED MODULE: ./src/common/util/MapCalculateUtil.js


var getMeterPerMapUnit = function(mapUnit) {
    var earchRadiusInMeters = 6378137;
    var meterPerMapUnit;
    if (mapUnit === Unit.METER) {
        meterPerMapUnit = 1;
    } else if (mapUnit === Unit.DEGREE) {
        // ćŻŹĺş¦čˇ¨ç¤şĺ¤šĺ°‘ç±łă€‚
        meterPerMapUnit = (Math.PI * 2 * earchRadiusInMeters) / 360;
    } else if (mapUnit === Unit.KILOMETER) {
        meterPerMapUnit = 1.0e-3;
    } else if (mapUnit === Unit.INCH) {
        meterPerMapUnit = 1 / 2.5399999918e-2;
    } else if (mapUnit === Unit.FOOT) {
        meterPerMapUnit = 0.3048;
    } else {
        return meterPerMapUnit;
    }
    return meterPerMapUnit;
};

function getWrapNum(x, includeMax = true, includeMin = true, range = [-180, 180]) {
    var max = range[1],
        min = range[0],
        d = max - min;
    if (x === max && includeMax) {
        return x;
    }
    if (x === min && includeMin) {
        return x;
    }
    var tmp = (((x - min) % d) + d) % d;
    if (tmp === 0 && includeMax) {
        return max;
    }
    return ((((x - min) % d) + d) % d) + min;
}

function conversionDegree(degrees) {
    const degree = parseInt(degrees);
    let fraction = parseInt((degrees - degree) * 60);
    let second = parseInt(((degrees - degree) * 60 - fraction) * 60);
    fraction = parseInt(fraction / 10) === 0 ? `0${fraction}` : fraction;
    second = parseInt(second / 10) === 0 ? `0${second}` : second;
    return `${degree}Â°${fraction}'${second}`;
}

;// CONCATENATED MODULE: ./src/classic/overlay/mapv/MapVRenderer.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/




/**
 * @class MapVRenderer
 * @classdesc MapVć¸˛ćź“ĺ™¨ă€‚
 * @private
 * @extends {mapv.baiduMapLayer}
 * @param {SuperMap.Map} map - ĺľ…ć¸˛ćź“çš„ĺś°ĺ›ľă€‚
 * @param {SuperMap.Layer.MapVLayer} layer - ĺľ…ć¸˛ćź“çš„ĺ›ľĺ±‚ă€‚
 * @param {Mapv.DataSet} dataSet - ĺľ…ć¸˛ćź“çš„ć•°ćŤ®é›†ďĽŚć•°ćŤ®ć‰€ĺ±žĺť?ć ‡çł»č¦?ć±‚ä¸Ž map äżťćŚ?ä¸€č‡´ă€‚
 * @param {Object} options - ć¸˛ćź“çš„ĺŹ‚ć•°ă€‚
 */
var MapVBaseLayer = external_function_try_return_mapv_catch_e_return_namespaceObject.baiduMapLayer ? external_function_try_return_mapv_catch_e_return_namespaceObject.baiduMapLayer.__proto__ : Function;

class MapVRenderer extends MapVBaseLayer {
    constructor(map, layer, dataSet, options) {
        super(map, dataSet, options);
        if (!MapVBaseLayer) {
            return this;
        }

        var self = this;
        options = options || {};

        self.init(options);
        self.argCheck(options);
        this.canvasLayer = layer;
        this.clickEvent = this.clickEvent.bind(this);
        this.mousemoveEvent = this.mousemoveEvent.bind(this);
        this.bindEvent();
    }

    /**
     * @function MapvRenderer.prototype.clickEvent
     * @description ç‚ąĺ‡»äş‹ä»¶ă€‚
     * @param {Object} e -  č§¦ĺŹ‘ĺŻąč±ˇă€‚
     */
    clickEvent(e) {
        var pixel = e.xy;
        var devicePixelRatio = this.devicePixelRatio || 1;
        super.clickEvent({ x: pixel.x / devicePixelRatio, y: pixel.y / devicePixelRatio }, e);
    }

    /**
     * @function MapvRenderer.prototype.mousemoveEvent
     * @description éĽ ć ‡ç§»ĺŠ¨äş‹ä»¶ă€‚
     * @param {Object} e - č§¦ĺŹ‘ĺŻąč±ˇă€‚
     */
    mousemoveEvent(e) {
        var pixel = e.xy;
        super.mousemoveEvent(pixel, e);
    }

    /**
     * @function MapvRenderer.prototype.bindEvent
     * @description ç»‘ĺ®šéĽ ć ‡ç§»ĺŠ¨ĺ’ŚéĽ ć ‡ç‚ąĺ‡»äş‹ä»¶ă€‚
     */
    bindEvent() {
        var map = this.map;

        if (this.options.methods) {
            if (this.options.methods.click) {
                map.events.on({ click: this.clickEvent });
            }
            if (this.options.methods.mousemove) {
                map.events.on({ mousemove: this.mousemoveEvent });
            }
        }
    }

    /**
     * @function MapvRenderer.prototype.unbindEvent
     * @description č§Łç»‘éĽ ć ‡ç§»ĺŠ¨ĺ’ŚéĽ ć ‡ć»‘ĺŠ¨č§¦ĺŹ‘çš„äş‹ä»¶ă€‚
     */
    unbindEvent() {
        var map = this.map;

        if (this.options.methods) {
            if (this.options.methods.click) {
                map.events.un({ click: this.clickEvent });
            }
            if (this.options.methods.mousemove) {
                map.events.un({ mousemove: this.mousemoveEvent });
            }
        }
    }

    /**
     * @function MapvRenderer.prototype.getContext
     * @description čŽ·ĺŹ–äżˇć?Żă€‚
     */
    getContext() {
        return this.canvasLayer && this.canvasLayer.canvasContext;
    }

    /**
     * @function MapvRenderer.prototype.addData
     * @description čż˝ĺŠ ć•°ćŤ®
     * @param {oject} data - ĺľ…ć·»ĺŠ çš„ć•°ćŤ®ă€‚
     * @param {oject} options - ĺľ…ć·»ĺŠ çš„ć•°ćŤ®äżˇć?Żă€‚
     */
    addData(data, options) {
        var _data = data;
        if (data && data.get) {
            _data = data.get();
        }
        this.dataSet.add(_data);
        this.update({ options: options });
    }

    /**
     * @function MapvRenderer.prototype.updateData
     * @description ć›´ć–°č¦†ç›–ĺŽźć•°ćŤ®ă€‚
     * @param {oject} data - ĺľ…ć›´ć–°çš„ć•°ćŤ®ă€‚
     * @param {oject} options - ĺľ…ć›´ć–°çš„ć•°ćŤ®äżˇć?Żă€‚
     */
    setData(data, options) {
        var _data = data;
        if (data && data.get) {
            _data = data.get();
        }
        this.dataSet = this.dataSet || new external_function_try_return_mapv_catch_e_return_namespaceObject.DataSet();
        this.dataSet.set(_data);
        this.update({ options: options });
    }

    /**
     * @function MapvRenderer.prototype.getData
     * @description čŽ·ĺŹ–ć•°ćŤ®ă€‚
     */
    getData() {
        return this.dataSet;
    }

    /**
     * @function MapvRenderer.prototype.removeData
     * @description ĺ? é™¤ç¬¦ĺ??čż‡ć»¤ćťˇä»¶çš„ć•°ćŤ®ă€‚
     * @param {function} filter - čż‡ć»¤ćťˇä»¶ă€‚ćťˇä»¶ĺŹ‚ć•°ä¸şć•°ćŤ®éˇąďĽŚčż”ĺ›žĺ€Ľä¸ş trueďĽŚčˇ¨ç¤şĺ? é™¤čŻĄĺ…?ç´ ďĽ›ĺ?¦ĺ?™čˇ¨ç¤şä¸Ťĺ? é™¤ă€‚
     */
    removeData(filter) {
        if (!this.dataSet) {
            return;
        }
        var newData = this.dataSet.get({
            filter: function (data) {
                return filter != null && typeof filter === 'function' ? !filter(data) : true;
            }
        });
        this.dataSet.set(newData);
        this.update({ options: null });
    }

    /**
     * @function MapvRenderer.prototype.clearData
     * @description ć¸…é™¤ć•°ćŤ®ă€‚
     */
    clearData() {
        this.dataSet && this.dataSet.clear();
        this.update({ options: null });
    }

    /**
     * @function MapvRenderer.prototype.render
     * @description çť€č‰˛ă€‚
     * @param {number} time
     */
    render(time) {
        this._canvasUpdate(time);
    }

    /**
     * @function MapvRenderer.prototype.transferToMercator
     * @description ĺ˘¨ĺŤˇć‰?ĺť?ć ‡ä¸şç»Źçş¬ĺş¦ă€‚
     * @deprecated
     */
    transferToMercator() {
        if (this.options.coordType && ['bd09mc', 'coordinates_mercator'].indexOf(this.options.coordType) > -1) {
            var data = this.dataSet.get();
            data = this.dataSet.transferCoordinate(
                data,
                function (coordinates) {
                    var pixel = SuperMap_SuperMap.Projection.transform(
                        {
                            x: coordinates[0],
                            y: coordinates[1]
                        },
                        'EPSG:3857',
                        'EPSG:4326'
                    );
                    return [pixel.x, pixel.y];
                },
                'coordinates',
                'coordinates'
            );
            this.dataSet._set(data);
        }
    }

    _canvasUpdate(time) {
        if (!this.canvasLayer) {
            return;
        }

        var self = this;

        var animationOptions = self.options.animation;

        var context = this.getContext();
        var map = this.map;
        if (self.isEnabledTime()) {
            if (time === undefined) {
                this.clear(context);
                return;
            }
            if (this.context === '2d') {
                context.save();
                context.globalCompositeOperation = 'destination-out';
                context.fillStyle = 'rgba(0, 0, 0, .1)';
                context.fillRect(0, 0, context.canvas.width, context.canvas.height);
                context.restore();
            }
        } else {
            this.clear(context);
        }

        if (this.context === '2d') {
            for (var key in self.options) {
                context[key] = self.options[key];
            }
        } else {
            context.clear(context.COLOR_BUFFER_BIT);
        }

        if (
            (self.options.minZoom && map.getZoom() < self.options.minZoom) ||
            (self.options.maxZoom && map.getZoom() > self.options.maxZoom)
        ) {
            return;
        }
        var layer = self.canvasLayer;

        var dataGetOptions = {
            fromColumn: 'coordinates',
            transferCoordinate: function (coordinate) {
                var coord = { lon: coordinate[0], lat: coordinate[1] };
                var worldPoint = map.getViewPortPxFromLonLat(coord);
                return [worldPoint.x, worldPoint.y];
            }
        };

        if (time !== undefined) {
            dataGetOptions.filter = function (item) {
                var trails = animationOptions.trails || 10;
                return time && item.time > time - trails && item.time < time;
            };
        }

        var data = self.dataSet.get(dataGetOptions);

        this.processData(data);
        // ä¸€ä¸Şĺ?Źç´ ć?Żĺ¤šĺ°‘ç±ł
        var zoomUnit = map.getResolution() * getMeterPerMapUnit('DEGREE');
        // // ĺ…Ľĺ®ąunitä¸ş'm'çš„ć?…ĺ†µ
        if (self.options.unit === 'm') {
            if (self.options.size) {
                self.options._size = self.options.size / zoomUnit;
            }
            if (self.options.width) {
                self.options._width = self.options.width / zoomUnit;
            }
            if (self.options.height) {
                self.options._height = self.options.height / zoomUnit;
            }
        } else {
            self.options._size = self.options.size;
            self.options._height = self.options.height;
            self.options._width = self.options.width;
        }

        var worldPoint = map.getViewPortPxFromLonLat(layer.transferToMapLatLng({ lon: 0, lat: 0 }));

        this.drawContext(context, data, self.options, worldPoint);

        self.options.updateCallback && self.options.updateCallback(time);
    }

    init(options) {
        var self = this;

        self.options = options;

        this.initDataRange(options);

        this.context = self.options.context || '2d';

        if (self.options.zIndex) {
            this.canvasLayer && this.canvasLayer.setZIndex(self.options.zIndex);
        }

        this.initAnimator();
    }

    /**
     * @function MapvRenderer.prototype.addAnimatorEvent
     * @description ć·»ĺŠ ĺŠ¨ç”»äş‹ä»¶ă€‚
     */
    addAnimatorEvent() {
        this.map.events.on({ movestart: this.animatorMovestartEvent.bind(this) });
        this.map.events.on({ moveend: this.animatorMoveendEvent.bind(this) });
    }

    /**
     * @function MapvRenderer.prototype.clear
     * @description ć¸…é™¤çŽŻĺ˘?ă€‚
     * @param {Object} context - ĺ˝“ĺ‰ŤçŽŻĺ˘?ă€‚
     */
    clear(context) {
        context && context.clearRect && context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }

    /**
     * @function MapvRenderer.prototype.show
     * @description ĺ±•ç¤şć¸˛ćź“ć•?ćžśă€‚
     */
    show() {
        this.map.addLayer(this.canvasLayer);
    }

    /**
     * @function MapvRenderer.prototype.hide
     * @description éš?č—Źć¸˛ćź“ć•?ćžśă€‚
     */
    hide() {
        this.map.removeLayer(this.canvasLayer);
    }

    /**
     * @function MapvRenderer.prototype.draw
     * @description ć¸˛ćź“ç»?ĺ?¶ă€‚
     */
    draw() {
        this.canvasLayer.redraw();
    }
}
;// CONCATENATED MODULE: ./src/classic/overlay/MapVLayer.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/



/**
 * @class SuperMap.Layer.MapVLayer
 * @category  Visualization MapV
 * @classdesc MapV ĺ›ľĺ±‚ă€‚
 * @extends {SuperMap.Layer}
 * @param {string} name - ĺ›ľĺ±‚ĺ?Ťă€‚
 * @param {Object} options - ĺŹŻé€‰ĺŹ‚ć•°ă€‚
 * @param {Mapv.DataSet} options.dataSet - mapv çš„ dataSet ĺŻąč±ˇă€‚
 * @param {Object} options.options - mapv ç»?ĺ›ľéŁŽć Ľé…Ťç˝®äżˇć?Żă€‚
 */
class MapVLayer extends SuperMap_SuperMap.Layer {
    constructor(name, options) {
        super(name, options);

        /**
         * @member {mapv.DataSet} SuperMap.Layer.MapVLayer.prototype.dataSet
         * @description mapv dataset ĺŻąč±ˇă€‚
         */
        this.dataSet = null;

        /**
         * @member {Object} SuperMap.Layer.MapVLayer.prototype.options
         * @description mapv ç»?ĺ›ľéŁŽć Ľé…Ťç˝®äżˇć?Żă€‚
         */
        this.options = null;

        /**
         * @member {boolean} [SuperMap.Layer.MapVLayer.prototype.supported=false]
         * @description ĺ˝“ĺ‰ŤćµŹč§?ĺ™¨ć?Żĺ?¦ć”ŻćŚ? canvas ç»?ĺ?¶ă€‚ĺ†łĺ®šäş† MapV ĺ›ľć?Żĺ?¦ĺŹŻç”¨ďĽŚĺ†…é?¨ĺ?¤ć–­ä˝żç”¨ă€‚
         */
        this.supported = false;

        /**
         * @member {Canvas} SuperMap.Layer.MapVLayer.prototype.canvas
         * @description MapV ĺ›ľä¸»ç»?ĺ?¶éť˘ćťżă€‚
         */
        this.canvas = null;

        /**
         * @private
         * @member {CanvasContext} SuperMap.Layer.MapVLayer.prototype.canvasContext
         * @description MapV ĺ›ľä¸»ç»?ĺ?¶ĺŻąč±ˇă€‚
         */
        this.canvasContext = null;

        if (options) {
            SuperMap_SuperMap.Util.extend(this, options);
        }
        
        //MapVĺ›ľč¦?ć±‚ä˝żç”¨canvasç»?ĺ?¶ďĽŚĺ?¤ć–­ć?Żĺ?¦ć”ŻćŚ?
        this.canvas = document.createElement('canvas');
        if (!this.canvas.getContext) {
            return;
        }
        this.supported = true;
        //ćž„ĺ»şç»?ĺ›ľéť˘ćťż
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = 0 + 'px';
        this.canvas.style.left = 0 + 'px';
        this.div.appendChild(this.canvas);
        var context = (this.options && this.options.context) || '2d';
        this.canvasContext = this.canvas.getContext(context);
        var global$2 = typeof window === 'undefined' ? {} : window;
        var devicePixelRatio = this.devicePixelRatio = global$2.devicePixelRatio || 1;
        if (context === '2d') {
            this.canvasContext.scale(devicePixelRatio, devicePixelRatio);
        }
        this.attribution =
            "Â© 2018 ç™ľĺş¦ <a href='https://mapv.baidu.com' target='_blank'>MapV</a> with <span>Â© <a target='_blank' href='https://iclient.supermap.io' " +
            "style='color: #08c;text-decoration: none;'>SuperMap iClient</a></span>";

        this.CLASS_NAME = 'SuperMap.Layer.MapVLayer';
    }

    /**
     * @function SuperMap.Layer.MapVLayer.prototype.destroy
     * @override
     */
    destroy() {
        if (this.renderer && this.renderer.animator) {
            this.renderer.animator.stop();
            this.renderer.animator = null;
        }
        this.dataSet = null;
        this.options = null;
        this.renderer = null;
        this.supported = null;
        this.canvas = null;
        this.canvasContext = null;
        this.maxWidth = null;
        this.maxHeight = null;
        super.destroy();
    }

    /**
     * @function SuperMap.Layer.MapVLayer.prototype.addData
     * @description čż˝ĺŠ ć•°ćŤ®ă€‚
     * @param {mapv.DataSet} dataSet - mapv ć•°ćŤ®é›†ă€‚
     * @param {Object} options - mapv ç»?ĺ›ľĺŹ‚ć•°ă€‚
     */
    addData(dataSet, options) {
        this.renderer && this.renderer.addData(dataSet, options);
    }

    /**
     * @function SuperMap.Layer.MapVLayer.prototype.
     * @description č®ľç˝®ć•°ćŤ®ă€‚
     * @param {mapv.DataSet} dataSet - mapv ć•°ćŤ®é›†ă€‚
     * @param {Object} options - mapv ç»?ĺ›ľĺŹ‚ć•°ă€‚
     */
    setData(dataSet, options) {
        this.renderer && this.renderer.setData(dataSet, options);
    }

    /**
     * @function SuperMap.Layer.MapVLayer.prototype.getData
     * @description čŽ·ĺŹ–ć•°ćŤ®ă€‚
     * @returns {mapv.DataSet} - mapv ć•°ćŤ®é›†ă€‚
     */
    getData() {
        if (this.renderer) {
            this.dataSet = this.renderer.getData();
        }
        return this.dataSet;
    }

    /**
     * @function SuperMap.Layer.MapVLayer.prototype.removeData
     * @description ĺ? é™¤ç¬¦ĺ??čż‡ć»¤ćťˇä»¶çš„ć•°ćŤ®ă€‚
     * @param {function} filter - čż‡ć»¤ćťˇä»¶ă€‚ćťˇä»¶ĺŹ‚ć•°ä¸şć•°ćŤ®éˇąďĽŚčż”ĺ›žĺ€Ľä¸ş trueďĽŚčˇ¨ç¤şĺ? é™¤čŻĄĺ…?ç´ ďĽ›ĺ?¦ĺ?™čˇ¨ç¤şä¸Ťĺ? é™¤ă€‚
     * @example
     *  filter=function(data){
     *    if(data.id=="1"){
     *      return true
     *    }
     *    return false;
     *  }
     */
    removeData(filter) {
        this.renderer && this.renderer.removeData(filter);
    }

    /**
     * @function SuperMap.Layer.MapVLayer.prototype.clearData
     * @description ć¸…é™¤ć•°ćŤ®
     */
    clearData() {
        this.renderer.clearData();
    }

    /**
     * @function SuperMap.Layer.MapVLayer.prototype.setMap
     * @description ĺ›ľĺ±‚ĺ·˛ç»Źć·»ĺŠ ĺ?° Map ä¸­ă€‚
     *              ĺ¦‚ćžśĺ˝“ĺ‰ŤćµŹč§?ĺ™¨ć”ŻćŚ? canvasďĽŚĺ?™ĺĽ€ĺ§‹ć¸˛ćź“č¦?ç´ ďĽ›ĺ¦‚ćžśä¸Ťć”ŻćŚ?ĺ?™ç§»é™¤ĺ›ľĺ±‚ă€‚
     * @param {SuperMap.Map} map - éś€č¦?ç»‘ĺ®šçš„ map ĺŻąč±ˇă€‚
     */
    setMap(map) {
        super.setMap(map);
        this.renderer = new MapVRenderer(map, this, this.dataSet, this.options);
        this.renderer.devicePixelRatio = this.devicePixelRatio;
        if (!this.supported) {
            this.map.removeLayer(this);
        } else {
            this.redraw();
        }
    }

    /**
     * @function SuperMap.Layer.MapVLayer.prototype.moveTo
     * @description é‡Ťç˝®ĺ˝“ĺ‰Ť MapV ĺ›ľĺ±‚çš„ divďĽŚĺ†Ťä¸€ć¬ˇä¸Ž Map ćŽ§ä»¶äżťćŚ?ä¸€č‡´ă€‚
     *              äż®ć”ąĺ˝“ĺ‰Ťć?ľç¤şčŚ?ĺ›´ďĽŚĺ˝“ĺąłç§»ć?–č€…çĽ©ć”ľç»“ćťźĺ?ŽĺĽ€ĺ§‹é‡Ťç»? MapV ĺ›ľçš„ć¸˛ćź“ć•?ćžśă€‚
     * @param {SuperMap.Bounds} bounds - ĺ›ľĺ±‚čŚ?ĺ›´ă€‚
     * @param {boolean} [zoomChanged] - çĽ©ć”ľçş§ĺ?«ć?Żĺ?¦ć”ąĺŹ?ă€‚
     * @param {boolean} [dragging] - ć?Żĺ?¦ć‹–ĺŠ¨ă€‚
     */
    moveTo(bounds, zoomChanged, dragging) {
        super.moveTo(bounds, zoomChanged, dragging);
        if (!this.supported) {
            return;
        }
        this.zoomChanged = zoomChanged;
        if (!dragging) {
            this.div.style.visibility = 'hidden';
            this.div.style.left = -parseInt(this.map.layerContainerDiv.style.left) + 'px';
            this.div.style.top = -parseInt(this.map.layerContainerDiv.style.top) + 'px';
            /*this.canvas.style.left = this.div.style.left;
             this.canvas.style.top = this.div.style.top;*/
            var size = this.map.getSize();
            this.div.style.width = parseInt(size.w) + 'px';
            this.div.style.height = parseInt(size.h) + 'px';
            if (this.options.draw === 'heatmap') {
                this.canvas.width = parseInt(size.w) * this.devicePixelRatio;
                this.canvas.height = parseInt(size.h) * this.devicePixelRatio;
            } else {
                this.canvas.width = parseInt(size.w);
                this.canvas.height = parseInt(size.h);
            }
           
            this.canvas.style.width = this.div.style.width;
            this.canvas.style.height = this.div.style.height;
            this.maxWidth = size.w;
            this.maxHeight = size.h;
            this.div.style.visibility = '';
            if (!zoomChanged) {
                this.renderer && this.renderer.render();
            }
        }

        if (zoomChanged) {
            this.renderer && this.renderer.render();
        }
    }

    /**
     * @function SuperMap.Layer.MapVLayer.prototype.transferToMapLatLng
     * @description ĺ°†ç»Źçş¬ĺş¦č˝¬ć??ĺş•ĺ›ľçš„ćŠ•ĺ˝±ĺť?ć ‡ă€‚
     * @param {SuperMap.Lonlat} latLng - ç»Źçş¬ĺş¦ĺť?ć ‡ă€‚
     * @deprecated
     */
    transferToMapLatLng(latLng) {
        var source = 'EPSG:4326',
            dest = 'EPSG:4326';
        var unit = this.map.getUnits() || 'degree';
        if (['m', 'meter'].indexOf(unit.toLowerCase()) > -1) {
            dest = 'EPSG:3857';
        }
        return new SuperMap_SuperMap.LonLat(latLng.lon, latLng.lat).transform(source, dest);
    }
}

SuperMap_SuperMap.Layer.MapVLayer = MapVLayer;

;// CONCATENATED MODULE: ./src/classic/overlay/mapv/index.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/

;// CONCATENATED MODULE: ./src/classic/overlay/index.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/


;// CONCATENATED MODULE: ./src/common/format/Format.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/



/**
 * @class SuperMap.Format
 * @classdesc čŻ»ĺ†™ĺ?„ç§Ťć ĽĺĽŹçš„ć ĽĺĽŹç±»ĺźşç±»ă€‚ĺ…¶ĺ­?ç±»ĺş”čŻĄĺŚ…ĺ?«ĺą¶ĺ®žçŽ° read ĺ’Ś write ć–ąćł•ă€‚
 * @category BaseTypes Format
 * @param {Object} options - ĺŹŻé€‰ĺŹ‚ć•°ă€‚
 * @param {boolean} [options.keepData=false] - ĺ¦‚ćžśč®ľç˝®ä¸ş trueďĽŚ data ĺ±žć€§äĽšćŚ‡ĺ?‘č˘«č§Łćž?çš„ĺŻąč±ˇďĽ?äľ‹ĺ¦‚ JSON ć?– xml ć•°ćŤ®ĺŻąč±ˇďĽ‰ă€‚
 * @param {Object} [options.data] - ĺ˝“ keepData ĺ±žć€§č®ľç˝®ä¸ş trueďĽŚčż™ć?ŻäĽ é€’ç»™ read ć“Ťä˝śçš„č¦?č˘«č§Łćž?çš„ĺ­—ç¬¦ä¸˛ă€‚
 */
class Format {


    constructor(options) {
        /**
         * @member {Object} SuperMap.Format.prototype.data 
         * @description ĺ˝“ keepData ĺ±žć€§č®ľç˝®ä¸ş trueďĽŚčż™ć?ŻäĽ é€’ç»™ read ć“Ťä˝śçš„č¦?č˘«č§Łćž?çš„ĺ­—ç¬¦ä¸˛ă€‚
         */
        this.data = null;

        /**
         * APIProperty: keepData
         * @member {Object} [SuperMap.Format.prototype.keepData=false]
         * @description äżťćŚ?ćś€čż‘čŻ»ĺ?°çš„ć•°ćŤ®çš„ĺĽ•ç”¨ďĽ?é€ščż‡ <data> ĺ±žć€§ďĽ‰ă€‚
         */
        this.keepData = false;

        Util.extend(this, options);
        this.options = options;

        this.CLASS_NAME = "SuperMap.Format";
    }

    /**
     * @function SuperMap.Format.prototype.destroy
     * @description é”€ćŻ?čŻĄć ĽĺĽŹç±»ďĽŚé‡Šć”ľç›¸ĺ…łčµ„ćş?ă€‚
     */
    destroy() {
        //ç”¨ćťĄé”€ćŻ?čŻĄć ĽĺĽŹç±»ďĽŚé‡Šć”ľç›¸ĺ…łčµ„ćş?
    }

    /**
     * @function SuperMap.Format.prototype.read
     * @description ćťĄä»Žĺ­—ç¬¦ä¸˛ä¸­čŻ»ĺŹ–ć•°ćŤ®ă€‚
     * @param {string} data - čŻ»ĺŹ–çš„ć•°ćŤ®ă€‚
     */
    read(data) { // eslint-disable-line no-unused-vars
        //ç”¨ćťĄä»Žĺ­—ç¬¦ä¸˛ä¸­čŻ»ĺŹ–ć•°ćŤ®
    }

    /**
     * @function SuperMap.Format.prototype.write
     * @description ĺ°†ĺŻąč±ˇĺ†™ć??ĺ­—ç¬¦ä¸˛ă€‚
     * @param {Object} object - ĺŹŻĺşŹĺ?—ĺŚ–çš„ĺŻąč±ˇă€‚
     * @returns {string} ĺŻąč±ˇč˘«ĺ†™ć??ĺ­—ç¬¦ä¸˛ă€‚
     */
    write(object) { // eslint-disable-line no-unused-vars
        //ç”¨ćťĄĺ†™ĺ­—ç¬¦ä¸˛
    }
}

SuperMap.Format = SuperMap.Format || Format;

;// CONCATENATED MODULE: ./src/common/format/JSON.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/



/**
 * @class SuperMap.Format.JSON
 * @classdesc ĺ®‰ĺ…¨çš„čŻ»ĺ†™ JSON çš„č§Łćž?ç±»ă€‚ä˝żç”¨ {@link SuperMap.Format.JSON} ćž„é€ ĺ‡˝ć•°ĺ?›ĺ»şć–°ĺ®žäľ‹ă€‚
 * @category BaseTypes Format
 * @param {Object} [options] - ĺŹ‚ć•°ă€‚
 * @param {string} [options.indent="    "] - ç”¨äşŽć ĽĺĽŹĺŚ–čľ“ĺ‡şďĽŚindent ĺ­—ç¬¦ä¸˛äĽšĺś¨ćŻŹć¬ˇçĽ©čż›çš„ć—¶ĺ€™ä˝żç”¨ä¸€ć¬ˇă€‚
 * @param {string} [options.space=" "] - ç”¨äşŽć ĽĺĽŹĺŚ–čľ“ĺ‡şďĽŚspace ĺ­—ç¬¦ä¸˛äĽšĺś¨ĺ?Ťĺ€ĽĺŻąçš„ ":" ĺ?Žčľąć·»ĺŠ ă€‚
 * @param {string} [options.newline="\n"] - ç”¨äşŽć ĽĺĽŹĺŚ–čľ“ĺ‡ş, newline ĺ­—ç¬¦ä¸˛äĽšç”¨ĺś¨ćŻŹä¸€ä¸Şĺ?Ťĺ€ĽĺŻąć?–ć•°ç»„éˇąćś«ĺ°ľă€‚
 * @param {number} [options.level=0] - ç”¨äşŽć ĽĺĽŹĺŚ–čľ“ĺ‡ş, čˇ¨ç¤şçš„ć?ŻçĽ©čż›çş§ĺ?«ă€‚
 * @param {boolean} [options.pretty=false] - ć?Żĺ?¦ĺś¨ĺşŹĺ?—ĺŚ–çš„ć—¶ĺ€™ä˝żç”¨é˘ťĺ¤–çš„ç©şć ĽćŽ§ĺ?¶ç»“ćž„ă€‚ĺś¨ write ć–ąćł•ä¸­ä˝żç”¨ă€‚
 * @param {boolean} [options.nativeJSON] - éś€č¦?č˘«ćł¨ĺ†Śçš„ç›‘ĺ?¬ĺ™¨ĺŻąč±ˇă€‚
 * @extends {SuperMap.Format}
 */
class JSONFormat extends Format {

    constructor(options) {
        super(options);
        /**
         * @member {string} [SuperMap.Format.JSON.prototype.indent="    "]
         * @description ç”¨äşŽć ĽĺĽŹĺŚ–čľ“ĺ‡şďĽŚindent ĺ­—ç¬¦ä¸˛äĽšĺś¨ćŻŹć¬ˇçĽ©čż›çš„ć—¶ĺ€™ä˝żç”¨ä¸€ć¬ˇă€‚
         */
        this.indent = "    ";

        /**
         * @member {string} [SuperMap.Format.JSON.prototype.space=" "]
         * @description ç”¨äşŽć ĽĺĽŹĺŚ–čľ“ĺ‡şďĽŚspace ĺ­—ç¬¦ä¸˛äĽšĺś¨ĺ?Ťĺ€ĽĺŻąçš„ ":" ĺ?Žčľąć·»ĺŠ ă€‚
         */
        this.space = " ";

        /**
         * @member {string} [SuperMap.Format.JSON.prototype.newline="\n"]
         * @description ç”¨äşŽć ĽĺĽŹĺŚ–čľ“ĺ‡ş, newline ĺ­—ç¬¦ä¸˛äĽšç”¨ĺś¨ćŻŹä¸€ä¸Şĺ?Ťĺ€ĽĺŻąć?–ć•°ç»„éˇąćś«ĺ°ľă€‚
         */
        this.newline = "\n";

        /**
         * @member {integer} [SuperMap.Format.JSON.prototype.level=0] 
         * @description ç”¨äşŽć ĽĺĽŹĺŚ–čľ“ĺ‡ş, čˇ¨ç¤şçš„ć?ŻçĽ©čż›çş§ĺ?«ă€‚
         */
        this.level = 0;

        /**
         * @member {boolean} [SuperMap.Format.JSON.prototype.pretty=false]
         * @description ć?Żĺ?¦ĺś¨ĺşŹĺ?—ĺŚ–çš„ć—¶ĺ€™ä˝żç”¨é˘ťĺ¤–çš„ç©şć ĽćŽ§ĺ?¶ç»“ćž„ă€‚ĺś¨ write ć–ąćł•ä¸­ä˝żç”¨ă€‚
         */
        this.pretty = false;

        /**
         * @member {boolean} SuperMap.Format.JSON.prototype.nativeJSON 
         * @description ĺ?¤ć–­ćµŹč§?ĺ™¨ć?Żĺ?¦ĺŽźç”źć”ŻćŚ? JSON ć ĽĺĽŹć•°ćŤ®ă€‚
         */
        this.nativeJSON = (function () {
            return !!(window.JSON && typeof JSON.parse === "function" && typeof JSON.stringify === "function");
        })();

        this.CLASS_NAME = "SuperMap.Format.JSON";
        /**
         * @member SuperMap.Format.JSON.prototype.serialize
         * @description ćŹ?äľ›ä¸€äş›ç±»ĺž‹ĺŻąč±ˇč˝¬ JSON ĺ­—ç¬¦ä¸˛çš„ć–ąćł•ă€‚
         */
        this.serialize = {
            /**
             * @function SuperMap.Format.JSON.serialize.object
             * @description ćŠŠĺŻąč±ˇč˝¬ćŤ˘ä¸ş JSON ĺ­—ç¬¦ä¸˛ă€‚
             * @param {Object} object - ĺŹŻĺşŹĺ?—ĺŚ–çš„ĺŻąč±ˇă€‚
             * @returns {string} JSON ĺ­—ç¬¦ä¸˛ă€‚
             */
            'object': function (object) {
                // three special objects that we want to treat differently
                if (object == null) {
                    return "null";
                }
                if (object.constructor === Date) {
                    return this.serialize.date.apply(this, [object]);
                }
                if (object.constructor === Array) {
                    return this.serialize.array.apply(this, [object]);
                }
                var pieces = ['{'];
                this.level += 1;
                var key, keyJSON, valueJSON;

                var addComma = false;
                for (key in object) {
                    if (object.hasOwnProperty(key)) {
                        // recursive calls need to allow for sub-classing
                        keyJSON = this.write.apply(this,
                            [key, this.pretty]);
                        valueJSON = this.write.apply(this,
                            [object[key], this.pretty]);
                        if (keyJSON != null && valueJSON != null) {
                            if (addComma) {
                                pieces.push(',');
                            }
                            pieces.push(this.writeNewline(), this.writeIndent(),
                                keyJSON, ':', this.writeSpace(), valueJSON);
                            addComma = true;
                        }
                    }
                }

                this.level -= 1;
                pieces.push(this.writeNewline(), this.writeIndent(), '}');
                return pieces.join('');
            },

            /**
             * @function SuperMap.Format.JSON.serialize.array
             * @description ćŠŠć•°ç»„č˝¬ćŤ˘ć?? JSON ĺ­—ç¬¦ä¸˛ă€‚
             * @param {Array} array - ĺŹŻĺşŹĺ?—ĺŚ–çš„ć•°ç»„ă€‚
             * @returns {string} JSON ĺ­—ç¬¦ä¸˛ă€‚
             */
            'array': function (array) {
                var json;
                var pieces = ['['];
                this.level += 1;

                for (var i = 0, len = array.length; i < len; ++i) {
                    // recursive calls need to allow for sub-classing
                    json = this.write.apply(this,
                        [array[i], this.pretty]);
                    if (json != null) {
                        if (i > 0) {
                            pieces.push(',');
                        }
                        pieces.push(this.writeNewline(), this.writeIndent(), json);
                    }
                }

                this.level -= 1;
                pieces.push(this.writeNewline(), this.writeIndent(), ']');
                return pieces.join('');
            },

            /**
             * @function SuperMap.Format.JSON.serialize.string
             * @description ćŠŠĺ­—ç¬¦ä¸˛č˝¬ćŤ˘ć?? JSON ĺ­—ç¬¦ä¸˛ă€‚
             * @param {string} string - ĺŹŻĺşŹĺ?—ĺŚ–çš„ĺ­—ç¬¦ä¸˛ă€‚
             * @returns {string} JSON ĺ­—ç¬¦ä¸˛ă€‚
             */
            'string': function (string) {
                // If the string contains no control characters, no quote characters, and no
                // backslash characters, then we can simply slap some quotes around it.
                // Otherwise we must also replace the offending characters with safe
                // sequences.
                var m = {
                    '\b': '\\b',
                    '\t': '\\t',
                    '\n': '\\n',
                    '\f': '\\f',
                    '\r': '\\r',
                    '"': '\\"',
                    '\\': '\\\\'
                };
                /*eslint-disable no-control-regex*/
                if (/["\\\x00-\x1f]/.test(string)) {
                    return '"' + string.replace(/([\x00-\x1f\\"])/g, function (a, b) {
                        var c = m[b];
                        if (c) {
                            return c;
                        }
                        c = b.charCodeAt();
                        return '\\u00' +
                            Math.floor(c / 16).toString(16) +
                            (c % 16).toString(16);
                    }) + '"';
                }
                return '"' + string + '"';
            },

            /**
             * @function SuperMap.Format.JSON.serialize.number
             * @description ćŠŠć•°ĺ­—č˝¬ćŤ˘ć?? JSON ĺ­—ç¬¦ä¸˛ă€‚
             * @param {number} number - ĺŹŻĺşŹĺ?—ĺŚ–çš„ć•°ĺ­—ă€‚
             * @returns {string} JSON ĺ­—ç¬¦ä¸˛ă€‚
             */
            'number': function (number) {
                return isFinite(number) ? String(number) : "null";
            },

            /**
             * @function SuperMap.Format.JSON.serialize.boolean
             * @description Transform a boolean into a JSON string.
             * @param {boolean} bool - The boolean to be serialized.
             * @returns {string} A JSON string representing the boolean.
             */
            'boolean': function (bool) {
                return String(bool);
            },

            /**
             * @function SuperMap.Format.JSON.serialize.object
             * @description ĺ°†ć—ĄćśźĺŻąč±ˇč˝¬ćŤ˘ć?? JSON ĺ­—ç¬¦ä¸˛ă€‚
             * @param {Date} date - ĺŹŻĺşŹĺ?—ĺŚ–çš„ć—ĄćśźĺŻąč±ˇă€‚
             * @returns {string} JSON ĺ­—ç¬¦ä¸˛ă€‚
             */
            'date': function (date) {
                function format(number) {
                    // Format integers to have at least two digits.
                    return (number < 10) ? '0' + number : number;
                }

                return '"' + date.getFullYear() + '-' +
                    format(date.getMonth() + 1) + '-' +
                    format(date.getDate()) + 'T' +
                    format(date.getHours()) + ':' +
                    format(date.getMinutes()) + ':' +
                    format(date.getSeconds()) + '"';
            }
        };
    }

    /**
     * @function SuperMap.Format.JSON.prototype.read
     * @description ĺ°†ä¸€ä¸Şç¬¦ĺ?? JSON ç»“ćž„çš„ĺ­—ç¬¦ä¸˛čż›čˇŚč§Łćž?ă€‚
     * @param {string} json - ç¬¦ĺ?? JSON ç»“ćž„çš„ĺ­—ç¬¦ä¸˛ă€‚
     * @param {function} filter - čż‡ć»¤ć–ąćł•ďĽŚćś€ç»?ç»“ćžśçš„ćŻŹä¸€ä¸Şé”®ĺ€ĽĺŻąé?˝äĽšč°?ç”¨čŻĄčż‡ć»¤ć–ąćł•ďĽŚĺą¶ĺś¨ĺŻąĺş”çš„ĺ€Ľçš„ä˝Ťç˝®ć›żćŤ˘ć??čŻĄć–ąćł•čż”ĺ›žçš„ĺ€Ľă€‚
     * @returns {Object} ĺŻąč±ˇďĽŚć•°ç»„ďĽŚĺ­—ç¬¦ä¸˛ć?–ć•°ĺ­—ă€‚
     */
    read(json, filter) {
        var object;
        if (this.nativeJSON) {
            try {
                object = JSON.parse(json, filter);
            } catch (e) {
                // Fall through if the regexp test fails.
            }
        }

        if (this.keepData) {
            this.data = object;
        }

        return object;
    }

    /**
     * @function SuperMap.Format.JSON.prototype.write
     * @description ĺşŹĺ?—ĺŚ–ä¸€ä¸ŞĺŻąč±ˇĺ?°ä¸€ä¸Şç¬¦ĺ?? JSON ć ĽĺĽŹçš„ĺ­—ç¬¦ä¸˛ă€‚
     * @param {(object|string|Array|number|boolean)} value - éś€č¦?č˘«ĺşŹĺ?—ĺŚ–çš„ĺŻąč±ˇďĽŚć•°ç»„ďĽŚĺ­—ç¬¦ä¸˛ďĽŚć•°ĺ­—ďĽŚĺ¸?ĺ°”ĺ€Ľă€‚
     * @param {boolean} [pretty=false] - ć?Żĺ?¦ĺś¨ĺşŹĺ?—ĺŚ–çš„ć—¶ĺ€™ä˝żç”¨é˘ťĺ¤–çš„ç©şć ĽćŽ§ĺ?¶ç»“ćž„ă€‚ĺś¨ write ć–ąćł•ä¸­ä˝żç”¨ă€‚
     * @returns {string} ç¬¦ĺ?? JSON ć ĽĺĽŹçš„ĺ­—ç¬¦ä¸˛ă€‚
     *
     */
    write(value, pretty) {
        this.pretty = !!pretty;
        var json = null;
        var type = typeof value;
        if (this.serialize[type]) {
            try {
                json = (!this.pretty && this.nativeJSON) ?
                    JSON.stringify(value) :
                    this.serialize[type].apply(this, [value]);
            } catch (err) {
                //SuperMap.Console.error("Trouble serializing: " + err);
            }
        }
        return json;
    }

    /**
     * @function SuperMap.Format.JSON.prototype.writeIndent
     * @description ć ąćŤ®çĽ©čż›çş§ĺ?«čľ“ĺ‡şä¸€ä¸ŞçĽ©čż›ĺ­—ç¬¦ä¸˛ă€‚
     * @private
     * @returns {string} ä¸€ä¸Şé€‚ĺ˝“çš„çĽ©čż›ĺ­—ç¬¦ä¸˛ă€‚
     */
    writeIndent() {
        var pieces = [];
        if (this.pretty) {
            for (var i = 0; i < this.level; ++i) {
                pieces.push(this.indent);
            }
        }
        return pieces.join('');
    }

    /**
     * @function SuperMap.Format.JSON.prototype.writeNewline
     * @description ĺś¨ć ĽĺĽŹĺŚ–čľ“ĺ‡şć¨ˇĺĽŹć?…ĺ†µä¸‹čľ“ĺ‡şä»Łčˇ¨ć–°ä¸€čˇŚçš„ĺ­—ç¬¦ä¸˛ă€‚
     * @private
     * @returns {string} ä»Łčˇ¨ć–°çš„ä¸€čˇŚçš„ĺ­—ç¬¦ä¸˛ă€‚
     */
    writeNewline() {
        return (this.pretty) ? this.newline : '';
    }

    /**
     * @function SuperMap.Format.JSON.prototype.writeSpace
     * @private
     * @description ĺś¨ć ĽĺĽŹĺŚ–čľ“ĺ‡şć¨ˇĺĽŹć?…ĺ†µä¸‹čľ“ĺ‡şä¸€ä¸Şä»Łčˇ¨ç©şć Ľçš„ĺ­—ç¬¦ä¸˛ă€‚
     * @returns {string} ä¸€ä¸Şç©şć Ľă€‚
     */
    writeSpace() {
        return (this.pretty) ? this.space : '';
    }

}

SuperMap.Format.JSON = JSONFormat;
;// CONCATENATED MODULE: ./src/common/iServer/CommonServiceBase.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/








/**
 * @class SuperMap.CommonServiceBase
 * @category  iServer
 * @classdesc ĺŻąćŽĄ iServer ĺ?„ç§ŤćśŤĺŠˇçš„ Service çš„ĺźşç±»ă€‚
 * @param {string} url - ćśŤĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {Object} options.eventListeners - äş‹ä»¶ç›‘ĺ?¬ĺ™¨ĺŻąč±ˇă€‚ćś‰ processCompleted ĺ±žć€§ĺŹŻäĽ ĺ…Ąĺ¤„ç?†ĺ®Ść??ĺ?Žçš„ĺ›žč°?ĺ‡˝ć•°ă€‚processFailed ĺ±žć€§äĽ ĺ…Ąĺ¤„ç?†ĺ¤±č´Ąĺ?Žçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
 * @param {string} [options.proxy] - ćśŤĺŠˇä»Łç?†ĺś°ĺť€ă€‚
 * @param {boolean} [options.withCredentials=false] - čŻ·ć±‚ć?Żĺ?¦ć?şĺ¸¦ cookieă€‚
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 */
class CommonServiceBase {
    constructor(url, options) {
        let me = this;

        this.EVENT_TYPES = ['processCompleted', 'processFailed'];

        this.events = null;

        this.eventListeners = null;

        this.url = null;

        this.urls = null;

        this.proxy = null;

        this.index = null;

        this.length = null;

        this.options = null;

        this.totalTimes = null;

        this.POLLING_TIMES = 3;

        this._processSuccess = null;

        this._processFailed = null;

        this.isInTheSameDomain = null;

        this.withCredentials = false;

        if (Util.isArray(url)) {
            me.urls = url;
            me.length = url.length;
            me.totalTimes = me.length;
            if (me.length === 1) {
                me.url = url[0];
            } else {
                me.index = parseInt(Math.random() * me.length);
                me.url = url[me.index];
            }
        } else {
            me.totalTimes = 1;
            me.url = url;
        }

        if (Util.isArray(url) && !me.isServiceSupportPolling()) {
            me.url = url[0];
            me.totalTimes = 1;
        }

        options = options || {};
        this.crossOrigin = options.crossOrigin;
        this.headers = options.headers;
        Util.extend(this, options);

        me.isInTheSameDomain = Util.isInTheSameDomain(me.url);

        me.events = new Events(me, null, me.EVENT_TYPES, true);
        if (me.eventListeners instanceof Object) {
            me.events.on(me.eventListeners);
        }

        this.CLASS_NAME = 'SuperMap.CommonServiceBase';
    }

    /**
     * @function SuperMap.CommonServiceBase.prototype.destroy
     * @description é‡Šć”ľčµ„ćş?ďĽŚĺ°†ĺĽ•ç”¨çš„čµ„ćş?ĺ±žć€§ç˝®ç©şă€‚
     */
    destroy() {
        let me = this;
        if (Util.isArray(me.urls)) {
            me.urls = null;
            me.index = null;
            me.length = null;
            me.totalTimes = null;
        }
        me.url = null;
        me.options = null;
        me._processSuccess = null;
        me._processFailed = null;
        me.isInTheSameDomain = null;

        me.EVENT_TYPES = null;
        if (me.events) {
            me.events.destroy();
            me.events = null;
        }
        if (me.eventListeners) {
            me.eventListeners = null;
        }
    }

    /**
     * @function  SuperMap.CommonServiceBase.prototype.request
     * @description: čŻĄć–ąćł•ç”¨äşŽĺ?‘ćśŤĺŠˇĺŹ‘é€?čŻ·ć±‚ă€‚
     * @param {Object} options - ĺŹ‚ć•°ă€‚
     * @param {string} [options.method='GET'] - čŻ·ć±‚ć–ąĺĽŹďĽŚĺŚ…ć‹¬ "GET"ďĽŚ"POST"ďĽŚ"PUT"ďĽŚ"DELETE"ă€‚
     * @param {string} [options.url] - ĺŹ‘é€?čŻ·ć±‚çš„ĺś°ĺť€ă€‚
     * @param {Object} [options.params] - ä˝śä¸şćźĄčŻ˘ĺ­—ç¬¦ä¸˛ć·»ĺŠ ĺ?° URL ä¸­çš„ä¸€ç»„é”®ĺ€ĽĺŻąďĽŚć­¤ĺŹ‚ć•°ĺŹŞé€‚ç”¨äşŽ GET ć–ąĺĽŹĺŹ‘é€?çš„čŻ·ć±‚ă€‚
     * @param {string} [options.data] - ĺŹ‘é€?ĺ?°ćśŤĺŠˇĺ™¨çš„ć•°ćŤ®ă€‚
     * @param {function} options.success - čŻ·ć±‚ć??ĺŠźĺ?Žçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {function} options.failure - čŻ·ć±‚ĺ¤±č´Ąĺ?Žçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {Object} [options.scope] - ĺ¦‚ćžśĺ›žč°?ĺ‡˝ć•°ć?ŻĺŻąč±ˇçš„ä¸€ä¸Şĺ…¬ĺ…±ć–ąćł•ďĽŚč®ľĺ®ščŻĄĺŻąč±ˇçš„čŚ?ĺ›´ă€‚
     * @param {boolean} [options.isInTheSameDomain] - čŻ·ć±‚ć?Żĺ?¦ĺś¨ĺ˝“ĺ‰Ťĺźźä¸­ă€‚
     * @param {boolean} [options.withCredentials=false] - čŻ·ć±‚ć?Żĺ?¦ć?şĺ¸¦ cookieă€‚
     * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
     * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
     */
    request(options) {
        let me = this;
        options.url = options.url || me.url;
        options.proxy = options.proxy || me.proxy;
        options.withCredentials = options.withCredentials != undefined ? options.withCredentials : me.withCredentials;
        options.crossOrigin = options.crossOrigin != undefined ? options.crossOrigin : me.crossOrigin;
        options.headers = options.headers || me.headers;
        options.isInTheSameDomain = me.isInTheSameDomain;
        //ä¸şurlć·»ĺŠ ĺ®‰ĺ…¨č®¤čŻ?äżˇć?Żç‰‡ć®µ
        options.url = SecurityManager.appendCredential(options.url);

        me.calculatePollingTimes();
        me._processSuccess = options.success;
        me._processFailed = options.failure;
        options.scope = me;
        options.success = me.getUrlCompleted;
        options.failure = me.getUrlFailed;
        me.options = options;
        me._commit(me.options);
    }

    /**
     * @function SuperMap.CommonServiceBase.prototype.getUrlCompleted
     * @description čŻ·ć±‚ć??ĺŠźĺ?Žć‰§čˇŚć­¤ć–ąćł•ă€‚
     * @param {Object} result - ćśŤĺŠˇĺ™¨čż”ĺ›žçš„ç»“ćžśĺŻąč±ˇă€‚
     */
    getUrlCompleted(result) {
        let me = this;
        me._processSuccess(result);
    }

    /**
     * @function SuperMap.CommonServiceBase.prototype.getUrlFailed
     * @description čŻ·ć±‚ĺ¤±č´Ąĺ?Žć‰§čˇŚć­¤ć–ąćł•ă€‚
     * @param {Object} result - ćśŤĺŠˇĺ™¨čż”ĺ›žçš„ç»“ćžśĺŻąč±ˇă€‚
     */
    getUrlFailed(result) {
        let me = this;
        if (me.totalTimes > 0) {
            me.totalTimes--;
            me.ajaxPolling();
        } else {
            me._processFailed(result);
        }
    }

    /**
     *
     * @function SuperMap.CommonServiceBase.prototype.ajaxPolling
     * @description čŻ·ć±‚ĺ¤±č´Ąĺ?ŽďĽŚĺ¦‚ćžśĺ‰©ä˝™čŻ·ć±‚ĺ¤±č´Ąć¬ˇć•°ä¸Ťä¸ş 0ďĽŚé‡Ťć–°čŽ·ĺŹ– URL ĺŹ‘é€?čŻ·ć±‚
     */
    ajaxPolling() {
        let me = this,
            url = me.options.url,
            re = /^http:\/\/([a-z]{9}|(\d+\.){3}\d+):\d{0,4}/;
        me.index = parseInt(Math.random() * me.length);
        me.url = me.urls[me.index];
        url = url.replace(re, re.exec(me.url)[0]);
        me.options.url = url;
        me.options.isInTheSameDomain = Util.isInTheSameDomain(url);
        me._commit(me.options);
    }

    /**
     * @function SuperMap.CommonServiceBase.prototype.calculatePollingTimes
     * @description č®ˇç®—ĺ‰©ä˝™čŻ·ć±‚ĺ¤±č´Ąć‰§čˇŚć¬ˇć•°ă€‚
     */
    calculatePollingTimes() {
        let me = this;
        if (me.times) {
            if (me.totalTimes > me.POLLING_TIMES) {
                if (me.times > me.POLLING_TIMES) {
                    me.totalTimes = me.POLLING_TIMES;
                } else {
                    me.totalTimes = me.times;
                }
            } else {
                if (me.times < me.totalTimes) {
                    me.totalTimes = me.times;
                }
            }
        } else {
            if (me.totalTimes > me.POLLING_TIMES) {
                me.totalTimes = me.POLLING_TIMES;
            }
        }
        me.totalTimes--;
    }

    /**
     * @function SuperMap.CommonServiceBase.prototype.isServiceSupportPolling
     * @description ĺ?¤ć–­ćśŤĺŠˇć?Żĺ?¦ć”ŻćŚ?č˝®čŻ˘ă€‚
     */
    isServiceSupportPolling() {
        let me = this;
        return !(
            me.CLASS_NAME === 'SuperMap.REST.ThemeService' || me.CLASS_NAME === 'SuperMap.REST.EditFeaturesService'
        );
    }

    /**
     * @function SuperMap.CommonServiceBase.prototype.serviceProcessCompleted
     * @description çŠ¶ć€?ĺ®Ść??ďĽŚć‰§čˇŚć­¤ć–ąćł•ă€‚
     * @param {Object} result - ćśŤĺŠˇĺ™¨čż”ĺ›žçš„ç»“ćžśĺŻąč±ˇă€‚
     */
    serviceProcessCompleted(result) {
        result = Util.transformResult(result);
        this.events.triggerEvent('processCompleted', {
            result: result
        });
    }

    /**
     * @function SuperMap.CommonServiceBase.prototype.serviceProcessFailed
     * @description çŠ¶ć€?ĺ¤±č´ĄďĽŚć‰§čˇŚć­¤ć–ąćł•ă€‚
     * @param {Object} result - ćśŤĺŠˇĺ™¨čż”ĺ›žçš„ç»“ćžśĺŻąč±ˇă€‚
     */
    serviceProcessFailed(result) {
        result = Util.transformResult(result);
        let error = result.error || result;
        this.events.triggerEvent('processFailed', {
            error: error
        });
    }

    _commit(options) {
        if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') {
            if (options.params) {
                options.url = Util.urlAppend(options.url, Util.getParameterString(options.params || {}));
            }
            if (typeof options.data === 'object') {
                try {
                    options.params = Util.toJSON(options.data);
                } catch (e) {
                    console.log('ä¸Ťć?ŻjsonĺŻąč±ˇ');
                }
            } else {
                options.params = options.data;
            }
        }
        FetchRequest.commit(options.method, options.url, options.params, {
            headers: options.headers,
            withCredentials: options.withCredentials,
            crossOrigin: options.crossOrigin,
            timeout: options.async ? 0 : null,
            proxy: options.proxy
        })
            .then(function (response) {
                if (response.text) {
                    return response.text();
                }
                if (response.json) {
                    return response.json();
                }
                return response;
            })
            .then(function (text) {
                let requestResult = text;
                if (typeof text === 'string') {
                    requestResult = new JSONFormat().read(text);
                }
                if (
                    !requestResult ||
                    requestResult.error ||
                    (requestResult.code >= 300 && requestResult.code !== 304)
                ) {
                    if (requestResult && requestResult.error) {
                        requestResult = {
                            error: requestResult.error
                        };
                    } else {
                        requestResult = {
                            error: requestResult
                        };
                    }
                }
                return requestResult;
            })
            .catch(function (e) {
                var failure = options.scope ? FunctionExt.bind(options.failure, options.scope) : options.failure;
                failure(e);
            })
            .then((requestResult) => {
                if (requestResult.error) {
                    var failure = options.scope ? FunctionExt.bind(options.failure, options.scope) : options.failure;
                    failure(requestResult);
                } else {
                    requestResult.succeed = requestResult.succeed == undefined ? true : requestResult.succeed;
                    var success = options.scope ? FunctionExt.bind(options.success, options.scope) : options.success;
                    success(requestResult);
                }
            });
    }
}

SuperMap.CommonServiceBase = CommonServiceBase;

/**
 * ćśŤĺŠˇĺ™¨čŻ·ć±‚ĺ›žč°?ĺ‡˝ć•°
 * @callback RequestCallback
 * @example
 * var requestCallback = function (serviceResult){
 *      console.log(serviceResult.result);
 * }
 * new QueryService(url).queryByBounds(param, requestCallback);
 * @param {Object} serviceResult
 * @param {Object} serviceResult.result ćśŤĺŠˇĺ™¨čż”ĺ›žç»“ćžśă€‚
 * @param {Object} serviceResult.object ĺŹ‘ĺ¸?ĺş”ç”¨ç¨‹ĺşŹäş‹ä»¶çš„ĺŻąč±ˇă€‚
 * @param {Object} serviceResult.type äş‹ä»¶ç±»ĺž‹ă€‚
 * @param {Object} serviceResult.element ćŽĄĺŹ—ćµŹč§?ĺ™¨äş‹ä»¶çš„ DOM čŠ‚ç‚ąă€‚
 */

;// CONCATENATED MODULE: ./src/common/iServer/AddressMatchService.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/





/**
 * @class SuperMap.AddressMatchService
 * @category iServer AddressMatch
 * @classdesc ĺś°ĺť€ĺŚąé…ŤćśŤĺŠˇďĽŚĺŚ…ć‹¬ć­Łĺ?‘ĺŚąé…Ťĺ’ŚĺŹŤĺ?‘ĺŚąé…Ťă€‚
 * @param {string} url - ĺś°ĺť€ĺŚąé…ŤćśŤĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 */
class AddressMatchService_AddressMatchService extends CommonServiceBase {
    constructor(url, options) {
        super(url, options);
        this.options = options || {};
        this.CLASS_NAME = 'SuperMap.AddressMatchService';
    }

    /**
     * @function SuperMap.AddressMatchService.prototype.destroy
     * @override
     */
    destroy() {
        super.destroy();
    }

    /**
     * @function SuperMap.AddressMatchService.prototype.code
     * @param {string} url - ć­Łĺ?‘ĺś°ĺť€ĺŚąé…ŤćśŤĺŠˇĺś°ĺť€ă€‚
     * @param {SuperMap.GeoCodingParameter} params - ć­Łĺ?‘ĺś°ĺť€ĺŚąé…ŤćśŤĺŠˇĺŹ‚ć•°ă€‚
     */
    code(url, params) {
        if (!(params instanceof GeoCodingParameter)) {
            return;
        }
        this.processAsync(url, params);
    }

    /**
     * @function SuperMap.AddressMatchService.prototype.decode
     * @param {string} url - ĺŹŤĺ?‘ĺś°ĺť€ĺŚąé…ŤćśŤĺŠˇĺś°ĺť€ă€‚
     * @param {SuperMap.GeoDecodingParameter} params - ĺŹŤĺ?‘ĺś°ĺť€ĺŚąé…ŤćśŤĺŠˇĺŹ‚ć•°ă€‚
     */
    decode(url, params) {
        if (!(params instanceof GeoDecodingParameter)) {
            return;
        }
        this.processAsync(url, params);
    }

    /**
     * @function SuperMap.AddressMatchService.prototype.processAsync
     * @description č´źč´Łĺ°†ĺ®˘ć?·ç«Żçš„ĺŠ¨ć€?ĺ?†ć®µćśŤĺŠˇĺŹ‚ć•°äĽ é€’ĺ?°ćśŤĺŠˇç«Żă€‚
     * @param {string} url - ćśŤĺŠˇĺś°ĺť€ă€‚
     * @param {Object} params - ĺŹ‚ć•°ă€‚
     */

    processAsync(url, params) {
        this.request({
            method: 'GET',
            url,
            params,
            scope: this,
            success: this.serviceProcessCompleted,
            failure: this.serviceProcessFailed
        });
    }

    /**
     * @function SuperMap.AddressMatchService.prototype.serviceProcessCompleted
     * @param {Object} result - ćśŤĺŠˇĺ™¨čż”ĺ›žçš„ç»“ćžśĺŻąč±ˇă€‚
     * @description ćśŤĺŠˇćµ?ç¨‹ć?Żĺ?¦ĺ®Ść??
     */
    serviceProcessCompleted(result) {
        if (result.succeed) {
            delete result.succeed;
        }
        super.serviceProcessCompleted(result);
    }

    /**
     * @function SuperMap.AddressMatchService.prototype.serviceProcessCompleted
     * @param {Object} result - ćśŤĺŠˇĺ™¨čż”ĺ›žçš„ç»“ćžśĺŻąč±ˇă€‚
     * @description ćśŤĺŠˇćµ?ç¨‹ć?Żĺ?¦ĺ¤±č´Ą
     */
    serviceProcessFailed(result) {
        super.serviceProcessFailed(result);
    }
}

SuperMap.AddressMatchService = AddressMatchService_AddressMatchService;

;// CONCATENATED MODULE: ./src/classic/services/AddressMatchService.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/




/**
 * @class SuperMap.REST.AddressMatchService
 * @category  iServer AddressMatch
 * @classdesc ĺś°ĺť€ĺŚąé…ŤćśŤĺŠˇďĽŚĺŚ…ć‹¬ć­Łĺ?‘ĺŚąé…Ťĺ’ŚĺŹŤĺ?‘ĺŚąé…Ťă€‚
 * @extends {SuperMap.CommonServiceBase}
 * @param {string} url - ćśŤĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 */
class AddressMatchService extends CommonServiceBase {

    constructor(url, options) {
        super(url, options);
        this.CLASS_NAME = "SuperMap.REST.AddressMatchService";
    }

    /**
     * @function SuperMap.REST.AddressMatchService.prototype.code
     * @description ć­Łĺ?‘ĺŚąé…Ťă€‚
     * @param {SuperMap.GeoCodingParameter} params - ć­Łĺ?‘ĺŚąé…ŤĺŹ‚ć•°ă€‚
     * @param {RequestCallback} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    code(params, callback) {
        var me = this;
        var addressMatchService = new AddressMatchService_AddressMatchService(me.url, {
            headers: me.headers,
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            }
        });
        addressMatchService.code(me.url + '/geocoding', params);
    }

    /**
     * @function SuperMap.REST.AddressMatchService.prototype.decode
     * @description ĺŹŤĺ?‘ĺŚąé…Ťă€‚
     * @param {SuperMap.GeoDecodingParameter} params - ĺŹŤĺ?‘ĺŚąé…ŤĺŹ‚ć•°ă€‚
     * @param {RequestCallback} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    decode(params, callback) {
        var me = this;
        var addressMatchService = new AddressMatchService_AddressMatchService(me.url, {
            headers: me.headers,
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            }
        });
        addressMatchService.decode(me.url + '/geodecoding', params);
    }
}

SuperMap_SuperMap.REST.AddressMatchService = AddressMatchService;
;// CONCATENATED MODULE: ./src/common/iServer/DatasetService.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/




/**
 * @class SuperMap.DatasetService
 * @category iServer Data Dataset
 * @classdesc ć•°ćŤ®é›†ćźĄčŻ˘ćśŤĺŠˇă€‚
 * @param {string} url - ćśŤĺŠˇçš„č®żé—®ĺś°ĺť€ă€‚ĺ¦‚č®żé—®World DataćśŤĺŠˇďĽŚĺŹŞéś€ĺ°†urlč®ľä¸şďĽšhttp://localhost:8090/iserver/services/data-world/rest/data ĺŤłĺŹŻă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚</br>
 * @param {Object} options.eventListeners - äş‹ä»¶ç›‘ĺ?¬ĺ™¨ĺŻąč±ˇă€‚ćś‰processCompletedĺ±žć€§ĺŹŻäĽ ĺ…Ąĺ¤„ç?†ĺ®Ść??ĺ?Žçš„ĺ›žč°?ĺ‡˝ć•°ă€‚processFailedĺ±žć€§äĽ ĺ…Ąĺ¤„ç?†ĺ¤±č´Ąĺ?Žçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
 * @param {SuperMap.DataFormat} [options.format=SuperMap.DataFormat.GEOJSON] - ćźĄčŻ˘ç»“ćžśčż”ĺ›žć ĽĺĽŹďĽŚç›®ĺ‰Ťć”ŻćŚ? iServerJSON ĺ’Ś GeoJSON ä¸¤ç§Ťć ĽĺĽŹă€‚ĺŹ‚ć•°ć ĽĺĽŹä¸ş "ISERVER"ďĽŚ"GEOJSON"ă€‚
 * @param {string}options.datasource - č¦?ćźĄčŻ˘çš„ć•°ćŤ®é›†ć‰€ĺś¨çš„ć•°ćŤ®ćş?ĺ?Ťç§°ă€‚</br>
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 *
 */
class DatasetService_DatasetService extends CommonServiceBase {

    constructor(url, options) {
        super(url, options);
        if(!options){
            return;
        }
        /**
         * @member {string} SuperMap.DatasetService.prototype.datasource
         * @description č¦?ćźĄčŻ˘çš„ć•°ćŤ®é›†ć‰€ĺś¨çš„ć•°ćŤ®ćş?ĺ?Ťç§°ă€‚
         */
        this.datasource = null;

        /**
         *  @member {string} SuperMap.DatasetService.prototype.dataset
         *  @description č¦?ćźĄčŻ˘çš„ć•°ćŤ®é›†ĺ?Ťç§°ă€‚
         */
        this.dataset = null;

        if (options) {
            Util.extend(this, options);
        }

        this.CLASS_NAME = "SuperMap.DatasetService";
    }

    /**
     * @function SuperMap.DatasetService.prototype.destroy
     * @override
     */
    destroy() {
        super.destroy();
        var me = this;
        me.datasource = null;
        me.dataset = null;
    }

    /**
     * @function SuperMap.DatasetService.prototype.getDatasetsService
     * @description ć‰§čˇŚćśŤĺŠˇďĽŚćźĄčŻ˘ć•°ćŤ®é›†ćśŤĺŠˇă€‚
     */
    getDatasetsService(params) {
        var me = this;
        me.url = Util.urlPathAppend(me.url,`datasources/name/${params}/datasets`);
        me.request({
            method: "GET",
            data: null,
            scope: me,
            success: me.serviceProcessCompleted,
            failure: me.serviceProcessFailed
        });
    }

    /**
     * @function SuperMap.DatasetService.prototype.getDatasetService
     * @description ć‰§čˇŚćśŤĺŠˇďĽŚćźĄčŻ˘ć•°ćŤ®é›†äżˇć?ŻćśŤĺŠˇă€‚
     */
    getDatasetService(datasourceName, datasetName) {
        var me = this;
        me.url = Util.urlPathAppend(me.url,`datasources/name/${datasourceName}/datasets/name/${datasetName}`);
        me.request({
            method: "GET",
            data: null,
            scope: me,
            success: me.serviceProcessCompleted,
            failure: me.serviceProcessFailed
        });
    }

    /**
     * @function SuperMap.DatasetService.prototype.setDatasetService
     * @description ć‰§čˇŚćśŤĺŠˇďĽŚć›´ć”ąć•°ćŤ®é›†äżˇć?ŻćśŤĺŠˇă€‚
     */
    setDatasetService(params) {
        if (!params) {
            return;
        }
        var me = this;
        var jsonParamsStr = Util.toJSON(params);
        me.request({
            method: "PUT",
            data: jsonParamsStr,
            scope: me,
            success: me.serviceProcessCompleted,
            failure: me.serviceProcessFailed
        });
    }

     /**
     * @function SuperMap.DatasetService.prototype.deleteDatasetService
     * @description ć‰§čˇŚćśŤĺŠˇďĽŚĺ? é™¤ć•°ćŤ®é›†äżˇć?ŻćśŤĺŠˇă€‚
     */
    deleteDatasetService() {
        var me = this;
        me.request({
            method: "DELETE",
            data: null,
            scope: me,
            success: me.serviceProcessCompleted,
            failure: me.serviceProcessFailed
        });
    }

}

SuperMap.DatasetService = DatasetService_DatasetService;
;// CONCATENATED MODULE: ./src/common/iServer/CreateDatasetParameters.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/



/**
 * @class SuperMap.CreateDatasetParameters
 * @category iServer Data Dataset
 * @classdesc ć•°ćŤ®é›†ĺ?›ĺ»şĺŹ‚ć•°ç±»ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚ 
 * @param {string} options.datasourceName - ć•°ćŤ®ćş?ĺ?Ťç§°(ĺż…é€‰)ă€‚
 * @param {string} options.datasetName - ć•°ćŤ®é›†ĺ?Ťç§°(ĺż…é€‰)ă€‚
 * @param {DatasetType} options.datasetType - ć•°ćŤ®é›†ç±»ĺž‹ă€‚ç›®ĺ‰Ťć”ŻćŚ?ĺ?›ĺ»şçš„ĺ‡şč?šé›†ç±»ĺž‹ćś‰ďĽšç‚ąă€?çşżă€?éť˘ă€?ć–‡ćś¬ă€?ĺ¤Ťĺ??ďĽ?CADďĽ‰ĺ’Śĺ±žć€§ć•°ćŤ®é›†ă€‚
 */
class CreateDatasetParameters {

    constructor(options) {
        if (!options) {
            return;
        }

        /**
         * @member {string} SuperMap.CreateDatasetParameters.prototype.datasourceName
         * @description ć•°ćŤ®ćş?ĺ?Ťç§°ă€‚
         */
        this.datasourceName = null;

        /**
         * @member {string} SuperMap.CreateDatasetParameters.prototype.datasetName
         * @description ć•°ćŤ®é›†ĺ?Ťç§°ă€‚
         */
        this.datasetName = null;

        /**
         * @member {DatasetType} SuperMap.CreateDatasetParameters.prototype.datasetType
         * @description ć•°ćŤ®é›†ç±»ĺž‹ă€‚ç›®ĺ‰Ťć”ŻćŚ?ĺ?›ĺ»şçš„ĺ‡şč?šé›†ç±»ĺž‹ćś‰ďĽšç‚ąă€?çşżă€?éť˘ă€?ć–‡ćś¬ă€?ĺ¤Ťĺ??ďĽ?CADďĽ‰ĺ’Śĺ±žć€§ć•°ćŤ®é›†ă€‚
         */
        this.datasetType = null;
        
        if (options) {
            Util.extend(this, options);
        }
        this.CLASS_NAME = "SuperMap.CreateDatasetParameters";
    }
    /**
     * @function SuperMap.CreateDatasetParameters.prototype.destroy
     * @description é‡Šć”ľčµ„ćş?ďĽŚĺ°†ĺĽ•ç”¨čµ„ćş?çš„ĺ±žć€§ç˝®ç©şă€‚
     */
    destroy() {
        var me = this;
        me.datasourceName = null;
        me.datasetName = null;
        me.datasetType = null;
    }
}

SuperMap.CreateDatasetParameters = CreateDatasetParameters;

;// CONCATENATED MODULE: ./src/common/iServer/UpdateDatasetParameters.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/



/**
 * @class SuperMap.UpdateDatasetParameters
 * @category iServer Data Dataset
 * @classdesc ć•°ćŤ®é›†äżˇć?Żć›´ć”ąĺŹ‚ć•°ç±»ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚ 
 * @param {String} options.datasourceName - ć•°ćŤ®ćş?ĺ?Ťç§°(ĺż…é€‰)ă€‚
 * @param {String} options.datasetName - ć•°ćŤ®é›†ĺ?Ťç§°(ĺż…é€‰)ă€‚
 * @param {boolean} options.isFileCache - ć?Żĺ?¦ä˝żç”¨ć–‡ä»¶ĺ˝˘ĺĽŹçš„çĽ“ĺ­?ă€‚ä»…ĺŻąć•°ćŤ®ĺş“ĺž‹ć•°ćŤ®ćş?ä¸­çš„çź˘é‡Źć•°ćŤ®é›†ćś‰ć•?ă€‚ă€‚
 * @param {String} options.description - ć•°ćŤ®é›†ćŹŹčż°äżˇć?Żă€‚
 * @param {PrjCoordSys} options.prjCoordSys - ćŠ•ĺ˝±ĺť?ć ‡çł»ă€‚
 * @param {enum} options.charset - çź˘é‡Źć•°ćŤ®é›†çš„ĺ­—ç¬¦é›†ă€‚ĺ˝“ć•°ćŤ®é›†ç±»ĺž‹ä¸şçź˘é‡Źć•°ćŤ®é›†ć—¶ďĽŚĺŹŻä»ĄäĽ é€’ć­¤ĺŹ‚ć•°ă€‚ĺ¦‚ćžśç”¨ć?·äĽ é€’ç©şĺ€ĽďĽŚĺ?™çĽ–ç ?ć–ąĺĽŹäżťćŚ?ä¸ŤĺŹ?ă€‚
 * @param {java.util.List<Color>} options.palette - ĺ˝±ĺ?Źć•°ćŤ®çš„é˘śč‰˛č°?č‰˛ćťżă€‚ĺ˝“ć•°ćŤ®é›†ç±»ĺž‹ä¸şĺ˝±ĺ?Źć•°ćŤ®é›†ć—¶ďĽŚĺŹŻä»ĄäĽ é€’ć­¤ĺŹ‚ć•°ă€‚
 * @param {double} options.noValue - ć …ć Ľć•°ćŤ®é›†ä¸­ć˛ˇćś‰ć•°ćŤ®çš„ĺ?Źĺ…?çš„ć …ć Ľĺ€Ľă€‚ĺ˝“ć•°ćŤ®é›†ç±»ĺž‹ä¸şć …ć Ľć•°ćŤ®é›†ć—¶ďĽŚĺŹŻä»ĄäĽ é€’ć­¤ĺŹ‚ć•°ă€‚
 */
class UpdateDatasetParameters {

    constructor(options) {
        if (!options) {
            return;
        }
        
        /**
         * @member {string} SuperMap.UpdateDatasetParameters.prototype.datasourceName
         * @description ć•°ćŤ®ćş?ĺ?Ťç§°ă€‚
         */
        this.datasourceName = null;

        /**
         * @member {string} SuperMap.UpdateDatasetParameters.prototype.datasetName
         * @description ć•°ćŤ®é›†ĺ?Ťç§°ă€‚
         */
        this.datasetName = null;

        /**
         * @member {boolean} SuperMap.UpdateDatasetParameters.prototype.isFileCache
         * @description ć?Żĺ?¦ä˝żç”¨ć–‡ä»¶ĺ˝˘ĺĽŹçš„çĽ“ĺ­?ă€‚ä»…ĺŻąć•°ćŤ®ĺş“ĺž‹ć•°ćŤ®ćş?ä¸­çš„çź˘é‡Źć•°ćŤ®é›†ćś‰ć•?ă€‚ă€‚
         */
        this.isFileCache = null;

        /**
         * @member {String} SuperMap.UpdateDatasetParameters.prototype.description
         * @description ć•°ćŤ®é›†ćŹŹčż°äżˇć?Żă€‚
         */
        this.description = null;

        /**
         * @member {PrjCoordSys} SuperMap.UpdateDatasetParameters.prototype.prjCoordSys
         * @description ćŠ•ĺ˝±ĺť?ć ‡çł»ă€‚
         */
        this.prjCoordSys = null;

        /**
         * @member {enum} SuperMap.UpdateDatasetParameters.prototype.charset
         * @description çź˘é‡Źć•°ćŤ®é›†çš„ĺ­—ç¬¦é›†ă€‚
         */
        this.charset = null;

        /**
         * @member {java.util.List<Color>} SuperMap.UpdateDatasetParameters.prototype.palette
         * @description ĺ˝±ĺ?Źć•°ćŤ®çš„é˘śč‰˛č°?č‰˛ćťżă€‚
         */
        this.palette = null;

        /**
         * @member {double} SuperMap.UpdateDatasetParameters.prototype.noValue
         * @description ć …ć Ľć•°ćŤ®é›†ä¸­ć˛ˇćś‰ć•°ćŤ®çš„ĺ?Źĺ…?çš„ć …ć Ľĺ€Ľă€‚
         */
        this.noValue = null;

        if (options) {
            Util.extend(this, options);
        }
        this.CLASS_NAME = "SuperMap.UpdateDatasetParameters";
    }

    /**
     * @function SuperMap.UpdateDatasetParameters.prototype.destroy
     * @description é‡Šć”ľčµ„ćş?ďĽŚĺ°†ĺĽ•ç”¨čµ„ćş?çš„ĺ±žć€§ç˝®ç©şă€‚
     */
    destroy() {
        var me = this;
        me.datasourceName = null;
        me.datasetName = null;
        me.isFileCache = null;
        me.prjCoordSys = null;
        me.charset = null;
        me.palette = null;
        me.noValue = null;
    }

}

SuperMap.UpdateDatasetParameters = UpdateDatasetParameters;

;// CONCATENATED MODULE: ./src/classic/services/DatasetService.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/







/**
 * @class SuperMap.REST.DatasetService
 * @category  iServer Data Dataset
 * @classdesc ć•°ćŤ®é›†ćźĄčŻ˘ă€‚
 * @extends {SuperMap.CommonServiceBase}
 * @param {string} url - ćśŤĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 */
class DatasetService extends CommonServiceBase {

    constructor(url, options) {
        super(url, options);
        this.CLASS_NAME = "SuperMap.REST.DatasetService";
    }

    /**
     * @function SuperMap.REST.DatasetService.prototype.getDatasets
     * @description ć•°ćŤ®é›†ćźĄčŻ˘ćśŤĺŠˇă€‚
     * @example
     *   new SuperMap.REST.DatasetService(url).getDatasets(datasourceName,function(result){
     *     //doSomething
     *   });
     * @param {string} datasourceName - ć•°ćŤ®ćş?ĺ?Ťç§°ă€‚
     * @param {RequestCallback} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    getDatasets(datasourceName, callback) {
        if (!datasourceName) {
            return;
        }
        const me = this;
        const datasetService = new DatasetService_DatasetService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            }
        });
        datasetService.getDatasetsService(datasourceName);
    }

    /**
     * @function SuperMap.REST.DatasetService.prototype.getDataset
     * @description ć•°ćŤ®é›†ćźĄčŻ˘ćśŤĺŠˇă€‚
     * @example
     *   new SuperMap.REST.DatasetService(url).getDataset(datasourceName, datasetName, function(result){
     *     //doSomething
     *   });
     * @param {string} datasourceName - ć•°ćŤ®ćş?ĺ?Ťç§°ă€‚
     * @param {string} datasetName - ć•°ćŤ®é›†ĺ?Ťç§°ă€‚
     * @param {RequestCallback} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    getDataset(datasourceName, datasetName, callback) {
        if (!datasourceName || !datasetName) {
            return;
        }
        const me = this;
        const datasetService = new DatasetService_DatasetService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            }
        });
        datasetService.getDatasetService(datasourceName, datasetName);
    }

    /**
     * @function SuperMap.REST.DatasetService.prototype.setDataset
     * @description ć•°ćŤ®é›†äżˇć?Żč®ľç˝®ćśŤĺŠˇă€‚ĺŹŻĺ®žçŽ°äż®ć”ąĺ·˛ĺ­?ĺś¨ć•°ćŤ®é›†ďĽŚć–°ĺ˘žä¸Ťĺ­?ĺś¨ć•°ćŤ®é›†ă€‚
     * @example
     *   new SuperMap.REST.DatasetService(url).setDataset(params, function(result){
     *     //doSomething
     *   });
     * @param {SuperMap.CreateDatasetParameters | SuperMap.UpdateDatasetParameters } params - ć•°ćŤ®é›†č®ľç˝®ĺŹ‚ć•°ç±»(ĺ˝“ĺ‰Ťć•°ćŤ®ćş?ä¸‹çš„ć•°ćŤ®é›†ä¸Ťĺ­?ĺś¨ć—¶ďĽŚć–°ĺ»şć•°ćŤ®é›†) || ć•°ćŤ®é›†äżˇć?Żć›´ć”ąĺŹ‚ć•°ç±»ă€‚(ĺ˝“ĺ‰Ťć•°ćŤ®ćş?ä¸‹çš„ć•°ćŤ®é›†ĺ­?ĺś¨ć—¶ďĽŚć›´ć”ąć•°ćŤ®é›†äżˇć?Ż)
     * @param {RequestCallback} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    setDataset(params, callback) {
        if (!(params instanceof CreateDatasetParameters) && !(params instanceof UpdateDatasetParameters)) {
            return;
        } 
        let datasetParams;
        if (params instanceof CreateDatasetParameters) {
            datasetParams = {
                "datasetType": params.datasetType,
                "datasetName": params.datasetName
            }
        } else if (params instanceof UpdateDatasetParameters) {
            datasetParams = {
                "datasetName": params.datasetName,
                "isFileCache": params.isFileCache,
                "description": params.description,
                "prjCoordSys": params.prjCoordSys,
                "charset": params.charset
            }
        }
        const me = this;
        const url = Util.urlPathAppend(me.url, `datasources/name/${params.datasourceName}/datasets/name/${params.datasetName}`);
        const datasetService = new DatasetService_DatasetService(url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                processCompleted: callback,
                processFailed: callback
            }
        });
        datasetService.setDatasetService(datasetParams);
    }

    /**
     * @function SuperMap.REST.DatasetService.prototype.deleteDataset
     * @description ćŚ‡ĺ®šć•°ćŤ®ćş?ä¸‹çš„ć•°ćŤ®é›†ĺ? é™¤ćśŤĺŠˇă€‚
     * @example
     *   new SuperMap.REST.DatasetService(url).deleteDataset(datasourceName, datasetName, function(result){
     *     //doSomething
     *   });
     * @param {string} datasourceName - ć•°ćŤ®ćş?ĺ?Ťç§°ă€‚
     * @param {string} datasetName - ć•°ćŤ®é›†ĺ?Ťç§°ă€‚
     * @param {RequestCallback} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    deleteDataset(datasourceName, datasetName, callback) {
        const me = this;
        const url = Util.urlPathAppend(me.url, `datasources/name/${datasourceName}/datasets/name/${datasetName}`);
        const datasetService = new DatasetService_DatasetService(url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                processCompleted: callback,
                processFailed: callback
            }
        });
        datasetService.deleteDatasetService();
    }
}

SuperMap_SuperMap.REST.DatasetService = DatasetService;
;// CONCATENATED MODULE: ./src/common/iServer/DatasourceService.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/




/**
 * @class SuperMap.DatasourceService
 * @category iServer Data Datasource
 * @classdesc ć•°ćŤ®ćş?ćźĄčŻ˘ćśŤĺŠˇă€‚
 * @param {string} url - ćśŤĺŠˇçš„č®żé—®ĺś°ĺť€ă€‚ĺ¦‚č®żé—®World DataćśŤĺŠˇďĽŚĺŹŞéś€ĺ°†urlč®ľä¸şďĽšhttp://localhost:8090/iserver/services/data-world/rest/data ĺŤłĺŹŻă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚</br>
 * @param {Object} options.eventListeners - äş‹ä»¶ç›‘ĺ?¬ĺ™¨ĺŻąč±ˇă€‚ćś‰processCompletedĺ±žć€§ĺŹŻäĽ ĺ…Ąĺ¤„ç?†ĺ®Ść??ĺ?Žçš„ĺ›žč°?ĺ‡˝ć•°ă€‚processFailedĺ±žć€§äĽ ĺ…Ąĺ¤„ç?†ĺ¤±č´Ąĺ?Žçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
 * @param {SuperMap.DataFormat} [options.format=SuperMap.DataFormat.GEOJSON] - ćźĄčŻ˘ç»“ćžśčż”ĺ›žć ĽĺĽŹďĽŚç›®ĺ‰Ťć”ŻćŚ? iServerJSON ĺ’Ś GeoJSON ä¸¤ç§Ťć ĽĺĽŹă€‚ĺŹ‚ć•°ć ĽĺĽŹä¸ş "ISERVER"ďĽŚ"GEOJSON"ă€‚
 * @param {string}options.datasource - č¦?ćźĄčŻ˘çš„ć•°ćŤ®é›†ć‰€ĺś¨çš„ć•°ćŤ®ćş?ĺ?Ťç§°ă€‚</br>
 * @param {string}options.dataset - č¦?ćźĄčŻ˘çš„ć•°ćŤ®é›†ĺ?Ťç§°ă€‚</br>
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 * @extends {SuperMap.CommonServiceBase}
 */

class DatasourceService_DatasourceService extends CommonServiceBase {

    constructor(url, options) {
        super(url, options);
        if (options) {
            Util.extend(this, options);
        }
        this.CLASS_NAME = "SuperMap.DatasourceService";
    }


    /**
     * @function SuperMap.DatasourceService.prototype.destroy
     * @override
     */
    destroy() {
        super.destroy();
    }


    /**
     * @function SuperMap.DatasourceService.prototype.getDatasourceService
     * @description ć‰§čˇŚćśŤĺŠˇďĽŚćźĄčŻ˘ć•°ćŤ®ćş?äżˇć?Żă€‚
     */
    getDatasourceService(datasourceName) {
        var me = this;
        me.url = Util.urlPathAppend(me.url,`datasources/name/${datasourceName}`);
        me.request({
            method: "GET",
            data: null,
            scope: me,
            success: me.serviceProcessCompleted,
            failure: me.serviceProcessFailed
        });
    }

    /**
     * @function SuperMap.DatasourceService.prototype.getDatasourcesService
     * @description ć‰§čˇŚćśŤĺŠˇďĽŚćźĄčŻ˘ć•°ćŤ®ćş?äżˇć?Żă€‚
     */
    getDatasourcesService() {
        var me = this;
        me.url = Util.urlPathAppend(me.url,`datasources`);
        me.request({
            method: "GET",
            data: null,
            scope: me,
            success: me.serviceProcessCompleted,
            failure: me.serviceProcessFailed
        });
    }
    /**
     * @function SuperMap.DatasourceService.prototype.setDatasourceService
     * @description ć‰§čˇŚćśŤĺŠˇďĽŚćźĄčŻ˘ć•°ćŤ®ćş?äżˇć?Żă€‚
     */
    setDatasourceService(params) {
        if (!params) {
            return;
        }
        var me = this;
        var jsonParamsStr = Util.toJSON(params);
        me.request({
            method: "PUT",
            data: jsonParamsStr,
            scope: me,
            success: me.serviceProcessCompleted,
            failure: me.serviceProcessFailed
        });
    }
}

SuperMap.DatasourceService = DatasourceService_DatasourceService;
;// CONCATENATED MODULE: ./src/common/iServer/SetDatasourceParameters.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/



/**
 * @class SuperMap.SetDatasourceParameters
 * @category iServer Data Datasource
 * @classdesc ć•°ćŤ®ćş?äżˇć?ŻćźĄčŻ˘ĺŹ‚ć•°ç±»ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚ 
 * @param {string} options.datasourceName - ć•°ćŤ®ćş?ĺ?Ťç§°ă€‚
 * @param {string} options.description - ć•°ćŤ®ćş?ćŹŹčż°äżˇć?Żă€‚
 * @param {Unit} options.coordUnit - ĺť?ć ‡ĺŤ•ä˝Ťă€‚
 * @param {Unit} options.distanceUnit - č·ťç¦»ĺŤ•ä˝Ťă€‚
 */
class SetDatasourceParameters {

    constructor(options) {
        if (!options) {
            return;
        }

        /**
         * @member {string} SuperMap.SetDatasourceParameters.prototype.datasourceName
         * @description ć•°ćŤ®ćş?ĺ?Ťç§°ă€‚
         */
        this.datasourceName = null;

        /**
         * @member {string} SuperMap.SetDatasourceParameters.prototype.description
         * @description ć•°ćŤ®ćş?ćŹŹčż°äżˇć?Żă€‚
         */
        this.description = null;

        /**
         * @member {Unit} SuperMap.SetDatasourceParameters.prototype.coordUnit
         * @description ĺť?ć ‡ĺŤ•ä˝Ťă€‚
         */
        this.coordUnit = null;

        /**
         * @member {Unit} SuperMap.SetDatasourceParameters.prototype.distanceUnit
         * @description č·ťç¦»ĺŤ•ä˝Ťă€‚
         */
        this.distanceUnit = null;

        if (options) {
            Util.extend(this, options);
        }
        this.CLASS_NAME = "SuperMap.SetDatasourceParameters";
    }

    /**
     * @function SuperMap.SetDatasourceParameters.prototype.destroy
     * @description é‡Šć”ľčµ„ćş?ďĽŚĺ°†ĺĽ•ç”¨čµ„ćş?çš„ĺ±žć€§ç˝®ç©şă€‚
     */
    destroy() {
        var me = this;
        me.datasourceName = null;
        me.description = null;
        me.coordUnit = null;
        me.distanceUnit = null;
    }

}

SuperMap.SetDatasourceParameters = SetDatasourceParameters;

;// CONCATENATED MODULE: ./src/classic/services/DatasourceService.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/






/**
 * @class SuperMap.REST.DatasourceService
 * @category  iServer Data Datasource
 * @classdesc ć•°ćŤ®ćş?ćśŤĺŠˇç±»ă€‚
 * @extends {SuperMap.CommonServiceBase}
 * @param {string} url - ćśŤĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 */
class DatasourceService extends CommonServiceBase {

    constructor(url, options) {
        super(url, options);
        this.CLASS_NAME = "SuperMap.REST.DatasourceService";
    }

    /**
     * @function SuperMap.REST.supermap.DatasourceService.prototype.getDatasources
     * @description ć•°ćŤ®ćş?é›†ćźĄčŻ˘ćśŤĺŠˇă€‚
     * @example
     *   new SuperMap.REST.DatasourceService(url).getDatasources(function(result){
     *     //doSomething
     *   });
     * @param {RequestCallback} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    getDatasources(callback) {
        const me = this;
        const datasourceService = new DatasourceService_DatasourceService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            }
        });
        datasourceService.getDatasourcesService();
    }
    
    /**
     * @function SuperMap.REST.DatasourceService.prototype.getDatasource
     * @description ć•°ćŤ®ćş?äżˇć?ŻćźĄčŻ˘ćśŤĺŠˇă€‚
     * @example
     *   new SuperMap.REST.DatasourceService(url).getDatasource(datasourceName,function(result){
     *     //doSomething
     *   });
     * @param {string} datasourceName - ć•°ćŤ®ćş?ĺ?Ťç§°ă€‚
     * @param {RequestCallback} callback ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    getDatasource(datasourceName, callback) {
        if (!datasourceName) {
            return;
        }
        const me = this;
        const datasourceService = new DatasourceService_DatasourceService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            }
        });
        datasourceService.getDatasourceService(datasourceName);
    }

   /**
     * @function SuperMap.REST.supermap.DatasourceService.prototype.setDatasource
     * @description ć•°ćŤ®ćş?äżˇć?Żč®ľç˝®ćśŤĺŠˇă€‚ĺŹŻĺ®žçŽ°ć›´ć”ąĺ˝“ĺ‰Ťć•°ćŤ®ćş?äżˇć?Żă€‚
     * @example
     *  new SuperMap.REST.DatasourceService(url).setDatasource(params, function(result){
     *     //doSomething
     *   });
     * @param {SuperMap.SetDatasourceParameters} params - ć•°ćŤ®ćş?äżˇć?Żč®ľç˝®ĺŹ‚ć•°ç±»ă€‚
     * @param {RequestCallback} callback - ĺ›žč°?ĺ‡˝ć•°ă€‚
     */
    setDatasource(params, callback) {
        if (!(params instanceof SetDatasourceParameters)) {
            return;
        }
        const datasourceParams = {
            description: params.description ,
            coordUnit: params.coordUnit,
            distanceUnit: params.distanceUnit
        };
        const me = this;
        const url = Util.urlPathAppend(me.url,`datasources/name/${params.datasourceName}`);
        const datasourceService = new DatasourceService_DatasourceService(url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                processCompleted: callback,
                processFailed: callback
            }
        });
        datasourceService.setDatasourceService(datasourceParams);
    }
}

SuperMap_SuperMap.REST.DatasourceService = DatasourceService;
;// CONCATENATED MODULE: ./src/common/iServer/ProcessingServiceBase.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/






/**
 * @class SuperMap.ProcessingServiceBase
 * @category  iServer ProcessingService
 * @classdesc ĺ?†ĺ¸?ĺĽŹĺ?†ćž?ćśŤĺŠˇĺźşç±»
 * @extends {SuperMap.CommonServiceBase}
 * @param {string} url - ĺ?†ĺ¸?ĺĽŹĺ?†ćž?ćśŤĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {SuperMap.Events} options.events - ĺ¤„ç?†ć‰€ćś‰äş‹ä»¶çš„ĺŻąč±ˇă€‚
 * @param {number} options.index - ćśŤĺŠˇč®żé—®ĺś°ĺť€ĺś¨ć•°ç»„ä¸­çš„ä˝Ťç˝®ă€‚
 * @param {number} options.length - ćśŤĺŠˇč®żé—®ĺś°ĺť€ć•°ç»„é•żĺş¦ă€‚
 * @param {Object} [options.eventListeners] - äş‹ä»¶ç›‘ĺ?¬ĺ™¨ĺŻąč±ˇă€‚ćś‰ processCompleted ĺ±žć€§ĺŹŻäĽ ĺ…Ąĺ¤„ç?†ĺ®Ść??ĺ?Žçš„ĺ›žč°?ĺ‡˝ć•°ă€‚processFailed ĺ±žć€§äĽ ĺ…Ąĺ¤„ç?†ĺ¤±č´Ąĺ?Žçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 */
class ProcessingServiceBase extends CommonServiceBase {

    constructor(url, options) {
        options = options || {};
        /*
         * Constant: EVENT_TYPES
         * {Array.<string>}
         * ć­¤ç±»ć”ŻćŚ?çš„äş‹ä»¶ç±»ĺž‹
         * - *processCompleted* ĺ?›ĺ»şć??ĺŠźĺ?Žč§¦ĺŹ‘çš„äş‹ä»¶ă€‚
         * - *processFailed* ĺ?›ĺ»şĺ¤±č´Ąĺ?Žč§¦ĺŹ‘çš„äş‹ä»¶ ă€‚
         * - *processRunning* ĺ?›ĺ»şčż‡ç¨‹çš„ć•´ä¸Şé?¶ć®µé?˝äĽšč§¦ĺŹ‘çš„äş‹ä»¶ďĽŚç”¨äşŽčŽ·ĺŹ–ĺ?›ĺ»şčż‡ç¨‹çš„çŠ¶ć€? ă€‚
         */
        options.EVENT_TYPES = ["processCompleted", "processFailed", "processRunning"];
        super(url, options);

        this.CLASS_NAME = "SuperMap.ProcessingServiceBase";
    }

    /**
     * @function SuperMap.ProcessingServiceBase.prototype.destroy
     * @override
     */
    destroy() {
        super.destroy();
    }

    /**
     * @function SuperMap.ProcessingServiceBase.prototype.getJobs
     * @description čŽ·ĺŹ–ĺ?†ĺ¸?ĺĽŹĺ?†ćž?ä»»ĺŠˇă€‚
     * @param {string} url - čµ„ćş?ĺś°ĺť€ă€‚
     */
    getJobs(url) {
        var me = this;
        FetchRequest.get(SecurityManager.appendCredential(url), null, {
            proxy: me.proxy
        }).then(function (response) {
            return response.json();
        }).then(function (result) {
            me.events.triggerEvent("processCompleted", {
                result: result
            });
        }).catch(function (e) {
            me.eventListeners.processFailed({
                error: e
            });
        });
    }

    /**
     * @function SuperMap.ProcessingServiceBase.prototype.addJob
     * @description ć·»ĺŠ ĺ?†ĺ¸?ĺĽŹĺ?†ćž?ä»»ĺŠˇă€‚
     * @param {string} url - čµ„ćş?ć ąĺś°ĺť€ă€‚
     * @param {Object} params - ĺ?›ĺ»şä¸€ä¸Şç©şé—´ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {string} paramType - čŻ·ć±‚ĺŹ‚ć•°ç±»ĺž‹ă€‚
     * @param {number} seconds - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     */
    addJob(url, params, paramType, seconds) {
        var me = this,
            parameterObject = null;
        if (params && params instanceof paramType) {
            parameterObject = new Object();
            paramType.toObject(params, parameterObject);
        }
        let headers = Object.assign({
          'Content-Type': 'application/x-www-form-urlencoded'
        }, me.headers || {})
        var options = {
            proxy: me.proxy,
            headers,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            isInTheSameDomain: me.isInTheSameDomain
        };
        FetchRequest.post(SecurityManager.appendCredential(url), JSON.stringify(parameterObject), options).then(function (response) {
            return response.json();
        }).then(function (result) {
            if (result.succeed) {
                me.serviceProcessCompleted(result, seconds);
            } else {
                me.serviceProcessFailed(result);
            }
        }).catch(function (e) {
            me.serviceProcessFailed({
                error: e
            });
        });
    }

    serviceProcessCompleted(result, seconds) {
        result = Util.transformResult(result);
        seconds = seconds || 1000;
        var me = this;
        if (result) {
            var id = setInterval(function () {
                FetchRequest.get(SecurityManager.appendCredential(result.newResourceLocation), {
                        _t: new Date().getTime()
                    })
                    .then(function (response) {
                        return response.json();
                    }).then(function (job) {
                        me.events.triggerEvent("processRunning", {
                            id: job.id,
                            state: job.state
                        });
                        if (job.state.runState === 'LOST' || job.state.runState === 'KILLED' || job.state.runState === 'FAILED') {
                            clearInterval(id);
                            me.events.triggerEvent("processFailed", {
                                error: job.state.errorMsg,
                                state: job.state.runState
                            });
                        }
                        if (job.state.runState === 'FINISHED' && job.setting.serviceInfo) {
                            clearInterval(id);
                            me.events.triggerEvent("processCompleted", {
                                result: job
                            });
                        }
                    }).catch(function (e) {
                        clearInterval(id);
                        me.events.triggerEvent("processFailed", {
                            error: e
                        });
                    });
            }, seconds);
        }
    }

    serviceProcessFailed(result) {
        super.serviceProcessFailed(result);
    }
}

SuperMap.ProcessingServiceBase = ProcessingServiceBase;
;// CONCATENATED MODULE: ./src/common/iServer/KernelDensityJobsService.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/





/**
 * @class SuperMap.KernelDensityJobsService
 * @category  iServer ProcessingService DensityAnalyst
 * @classdesc ć ¸ĺŻ†ĺş¦ĺ?†ćž?ćśŤĺŠˇç±»
 * @extends {SuperMap.ProcessingServiceBase}
 * @param {string} url -ć ¸ĺŻ†ĺş¦ĺ?†ćž?ćśŤĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - äş¤äş’ćśŤĺŠˇć—¶ć‰€éś€ĺŹŻé€‰ĺŹ‚ć•°ă€‚
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 */
class KernelDensityJobsService extends ProcessingServiceBase {

    constructor(url, options) {
        super(url, options);
        this.url = Util.urlPathAppend(this.url, 'spatialanalyst/density');
        this.CLASS_NAME = "SuperMap.KernelDensityJobsService";
    }

    /**
     * @function SuperMap.KernelDensityJobsService.prototype.destroy
     * @override
     */
    destroy() {
        super.destroy();
    }

    /**
     * @function SuperMap.KernelDensityJobsService.prototype.getKernelDensityJobs
     * @description čŽ·ĺŹ–ć ¸ĺŻ†ĺş¦ĺ?†ćž?ä»»ĺŠˇ
     */
    getKernelDensityJobs() {
        super.getJobs(this.url);
    }

    /**
     * @function SuperMap.KernelDensityJobsService.prototype.getKernelDensityJobs
     * @description čŽ·ĺŹ–ćŚ‡ĺ®šidçš„ć ¸ĺŻ†ĺş¦ĺ?†ćž?ćśŤĺŠˇ
     * @param {string} id - ćŚ‡ĺ®šč¦?čŽ·ĺŹ–ć•°ćŤ®çš„id
     */
    getKernelDensityJob(id) {
        super.getJobs(Util.urlPathAppend(this.url, id));
    }

    /**
     * @function SuperMap.KernelDensityJobsService.prototype.addKernelDensityJob
     * @description ć–°ĺ»şć ¸ĺŻ†ĺş¦ĺ?†ćž?ćśŤĺŠˇ
     * @param {SuperMap.KernelDensityJobParameter} params - ĺ?›ĺ»şä¸€ä¸Şç©şé—´ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {number} seconds - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     */
    addKernelDensityJob(params, seconds) {
        super.addJob(this.url, params, KernelDensityJobParameter, seconds);
    }

}

SuperMap.KernelDensityJobsService = KernelDensityJobsService;
;// CONCATENATED MODULE: ./src/common/iServer/SingleObjectQueryJobsService.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/





/**
 * @class SuperMap.SingleObjectQueryJobsService
 * @category  iServer ProcessingService Query
 * @classdesc ĺŤ•ĺŻąč±ˇćźĄčŻ˘ĺ?†ćž?ćśŤĺŠˇç±»
 * @extends {SuperMap.ProcessingServiceBase}
 * @param {string} url - ĺŤ•ĺŻąč±ˇç©şé—´ćźĄčŻ˘ĺ?†ćž?ćśŤĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 */
class SingleObjectQueryJobsService extends ProcessingServiceBase {
    constructor(url, options) {
        super(url, options);
        this.url = Util.urlPathAppend(this.url, 'spatialanalyst/query');
        this.CLASS_NAME = 'SuperMap.SingleObjectQueryJobsService';
    }

    /**
     *@override
     */
    destroy() {
        super.destroy();
    }

    /**
     * @function SuperMap.SingleObjectQueryJobsService.protitype.getQueryJobs
     * @description čŽ·ĺŹ–ĺŤ•ĺŻąč±ˇç©şé—´ćźĄčŻ˘ĺ?†ćž?ć‰€ćś‰ä»»ĺŠˇ
     */
    getQueryJobs() {
        super.getJobs(this.url);
    }

    /**
     * @function SuperMap.KernelDensityJobsService.protitype.getQueryJob
     * @description čŽ·ĺŹ–ćŚ‡ĺ®šidçš„ĺŤ•ĺŻąč±ˇç©şé—´ćźĄčŻ˘ĺ?†ćž?ćśŤĺŠˇ
     * @param {string} id - ćŚ‡ĺ®šč¦?čŽ·ĺŹ–ć•°ćŤ®çš„id
     */
    getQueryJob(id) {
        super.getJobs(Util.urlPathAppend(this.url, id));
    }

    /**
     * @function SuperMap.SingleObjectQueryJobsService.protitype.addQueryJob
     * @description ć–°ĺ»şĺŤ•ĺŻąč±ˇç©şé—´ćźĄčŻ˘ĺ?†ćž?ćśŤĺŠˇ
     * @param {SuperMap.SingleObjectQueryJobsParameter} params - ĺ?›ĺ»şä¸€ä¸Şç©şé—´ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {number} seconds - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     */
    addQueryJob(params, seconds) {
        super.addJob(this.url, params, SingleObjectQueryJobsParameter, seconds);
    }
}

SuperMap.SingleObjectQueryJobsService = SingleObjectQueryJobsService;

;// CONCATENATED MODULE: ./src/common/iServer/SummaryMeshJobsService.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/





/**
 * @class SuperMap.SummaryMeshJobsService
 * @category  iServer ProcessingService AggregatePoints
 * @classdesc ç‚ąč?šĺ??ĺ?†ćž?ä»»ĺŠˇç±»ă€‚
 * @param {string} url -ç‚ąč?šĺ??ĺ?†ćž?ä»»ĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {SuperMap.Events} options.events - ĺ¤„ç?†ć‰€ćś‰äş‹ä»¶çš„ĺŻąč±ˇă€‚<br>
 * @param {Object} [options.eventListeners] - äş‹ä»¶ç›‘ĺ?¬ĺ™¨ĺŻąč±ˇă€‚ćś‰ processCompleted ĺ±žć€§ĺŹŻäĽ ĺ…Ąĺ¤„ç?†ĺ®Ść??ĺ?Žçš„ĺ›žč°?ĺ‡˝ć•°ă€‚processFailed ĺ±žć€§äĽ ĺ…Ąĺ¤„ç?†ĺ¤±č´Ąĺ?Žçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
 * @param {number} options.index - ćśŤĺŠˇč®żé—®ĺś°ĺť€ĺś¨ć•°ç»„ä¸­çš„ä˝Ťç˝®ă€‚<br>
 * @param {number} options.length - ćśŤĺŠˇč®żé—®ĺś°ĺť€ć•°ç»„é•żĺş¦ă€‚
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 */
class SummaryMeshJobsService extends ProcessingServiceBase {
    constructor(url, options) {
        super(url, options);
        this.url = Util.urlPathAppend(this.url, 'spatialanalyst/aggregatepoints');
        this.CLASS_NAME = 'SuperMap.SummaryMeshJobsService';
    }

    /**
     * @override
     */
    destroy() {
        super.destroy();
    }

    /**
     * @function SuperMap.SummaryMeshJobsService.prototype.getSummaryMeshJobs
     * @description čŽ·ĺŹ–ç‚ąč?šĺ??ĺ?†ćž?ä»»ĺŠˇ
     */
    getSummaryMeshJobs() {
        super.getJobs(this.url);
    }

    /**
     * @function SuperMap.SummaryMeshJobsService.prototype.getSummaryMeshJob
     * @description čŽ·ĺŹ–ćŚ‡ĺ®šipçš„ç‚ąč?šĺ??ĺ?†ćž?ä»»ĺŠˇ
     * @param {string} id - ćŚ‡ĺ®šč¦?čŽ·ĺŹ–ć•°ćŤ®çš„id
     */
    getSummaryMeshJob(id) {
        super.getJobs(Util.urlPathAppend(this.url, id));
    }

    /**
     * @function SuperMap.SummaryMeshJobsService.prototype.addSummaryMeshJob
     * @description ć–°ĺ»şç‚ąč?šĺ??ĺ?†ćž?ćśŤĺŠˇ
     * @param {SuperMap.SummaryMeshJobParameter} params - ĺ?›ĺ»şä¸€ä¸Şç©şé—´ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {number} seconds - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     */
    addSummaryMeshJob(params, seconds) {
        super.addJob(this.url, params, SummaryMeshJobParameter, seconds);
    }
}

SuperMap.SummaryMeshJobsService = SummaryMeshJobsService;

;// CONCATENATED MODULE: ./src/common/iServer/SummaryRegionJobsService.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/





/**
 * @class SuperMap.SummaryRegionJobsService
 * @category  iServer ProcessingService SummaryRegion
 * @classdesc ĺŚşĺźźć±‡ć€»ĺ?†ćž?ćśŤĺŠˇç±»
 * @extends {SuperMap.ProcessingServiceBase}
 * @param {string} url - ĺŚşĺźźć±‡ć€»ĺ?†ćž?ćśŤĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 */
class SummaryRegionJobsService extends ProcessingServiceBase {
    constructor(url, options) {
        super(url, options);
        this.url = Util.urlPathAppend(this.url, 'spatialanalyst/summaryregion');
        this.CLASS_NAME = 'SuperMap.SummaryRegionJobsService';
    }

    /**
     *@override
     */
    destroy() {
        super.destroy();
    }

    /**
     * @function SuperMap.SummaryRegionJobsService.prototype.getSummaryRegionJobs
     * @description čŽ·ĺŹ–ĺŚşĺźźć±‡ć€»ĺ?†ćž?ä»»ĺŠˇé›†ĺ??ă€‚
     */
    getSummaryRegionJobs() {
        super.getJobs(this.url);
    }

    /**
     * @function SuperMap.SummaryRegionJobsService.prototype.getSummaryRegionJob
     * @description čŽ·ĺŹ–ćŚ‡ĺ®šidçš„ĺŚşĺźźć±‡ć€»ĺ?†ćž?ä»»ĺŠˇă€‚
     * @param {string} id -č¦?čŽ·ĺŹ–ĺŚşĺźźć±‡ć€»ĺ?†ćž?ä»»ĺŠˇçš„id
     */
    getSummaryRegionJob(id) {
        super.getJobs(Util.urlPathAppend(this.url, id));
    }

    /**
     * @function SuperMap.SummaryRegionJobsService.prototype.addSummaryRegionJob
     * @description ć–°ĺ»şĺŚşĺźźć±‡ć€»ä»»ĺŠˇă€‚
     * @param {SuperMap.SummaryRegionJobParameter} params - ĺ?›ĺ»şä¸€ä¸ŞĺŚşĺźźć±‡ć€»ä»»ĺŠˇçš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {number} seconds - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     */
    addSummaryRegionJob(params, seconds) {
        super.addJob(this.url, params, SummaryRegionJobParameter, seconds);
    }
}

SuperMap.SummaryRegionJobsService = SummaryRegionJobsService;

;// CONCATENATED MODULE: ./src/common/iServer/VectorClipJobsParameter.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/






/**
 * @class SuperMap.VectorClipJobsParameter
 * @category  iServer ProcessingService VectorClip
 * @classdesc çź˘é‡ŹčŁ?ĺ‰Şĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ç±»ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚ 
 * @param {string} options.datasetName - ć•°ćŤ®é›†ĺ?Ťă€‚ 
 * @param {string} options.datasetOverlay - čŁ?ĺ‰ŞĺŻąč±ˇć•°ćŤ®é›†ă€‚ 
 * @param {SuperMap.ClipAnalystMode} [options.mode=SuperMap.ClipAnalystMode.CLIP] - čŁ?ĺ‰Şĺ?†ćž?ć¨ˇĺĽŹă€‚ 
 * @param {SuperMap.OutputSetting} [options.output] - čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ă€‚ 
 * @param {SuperMap.MappingParameters} [options.mappingParameters] - ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚   
 */
class VectorClipJobsParameter {

    constructor(options) {
        options = options || {};

        /**
         * @member {string} SuperMap.VectorClipJobsParameter.prototype.datasetName
         * @description ć•°ćŤ®é›†ĺ?Ťă€‚
         */
        this.datasetName = "";

        /**
         * @member {string} SuperMap.VectorClipJobsParameter.prototype.datasetOverlay
         * @description čŁ?ĺ‰ŞĺŻąč±ˇć•°ćŤ®é›†ă€‚
         */
        this.datasetVectorClip = "";

        /**
         * @member {string} SuperMap.VectorClipJobsParameter.prototype.geometryClip
         * @description čŁ?ĺ‰Şĺ‡ ä˝•ĺŻąč±ˇă€‚
         */
        this.geometryClip = "";

        /**
         * @member {SuperMap.ClipAnalystMode} [SuperMap.VectorClipJobsParameter.prototype.mode=ClipAnalystMode.CLIP]
         * @description čŁ?ĺ‰Şĺ?†ćž?ć¨ˇĺĽŹ ă€‚
         */
        this.mode = ClipAnalystMode.CLIP;

        /**
         * @member {SuperMap.OutputSetting} SuperMap.VectorClipJobsParameter.prototype.output
         * @description čľ“ĺ‡şĺŹ‚ć•°č®ľç˝®ç±»ă€‚
         */
        this.output = null;

        /**
         * @member {SuperMap.MappingParameters} [SuperMap.VectorClipJobsParameter.prototype.mappingParameters]
         * @description ĺ?†ćž?ĺ?Žç»“ćžśĺŹŻč§†ĺŚ–çš„ĺŹ‚ć•°ç±»ă€‚   
         */
        this.mappingParameters = null;

        Util.extend(this, options);

        this.CLASS_NAME = "SuperMap.VectorClipJobsParameter";
    }

    /**
     * @function SuperMap.VectorClipJobsParameter.prototype.destroy
     * @description é‡Šć”ľčµ„ćş?ďĽŚĺ°†ĺĽ•ç”¨čµ„ćş?çš„ĺ±žć€§ç˝®ç©şă€‚
     */
    destroy() {
        this.datasetName = null;
        this.datasetVectorClip = null;
        this.geometryClip = null;
        this.mode = null;
        if (this.output instanceof OutputSetting) {
            this.output.destroy();
            this.output = null;
        }
        if (this.mappingParameters instanceof MappingParameters) {
            this.mappingParameters.destroy();
            this.mappingParameters = null;
        }
    }

    /**
     * @function SuperMap.VectorClipJobsParameter.toObject
     * @param {Object} vectorClipJobsParameter - ĺŚşĺźźć±‡ć€»ĺ?†ćž?ćśŤĺŠˇĺŹ‚ć•°ă€‚
     * @param {Object} tempObj - ç›®ć ‡ĺŻąč±ˇă€‚
     * @description çź˘é‡ŹčŁ?ĺ‰Şĺ?†ćž?ä»»ĺŠˇĺŻąč±ˇă€‚
     */
    static toObject(vectorClipJobsParameter, tempObj) {
        for (var name in vectorClipJobsParameter) {
            if (name === "datasetName") {
                tempObj['input'] = tempObj['input'] || {};
                tempObj['input'][name] = vectorClipJobsParameter[name];
                continue;
            }
            if (name === "output"){
                tempObj['output'] = tempObj['output'] || {};
                tempObj['output'] = vectorClipJobsParameter[name];
                continue;
            }
            tempObj['analyst'] = tempObj['analyst'] || {};
            tempObj['analyst'][name] = vectorClipJobsParameter[name];
            if(name === 'mappingParameters'){
                tempObj['analyst'][name] = tempObj['analyst'][name] || {};
                tempObj['analyst']['mappingParameters'] = vectorClipJobsParameter[name];
            }
        }
    }

}

SuperMap.VectorClipJobsParameter = VectorClipJobsParameter;

;// CONCATENATED MODULE: ./src/common/iServer/VectorClipJobsService.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/





/**
 * @class SuperMap.VectorClipJobsService
 * @category  iServer ProcessingService VectorClip
 * @classdesc çź˘é‡ŹčŁ?ĺ‰Şĺ?†ćž?ćśŤĺŠˇç±»
 * @extends {SuperMap.ProcessingServiceBase}
 * @param {string} url -çź˘é‡ŹčŁ?ĺ‰Şĺ?†ćž?ćśŤĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - äş¤äş’ćśŤĺŠˇć—¶ć‰€éś€ĺŹŻé€‰ĺŹ‚ć•°ă€‚
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 */
class VectorClipJobsService extends ProcessingServiceBase {
    constructor(url, options) {
        super(url, options);
        this.url = Util.urlPathAppend(this.url, 'spatialanalyst/vectorclip');
        this.CLASS_NAME = 'SuperMap.VectorClipJobsService';
    }

    /**
     *@override
     */
    destroy() {
        super.destroy();
    }

    /**
     * @function SuperMap.VectorClipJobsService.protitype.getVectorClipJobs
     * @description čŽ·ĺŹ–çź˘é‡ŹčŁ?ĺ‰Şĺ?†ćž?ć‰€ćś‰ä»»ĺŠˇ
     */
    getVectorClipJobs() {
        super.getJobs(this.url);
    }

    /**
     * @function SuperMap.KernelDensityJobsService.protitype.getVectorClipJob
     * @description čŽ·ĺŹ–ćŚ‡ĺ®šidçš„çź˘é‡ŹčŁ?ĺ‰Şĺ?†ćž?ćśŤĺŠˇ
     * @param {string} id - ćŚ‡ĺ®šč¦?čŽ·ĺŹ–ć•°ćŤ®çš„id
     */
    getVectorClipJob(id) {
        super.getJobs(Util.urlPathAppend(this.url, id));
    }

    /**
     * @function SuperMap.VectorClipJobsService.protitype.addVectorClipJob
     * @description ć–°ĺ»şçź˘é‡ŹčŁ?ĺ‰Şĺ?†ćž?ćśŤĺŠˇ
     * @param {SuperMap.VectorClipJobsParameter} params - ĺ?›ĺ»şä¸€ä¸Şç©şé—´ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {number} seconds - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     */
    addVectorClipJob(params, seconds) {
        super.addJob(this.url, params, VectorClipJobsParameter, seconds);
    }
}

SuperMap.VectorClipJobsService = VectorClipJobsService;

;// CONCATENATED MODULE: ./src/common/iServer/OverlayGeoJobsService.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/





/**
 * @class SuperMap.OverlayGeoJobsService
 * @category iServer ProcessingService OverlayAnalyst
 * @classdesc ĺŹ ĺŠ ĺ?†ćž?ä»»ĺŠˇç±»ă€‚
 * @param {string} url - ĺŹ ĺŠ ĺ?†ćž?ä»»ĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {SuperMap.Events} options.events - ĺ¤„ç?†ć‰€ćś‰äş‹ä»¶çš„ĺŻąč±ˇă€‚
 * @param {Object} [options.eventListeners] - äş‹ä»¶ç›‘ĺ?¬ĺ™¨ĺŻąč±ˇă€‚ćś‰ processCompleted ĺ±žć€§ĺŹŻäĽ ĺ…Ąĺ¤„ç?†ĺ®Ść??ĺ?Žçš„ĺ›žč°?ĺ‡˝ć•°ă€‚processFailed ĺ±žć€§äĽ ĺ…Ąĺ¤„ç?†ĺ¤±č´Ąĺ?Žçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
 * @param {number} options.index - ćśŤĺŠˇč®żé—®ĺś°ĺť€ĺś¨ć•°ç»„ä¸­çš„ä˝Ťç˝®ă€‚
 * @param {number} options.length - ćśŤĺŠˇč®żé—®ĺś°ĺť€ć•°ç»„é•żĺş¦ă€‚
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 */
class OverlayGeoJobsService extends ProcessingServiceBase {
    constructor(url, options) {
        super(url, options);
        this.url = Util.urlPathAppend(this.url, 'spatialanalyst/overlay');
        this.CLASS_NAME = 'SuperMap.OverlayGeoJobsService';
    }

    /**
     * @override
     */
    destroy() {
        super.destroy();
    }

    /**
     * @function SuperMap.OverlayGeoJobsService.prototype.getOverlayGeoJobs
     * @description čŽ·ĺŹ–ĺŹ ĺŠ ĺ?†ćž?ä»»ĺŠˇ
     */
    getOverlayGeoJobs() {
        super.getJobs(this.url);
    }

    /**
     * @function SuperMap.OverlayGeoJobsService.prototype.getOverlayGeoJob
     * @description čŽ·ĺŹ–ćŚ‡ĺ®šidçš„ĺŹ ĺŠ ĺ?†ćž?ä»»ĺŠˇ
     * @param {string} id - ćŚ‡ĺ®šč¦?čŽ·ĺŹ–ć•°ćŤ®çš„id
     */
    getOverlayGeoJob(id) {
        super.getJobs(Util.urlPathAppend(this.url, id));
    }

    /**
     * @function SuperMap.OverlayGeoJobsService.prototype.addOverlayGeoJob
     * @description ć–°ĺ»şç‚ąĺŹ ĺŠ ćž?ćśŤĺŠˇ
     * @param {SuperMap.OverlayGeoJobParameter} params - ĺ?›ĺ»şä¸€ä¸ŞĺŹ ĺŠ ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {number} seconds - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     */
    addOverlayGeoJob(params, seconds) {
        super.addJob(this.url, params, OverlayGeoJobParameter, seconds);
    }
}
SuperMap.OverlayGeoJobsService = OverlayGeoJobsService;

;// CONCATENATED MODULE: ./src/common/iServer/BuffersAnalystJobsService.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/





/**
 * @class SuperMap.BuffersAnalystJobsService
 * @category iServer ProcessingService BufferAnalyst
 * @classdesc çĽ“ĺ†˛ĺŚşĺ?†ćž?ćśŤĺŠˇç±»
 * @extends {SuperMap.ProcessingServiceBase}
 * @param {string} url - ćśŤĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 */
class BuffersAnalystJobsService extends ProcessingServiceBase {
    constructor(url, options) {
        super(url, options);
        this.url = Util.urlPathAppend(this.url, 'spatialanalyst/buffers');
        this.CLASS_NAME = 'SuperMap.BuffersAnalystJobsService';
    }

    /**
     *@override
     */
    destroy() {
        super.destroy();
    }

    /**
     * @function SuperMap.BuffersAnalystJobsService.prototype.getBufferJobs
     * @description čŽ·ĺŹ–çĽ“ĺ†˛ĺŚşĺ?†ćž?ć‰€ćś‰ä»»ĺŠˇ
     */
    getBuffersJobs() {
        super.getJobs(this.url);
    }

    /**
     * @function SuperMap.BuffersAnalystJobsService.prototype.getBufferJob
     * @description čŽ·ĺŹ–ćŚ‡ĺ®šidçš„çĽ“ĺ†˛ĺŚşĺ?†ćž?ćśŤĺŠˇ
     * @param {string} id - ćŚ‡ĺ®šč¦?čŽ·ĺŹ–ć•°ćŤ®çš„idă€‚
     */
    getBuffersJob(id) {
        super.getJobs(Util.urlPathAppend(this.url, id));
    }

    /**
     * @function SuperMap.BuffersAnalystJobsService.prototype.addBufferJob
     * @description ć–°ĺ»şçĽ“ĺ†˛ĺŚşĺ?†ćž?ćśŤĺŠˇ
     * @param {SuperMap.BuffersAnalystJobsParameter} params - ĺ?›ĺ»şä¸€ä¸Şç©şé—´ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {number} seconds - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     */
    addBuffersJob(params, seconds) {
        super.addJob(this.url, params, BuffersAnalystJobsParameter, seconds);
    }
}

SuperMap.BuffersAnalystJobsService = BuffersAnalystJobsService;

;// CONCATENATED MODULE: ./src/common/iServer/TopologyValidatorJobsService.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/





/**
 * @class SuperMap.TopologyValidatorJobsService
 * @category  iServer ProcessingService TopologyValidator
 * @classdesc ć‹“ć‰‘ćŁ€ćźĄĺ?†ćž?ćśŤĺŠˇç±»
 * @extends {SuperMap.ProcessingServiceBase}
 * @param {string} url - ć‹“ć‰‘ćŁ€ćźĄĺ?†ćž?ćśŤĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 */
class TopologyValidatorJobsService extends ProcessingServiceBase {

    constructor(url, options) {
        super(url, options);
        this.url = Util.urlPathAppend(this.url, 'spatialanalyst/topologyvalidator');
        this.CLASS_NAME = "SuperMap.TopologyValidatorJobsService";
    }

    /**
     *@override
     */
    destroy() {
        super.destroy();
    }

    /**
     * @function SuperMap.TopologyValidatorJobsService.protitype.getTopologyValidatorJobs
     * @description čŽ·ĺŹ–ć‹“ć‰‘ćŁ€ćźĄĺ?†ćž?ć‰€ćś‰ä»»ĺŠˇ
     */
    getTopologyValidatorJobs() {
        super.getJobs(this.url);
    }

    /**
     * @function SuperMap.TopologyValidatorJobsService.protitype.getTopologyValidatorJob
     * @description čŽ·ĺŹ–ćŚ‡ĺ®šidçš„ć‹“ć‰‘ćŁ€ćźĄĺ?†ćž?ćśŤĺŠˇ
     * @param {string} id - ćŚ‡ĺ®šč¦?čŽ·ĺŹ–ć•°ćŤ®çš„id
     */
    getTopologyValidatorJob(id) {
        super.getJobs( Util.urlPathAppend(this.url, id));
    }

    /**
     * @function SuperMap.TopologyValidatorJobsService.protitype.addTopologyValidatorJob
     * @description ć–°ĺ»şć‹“ć‰‘ćŁ€ćźĄĺ?†ćž?ćśŤĺŠˇ
     * @param {SuperMap.TopologyValidatorJobsParameter} params - ĺ?›ĺ»şä¸€ä¸Şç©şé—´ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {number} seconds - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     */
    addTopologyValidatorJob(params, seconds) {
        super.addJob(this.url, params, TopologyValidatorJobsParameter, seconds);
    }

}

SuperMap.TopologyValidatorJobsService = TopologyValidatorJobsService;
;// CONCATENATED MODULE: ./src/common/iServer/SummaryAttributesJobsService.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/





/**
 * @class SuperMap.SummaryAttributesJobsService
 * @category  iServer ProcessingService SummaryAttributes
 * @classdesc ĺ±žć€§ć±‡ć€»ĺ?†ćž?ćśŤĺŠˇç±»
 * @extends {SuperMap.ProcessingServiceBase}
 * @param {string} url - ć±‡ć€»ç»źč®ˇĺ?†ćž?ćśŤĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - ĺŹ‚ć•°ă€‚
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 */
class SummaryAttributesJobsService extends ProcessingServiceBase {

    constructor(url, options) {
        super(url, options);
        this.url = Util.urlPathAppend(this.url, 'spatialanalyst/summaryattributes');
        this.CLASS_NAME = "SuperMap.SummaryAttributesJobsService";
    }

    /**
     *@override
     */
    destroy() {
        super.destroy();
    }

    /**
     * @function SuperMap.SummaryAttributesJobsService.protitype.getSummaryAttributesJobs
     * @description čŽ·ĺŹ–ĺ±žć€§ć±‡ć€»ĺ?†ćž?ć‰€ćś‰ä»»ĺŠˇ
     */
    getSummaryAttributesJobs (){
        super.getJobs(this.url);
    }

    /**
     * @function SuperMap.SummaryAttributesJobsService.protitype.getSummaryAttributesJob
     * @description čŽ·ĺŹ–ćŚ‡ĺ®šidçš„ĺ±žć€§ć±‡ć€»ĺ?†ćž?ćśŤĺŠˇ
     * @param {string} id - ćŚ‡ĺ®šč¦?čŽ·ĺŹ–ć•°ćŤ®çš„id
     */
    getSummaryAttributesJob(id) {
        super.getJobs(Util.urlPathAppend(this.url, id));
    }

    /**
     * @function SuperMap.SummaryAttributesJobsService.protitype.addSummaryAttributesJob
     * @description ć–°ĺ»şĺ±žć€§ć±‡ć€»ĺ?†ćž?ćśŤĺŠˇ
     * @param {SuperMap.SummaryAttributesJobsParameter} params - ĺ?›ĺ»şä¸€ä¸Şç©şé—´ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {number} seconds - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     */
    addSummaryAttributesJob(params, seconds) {
        super.addJob(this.url, params, SummaryAttributesJobsParameter, seconds);
    }

}

SuperMap.SummaryAttributesJobsService = SummaryAttributesJobsService;
;// CONCATENATED MODULE: ./src/classic/services/ProcessingService.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/













/**
 * @class SuperMap.REST.ProcessingService
 * @category  iServer ProcessingService
 * @classdesc ĺ?†ĺ¸?ĺĽŹĺ?†ćž?ç›¸ĺ…łćśŤĺŠˇç±»ă€‚
 * @augments SuperMap.CommonServiceBase
 * @example
 * ç”¨ćł•ďĽš
 * new SuperMap.REST.ProcessingService(url,options)
 *    .getKernelDensityJobs(function(result){
 *       //doSomething
 * })
 * @param {string} url - ĺ?†ĺ¸?ĺĽŹĺ?†ćž?ćśŤĺŠˇĺś°ĺť€ă€‚
 * @param {Object} options - ĺŹŻé€‰ĺŹ‚ć•°ă€‚
 * @param {boolean} [options.crossOrigin] - ć?Żĺ?¦ĺ…?č®¸č·¨ĺźźčŻ·ć±‚ă€‚
 * @param {Object} [options.headers] - čŻ·ć±‚ĺ¤´ă€‚
 */
class ProcessingService extends CommonServiceBase {
    constructor(url, options) {
        super(url, options);
        this.kernelDensityJobs = {};
        this.summaryMeshJobs = {};
        this.queryJobs = {};
        this.summaryRegionJobs = {};
        this.vectorClipJobs = {};
        this.overlayGeoJobs = {};
        this.buffersJobs = {};
        this.topologyValidatorJobs = {};
        this.summaryAttributesJobs = {};
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getKernelDensityJobs
     * @description čŽ·ĺŹ–ĺŻ†ĺş¦ĺ?†ćž?çš„ĺ?—čˇ¨ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getKernelDensityJobs(callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var kernelDensityJobsService = new KernelDensityJobsService(me.url, {
            headers: me.headers,
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        kernelDensityJobsService.getKernelDensityJobs();
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getKernelDensityJob
     * @description čŽ·ĺŹ–ćź?ä¸€ä¸ŞĺŻ†ĺş¦ĺ?†ćž?ă€‚
     * @param {string} id - ç©şé—´ĺ?†ćž?çš„ idă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getKernelDensityJob(id, callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var kernelDensityJobsService = new KernelDensityJobsService(me.url, {
            headers: me.headers,
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        kernelDensityJobsService.getKernelDensityJob(id);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.addKernelDensityJob
     * @description ć–°ĺ»şä¸€ä¸ŞĺŻ†ĺş¦ĺ?†ćž?ă€‚
     * @param {SuperMap.KernelDensityJobParameter} params - ĺ?›ĺ»şä¸€ä¸Şç©şé—´ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {number} [seconds=1000] - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    addKernelDensityJob(params, callback, seconds, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var kernelDensityJobsService = new KernelDensityJobsService(me.url, {
            headers: me.headers,
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback,
                processRunning(job) {
                    me.kernelDensityJobs[job.id] = job.state;
                }
            },
            format: format
        });
        kernelDensityJobsService.addKernelDensityJob(params, seconds);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getKernelDensityJobState
     * @description čŽ·ĺŹ–ĺŻ†ĺş¦ĺ?†ćž?çš„çŠ¶ć€?ă€‚
     * @param {string} id - ĺŻ†ĺş¦ĺ?†ćž?çš„ idă€‚
     * @returns {Object} - ĺŻ†ĺş¦ĺ?†ćž?çš„çŠ¶ć€?ă€‚
     */
    getKernelDensityJobState(id) {
        return this.kernelDensityJobs[id];
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getSummaryMeshJobs
     * @description čŽ·ĺŹ–ç‚ąč?šĺ??ĺ?†ćž?çš„ĺ?—čˇ¨ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getSummaryMeshJobs(callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var summaryMeshJobsService = new SummaryMeshJobsService(me.url, {
            headers: me.headers,
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        summaryMeshJobsService.getSummaryMeshJobs();
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getSummaryMeshJob
     * @description čŽ·ĺŹ–ćź?ä¸€ä¸Şç‚ąč?šĺ??ĺ?†ćž?ă€‚
     * @param {string} id - ç©şé—´ĺ?†ćž?çš„ idă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getSummaryMeshJob(id, callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var summaryMeshJobsService = new SummaryMeshJobsService(me.url, {
            headers: me.headers,
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        summaryMeshJobsService.getSummaryMeshJob(id);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.addSummaryMeshJob
     * @description ć–°ĺ»şä¸€ä¸Şç‚ąč?šĺ??ĺ?†ćž?ă€‚
     * @param {SuperMap.SummaryMeshJobParameter} params - ç‚ąč?šĺ??ĺ?†ćž?ä»»ĺŠˇĺŹ‚ć•°ç±»ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {number} [seconds=1000] - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    addSummaryMeshJob(params, callback, seconds, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var summaryMeshJobsService = new SummaryMeshJobsService(me.url, {
            headers: me.headers,
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback,
                processRunning(job) {
                    me.summaryMeshJobs[job.id] = job.state;
                }
            },
            format: format
        });
        summaryMeshJobsService.addSummaryMeshJob(params, seconds);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getSummaryMeshJobState
     * @description čŽ·ĺŹ–ç‚ąč?šĺ??ĺ?†ćž?çš„çŠ¶ć€?ă€‚
     * @param {string} id - ç‚ąč?šĺ??ĺ?†ćž?çš„ idă€‚
     * @returns {Object} ç‚ąč?šĺ??ĺ?†ćž?çš„çŠ¶ć€?ă€‚
     */
    getSummaryMeshJobState(id) {
        return this.summaryMeshJobs[id];
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getQueryJobs
     * @description čŽ·ĺŹ–ĺŤ•ĺŻąč±ˇćźĄčŻ˘ĺ?†ćž?çš„ĺ?—čˇ¨ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getQueryJobs(callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var singleObjectQueryJobsService = new SingleObjectQueryJobsService(me.url, {
            headers: me.headers,
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        singleObjectQueryJobsService.getQueryJobs();
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getQueryJob
     * @description čŽ·ĺŹ–ćź?ä¸€ä¸ŞĺŤ•ĺŻąč±ˇćźĄčŻ˘ĺ?†ćž?ă€‚
     * @param {string} id - ç©şé—´ĺ?†ćž?çš„ idă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getQueryJob(id, callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var singleObjectQueryJobsService = new SingleObjectQueryJobsService(me.url, {
            headers: me.headers,
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,

            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        singleObjectQueryJobsService.getQueryJob(id);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.addQueryJob
     * @description ć–°ĺ»şä¸€ä¸ŞĺŤ•ĺŻąč±ˇćźĄčŻ˘ĺ?†ćž?ă€‚
     * @param {SuperMap.SingleObjectQueryJobsParameter} params - ĺ?›ĺ»şä¸€ä¸Şç©şé—´ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {number} [seconds=1000] - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    addQueryJob(params, callback, seconds, resultFormat) {
        var me = this,
            param = me._processParams(params),
            format = me._processFormat(resultFormat);
        var singleObjectQueryJobsService = new SingleObjectQueryJobsService(me.url, {
            headers: me.headers,
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback,
                processRunning(job) {
                    me.queryJobs[job.id] = job.state;
                }
            },
            format: format
        });
        singleObjectQueryJobsService.addQueryJob(param, seconds);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getQueryJobState
     * @description čŽ·ĺŹ–ĺŤ•ĺŻąč±ˇćźĄčŻ˘ĺ?†ćž?çš„çŠ¶ć€?ă€‚
     * @param {string} id - ĺŤ•ĺŻąč±ˇćźĄčŻ˘ĺ?†ćž?çš„ idă€‚
     * @returns {Object} ĺŤ•ĺŻąč±ˇćźĄčŻ˘ĺ?†ćž?çš„çŠ¶ć€?
     */
    getQueryJobState(id) {
        return this.queryJobs[id];
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getSummaryRegionJobs
     * @description čŽ·ĺŹ–ĺŚşĺźźć±‡ć€»ĺ?†ćž?çš„ĺ?—čˇ¨ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getSummaryRegionJobs(callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var summaryRegionJobsService = new SummaryRegionJobsService(me.url, {
            proxy: me.proxy,
            headers: me.headers,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,

            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        summaryRegionJobsService.getSummaryRegionJobs();
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getSummaryRegionJob
     * @description čŽ·ĺŹ–ćź?ä¸€ä¸ŞĺŚşĺźźć±‡ć€»ĺ?†ćž?ă€‚
     * @param {string} id - ĺŚşĺźźć±‡ć€»ĺ?†ćž?çš„ idă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getSummaryRegionJob(id, callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var summaryRegionJobsService = new SummaryRegionJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        summaryRegionJobsService.getSummaryRegionJob(id);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.addSummaryRegionJob
     * @description ć–°ĺ»şä¸€ä¸ŞĺŚşĺźźć±‡ć€»ĺ?†ćž?ă€‚
     * @param {SuperMap.SummaryRegionJobParameter} params -ĺ?›ĺ»şä¸€ä¸ŞĺŚşĺźźć±‡ć€»ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {number} [seconds=1000] - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    addSummaryRegionJob(params, callback, seconds, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var summaryRegionJobsService = new SummaryRegionJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback,
                processRunning(job) {
                    me.summaryRegionJobs[job.id] = job.state;
                }
            },
            format: format
        });
        summaryRegionJobsService.addSummaryRegionJob(params, seconds);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getSummaryRegionJobState
     * @description čŽ·ĺŹ–ĺŚşĺźźć±‡ć€»ĺ?†ćž?çš„çŠ¶ć€?ă€‚
     * @param {string} id - ĺŚşĺźźć±‡ć€»ĺ?†ćž?çš„ idă€‚
     * @returns {Object} ĺŚşĺźźć±‡ć€»ĺ?†ćž?çš„çŠ¶ć€?ă€‚
     */
    getSummaryRegionJobState(id) {
        return this.summaryRegionJobs[id];
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getVectorClipJobs
     * @description čŽ·ĺŹ–çź˘é‡ŹčŁ?ĺ‰Şĺ?†ćž?çš„ĺ?—čˇ¨ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getVectorClipJobs(callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var vectorClipJobsService = new VectorClipJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        vectorClipJobsService.getVectorClipJobs();
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getVectorClipJob
     * @description čŽ·ĺŹ–ćź?ä¸€ä¸Şçź˘é‡ŹčŁ?ĺ‰Şĺ?†ćž?ă€‚
     * @param {string} id - ç©şé—´ĺ?†ćž?çš„ idă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getVectorClipJob(id, callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var vectorClipJobsService = new VectorClipJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        vectorClipJobsService.getVectorClipJob(id);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.addVectorClipJob
     * @description ć–°ĺ»şä¸€ä¸Şçź˘é‡ŹčŁ?ĺ‰Şĺ?†ćž?ă€‚
     * @param {SuperMap.VectorClipJobsParameter} params - ĺ?›ĺ»şä¸€ä¸Şç©şé—´ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {number} [seconds=1000] - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    addVectorClipJob(params, callback, seconds, resultFormat) {
        var me = this,
            param = me._processParams(params),
            format = me._processFormat(resultFormat);
        var vectorClipJobsService = new VectorClipJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback,
                processRunning(job) {
                    me.vectorClipJobs[job.id] = job.state;
                }
            },
            format: format
        });
        vectorClipJobsService.addVectorClipJob(param, seconds);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getVectorClipJobState
     * @description čŽ·ĺŹ–çź˘é‡ŹčŁ?ĺ‰Şĺ?†ćž?çš„çŠ¶ć€?ă€‚
     * @param {string} id - çź˘é‡ŹčŁ?ĺ‰Şĺ?†ćž?çš„ idă€‚
     * @returns {Object} çź˘é‡ŹčŁ?ĺ‰Şĺ?†ćž?çš„çŠ¶ć€?ă€‚
     */
    getVectorClipJobState(id) {
        return this.vectorClipJobs[id];
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getOverlayGeoJobs
     * @description čŽ·ĺŹ–ĺŹ ĺŠ ĺ?†ćž?çš„ĺ?—čˇ¨ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getOverlayGeoJobs(callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var overlayGeoJobsService = new OverlayGeoJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        overlayGeoJobsService.getOverlayGeoJobs();
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getOverlayGeoJob
     * @description čŽ·ĺŹ–ćź?ä¸€ä¸ŞĺŹ ĺŠ ĺ?†ćž?ă€‚
     * @param {string} id - ç©şé—´ĺ?†ćž?çš„ idă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getOverlayGeoJob(id, callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var overlayGeoJobsService = new OverlayGeoJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        overlayGeoJobsService.getOverlayGeoJob(id);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.addOverlayGeoJob
     * @description ć–°ĺ»şä¸€ä¸ŞĺŹ ĺŠ ĺ?†ćž?ă€‚
     * @param {SuperMap.OverlayGeoJobParameter} params - ĺ?›ĺ»şä¸€ä¸Şç©şé—´ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {number} [seconds=1000] - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    addOverlayGeoJob(params, callback, seconds, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var overlayGeoJobsService = new OverlayGeoJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback,
                processRunning: function(job) {
                    me.overlayGeoJobs[job.id] = job.state;
                }
            },
            format: format
        });
        overlayGeoJobsService.addOverlayGeoJob(params, seconds);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getoverlayGeoJobState
     * @description čŽ·ĺŹ–ĺŹ ĺŠ ĺ?†ćž?çš„çŠ¶ć€?ă€‚
     * @param {string} id - ĺŹ ĺŠ ĺ?†ćž?çš„ idă€‚
     * @returns {Object} ĺŹ ĺŠ ĺ?†ćž?çš„çŠ¶ć€?ă€‚
     */
    getoverlayGeoJobState(id) {
        return this.overlayGeoJobs[id];
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getBuffersJobs
     * @description čŽ·ĺŹ–çĽ“ĺ†˛ĺŚşĺ?†ćž?çš„ĺ?—čˇ¨ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getBuffersJobs(callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var buffersAnalystJobsService = new BuffersAnalystJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        buffersAnalystJobsService.getBuffersJobs();
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getBuffersJob
     * @description čŽ·ĺŹ–ćź?ä¸€ä¸ŞçĽ“ĺ†˛ĺŚşĺ?†ćž?ă€‚
     * @param {string} id - ç©şé—´ĺ?†ćž?çš„ idă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getBuffersJob(id, callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var buffersAnalystJobsService = new BuffersAnalystJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        buffersAnalystJobsService.getBuffersJob(id);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.addBuffersJob
     * @description ć–°ĺ»şä¸€ä¸ŞçĽ“ĺ†˛ĺŚşĺ?†ćž?ă€‚
     * @param {SuperMap.BuffersAnalystJobsParameter} params - ĺ?›ĺ»şä¸€ä¸Şç©şé—´ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {number} [seconds=1000] - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    addBuffersJob(params, callback, seconds, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var buffersAnalystJobsService = new BuffersAnalystJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback,
                processRunning: function(job) {
                    me.buffersJobs[job.id] = job.state;
                }
            },
            format: format
        });
        buffersAnalystJobsService.addBuffersJob(params, seconds);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getBuffersJobState
     * @description čŽ·ĺŹ–çĽ“ĺ†˛ĺŚşĺ?†ćž?çš„çŠ¶ć€?ă€‚
     * @param {string} id - çĽ“ĺ†˛ĺŚşĺ?†ćž?çš„ idă€‚
     * @returns {Object} çĽ“ĺ†˛ĺŚşĺ?†ćž?çš„çŠ¶ć€?ă€‚
     */
    getBuffersJobState(id) {
        return this.buffersJobs[id];
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getTopologyValidatorJobs
     * @description čŽ·ĺŹ–ć‹“ć‰‘ćŁ€ćźĄĺ?†ćž?çš„ĺ?—čˇ¨ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getTopologyValidatorJobs(callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var topologyValidatorJobsService = new TopologyValidatorJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        topologyValidatorJobsService.getTopologyValidatorJobs();
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getTopologyValidatorJob
     * @description čŽ·ĺŹ–ćź?ä¸€ä¸Şć‹“ć‰‘ćŁ€ćźĄĺ?†ćž?ă€‚
     * @param {string} id - ç©şé—´ĺ?†ćž?çš„ idă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getTopologyValidatorJob(id, callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var topologyValidatorJobsService = new TopologyValidatorJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        topologyValidatorJobsService.getTopologyValidatorJob(id);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.addTopologyValidatorJob
     * @description ć–°ĺ»şä¸€ä¸Şć‹“ć‰‘ćŁ€ćźĄĺ?†ćž?ă€‚
     * @param {SuperMap.TopologyValidatorJobsParameter} params - ĺ?›ĺ»şä¸€ä¸Şç©şé—´ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {number} [seconds=1000] - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    addTopologyValidatorJob(params, callback, seconds, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var topologyValidatorJobsService = new TopologyValidatorJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback,
                processRunning: function(job) {
                    me.topologyValidatorJobs[job.id] = job.state;
                }
            },
            format: format
        });
        topologyValidatorJobsService.addTopologyValidatorJob(params, seconds);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getTopologyValidatorJobState
     * @description čŽ·ĺŹ–ć‹“ć‰‘ćŁ€ćźĄĺ?†ćž?çš„çŠ¶ć€?ă€‚
     * @param {string} id - ć‹“ć‰‘ćŁ€ćźĄĺ?†ćž?çš„ idă€‚
     * @returns {Object} ć‹“ć‰‘ćŁ€ćźĄĺ?†ćž?çš„çŠ¶ć€?ă€‚
     */
    getTopologyValidatorJobState(id) {
        return this.topologyValidatorJobs[id];
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getSummaryAttributesJobs
     * @description čŽ·ĺŹ–ĺ±žć€§ć±‡ć€»ĺ?†ćž?çš„ĺ?—čˇ¨ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getSummaryAttributesJobs(callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var summaryAttributesJobsService = new SummaryAttributesJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        summaryAttributesJobsService.getSummaryAttributesJobs();
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getSummaryAttributesJob
     * @description čŽ·ĺŹ–ćź?ä¸€ä¸Şĺ±žć€§ć±‡ć€»ĺ?†ćž?ă€‚
     * @param {string} id - ç©şé—´ĺ?†ćž?çš„ idă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    getSummaryAttributesJob(id, callback, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var summaryAttributesJobsService = new SummaryAttributesJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback
            },
            format: format
        });
        summaryAttributesJobsService.getSummaryAttributesJob(id);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.addSummaryAttributesJob
     * @description ć–°ĺ»şä¸€ä¸Şĺ±žć€§ć±‡ć€»ĺ?†ćž?ă€‚
     * @param {SuperMap.SummaryAttributesJobsParameter} params - ĺ?›ĺ»şä¸€ä¸Şç©şé—´ĺ?†ćž?çš„čŻ·ć±‚ĺŹ‚ć•°ă€‚
     * @param {function} callback - čŻ·ć±‚ç»“ćžśçš„ĺ›žč°?ĺ‡˝ć•°ă€‚
     * @param {number} [seconds=1000] - ĺĽ€ĺ§‹ĺ?›ĺ»şĺ?ŽďĽŚčŽ·ĺŹ–ĺ?›ĺ»şć??ĺŠźç»“ćžśçš„ć—¶é—´é—´éš”ă€‚
     * @param {SuperMap.DataFormat} [resultFormat=SuperMap.DataFormat.GEOJSON] - čż”ĺ›žçš„ç»“ćžśç±»ĺž‹ă€‚
     */
    addSummaryAttributesJob(params, callback, seconds, resultFormat) {
        var me = this,
            format = me._processFormat(resultFormat);
        var summaryAttributesJobsService = new SummaryAttributesJobsService(me.url, {
            proxy: me.proxy,
            withCredentials: me.withCredentials,
            crossOrigin: me.crossOrigin,
            headers: me.headers,
            eventListeners: {
                scope: me,
                processCompleted: callback,
                processFailed: callback,
                processRunning: function(job) {
                    me.summaryAttributesJobs[job.id] = job.state;
                }
            },
            format: format
        });
        summaryAttributesJobsService.addSummaryAttributesJob(params, seconds);
    }

    /**
     * @function SuperMap.REST.ProcessingService.prototype.getSummaryAttributesJobState
     * @description čŽ·ĺŹ–ĺ±žć€§ć±‡ć€»ĺ?†ćž?çš„çŠ¶ć€?ă€‚
     * @param {string} id - ĺ±žć€§ć±‡ć€»ĺ?†ćž?çš„ idă€‚
     * @returns {Object} ĺ±žć€§ć±‡ć€»ĺ?†ćž?çš„çŠ¶ć€?ă€‚
     */
    getSummaryAttributesJobState(id) {
        return this.summaryAttributesJobs[id];
    }

    _processFormat(resultFormat) {
        return resultFormat ? resultFormat : DataFormat.GEOJSON;
    }

    _processParams(params) {
        if (!params) {
            return {};
        }
        if (params.geometryQuery) {
            params.geometryQuery = this._convertPatams(params.geometryQuery);
        }
        if (params.geometryClip) {
            params.geometryClip = this._convertPatams(params.geometryClip);
        }
        return params;
    }

    _convertPatams(points) {
        var geometryParam = {};
        if (points.length < 1) {
            geometryParam = '';
        } else {
            var results = [];
            for (var i = 0; i < points.length; i++) {
                var point = {};
                point.x = points[i].x;
                point.y = points[i].y;
                results.push(point);
            }
            geometryParam.type = 'REGION';
            geometryParam.points = results;
        }
        return geometryParam;
    }
}

SuperMap_SuperMap.REST.ProcessingService = ProcessingService;

;// CONCATENATED MODULE: ./src/classic/services/index.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/




;// CONCATENATED MODULE: ./src/classic/index.js
/* CopyrightÂ© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/


















/**
 *@namespace SuperMap
 *@category BaseTypes Namespace
 */

})();

/******/ })()
;