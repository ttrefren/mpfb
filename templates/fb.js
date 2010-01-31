var MixpanelLib = function(token) {
    var metrics = {};
    var mpt;
    var mpt_total = 0, mpt_cap = 100; 

    metrics.init = function(token) {
        metrics.token = token;
        metrics.api_host = 'https://api.mixpanel.com';
        root = document.getRootElement();
        mpt = document.createElement("div");
        mpt.setStyle({height: '1px', width: '1px'});
        root.appendChild(mpt);
    };

    metrics.get_unixtime = function() {
        return parseInt(new Date().getTime().toString().substring(0,10), 10);
    };

    metrics.create_img = function(url) {
        var id = "mpt_img_" + mpt_total;
        var img = document.getElementById(id);
        if (img) {
            mpt.removeChild(img);
        }
        img = document.createElement("img");
        img.setSrc(url);
        img.setId(id);
        return img;
    };

    metrics.http_build_query = function(formdata, arg_separator) {
        var key, use_val, use_key, i = 0, tmp_arr = [];

        if (!arg_separator) {
            arg_separator = '&';
        }

        for (key in formdata) {
            if (key) {
                use_val = formdata[key].toString();
                use_key = key;
                tmp_arr[i++] = use_key + '=' + use_val;
            }
        }
        return tmp_arr.join(arg_separator);
    };

    metrics.send_request = function(url, data) {
        mpt_total = mpt_total % mpt_cap;
        if (data) { url += '?' + metrics.http_build_query(data); }
        url += '&_=' + new Date().getTime().toString();
        
        var img = metrics.create_img(url);
        mpt.appendChild(img);
        mpt_total++;
    };

    metrics.json_encode = function(mixed_val) {    
        var indent;
        var value = mixed_val;
        var i;

        var quote = function (string) {
            var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
            var meta = {    // table of character substitutions
                '\b': '\\b',
                '\t': '\\t',
                '\n': '\\n',
                '\f': '\\f',
                '\r': '\\r',
                '"' : '\\"',
                '\\': '\\\\'
            };

            escapable.lastIndex = 0;
            return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
        };

        var str = function(key, holder) {
            var gap = '';
            var indent = '    ';
            var i = 0;          // The loop counter.
            var k = '';          // The member key.
            var v = '';          // The member value.
            var length = 0;
            var mind = gap;
            var partial = [];
            var value = holder[key];

            // If the value has a toJSON method, call it to obtain a replacement value.
            if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
                value = value.toJSON(key);
            }

            // What happens next depends on the value's type.
            switch (typeof value) {
                case 'string':
                    return quote(value);

                case 'number':
                    // JSON numbers must be finite. Encode non-finite numbers as null.
                    return isFinite(value) ? value.toString() : 'null';

                case 'boolean':
                case 'null':
                    // If the value is a boolean or null, convert it to a string. Note:
                    // typeof null does not produce 'null'. The case is included here in
                    // the remote chance that this gets fixed someday.

                    return value.toString();

                case 'object':
                    // If the type is 'object', we might be dealing with an object or an array or
                    // null.
                    // Due to a specification blunder in ECMAScript, typeof null is 'object',
                    // so watch out for that case.
                    if (!value) {
                        return 'null';
                    }

                    // Make an array to hold the partial results of stringifying this object value.
                    gap += indent;
                    partial = [];
                    // Iterate through all of the keys in the object.
                    for (k in value) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }

                    // Join all of the member texts together, separated with commas,
                    // and wrap them in braces.
                    v = partial.length === 0 ? '{}' :
                    gap ? '{' + partial.join(',') + '' +
                    mind + '}' : '{' + partial.join(',') + '}';
                    gap = mind;
                    return v;
            }
        };

        // Make a fake root object containing our value under the key of ''.
        // Return the result of stringifying the value.
        return str('', {
            '': value
        });
    };

    metrics.utf8_encode = function (string) {
        string = (string+'').replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        var utftext = "";
        var start, end;
        var stringl = 0;

        start = end = 0;
        stringl = string.length;
        for (var n = 0; n < stringl; n++) {
            var c1 = string.charCodeAt(n);
            var enc = null;

            if (c1 < 128) {
                end++;
            } else if((c1 > 127) && (c1 < 2048)) {
                enc = String.fromCharCode((c1 >> 6) | 192) + String.fromCharCode((c1 & 63) | 128);
            } else {
                enc = String.fromCharCode((c1 >> 12) | 224) + String.fromCharCode(((c1 >> 6) & 63) | 128) + String.fromCharCode((c1 & 63) | 128);
            }
            if (enc !== null) {
                if (end > start) {
                    utftext += string.substring(start, end);
                }
                utftext += enc;
                start = end = n+1;
            }
        }

        if (end > start) {
            utftext += string.substring(start, string.length);
        }

        return utftext;
    };

    metrics.base64_encode = function(data) {        
        var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc="", tmp_arr = [];

        if (!data) {
            return data;
        }

        data = metrics.utf8_encode(data+'');

        do { // pack three octets into four hexets
            o1 = data.charCodeAt(i++);
            o2 = data.charCodeAt(i++);
            o3 = data.charCodeAt(i++);

            bits = o1<<16 | o2<<8 | o3;

            h1 = bits>>18 & 0x3f;
            h2 = bits>>12 & 0x3f;
            h3 = bits>>6 & 0x3f;
            h4 = bits & 0x3f;

            // use hexets to index into b64, and append result to encoded string
            tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
        } while (i < data.length);

        enc = tmp_arr.join('');

        switch( data.length % 3 ){
            case 1:
                enc = enc.slice(0, -2) + '==';
            break;
            case 2:
                enc = enc.slice(0, -1) + '=';
            break;
        }

        return enc;
    };

    metrics.track = function(event, properties) {
        //  Usage: metrics.track('event', {'property1':'value1', 'gender':'male'});
        if (!properties){
            properties = {};
        }

        properties.time = metrics.get_unixtime();
        properties.token = metrics.token;

        var data = {
            'event' : event,
            'properties' : properties
        };

        encoded_data = metrics.base64_encode(metrics.json_encode(data)); // Security by obscurity
        metrics.send_request(
            metrics.api_host + '/track/', 
            {
                'data' : encoded_data, 
                'ip' : 1,
                'img' : 1
            }
        );

    };

    metrics.track_funnel = function(funnel, step, goal, properties) {
        /*
        @funnel: Name of this funnel
        @step: integer, starting with 1
        @goal: name for this step
        Usage: metrics.track_funnel('registration', 1, 'splash_page', {'gender': 'male', 'referer': 'Twitter'});
        */
        if (! properties) { properties = {}; }

        properties.funnel = funnel;
        properties.step = parseInt(step, 10);
        properties.goal = goal;

        metrics.track('mp_funnel', properties);
    };

    metrics.log = function(data, callback) {
        /*  Deprecated, do not use.
            Use metrics.track() instead */
        if (! data.project) { data.project = metrics.token; }
        if (data.project && data.category) {
            metrics.callback = callback;
            data.ip = 1;
            data.img = 1;
            metrics.send_request(metrics.api_host + "/log/", data);
        }
    };
    
    // Initiation
    metrics.init(token);
    
    return metrics;
};


