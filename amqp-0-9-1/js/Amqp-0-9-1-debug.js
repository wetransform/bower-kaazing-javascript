/**
 * Copyright (c) 2007-2014 Kaazing Corporation. All rights reserved.
 * 
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */


/**
 * @private
 */
// Root Namespace Object
var Kaazing = Kaazing || {};

if (typeof Kaazing.namespace !== "function") {
    // The implementation is nondestructive i.e. if a namespace exists, it won't be created.
	Kaazing.namespace = function(namespace_string) {
	    var parts = namespace_string.split('.');
	    var parent = Kaazing;
	    
	    // strip redundant leading global
	    if (parts[0] === "Kaazing") {
	        parts = parts.slice(1);
	    }
	    
	    for (var i = 0; i < parts.length; i++) {
	        // create a property if it does not exist
	        if (typeof parent[parts[i]] === "undefined") {
	            parent[parts[i]] = {};
	        }
	        parent = parent[parts[i]];
	    }
	    
	    return parent;
	}
}



/**
 * @private
 */
var Logger = function(name) {
    this._name = name;
    this._level = Logger.Level.INFO; // default to INFO 
};
        
(function() {
    /**
     * Logging levels available. Matches java.util.logging.Level.
     * See http://java.sun.com/javase/6/docs/api/java/util/logging/Level.html
     * @ignore
     */
    Logger.Level = {
        OFF:8,
        SEVERE:7,
        WARNING:6,
        INFO:5,
        CONFIG:4,
        FINE:3,
        FINER:2,
        FINEST:1,
        ALL:0
    };
    
    // Load the logging configuration as specified by the kaazing:logging META tag
    var logConfString;
    var tags = document.getElementsByTagName("meta");
    for(var i = 0; i < tags.length; i++) {
        if (tags[i].name === 'kaazing:logging') {
            logConfString = tags[i].content;
            break;
        }
    }
    Logger._logConf = {};
    if (logConfString) {
        var tokens = logConfString.split(',');
        for (var i = 0; i < tokens.length; i++) {
            var logConfItems = tokens[i].split('=');
            Logger._logConf[logConfItems[0]] = logConfItems[1];
        }
    }
    
    var loggers = {};
    
    Logger.getLogger = function(name) {
        var logger = loggers[name];
        if (logger === undefined) {
            logger = new Logger(name);
            loggers[name] = logger;
        }
        return logger; 
    }
    
    var $prototype = Logger.prototype;
    
    /**
     * Set the log level specifying which message levels will be logged.
     * @param level the log level
     * @ignore
     * @memberOf Logger
     */
    $prototype.setLevel = function(level) {
        if (level && level >= Logger.Level.ALL && level <= Logger.Level.OFF) {
            this._level = level;
        }
    }    

    /**
     * Check if a message of the given level would actually be logged.
     * @param level the log level
     * @return whether loggable
     * @ignore
     * @memberOf Logger
     */
    $prototype.isLoggable = function(level) {
        for (var logKey in Logger._logConf) {
            if (Logger._logConf.hasOwnProperty(logKey)) {
                if (this._name.match(logKey)) {
                    var logVal = Logger._logConf[logKey];
                    if (logVal) {
                        return (Logger.Level[logVal] <= level);
                    }
                }
            }
        }
        return (this._level <= level);
    }
    
    var noop = function() {};
    
    var delegates = {};
    delegates[Logger.Level.OFF] = noop;
    delegates[Logger.Level.SEVERE] = (window.console) ? (console.error || console.log || noop) : noop;
    delegates[Logger.Level.WARNING] = (window.console) ? (console.warn || console.log || noop) : noop;
    delegates[Logger.Level.INFO] = (window.console) ? (console.info || console.log || noop) : noop;
    delegates[Logger.Level.CONFIG] = (window.console) ? (console.info || console.log || noop) : noop;
    delegates[Logger.Level.FINE] = (window.console) ? (console.debug || console.log || noop) : noop;
    delegates[Logger.Level.FINER] = (window.console) ? (console.debug || console.log || noop) : noop;
    delegates[Logger.Level.FINEST] = (window.console) ? (console.debug || console.log || noop) : noop;
    delegates[Logger.Level.ALL] = (window.console) ? (console.log || noop) : noop;
    
    $prototype.config = function(source, message) {
        this.log(Logger.Level.CONFIG, source, message);
    };

    $prototype.entering = function(source, name, params) {
        if (this.isLoggable(Logger.Level.FINER)) {
            if (browser == 'chrome' || browser == 'safari') {
                source = console;
            }
            var delegate = delegates[Logger.Level.FINER];
            if (params) {
                if (typeof(delegate) == 'object') {
                    delegate('ENTRY ' + name, params);
                } else {
                    delegate.call(source, 'ENTRY ' + name, params);
                }
            } else {
                if (typeof(delegate) == 'object') {
                    delegate('ENTRY ' + name);
                } else {
                    delegate.call(source, 'ENTRY ' + name);
                }
            }
        }  
    };

    $prototype.exiting = function(source, name, value) {
        if (this.isLoggable(Logger.Level.FINER)) {
            var delegate = delegates[Logger.Level.FINER];
            if (browser == 'chrome' || browser == 'safari') {
                source = console;
            }
            if (value) {
                if (typeof(delegate) == 'object') {
                    delegate('RETURN ' + name, value);
                } else {
                    delegate.call(source, 'RETURN ' + name, value);
                }
            } else {
                if (typeof(delegate) == 'object') {
                    delegate('RETURN ' + name);
                } else {
                    delegate.call(source, 'RETURN ' + name);
                }
            }
        }  
    };
    
    $prototype.fine = function(source, message) {
        this.log(Logger.Level.FINE, source, message);
    };

    $prototype.finer = function(source, message) {
        this.log(Logger.Level.FINER, source, message);
    };

    $prototype.finest = function(source, message) {
        this.log(Logger.Level.FINEST, source, message);
    };

    $prototype.info = function(source, message) {
        this.log(Logger.Level.INFO, source, message);
    };

    $prototype.log = function(level, source, message) {
        if (this.isLoggable(level)) {
            var delegate = delegates[level];
            if (browser == 'chrome' || browser == 'safari') {
                source = console;
            }
            if (typeof(delegate) == 'object') {
                delegate(message);
            } else {
                delegate.call(source, message);
            }
        }  
    };

    $prototype.severe = function(source, message) {
        this.log(Logger.Level.SEVERE, source, message);
    };

    $prototype.warning = function(source, message) {
        this.log(Logger.Level.WARNING, source, message);
    };

})();
    



/**
 * @ignore
 */
;;;var ULOG = Logger.getLogger('com.kaazing.gateway.client.loader.Utils');

/**
 * Given a key, returns the value of the content attribute of the first
 * meta tag with a name attribute matching that key.
 *
 * @internal
 * @ignore
 */
var getMetaValue = function(key) {
    ;;;ULOG.entering(this, 'Utils.getMetaValue', key);
    // get all meta tags
    var tags = document.getElementsByTagName("meta");

    // find tag with name matching key
    for(var i=0; i < tags.length; i++) {
        if (tags[i].name === key) {
            var v = tags[i].content;
            ;;;ULOG.exiting(this, 'Utils.getMetaValue', v);
            return v;
        }
    }
    ;;;ULOG.exiting(this, 'Utils.getMetaValue');
}

var arrayCopy = function(array) {
    ;;;ULOG.entering(this, 'Utils.arrayCopy', array);
    var newArray = [];
    for (var i=0; i<array.length; i++) {
        newArray.push(array[i]);
    }
    return newArray;
}

var arrayFilter = function(array, callback) {
    ;;;ULOG.entering(this, 'Utils.arrayFilter', {'array':array, 'callback':callback});
    var newArray = [];
    for (var i=0; i<array.length; i++) {
        var elt = array[i];
        if(callback(elt)) {
            newArray.push(array[i]);
        }
    }
    return newArray;
}

var indexOf = function(array, searchElement) {
    ;;;ULOG.entering(this, 'Utils.indexOf', {'array':array, 'searchElement':searchElement});
    for (var i=0; i<array.length; i++) {
        if (array[i] == searchElement) {
            ;;;ULOG.exiting(this, 'Utils.indexOf', i);
            return i;
        }
    }
    ;;;ULOG.exiting(this, 'Utils.indexOf', -1);
    return -1;
}

/**
 * Given a byte string, decode as a UTF-8 string
 * @private
 * @ignore
 */
var decodeByteString = function(s) {
    ;;;ULOG.entering(this, 'Utils.decodeByteString', s);
    var a = [];
    for (var i=0; i<s.length; i++) {
        a.push(s.charCodeAt(i) & 0xFF);
    }
    var buf = new Kaazing.ByteBuffer(a);
    var v = getStringUnterminated(buf, Kaazing.Charset.UTF8);
    ;;;ULOG.exiting(this, 'Utils.decodeByteString', v);
    return v;
}

/**
 * Given an arrayBuffer, decode as a UTF-8 string
 * @private
 * @ignore
 */
var decodeArrayBuffer = function(array) {
    ;;;ULOG.entering(this, 'Utils.decodeArrayBuffer', array);
    var buf = new Uint8Array(array);
    var a = [];
    for (var i=0; i<buf.length; i++) {
        a.push(buf[i]);
    }
    var buf = new Kaazing.ByteBuffer(a);
    var s = getStringUnterminated(buf, Kaazing.Charset.UTF8);
    ;;;ULOG.exiting(this, 'Utils.decodeArrayBuffer', s);
    return s;
}

/**
 * Given an arrayBuffer, decode as a Kaazing.ByteBuffer
 * @private
 * @ignore
 */
var decodeArrayBuffer2ByteBuffer = function(array) {
    ;;;ULOG.entering(this, 'Utils.decodeArrayBuffer2ByteBuffer');
    var buf = new Uint8Array(array);
    var a = [];
    for (var i=0; i<buf.length; i++) {
        a.push(buf[i]);
    }
    ;;;ULOG.exiting(this, 'Utils.decodeArrayBuffer2ByteBuffer');
    return new Kaazing.ByteBuffer(a);
}

var ESCAPE_CHAR = String.fromCharCode(0x7F);
var NULL = String.fromCharCode(0);
var LINEFEED = "\n";

/**
 * Convert a ByteBuffer into an escaped and encoded string
 * @private
 * @ignore
 */
var encodeEscapedByteString = function(buf) {
    ;;;ULOG.entering(this, 'Utils.encodeEscapedByte', buf);
    var a = [];
    while(buf.remaining()) {
        var n = buf.getUnsigned();
        var chr = String.fromCharCode(n);
        switch(chr) {
            case ESCAPE_CHAR:
                a.push(ESCAPE_CHAR);
                a.push(ESCAPE_CHAR);
                break;
            case NULL:
                a.push(ESCAPE_CHAR);
                a.push("0");
                break;
            case LINEFEED:
                a.push(ESCAPE_CHAR);
                a.push("n");
                break;
            default:
                a.push(chr);
        }

    }
    var v = a.join("");
    ;;;ULOG.exiting(this, 'Utils.encodeEscapedBytes', v);
    return v;
}

/**
 * Convert a ByteBuffer into a properly escaped and encoded string
 * @private
 * @ignore
 */
var encodeByteString = function(buf, requiresEscaping) {
    ;;;ULOG.entering(this, 'Utils.encodeByteString', {'buf':buf, 'requiresEscaping': requiresEscaping});
    if (requiresEscaping) {
        return encodeEscapedByteString(buf);
    } else {
    	// obtain the array without copying if possible
		var array = buf.array;
		var bytes = (buf.position == 0 && buf.limit == array.length) ? array : buf.getBytes(buf.remaining());

		// update the array to use unsigned values and \u0100 for \u0000 (due to XDR bug)
        var sendAsUTF8 = !(XMLHttpRequest.prototype.sendAsBinary);
		for (var i=bytes.length-1; i >= 0; i--) {
		    var element = bytes[i];
		    if (element == 0 && sendAsUTF8) {
		        bytes[i] = 0x100;
		    }
		    else if (element < 0) {
		        bytes[i] = element & 0xff;
		    }
		}

        var encodedLength = 0;
        var partsOfByteString = [];

        do {
            var amountToEncode = Math.min(bytes.length - encodedLength, 10000);
            partOfBytes = bytes.slice(encodedLength, encodedLength + amountToEncode);
            encodedLength += amountToEncode;
		    partsOfByteString.push(String.fromCharCode.apply(null, partOfBytes));
        } while ( encodedLength < bytes.length);

		// convert UTF-8 char codes to String
        var byteString = partsOfByteString.join("");

		// restore original byte values for \u0000
		if (bytes === array) {
			for (var i=bytes.length-1; i >= 0; i--) {
			    var element = bytes[i];
			    if (element == 0x100) {
			        bytes[i] = 0;
			    }
			}
		}

        ;;;ULOG.exiting(this, 'Utils.encodeByteString', byteString);
        return byteString;
    }
}

/**
 * UTF8 Decode an entire ByteBuffer (ignoring "null termination" because 0 is a
 *      valid character code!
 * @private
 * @ignore
 */
var getStringUnterminated = function(buf, cs) {
  var newLimit = buf.position;
  var oldLimit = buf.limit;
  var array = buf.array;
  while (newLimit < oldLimit) {
    newLimit++;
  }
  try {
      buf.limit = newLimit;
      return cs.decode(buf);
  }
  finally {
      if (newLimit != oldLimit) {
          buf.limit = oldLimit;
          buf.position = newLimit + 1;
      }
  }
};



/**
 * @ignore
 */
var browser = null;
if (typeof(ActiveXObject) != "undefined") {
    //KG-5860: treat IE 10 same as Chrome
    if(navigator.userAgent.indexOf("MSIE 10")!=-1){
        browser="chrome";
    }else{
        browser="ie";
    }
}
else if (navigator.userAgent.indexOf("Trident/7") != -1 && navigator.userAgent.indexOf("rv:11") != -1) {
    // treat IE 11 same as chrome
    // IE 11 UA string - http://blogs.msdn.com/b/ieinternals/archive/2013/09/21/internet-explorer-11-user-agent-string-ua-string-sniffing-compatibility-with-gecko-webkit.aspx
    // window.ActiveXObject property is hidden from the DOM
    browser = "chrome";
}
else if (navigator.userAgent.indexOf("Edge") != -1) {
    // treat Edge same as chrome
    browser = "chrome";
}
else if(Object.prototype.toString.call(window.opera) == "[object Opera]") {
    browser = 'opera';
}
else if (navigator.vendor.indexOf('Apple') != -1) {
    // This has to happen before the Gecko check, as that expression also
    // evaluates to true.
    browser = 'safari';
    // add ios attribute for known iOS substrings
    if (navigator.userAgent.indexOf("iPad")!=-1 || navigator.userAgent.indexOf("iPhone")!=-1) {
    	browser.ios = true;
    }
}
else if (navigator.vendor.indexOf('Google') != -1) {
    if ((navigator.userAgent.indexOf("Android") != -1) &&
        (navigator.userAgent.indexOf("Chrome") == -1)) {
        browser = "android";
    }
    else {
        browser="chrome";
    }
}
else if (navigator.product == 'Gecko' && window.find && !navigator.savePreferences) {
    browser = 'firefox'; // safari as well
}
else {
    throw new Error("couldn't detect browser");
}



(function($module){
   
   if (typeof $module.ByteOrder === "undefined") {
        /**
         * A typesafe enumeration for byte orders.
         *
         * @class ByteOrder
         * @alias ByteOrder
         */
       var ByteOrder = function() {};
    
	    // Note:
	    //   Math.pow(2, 32) = 4294967296
	    //   Math.pow(2, 16) = 65536
	    //   Math.pow(2,  8) = 256
	
	    /**
	     * @ignore
	     */
	    var $prototype = ByteOrder.prototype;
	
	    /**
	     * Returns the string representation of a ByteOrder.
	     *
	     * @return string
	     *
	     * @public
	     * @function
	     * @name toString
	     * @memberOf ByteOrder#
	     */
	    $prototype.toString = function() {
	        throw new Error ("Abstract");
	    }
	    
	    /**
	     * Returns the single-byte representation of an 8-bit integer.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _toUnsignedByte = function(v) {
	        return (v & 255);
	    }
	    
	    /**
	     * Returns a signed 8-bit integer from a single-byte representation.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _toByte = function(byte0) {
	        return (byte0 & 128) ? (byte0 | -256) : byte0;
	    }
	    
	    /**
	     * Returns the big-endian 2-byte representation of a 16-bit integer.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _fromShort = function(v) {
	        return [((v >> 8) & 255), (v & 255)];
	    }
	    
	    /**
	     * Returns a signed 16-bit integer from a big-endian two-byte representation.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _toShort = function(byte1, byte0) {
	        return (_toByte(byte1) << 8) | (byte0 & 255);
	    }
	    
	    /**
	     * Returns an unsigned 16-bit integer from a big-endian two-byte representation.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _toUnsignedShort = function(byte1, byte0) {
	        return ((byte1 & 255) << 8) | (byte0 & 255);
	    }
	
	    /**
	     * Returns an unsigned 24-bit integer from a big-endian three-byte representation.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _toUnsignedMediumInt = function(byte2, byte1, byte0) {
	        return ((byte2 & 255) << 16) | ((byte1 & 255) << 8) | (byte0 & 255);
	    }
	
	    /**
	     * Returns the big-endian three-byte representation of a 24-bit integer.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _fromMediumInt = function(v) {
	        return [((v >> 16) & 255), ((v >> 8) & 255), (v & 255)];
	    }
	    
	    /**
	     * Returns a signed 24-bit integer from a big-endian three-byte representation.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _toMediumInt = function(byte2, byte1, byte0) {
	        return ((byte2 & 255) << 16) | ((byte1 & 255) << 8) | (byte0 & 255);
	    }
	    
	    /**
	     * Returns the big-endian four-byte representation of a 32-bit integer.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _fromInt = function(v) {
	        return [((v >> 24) & 255), ((v >> 16) & 255), ((v >> 8) & 255), (v & 255)];
	    }
	    
	    /**
	     * Returns a signed 32-bit integer from a big-endian four-byte representation.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _toInt = function(byte3, byte2, byte1, byte0) {
	        return (_toByte(byte3) << 24) | ((byte2 & 255) << 16) | ((byte1 & 255) << 8) | (byte0 & 255);
	    }
	    
	    /**
	     * Returns an unsigned 32-bit integer from a big-endian four-byte representation.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _toUnsignedInt = function(byte3, byte2, byte1, byte0) {
	        var nibble1 = _toUnsignedShort(byte3, byte2);
	        var nibble0 = _toUnsignedShort(byte1, byte0);
	        return (nibble1 * 65536 + nibble0);
	    }
	
	    /**
	     * The big-endian byte order.
	     *
	     * @public
	     * @static
	     * @final
	     * @field
	     * @name BIG_ENDIAN
	     * @type ByteOrder
	     * @memberOf ByteOrder
	     */
	    ByteOrder.BIG_ENDIAN = (function() {
	        
	        var BigEndian = function() {}
	        BigEndian.prototype = new ByteOrder();
	        var $prototype = BigEndian.prototype;
	
	        $prototype._toUnsignedByte = _toUnsignedByte;
	        $prototype._toByte = _toByte;
	        $prototype._fromShort = _fromShort;
	        $prototype._toShort = _toShort;
	        $prototype._toUnsignedShort = _toUnsignedShort;
	        $prototype._toUnsignedMediumInt = _toUnsignedMediumInt;
	        $prototype._fromMediumInt = _fromMediumInt;
	        $prototype._toMediumInt = _toMediumInt;
	        $prototype._fromInt = _fromInt;
	        $prototype._toInt = _toInt;
	        $prototype._toUnsignedInt = _toUnsignedInt;
	
	        $prototype.toString = function() {
	            return "<ByteOrder.BIG_ENDIAN>";
	        }
	
	        return new BigEndian();
	    })();
	
	    /**
	     * The little-endian byte order.
	     *
	     * @public
	     * @static
	     * @final
	     * @field
	     * @name BIG_ENDIAN
	     * @type ByteOrder
	     * @memberOf ByteOrder
	     */
	    ByteOrder.LITTLE_ENDIAN = (function() {
	        var LittleEndian = function() {}
	        LittleEndian.prototype = new ByteOrder();
	        var $prototype = LittleEndian.prototype;
	
	        $prototype._toByte = _toByte;
	        $prototype._toUnsignedByte = _toUnsignedByte;
	        
	        $prototype._fromShort = function(v) {
	            return _fromShort(v).reverse();
	        }
	        
	        $prototype._toShort = function(byte1, byte0) {
	            return _toShort(byte0, byte1);
	        }
	        
	        $prototype._toUnsignedShort = function(byte1, byte0) {
	            return _toUnsignedShort(byte0, byte1);
	        }
	
	        $prototype._toUnsignedMediumInt = function(byte2, byte1, byte0) {
	            return _toUnsignedMediumInt(byte0, byte1, byte2);
	        }
	
	        $prototype._fromMediumInt = function(v) {
	            return _fromMediumInt(v).reverse();
	        }
	        
	        $prototype._toMediumInt = function(byte5, byte4, byte3, byte2, byte1, byte0) {
	            return _toMediumInt(byte0, byte1, byte2, byte3, byte4, byte5);
	        }
	        
	        $prototype._fromInt = function(v) {
	            return _fromInt(v).reverse();
	        }
	        
	        $prototype._toInt = function(byte3, byte2, byte1, byte0) {
	            return _toInt(byte0, byte1, byte2, byte3);
	        }
	        
	        $prototype._toUnsignedInt = function(byte3, byte2, byte1, byte0) {
	            return _toUnsignedInt(byte0, byte1, byte2, byte3);
	        }
	        
	        $prototype.toString = function() {
	            return "<ByteOrder.LITTLE_ENDIAN>";
	        }
	
	        return new LittleEndian();
	    })();
		
		$module.ByteOrder = ByteOrder;
   }

})(Kaazing);





(function($module) {

    if (typeof $module.ByteBuffer === "undefined") {
        /**
         * Creates a new ByteBuffer instance.
         *
         * @class  ByteBuffer provides a compact byte array representation for 
         *         sending, receiving and processing binary data using WebSocket.
         * @alias ByteBuffer
         * @param {Array} bytes  the byte-valued Number array
         * @constructor ByteBuffer
         */
        var ByteBuffer = function(bytes) {
            this.array = bytes || [];
            this._mark = -1;
            this.limit = this.capacity = this.array.length;
            // Default to network byte order
            this.order = $module.ByteOrder.BIG_ENDIAN;
        }
        
        
        /**
         * Allocates a new ByteBuffer instance.
         * The new buffer's position will be zero, its limit will be its capacity,
         * and its mark will be undefined. 
         *
         * @param {Number} capacity  the maximum buffer capacity
         *
         * @return {ByteBuffer} the allocated ByteBuffer 
         *
         * @public
         * @static
         * @function
         * @memberOf ByteBuffer
         */
        ByteBuffer.allocate = function(capacity) {
            var buf = new ByteBuffer();
            buf.capacity = capacity;
    
            // setting limit to the given capacity, other it would be 0...
            buf.limit = capacity;
            return buf;
        };
        
        /**
         * Wraps a byte array as a new ByteBuffer instance.
         *
         * @param {Array} bytes  an array of byte-sized numbers
         *
         * @return {ByteBuffer} the bytes wrapped as a ByteBuffer 
         *
         * @public
         * @static
         * @function
         * @memberOf ByteBuffer
         */
        ByteBuffer.wrap = function(bytes) {
          return new ByteBuffer(bytes);
        };
    
        var $prototype = ByteBuffer.prototype;
        
        /**
         * The autoExpand property enables writing variable length data,
         * and is on by default.
         *
         * @public
         * @field
         * @name autoExpand
         * @type Boolean
         * @memberOf ByteBuffer#
         */
        $prototype.autoExpand = true;
    
        /**
         * The capacity property indicates the maximum number of bytes
         * of storage available if the buffer is not automatically expanding.
         *
         * @public
         * @readonly
         * @field
         * @name capacity
         * @type Number
         * @memberOf ByteBuffer#
         */
        $prototype.capacity = 0;
        
        /**
         * The position property indicates the progress through the buffer,
         * and indicates the position within the underlying array that
         * subsequent data will be read from or written to.
         *
         * @public
         * @field
         * @name position
         * @type Number
         * @memberOf ByteBuffer#
         */
        $prototype.position = 0;
        
        /**
         * The limit property indicates the last byte of data available for 
         * reading.
         *
         * @public
         * @field
         * @name limit
         * @type Number
         * @memberOf ByteBuffer#
         */
        $prototype.limit = 0;
    
    
        /**
         * The order property indicates the endianness of multibyte integer types in
         * the buffer.
         *
         * @public
         * @field
         * @name order
         * @type ByteOrder
         * @memberOf ByteBuffer#
         */
        $prototype.order = $module.ByteOrder.BIG_ENDIAN;
        
        /**
         * The array property provides byte storage for the buffer.
         *
         * @public
         * @field
         * @name array
         * @type Array
         * @memberOf ByteBuffer#
         */
        $prototype.array = [];
        
        /**
         * Marks a position in the buffer.
         *
         * @return {ByteBuffer} the buffer
         *
         * @see ByteBuffer#reset
         *
         * @public
         * @function
         * @name mark
         * @memberOf ByteBuffer#
         */
        $prototype.mark = function() {
          this._mark = this.position;
          return this;
        };
        
        /**
         * Resets the buffer position using the mark.
         *
         * @throws {Error} if the mark is invalid
         *
         * @return {ByteBuffer} the buffer
         *
         * @see ByteBuffer#mark
         *
         * @public
         * @function
         * @name reset
         * @memberOf ByteBuffer#
         */
        $prototype.reset = function() {
          var m = this._mark;
          if (m < 0) {
            throw new Error("Invalid mark");
          }
          this.position = m;
          return this;
        };
        
        /**
         * Compacts the buffer by removing leading bytes up
         * to the buffer position, and decrements the limit
         * and position values accordingly.
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name compact
         * @memberOf ByteBuffer#
         */
        $prototype.compact = function() {
          this.array.splice(0, this.position);
          this.limit -= this.position;
          this.position = 0;
          return this;
        };
        
        /**
         * Duplicates the buffer by reusing the underlying byte
         * array but with independent position, limit and capacity.
         *
         * @return {ByteBuffer} the duplicated buffer
         *
         * @public
         * @function
         * @name duplicate
         * @memberOf ByteBuffer#
         */
        $prototype.duplicate = function() {
          var buf = new ByteBuffer(this.array);
          buf.position = this.position;
          buf.limit = this.limit;
          buf.capacity = this.capacity;
          return buf;
        };
        
        /**
         * Fills the buffer with a repeated number of zeros.
         *
         * @param size  {Number}  the number of zeros to repeat
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name fill
         * @memberOf ByteBuffer#
         */
        $prototype.fill = function(size) {
          _autoExpand(this, size);
          while (size-- > 0) {
            this.put(0);
          }
          return this;
        };
        
        /**
         * Fills the buffer with a specific number of repeated bytes.
         *
         * @param b     {Number}  the byte to repeat
         * @param size  {Number}  the number of times to repeat
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name fillWith
         * @memberOf ByteBuffer#
         */
        $prototype.fillWith = function(b, size) {
          _autoExpand(this, size);
          while (size-- > 0) {
            this.put(b);
          }
          return this;
        };
        
        /**
         * Returns the index of the specified byte in the buffer.
         *
         * @param b     {Number}  the byte to find
         *
         * @return {Number} the index of the byte in the buffer, or -1 if not found
         *
         * @public
         * @function
         * @name indexOf
         * @memberOf ByteBuffer#
         */
        $prototype.indexOf = function(b) {
          var limit = this.limit;
          var array = this.array;
          for (var i=this.position; i < limit; i++) {
            if (array[i] == b) {
              return i;
            }
          }
          return -1;
        };
        
        /**
         * Puts a single byte number into the buffer at the current position.
         *
         * @param v     {Number}  the single-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name put
         * @memberOf ByteBuffer#
         */
        $prototype.put = function(v) {
           _autoExpand(this, 1);
           this.array[this.position++] = v & 255;
           return this;
        };
        
        /**
         * Puts a single byte number into the buffer at the specified index.
         *
         * @param index   {Number}  the index
         * @param v       {Number}  the byte
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putAt
         * @memberOf ByteBuffer#
         */
        $prototype.putAt = function(index, v) {
           _checkForWriteAt(this,index,1);
           this.array[index] = v & 255;
           return this;
        };
    
        /**
         * Puts an unsigned single-byte number into the buffer at the current position.
         *
         * @param v     {Number}  the single-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putUnsigned
         * @memberOf ByteBuffer#
         */
         $prototype.putUnsigned = function(v) {
            _autoExpand(this, 1);
            this.array[this.position++] = v & 0xFF;
            return this;
        }
        /**
         * Puts an unsigned single byte into the buffer at the specified position.
         *
         * @param index  {Number}  the index
         * @param v      {Number}  the single-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putUnsignedAt
         * @memberOf ByteBuffer#
         */
         $prototype.putUnsignedAt = function(index, v) {
            _checkForWriteAt(this,index,1);
            this.array[index] = v & 0xFF;
            return this;
        }
        /**
         * Puts a two-byte short into the buffer at the current position.
         *
         * @param v     {Number} the two-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putShort
         * @memberOf ByteBuffer#
         */
        $prototype.putShort = function(v) {
            _autoExpand(this, 2);
            _putBytesInternal(this, this.position, this.order._fromShort(v));
            this.position += 2;
            return this;
        };
        
        /**
         * Puts a two-byte short into the buffer at the specified index.
         *
         * @param index  {Number}  the index
         * @param v      {Number}  the two-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putShortAt
         * @memberOf ByteBuffer#
         */
        $prototype.putShortAt = function(index, v) {
            _checkForWriteAt(this,index,2);
            _putBytesInternal(this, index, this.order._fromShort(v));
            return this;
        };
        
        /**
         * Puts a two-byte unsigned short into the buffer at the current position.
         *
         * @param v     {Number}  the two-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putUnsignedShort
         * @memberOf ByteBuffer#
         */
        $prototype.putUnsignedShort = function(v) {
            _autoExpand(this, 2);
            _putBytesInternal(this, this.position, this.order._fromShort(v & 0xFFFF));
            this.position += 2;
            return this;
        }
    
        /**
         * Puts an unsigned two-byte unsigned short into the buffer at the position specified.
         * 
         * @param index     {Number}  the index
         * @param v     {Number}  the two-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putUnsignedShort
         * @memberOf ByteBuffer#
         */
        $prototype.putUnsignedShortAt = function(index, v) {
            _checkForWriteAt(this,index,2);
            _putBytesInternal(this, index, this.order._fromShort(v & 0xFFFF));
            return this;
        }
    
        /**
         * Puts a three-byte number into the buffer at the current position.
         *
         * @param v     {Number}  the three-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putMediumInt
         * @memberOf ByteBuffer#
         */
        $prototype.putMediumInt = function(v) {
           _autoExpand(this, 3);
           this.putMediumIntAt(this.position, v);
           this.position += 3;
           return this;
        };
    
        /**
         * Puts a three-byte number into the buffer at the specified index.
         *
         * @param index     {Number}  the index
         * @param v     {Number}  the three-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putMediumIntAt
         * @memberOf ByteBuffer#
         */
        $prototype.putMediumIntAt = function(index, v) {
            this.putBytesAt(index, this.order._fromMediumInt(v));
            return this;
        };
    
        /**
         * Puts a four-byte number into the buffer at the current position.
         *
         * @param v     {Number}  the four-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putInt
         * @memberOf ByteBuffer#
         */
        $prototype.putInt = function(v) {
            _autoExpand(this, 4);
            _putBytesInternal(this, this.position, this.order._fromInt(v))
            this.position += 4;
            return this;
        };
        
        /**
         * Puts a four-byte number into the buffer at the specified index.
         *
         * @param index     {Number}  the index
         * @param v     {Number}  the four-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putIntAt
         * @memberOf ByteBuffer#
         */
        $prototype.putIntAt = function(index, v) {
            _checkForWriteAt(this,index,4);
            _putBytesInternal(this, index, this.order._fromInt(v))
            return this;
        };
        
        /**
         * Puts an unsigned four-byte number into the buffer at the current position.
         *
         * @param i     {Number}  the index
         * 
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putUnsignedInt
         * @memberOf ByteBuffer#
         */
        $prototype.putUnsignedInt = function(v) {
            _autoExpand(this, 4);
            this.putUnsignedIntAt(this.position, v & 0xFFFFFFFF);
            this.position += 4;
            return this;
        }
    
        /**
         * Puts an unsigned four-byte number into the buffer at the specified index.
         *
         * @param index     {Number}  the index
         * @param v     {Number}  the four-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putUnsignedIntAt
         * @memberOf ByteBuffer#
         */
        $prototype.putUnsignedIntAt = function(index, v) {
            _checkForWriteAt(this,index,4);
            this.putIntAt(index, v & 0xFFFFFFFF);
            return this;
        }
    
        /**
         * Puts a string into the buffer at the current position, using the
         * character set to encode the string as bytes.
         *
         * @param v     {String}   the string
         * @param cs    {Charset}  the character set
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putString
         * @memberOf ByteBuffer#
         */
        $prototype.putString = function(v, cs) {
           cs.encode(v, this);
           return this;
        };
        
        /**
         * Puts a string into the buffer at the specified index, using the
         * character set to encode the string as bytes.
         *
         * @param fieldSize  {Number}   the width in bytes of the prefixed length field
         * @param v          {String}   the string
         * @param cs         {Charset}  the character set
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putPrefixedString
         * @memberOf ByteBuffer#
         */
        $prototype.putPrefixedString = function(fieldSize, v, cs) {
            if (typeof(cs) === "undefined" || typeof(cs.encode) === "undefined") {
                throw new Error("ByteBuffer.putPrefixedString: character set parameter missing");
            }
    
            if (fieldSize === 0) {
                return this;
            }
        
            _autoExpand(this, fieldSize);
    
            var len = v.length;
            switch (fieldSize) {
              case 1:
                this.put(len);
                break;
              case 2:
                this.putShort(len);
                break;
              case 4:
                this.putInt(len);
                break;
            }
            
            cs.encode(v, this);
            return this;
        };
        
        // encapsulates the logic to store byte array in the buffer
        function _putBytesInternal($this, index, v) {
            var array = $this.array;
            for (var i = 0; i < v.length; i++) {
                array[i + index] = v[i] & 255;
            }
        };
        
        /**
         * Puts a single-byte array into the buffer at the current position.
         *
         * @param v     {Array}  the single-byte array
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putBytes
         * @memberOf ByteBuffer#
         */
        $prototype.putBytes = function(v) {
            _autoExpand(this, v.length);
            _putBytesInternal(this, this.position, v);
            this.position += v.length;
            return this;
        };
        
        /**
         * Puts a byte array into the buffer at the specified index.
         *
         * @param index     {Number} the index
         * @param v     {Array}  the single-byte array
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putBytesAt
         * @memberOf ByteBuffer#
         */
        $prototype.putBytesAt = function(index, v) {
            _checkForWriteAt(this,index,v.length);
            _putBytesInternal(this, index, v);
            return this;
        };
        
         /**
         * Puts a ByteArray into the buffer at the current position.
         *
         * @param v     {ByteArray}  the ByteArray
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putByteArray
         * @memberOf ByteBuffer#
         */
        $prototype.putByteArray = function(v) {
            _autoExpand(this, v.byteLength);
            var u = new Uint8Array(v);
            // copy bytes into ByteBuffer
            for (var i=0; i<u.byteLength; i++) {
                this.putAt(this.position + i, u[i] & 0xFF);
            }
            this.position += v.byteLength;
            return this;
        };
        /**
         * Puts a buffer into the buffer at the current position.
         *
         * @param v     {Array}  the single-byte array
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putBuffer
         * @memberOf ByteBuffer#
         */
        $prototype.putBuffer = function(v) {
        
           var len = v.remaining();
           _autoExpand(this, len);
            
           var sourceArray = v.array;
           var sourceBufferPosition = v.position;
           var currentPosition = this.position;
           
           for (var i = 0; i < len; i++) {
               this.array[i + currentPosition] = sourceArray[i + sourceBufferPosition];
           }
           
           this.position += len;
           return this;
        };
    
        
        /**
         * Puts a buffer into the buffer at the specified index.
         *
         * @param index     {Number} the index
         * @param v     {Array}  the single-byte array
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putBufferAt
         * @memberOf ByteBuffer#
         */
        $prototype.putBufferAt = function(index, v) {
           var len = v.remaining();
           _autoExpand(this, len);
           
           var sourceArray = v.array;
           var sourceBufferPosition = v.position;
           var currentPosition = this.position;
           
           for (var i = 0; i < len; i++) {
               this.array[i + currentPosition] = sourceArray[i + sourceBufferPosition];
           }
           
           return this;
        };
        
        /**
         * Returns a single-byte number from the buffer at the current position.
         *
         * @return {Number}  the single-byte number
         *
         * @public
         * @function
         * @name get
         * @memberOf ByteBuffer#
         */
        $prototype.get = function() {
          _checkForRead(this,1);
          return this.order._toByte(this.array[this.position++]);
        };
    
        /**
         * Returns a single-byte number from the buffer at the specified index.
         *
         * @param index     {Number} the index
         *
         * @return {Number}  the single-byte number
         *
         * @public
         * @function
         * @name getAt
         * @memberOf ByteBuffer#
         */
        $prototype.getAt = function(index) {
            _checkForReadAt(this,index,1);
            return this.order._toByte(this.array[index]);
        };
    
        /**
         * Returns an unsigned single-byte number from the buffer at the current position.
         *
         * @return {Number}  the unsigned single-byte number
         *
         * @public
         * @function
         * @name getUnsigned
         * @memberOf ByteBuffer#
         */
        $prototype.getUnsigned = function() {
            _checkForRead(this,1);
            var val = this.order._toUnsignedByte(this.array[this.position++]);
            return val;
        };
        /**
         * Returns an unsigned single-byte number from the buffer at the specified index.
         *
         * @param index  the index
         *
         * @return  the unsigned single-byte number
         * @public
         * @function
         * @name getUnsignedAt
         * @memberOf ByteBuffer#
    
         */
        $prototype.getUnsignedAt = function(index) {
            _checkForReadAt(this,index,1);
            return this.order._toUnsignedByte(this.array[index]);
        }
    
        /**
         * Returns a n-byte number from the buffer at the current position.
         *
         * @param size     {Number} size the size of the buffer to be returned
         *
         * @return {Array}  a new byte array with bytes read from the buffer
         *
         * @public
         * @function
         * @name getBytes
         * @memberOf ByteBuffer#
         */
        $prototype.getBytes = function(size) {
            _checkForRead(this,size);
            var byteArray = new Array();
            for(var i=0; i<size; i++) {
                byteArray.push(this.order._toByte(this.array[i+this.position]));
            }
            this.position += size;
            return byteArray;
        };
    
        /**
         * Returns a n-byte number from the buffer at the specified index.
         *
         * @param index    {Number} the index
         * @param size     {Number} size the size of the buffer to be returned
         *
         * @return {Array}  a new byte array with bytes read from the buffer
         *
         * @public
         * @function
         * @name getBytes
         * @memberOf ByteBuffer#
         */
        $prototype.getBytesAt = function(index,size) {
            _checkForReadAt(this,index,size);
            var byteArray = new Array();
            var sourceArray = this.array;
            for (var i = 0; i < size; i++) {
             byteArray.push(sourceArray[i + index]);
            }
            return byteArray;
        };
    
        /**
         * Returns a Blob from the buffer at the current position.
         *
         * @param size     {Number} size the size of the Blob to be returned
         *
         * @return {Blob}  a new Blob with bytes read from the buffer
         *
         * @public
         * @function
         * @name getBlob
         * @memberOf ByteBuffer#
         */
        $prototype.getBlob = function(size) {
            var bytes = this.array.slice(this.position, size);
            this.position += size;
            return $module.BlobUtils.fromNumberArray(bytes);
        }
    
        /**
         * Returns a Blob from the buffer at the specified index.
         *
         * @param index    {Number} the index
         * @param size     {Number} size the size of the Blob to be returned
         *
         * @return {Blob}  a new Blob with bytes read from the buffer
         *
         * @public
         * @function
         * @name getBlobAt
         * @memberOf ByteBuffer#
         */
        $prototype.getBlobAt = function(index, size) {
            var bytes = this.getBytesAt(index, size);
            return $module.BlobUtils.fromNumberArray(bytes);
    
        }
        
        /**
         * Returns a ArrayBuffer from the buffer at the current position.
         *
         * @param size     {Number} size the size of the ArrayBuffer to be returned
         *
         * @return {ArrayBuffer}  a new ArrayBuffer with bytes read from the buffer
         *
         * @public
         * @function
         * @name getArrayBuffer
         * @memberOf ByteBuffer#
         */
        $prototype.getArrayBuffer = function(size) {
             var u = new Uint8Array(size);
             u.set(this.array.slice(this.position, size));
             this.position += size;
             return u.buffer;
        }                
    
        /**
         * Returns a two-byte number from the buffer at the current position.
         *
         * @return {Number}  the two-byte number
         *
         * @public
         * @function
         * @name getShort
         * @memberOf ByteBuffer#
         */
        $prototype.getShort = function() {
            _checkForRead(this,2);
            var val = this.getShortAt(this.position);
            this.position += 2;
            return val;
        };
        
        /**
         * Returns a two-byte number from the buffer at the specified index.
         *
         * @param index     {Number} the index
         *
         * @return {Number}  the two-byte number
         *
         * @public
         * @function
         * @name getShortAt
         * @memberOf ByteBuffer#
         */
        $prototype.getShortAt = function(index) {
            _checkForReadAt(this,index,2);
            var array = this.array;
            return this.order._toShort(array[index++], array[index++]);
        };
    
        /**
         * Returns an unsigned two-byte number from the buffer at the current position.
         *
         * @return {Number}  the unsigned two-byte number
         *
         * @public
         * @function
         * @name getUnsignedShort
         * @memberOf ByteBuffer#
         */
        $prototype.getUnsignedShort = function() {
            _checkForRead(this,2);
            var val = this.getUnsignedShortAt(this.position);
            this.position += 2;
            return val;
        };
    
        /**
         * Returns an unsigned two-byte number from the buffer at the specified index.
         *
         * 
         * @return  the unsigned two-byte number
         * @public
         * @function
         * @name getUnsignedShortAt
         * @memberOf ByteBuffer#
         */
        $prototype.getUnsignedShortAt = function(index) {
            _checkForReadAt(this,index,2);
            var array = this.array;
            return this.order._toUnsignedShort(array[index++], array[index++]);
        }
    
        /**
         * Returns an unsigned three-byte number from the buffer at the current position.
         *
         * @return {Number}  the unsigned three-byte number
         *
         * @public
         * @function
         * @name getUnsignedMediumInt
         * @memberOf ByteBuffer#
         */
        $prototype.getUnsignedMediumInt = function() {
            var array = this.array;
            return this.order._toUnsignedMediumInt(array[this.position++], array[this.position++], array[this.position++]);
        };
    
        /**
         * Returns a three-byte number from the buffer at the current position.
         *
         * @return {Number}  the three-byte number
         *
         * @public
         * @function
         * @name getMediumInt
         * @memberOf ByteBuffer#
         */
        $prototype.getMediumInt = function() {
            var val = this.getMediumIntAt(this.position);
            this.position += 3;
            return val;
        };
    
        /**
         * Returns a three-byte number from the buffer at the specified index.
         *
         * @param i     {Number} the index
         *
         * @return {Number}  the three-byte number
         *
         * @public
         * @function
         * @name getMediumIntAt
         * @memberOf ByteBuffer#
         */
        $prototype.getMediumIntAt = function(i) {
            var array = this.array;
            return this.order._toMediumInt(array[i++], array[i++], array[i++]);
        };
    
        /**
         * Returns a four-byte number from the buffer at the current position.
         *
         * @return {Number}  the four-byte number
         *
         * @public
         * @function
         * @name getInt
         * @memberOf ByteBuffer#
         */
        $prototype.getInt = function() {
            _checkForRead(this,4);
            var val = this.getIntAt(this.position);
            this.position += 4;
            return val;
        };
        
        /**
         * Returns a four-byte number from the buffer at the specified index.
         *
         * @param index     {Number} the index
         *
         * @return {Number}  the four-byte number
         *
         * @public
         * @function
         * @name getIntAt
         * @memberOf ByteBuffer#
         */
        $prototype.getIntAt = function(index) {
            _checkForReadAt(this,index,4);
            var array = this.array;
            return this.order._toInt(array[index++], array[index++], array[index++], array[index++]);
        };
    
        /**
         * Returns an unsigned four-byte number from the buffer at the current position.
         *
         * @return {Number}  the unsigned four-byte number
         *
         * @public
         * @function
         * @name getUnsignedInt
         * @memberOf ByteBuffer#
         */
        $prototype.getUnsignedInt = function() {
            _checkForRead(this,4);
            var val = this.getUnsignedIntAt(this.position);
            this.position += 4;
            return val;
        };
    
        /**
         * Returns an unsigned four-byte number from the buffer at the specified position.
         * 
         * @param index the index
         * 
         * @return {Number}  the unsigned four-byte number
         *
         * @public
         * @function
         * @name getUnsignedIntAt
         * @memberOf ByteBuffer#
         */
        $prototype.getUnsignedIntAt = function(index) {
            _checkForReadAt(this,index,4);
            var array = this.array;
            return this.order._toUnsignedInt(array[index++], array[index++], array[index++], array[index++]);
            return val;
        };
    
        /**
         * Returns a length-prefixed string from the buffer at the current position.
         *
         * @param  fieldSize {Number}   the width in bytes of the prefixed length field
         * @param  cs        {Charset}  the character set
         *
         * @return {String}  the length-prefixed string
         *
         * @public
         * @function
         * @name getPrefixedString
         * @memberOf ByteBuffer#
         */
        $prototype.getPrefixedString = function(fieldSize, cs) {
          var len = 0;
          switch (fieldSize || 2) {
            case 1:
              len = this.getUnsigned();
              break;
            case 2:
              len = this.getUnsignedShort();
              break;
            case 4:
              len = this.getInt();
              break;
          }
          
          if (len === 0) {
            return "";
          }
          
          var oldLimit = this.limit;
          try {
              this.limit = this.position + len;
              return cs.decode(this);
          }
          finally {
              this.limit = oldLimit;
          }
        };
        
        /**
         * Returns a string from the buffer at the current position. 
         * 
         * @param  cs  {Charset}  the character set
         *
         * @return {String}  the string
         *
         * @public
         * @function
         * @name getString
         * @memberOf ByteBuffer#
         */
        $prototype.getString = function(cs) {
          try {
              return cs.decode(this);
          }
          finally {
              this.position = this.limit;
          }
        };
        
        /**
         * Returns a sliced buffer, setting the position to zero, and 
         * decrementing the limit accordingly.
         *
         * @return  {ByteBuffer} the sliced buffer
         *
         * @public
         * @function
         * @name slice
         * @memberOf ByteBuffer#
         */
        $prototype.slice = function() {
          return new ByteBuffer(this.array.slice(this.position, this.limit));
        };
    
        /**
         * Flips the buffer. The limit is set to the current position,
         * the position is set to zero, and the mark is reset.
         *
         * @return  {ByteBuffer} the flipped buffer
         *
         * @public
         * @function
         * @name flip
         * @memberOf ByteBuffer#
         */    
        $prototype.flip = function() {
           this.limit = this.position;
           this.position = 0;
           this._mark = -1;
           return this;
        };
        
        /**
         * Rewinds the buffer. The position is set to zero and the mark is reset.
         *
         * @return  {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name rewind
         * @memberOf ByteBuffer#
         */    
        $prototype.rewind = function() {
           this.position = 0;
           this._mark = -1;
           return this;
        };
        
        /**
         * Clears the buffer. The position is set to zero, the limit is set to the
         * capacity and the mark is reset.
         *
         * @return  {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name clear
         * @memberOf ByteBuffer#
         */    
        $prototype.clear = function() {
           this.position = 0;
           this.limit = this.capacity;
           this._mark = -1;
           return this;
        };
        
        /**
         * Returns the number of bytes remaining from the current position to the limit.
         *
         * @return {Number} the number of bytes remaining
         *
         * @public
         * @function
         * @name remaining
         * @memberOf ByteBuffer#
         */
        $prototype.remaining = function() {
          return (this.limit - this.position);
        };
        
        /**
         * Returns true   if this buffer has remaining bytes, 
         *         false  otherwise.
         *
         * @return  {Boolean} whether this buffer has remaining bytes
         *
         * @public
         * @function
         * @name hasRemaining
         * @memberOf ByteBuffer#
         */
        $prototype.hasRemaining = function() {
          return (this.limit > this.position);
        };
    
        /**
         * Skips the specified number of bytes from the current position.
         * 
         * @param  size  {Number}  the number of bytes to skip
         *
         * @return  {ByteBuffer}  the buffer
         *
         * @public
         * @function
         * @name skip
         * @memberOf ByteBuffer#
         */    
        $prototype.skip = function(size) {
          this.position += size;
          return this;
        };
        
        /**
         * Returns a hex dump of this buffer.
         *
         * @return  {String}  the hex dump
         *
         * @public
         * @function
         * @name getHexDump
         * @memberOf ByteBuffer#
         */    
        $prototype.getHexDump = function() {
           var array = this.array;
           var pos = this.position;
           var limit = this.limit;
    
           if (pos == limit) {
             return "empty";
           }
           
           var hexDump = [];
           for (var i=pos; i < limit; i++) {
             var hex = (array[i] || 0).toString(16);
             if (hex.length == 1) {
                 hex = "0" + hex;
             }
             hexDump.push(hex);
           }
           return hexDump.join(" ");
        };
        
        /**
         * Returns the string representation of this buffer.
         *
         * @return  {String}  the string representation
         *
         * @public
         * @function
         * @name toString
         * @memberOf ByteBuffer#
         */    
        $prototype.toString = $prototype.getHexDump;
    
        /**
         * Expands the buffer to support the expected number of remaining bytes
         * after the current position.
         *
         * @param  expectedRemaining  {Number}  the expected number of remaining bytes
         *
         * @return {ByteBuffer}  the buffer
         *
         * @public
         * @function
         * @name expand
         * @memberOf ByteBuffer#
         */
        $prototype.expand = function(expectedRemaining) {
          return this.expandAt(this.position, expectedRemaining);
        };
        
        /**
         * Expands the buffer to support the expected number of remaining bytes
         * at the specified index.
         *
         * @param  i                  {Number} the index
         * @param  expectedRemaining  {Number}  the expected number of remaining bytes
         *
         * @return {ByteBuffer}  the buffer
         *
         * @public
         * @function
         * @name expandAt
         * @memberOf ByteBuffer#
         */
        $prototype.expandAt = function(i, expectedRemaining) {
          var end = i + expectedRemaining;
    
          if (end > this.capacity) {
            this.capacity = end;
          }
          
          if (end > this.limit) {
            this.limit = end;
          }
          return this;
        };
        
        function _autoExpand($this, expectedRemaining) {
          if ($this.autoExpand) {
            $this.expand(expectedRemaining);
          }
          return $this;
        }
    
        function _checkForRead($this, expected) {
          var end = $this.position + expected;
          if (end > $this.limit) {
            throw new Error("Buffer underflow");
          }
          return $this;
        }
    
        function _checkForReadAt($this, index, expected) {
          var end = index + expected;
          if (index < 0 || end > $this.limit) {
            throw new Error("Index out of bounds");
          }
          return $this;
        }
        
        function _checkForWriteAt($this, index, expected) {
          var end = index + expected;
          if (index < 0 || end > $this.limit) {
            throw new Error("Index out of bounds");
          }
          return $this;
        }
        
        $module.ByteBuffer = ByteBuffer;        
    }
   
})(Kaazing);



(function($module) {

    if (typeof $module.Charset === "undefined") {
    
        /**
         * Charset is an abstract super class for all character set encoders and decoders.
         *
         * @class  Charset provides character set encoding and decoding for JavaScript.
         * @alias Charset
         * @constructor
         */
        var Charset = function(){}

        /**
         * @ignore
         */
        var $prototype = Charset.prototype; 
    
        /**
         * Decodes a ByteBuffer into a String.  Bytes for partial characters remain 
         * in the ByteBuffer after decode has completed.
         *
         * @param {ByteBuffer} buf  the ByteBuffer to decode
         * @return {String}  the decoded String
         *
         * @public
         * @function
         * @name decode
         * @memberOf Charset#
         */
        $prototype.decode = function(buf) {}
        
        /**
         * Encodes a String into a ByteBuffer.
         *
         * @param {String}     text  the String to encode
         * @param {ByteBuffer} buf   the target ByteBuffer
         * @return {void}
         *
         * @public
         * @function
         * @name encode
         * @memberOf Charset#
         */
        $prototype.encode = function(str, buf) {}
        
        /**
         * The UTF8 character set encoder and decoder.
         *
         * @public
         * @static
         * @final
         * @field
         * @name UTF8
         * @type Charset
         * @memberOf Charset
         */
        Charset.UTF8 = (function() {
            function UTF8() {}
            UTF8.prototype = new Charset();
        
            /**
             * @ignore
             */
            var $prototype = UTF8.prototype; 
    
            $prototype.decode = function(buf) {
            
                var remainingData = buf.remaining();
                
                // use different strategies for building string sizes greater or
                // less than 10k.
                var shortBuffer = remainingData < 10000;
    
                var decoded = [];
                var sourceArray = buf.array;
                var beginIndex = buf.position;
                var endIndex = beginIndex + remainingData;
                var byte0, byte1, byte2, byte3;
                for (var i = beginIndex; i < endIndex; i++) {
                    byte0 = (sourceArray[i] & 255);
                    var byteCount = charByteCount(byte0);
                    var remaining = endIndex - i;
                    if (remaining < byteCount) {
                        break;
                    }
                    var charCode = null;
                    switch (byteCount) {
                        case 1:
                            // 000000-00007f    0zzzzzzz
                            charCode = byte0;
                            break;
                        case 2:
                            // 000080-0007ff    110yyyyy 10zzzzzz
                            i++;
                            byte1 = (sourceArray[i] & 255);
                            
                            charCode = ((byte0 & 31) << 6) | (byte1 & 63);
                            break;
                        case 3:
                            // 000800-00ffff    1110xxxx 10yyyyyy 10zzzzzz
                            i++;
                            byte1 = (sourceArray[i] & 255);
                            
                            i++;
                            byte2 = (sourceArray[i] & 255);
                            
                            charCode = ((byte0 & 15) << 12) | ((byte1 & 63) << 6) | (byte2 & 63);
                            break;
                        case 4:
                            // 010000-10ffff    11110www 10xxxxxx 10yyyyyy 10zzzzzz
                            i++;
                            byte1 = (sourceArray[i] & 255);
                            
                            i++;
                            byte2 = (sourceArray[i] & 255);
                            
                            i++;
                            byte3 = (sourceArray[i] & 255);
                            
                            charCode = ((byte0 & 7) << 18) | ((byte1 & 63) << 12) | ((byte2 & 63) << 6) | (byte3 & 63);
                            break;
                    }
    
                    if (shortBuffer) {
                        decoded.push(charCode);
                    } else {
                        decoded.push(String.fromCharCode(charCode));
                    }
                }
                
                if (shortBuffer) {
                    return String.fromCharCode.apply(null, decoded);
                } else {
                    return decoded.join("");
                }
            };
    
            $prototype.encode = function(str, buf) {
                var currentPosition = buf.position;
                var mark = currentPosition;
                var array = buf.array;
                for (var i = 0; i < str.length; i++) {
                    var charCode = str.charCodeAt(i);
                    if (charCode < 0x80) {
                        // 000000-00007f    0zzzzzzz
                        array[currentPosition++] = charCode;
                    }
                    else if (charCode < 0x0800) {
                        // 000080-0007ff    110yyyyy 10zzzzzz
                        array[currentPosition++] = (charCode >> 6) | 192;
                        array[currentPosition++] = (charCode & 63) | 128;
                    }
                    else if (charCode < 0x10000) {
                        // 000800-00ffff  1110xxxx 10yyyyyy 10zzzzzz
                        array[currentPosition++] = (charCode >> 12) | 224;
                        array[currentPosition++] = ((charCode >> 6) & 63) | 128;
                        array[currentPosition++] = (charCode & 63) | 128;
                    }
                    else if (charCode < 0x110000) {
                        // 010000-10ffff  11110www 10xxxxxx 10yyyyyy 10zzzzzz
                        array[currentPosition++] = (charCode >> 18) | 240;
                        array[currentPosition++] = ((charCode >> 12) & 63) | 128;
                        array[currentPosition++] = ((charCode >> 6) & 63) | 128;
                        array[currentPosition++] = (charCode & 63) | 128;
                    }
                    else {
                        throw new Error("Invalid UTF-8 string");
                    }
                }
                buf.position = currentPosition;
                buf.expandAt(currentPosition, currentPosition - mark);
            };
            
            $prototype.encodeAsByteArray = function(str) {
                var bytes = new Array();
                for (var i = 0; i < str.length; i++) {
                    var charCode = str.charCodeAt(i);
                    if (charCode < 0x80) {
                        // 000000-00007f    0zzzzzzz
                        bytes.push(charCode);
                    }
                    else if (charCode < 0x0800) {
                        // 000080-0007ff    110yyyyy 10zzzzzz
                        bytes.push((charCode >> 6) | 192);
                        bytes.push((charCode & 63) | 128);
                    }
                    else if (charCode < 0x10000) {
                        // 000800-00ffff  1110xxxx 10yyyyyy 10zzzzzz
                        bytes.push((charCode >> 12) | 224);
                        bytes.push(((charCode >> 6) & 63) | 128);
                        bytes.push((charCode & 63) | 128);
                    }
                    else if (charCode < 0x110000) {
                        // 010000-10ffff  11110www 10xxxxxx 10yyyyyy 10zzzzzz
                        bytes.push((charCode >> 18) | 240);
                        bytes.push(((charCode >> 12) & 63) | 128);
                        bytes.push(((charCode >> 6) & 63) | 128);
                        bytes.push((charCode & 63) | 128);
                    }
                    else {
                        throw new Error("Invalid UTF-8 string");
                    }
                }
                return bytes;
            };
        
            // encode a byte array to UTF-8 string
            $prototype.encodeByteArray = function(array) {
                var strLen = array.length;
                var bytes = [];
                for (var i = 0; i < strLen; i++) {
                    var charCode = array[i];
                    if (charCode < 0x80) {
                        // 000000-00007f    0zzzzzzz
                        bytes.push(charCode);
                    }
                    else if (charCode < 0x0800) {
                        // 000080-0007ff    110yyyyy 10zzzzzz
                        bytes.push((charCode >> 6) | 192);
                        bytes.push((charCode & 63) | 128);
                    }
                    else if (charCode < 0x10000) {
                        // 000800-00ffff  1110xxxx 10yyyyyy 10zzzzzz
                        bytes.push((charCode >> 12) | 224);
                        bytes.push(((charCode >> 6) & 63) | 128);
                        bytes.push((charCode & 63) | 128);
                    }
                    else if (charCode < 0x110000) {
                        // 010000-10ffff  11110www 10xxxxxx 10yyyyyy 10zzzzzz
                        bytes.push((charCode >> 18) | 240);
                        bytes.push(((charCode >> 12) & 63) | 128);
                        bytes.push(((charCode >> 6) & 63) | 128);
                        bytes.push((charCode & 63) | 128);
                    }
                    else {
                        throw new Error("Invalid UTF-8 string");
                    }
                }
                return String.fromCharCode.apply(null, bytes);
            };
            
            // encode an arraybuffer to UTF-8 string
            $prototype.encodeArrayBuffer = function(arraybuffer) {
                var buf = new Uint8Array(arraybuffer);
                var strLen = buf.length;
                var bytes = [];
                for (var i = 0; i < strLen; i++) {
                    var charCode = buf[i];
                    if (charCode < 0x80) {
                        // 000000-00007f    0zzzzzzz
                        bytes.push(charCode);
                    }
                    else if (charCode < 0x0800) {
                        // 000080-0007ff    110yyyyy 10zzzzzz
                        bytes.push((charCode >> 6) | 192);
                        bytes.push((charCode & 63) | 128);
                    }
                    else if (charCode < 0x10000) {
                        // 000800-00ffff  1110xxxx 10yyyyyy 10zzzzzz
                        bytes.push((charCode >> 12) | 224);
                        bytes.push(((charCode >> 6) & 63) | 128);
                        bytes.push((charCode & 63) | 128);
                    }
                    else if (charCode < 0x110000) {
                        // 010000-10ffff  11110www 10xxxxxx 10yyyyyy 10zzzzzz
                        bytes.push((charCode >> 18) | 240);
                        bytes.push(((charCode >> 12) & 63) | 128);
                        bytes.push(((charCode >> 6) & 63) | 128);
                        bytes.push((charCode & 63) | 128);
                    }
                    else {
                        throw new Error("Invalid UTF-8 string");
                    }
                }
                return String.fromCharCode.apply(null, bytes);
            };
            
            //decode a UTF-8 string to byte array
            $prototype.toByteArray = function(str) {
                
                
                var decoded = [];
                var byte0, byte1, byte2, byte3;
                var strLen = str.length;
                for (var i = 0; i < strLen; i++) {
                    byte0 = (str.charCodeAt(i) & 255);
                    var byteCount = charByteCount(byte0);
                    
                    var charCode = null;
                    if (byteCount + i > strLen) {
                        break;
                    }
                    switch (byteCount) {
                        case 1:
                            // 000000-00007f    0zzzzzzz
                            charCode = byte0;
                            break;
                        case 2:
                            // 000080-0007ff    110yyyyy 10zzzzzz
                            i++;
                            byte1 = (str.charCodeAt(i) & 255);
                            
                            charCode = ((byte0 & 31) << 6) | (byte1 & 63);
                            break;
                        case 3:
                            // 000800-00ffff    1110xxxx 10yyyyyy 10zzzzzz
                            i++;
                            byte1 = (str.charCodeAt(i) & 255);
                            
                            i++;
                            byte2 = (str.charCodeAt(i) & 255);
                            
                            charCode = ((byte0 & 15) << 12) | ((byte1 & 63) << 6) | (byte2 & 63);
                            break;
                        case 4:
                            // 010000-10ffff    11110www 10xxxxxx 10yyyyyy 10zzzzzz
                            i++;
                            byte1 = (str.charCodeAt(i) & 255);
                            
                            i++;
                            byte2 = (str.charCodeAt(i) & 255);
                            
                            i++;
                            byte3 = (str.charCodeAt(i) & 255);
                            
                            charCode = ((byte0 & 7) << 18) | ((byte1 & 63) << 12) | ((byte2 & 63) << 6) | (byte3 & 63);
                            break;
                    }
                    decoded.push(charCode & 255);
                }
                return decoded;
            };
    
            /**
             * Returns the number of bytes used to encode a UTF-8 character, based on the first byte.
             *
             * 000000-00007f  0zzzzzzz
             * 000080-0007ff  110yyyyy 10zzzzzz
             * 000800-00ffff  1110xxxx 10yyyyyy 10zzzzzz
             * 010000-10ffff  11110www 10xxxxxx 10yyyyyy 10zzzzzz
             *
             * @private 
             * @static
             * @function
             * @memberOf UTF8
             */    
            function charByteCount(b) {
        
                // determine number of bytes based on first zero bit,
                // starting with most significant bit
        
                if ((b & 128) === 0) {
                    return 1;
                }
                
                if ((b & 32) === 0) {
                    return 2;
                }
                
                if ((b & 16) === 0) {
                    return 3;
                }
                
                if ((b & 8) === 0) {
                    return 4;
                }
                
                throw new Error("Invalid UTF-8 bytes");
            }
            
            return new UTF8();
        })();
        
        $module.Charset = Charset;
    }
})(Kaazing);



/**
 * Creates a new URI instance with the specified location.
 *
 * @param {String} str  the location string
 * 
 * @private
 * @class  Represents a Uniform Resource Identifier (URI) reference. 
 */
function URI(str) {
	// TODO: use regular expression instead of manual string parsing
    str = str || "";
    var position = 0;
    
    var schemeEndAt = str.indexOf("://");
    if (schemeEndAt != -1) {
	    /**
	     * The scheme property indicates the URI scheme.
	     *
	     * @public
	     * @field
	     * @name scheme
	     * @type String
	     * @memberOf URI
	     */
        this.scheme = str.slice(0, schemeEndAt);
        position = schemeEndAt + 3;

        var pathAt = str.indexOf('/', position);
        if (pathAt == -1) {
           pathAt = str.length;
           // Add trailing slash to root URI if it is missing
           str += "/";
        }

        var authority = str.slice(position, pathAt);
        /**
         * The authority property indiciates the URI authority.
         *
         * @public
         * @field
         * @name authority
         * @type String
         * @memberOf URI
         */
        this.authority = authority;
        position = pathAt;
        
        /**
         * The host property indiciates the URI host.
         *
         * @public
         * @field
         * @name host
         * @type String
         * @memberOf URI
         */
        this.host = authority;
        var colonAt = authority.indexOf(":");
        if (colonAt != -1) {
            this.host = authority.slice(0, colonAt);

	        /**
	         * The port property indiciates the URI port.
	         *
	         * @public
	         * @field
	         * @name port
	         * @type Number
	         * @memberOf URI
	         */
            this.port = parseInt(authority.slice(colonAt + 1), 10);
            if (isNaN(this.port)) {
                throw new Error("Invalid URI syntax");
            }
        } 
    }

    var queryAt = str.indexOf("?", position);
    if (queryAt != -1) {
        /**
         * The path property indiciates the URI path.
         *
         * @public
         * @field
         * @name path
         * @type String
         * @memberOf URI
         */
        this.path = str.slice(position, queryAt);
        position = queryAt + 1;
    }

    var fragmentAt = str.indexOf("#", position);
    if (fragmentAt != -1) {
        if (queryAt != -1) {
            this.query = str.slice(position, fragmentAt);
        }
        else {
            this.path = str.slice(position, fragmentAt);
        }
        position = fragmentAt + 1;
        /**
         * The fragment property indiciates the URI fragment.
         *
         * @public
         * @field
         * @name fragment
         * @type String
         * @memberOf URI
         */
        this.fragment = str.slice(position);
    }
    else {
        if (queryAt != -1) {
            this.query = str.slice(position);
        }
        else {
            this.path = str.slice(position);
        }
    }
}

(function() {
    var $prototype = URI.prototype;
    
    /**
     * Returns a String representation of this URI.
     *
     * @return {String}  a String representation
     *
     * @public
     * @function
     * @name toString
     * @memberOf URI
     */
    $prototype.toString = function() {
        var sb = [];
        
        var scheme = this.scheme;
        if (scheme !== undefined) {
            sb.push(scheme);
            sb.push("://");
            sb.push(this.host);
            
            var port = this.port;
            if (port !== undefined) {
                sb.push(":");
                sb.push(port.toString());
            }
        }
        
        if (this.path !== undefined) {
          sb.push(this.path);
        }
        
        if (this.query !== undefined) {
          sb.push("?");
          sb.push(this.query);
        }
        
        if (this.fragment !== undefined) {
          sb.push("#");
          sb.push(this.fragment);
        }
        
        return sb.join("");
    };

    var DEFAULT_PORTS = { "http":80, "ws":80, "https":443, "wss":443 };
    
    URI.replaceProtocol = function(location, protocol) {
        var indx = location.indexOf("://");
        if (indx > 0) {
            return protocol + location.substr(indx);
        } else {
            return "";
        }
    }
})();
