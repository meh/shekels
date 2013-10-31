/*
    json2.js
    2013-05-26

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function () {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());
/*! Sizzle v1.10.10-pre | (c) 2013 jQuery Foundation, Inc. | jquery.org/license
//@ sourceMappingURL=sizzle.min.map
*/
!function(a){function b(a,b,c,d){var e,f,g,h,i,j,l,o,p,q;if((b?b.ownerDocument||b:P)!==H&&G(b),b=b||H,c=c||[],!a||"string"!=typeof a)return c;if(1!==(h=b.nodeType)&&9!==h)return[];if(J&&!d){if(e=tb.exec(a))if(g=e[1]){if(9===h){if(f=b.getElementById(g),!f||!f.parentNode)return c;if(f.id===g)return c.push(f),c}else if(b.ownerDocument&&(f=b.ownerDocument.getElementById(g))&&N(b,f)&&f.id===g)return c.push(f),c}else{if(e[2])return ab.apply(c,b.getElementsByTagName(a)),c;if((g=e[3])&&x.getElementsByClassName&&b.getElementsByClassName)return ab.apply(c,b.getElementsByClassName(g)),c}if(x.qsa&&(!K||!K.test(a))){if(o=l=O,p=b,q=9===h&&a,1===h&&"object"!==b.nodeName.toLowerCase()){for(j=m(a),(l=b.getAttribute("id"))?o=l.replace(vb,"\\$&"):b.setAttribute("id",o),o="[id='"+o+"'] ",i=j.length;i--;)j[i]=o+n(j[i]);p=ub.test(a)&&k(b.parentNode)||b,q=j.join(",")}if(q)try{return ab.apply(c,p.querySelectorAll(q)),c}catch(r){}finally{l||b.removeAttribute("id")}}}return v(a.replace(jb,"$1"),b,c,d)}function c(){function a(c,d){return b.push(c+" ")>z.cacheLength&&delete a[b.shift()],a[c+" "]=d}var b=[];return a}function d(a){return a[O]=!0,a}function e(a){var b=H.createElement("div");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function f(a,b){for(var c=a.split("|"),d=a.length;d--;)z.attrHandle[c[d]]=b}function g(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&(~b.sourceIndex||X)-(~a.sourceIndex||X);if(d)return d;if(c)for(;c=c.nextSibling;)if(c===b)return-1;return a?1:-1}function h(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function i(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function j(a){return d(function(b){return b=+b,d(function(c,d){for(var e,f=a([],c.length,b),g=f.length;g--;)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function k(a){return a&&typeof a.getElementsByTagName!==W&&a}function l(){}function m(a,c){var d,e,f,g,h,i,j,k=T[a+" "];if(k)return c?0:k.slice(0);for(h=a,i=[],j=z.preFilter;h;){(!d||(e=kb.exec(h)))&&(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),d=!1,(e=lb.exec(h))&&(d=e.shift(),f.push({value:d,type:e[0].replace(jb," ")}),h=h.slice(d.length));for(g in z.filter)!(e=pb[g].exec(h))||j[g]&&!(e=j[g](e))||(d=e.shift(),f.push({value:d,type:g,matches:e}),h=h.slice(d.length));if(!d)break}return c?h.length:h?b.error(a):T(a,i).slice(0)}function n(a){for(var b=0,c=a.length,d="";c>b;b++)d+=a[b].value;return d}function o(a,b,c){var d=b.dir,e=c&&"parentNode"===d,f=R++;return b.first?function(b,c,f){for(;b=b[d];)if(1===b.nodeType||e)return a(b,c,f)}:function(b,c,g){var h,i,j,k=Q+" "+f;if(g){for(;b=b[d];)if((1===b.nodeType||e)&&a(b,c,g))return!0}else for(;b=b[d];)if(1===b.nodeType||e)if(j=b[O]||(b[O]={}),(i=j[d])&&i[0]===k){if((h=i[1])===!0||h===y)return h===!0}else if(i=j[d]=[k],i[1]=a(b,c,g)||y,i[1]===!0)return!0}}function p(a){return a.length>1?function(b,c,d){for(var e=a.length;e--;)if(!a[e](b,c,d))return!1;return!0}:a[0]}function q(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;i>h;h++)(f=a[h])&&(!c||c(f,d,e))&&(g.push(f),j&&b.push(h));return g}function r(a,b,c,e,f,g){return e&&!e[O]&&(e=r(e)),f&&!f[O]&&(f=r(f,g)),d(function(d,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=d||u(b||"*",h.nodeType?[h]:h,[]),r=!a||!d&&b?p:q(p,m,a,h,i),s=c?f||(d?a:o||e)?[]:g:r;if(c&&c(r,s,h,i),e)for(j=q(s,n),e(j,[],h,i),k=j.length;k--;)(l=j[k])&&(s[n[k]]=!(r[n[k]]=l));if(d){if(f||a){if(f){for(j=[],k=s.length;k--;)(l=s[k])&&j.push(r[k]=l);f(null,s=[],j,i)}for(k=s.length;k--;)(l=s[k])&&(j=f?cb.call(d,l):m[k])>-1&&(d[j]=!(g[j]=l))}}else s=q(s===g?s.splice(o,s.length):s),f?f(null,g,s,i):ab.apply(g,s)})}function s(a){for(var b,c,d,e=a.length,f=z.relative[a[0].type],g=f||z.relative[" "],h=f?1:0,i=o(function(a){return a===b},g,!0),j=o(function(a){return cb.call(b,a)>-1},g,!0),k=[function(a,c,d){return!f&&(d||c!==D)||((b=c).nodeType?i(a,c,d):j(a,c,d))}];e>h;h++)if(c=z.relative[a[h].type])k=[o(p(k),c)];else{if(c=z.filter[a[h].type].apply(null,a[h].matches),c[O]){for(d=++h;e>d&&!z.relative[a[d].type];d++);return r(h>1&&p(k),h>1&&n(a.slice(0,h-1).concat({value:" "===a[h-2].type?"*":""})).replace(jb,"$1"),c,d>h&&s(a.slice(h,d)),e>d&&s(a=a.slice(d)),e>d&&n(a))}k.push(c)}return p(k)}function t(a,c){var e=0,f=c.length>0,g=a.length>0,h=function(d,h,i,j,k){var l,m,n,o=0,p="0",r=d&&[],s=[],t=D,u=d||g&&z.find.TAG("*",k),v=Q+=null==t?1:Math.random()||.1,w=u.length;for(k&&(D=h!==H&&h,y=e);p!==w&&null!=(l=u[p]);p++){if(g&&l){for(m=0;n=a[m++];)if(n(l,h,i)){j.push(l);break}k&&(Q=v,y=++e)}f&&((l=!n&&l)&&o--,d&&r.push(l))}if(o+=p,f&&p!==o){for(m=0;n=c[m++];)n(r,s,h,i);if(d){if(o>0)for(;p--;)r[p]||s[p]||(s[p]=$.call(j));s=q(s)}ab.apply(j,s),k&&!d&&s.length>0&&o+c.length>1&&b.uniqueSort(j)}return k&&(Q=v,D=t),r};return f?d(h):h}function u(a,c,d){for(var e=0,f=c.length;f>e;e++)b(a,c[e],d);return d}function v(a,b,c,d){var e,f,g,h,i,j=m(a);if(!d&&1===j.length){if(f=j[0]=j[0].slice(0),f.length>2&&"ID"===(g=f[0]).type&&x.getById&&9===b.nodeType&&J&&z.relative[f[1].type]){if(b=(z.find.ID(g.matches[0].replace(wb,xb),b)||[])[0],!b)return c;a=a.slice(f.shift().value.length)}for(e=pb.needsContext.test(a)?0:f.length;e--&&(g=f[e],!z.relative[h=g.type]);)if((i=z.find[h])&&(d=i(g.matches[0].replace(wb,xb),ub.test(f[0].type)&&k(b.parentNode)||b))){if(f.splice(e,1),a=d.length&&n(f),!a)return ab.apply(c,d),c;break}}return C(a,j)(d,b,!J,c,ub.test(a)&&k(b.parentNode)||b),c}var w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O="sizzle"+-new Date,P=a.document,Q=0,R=0,S=c(),T=c(),U=c(),V=function(a,b){return a===b&&(F=!0),0},W=typeof void 0,X=1<<31,Y={}.hasOwnProperty,Z=[],$=Z.pop,_=Z.push,ab=Z.push,bb=Z.slice,cb=Z.indexOf||function(a){for(var b=0,c=this.length;c>b;b++)if(this[b]===a)return b;return-1},db="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",eb="[\\x20\\t\\r\\n\\f]",fb="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",gb=fb.replace("w","w#"),hb="\\["+eb+"*("+fb+")"+eb+"*(?:([*^$|!~]?=)"+eb+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+gb+")|)|)"+eb+"*\\]",ib=":("+fb+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+hb.replace(3,8)+")*)|.*)\\)|)",jb=new RegExp("^"+eb+"+|((?:^|[^\\\\])(?:\\\\.)*)"+eb+"+$","g"),kb=new RegExp("^"+eb+"*,"+eb+"*"),lb=new RegExp("^"+eb+"*([>+~]|"+eb+")"+eb+"*"),mb=new RegExp("="+eb+"*([^\\]'\"]*)"+eb+"*\\]","g"),nb=new RegExp(ib),ob=new RegExp("^"+gb+"$"),pb={ID:new RegExp("^#("+fb+")"),CLASS:new RegExp("^\\.("+fb+")"),TAG:new RegExp("^("+fb.replace("w","w*")+")"),ATTR:new RegExp("^"+hb),PSEUDO:new RegExp("^"+ib),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+eb+"*(even|odd|(([+-]|)(\\d*)n|)"+eb+"*(?:([+-]|)"+eb+"*(\\d+)|))"+eb+"*\\)|)","i"),bool:new RegExp("^(?:"+db+")$","i"),needsContext:new RegExp("^"+eb+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+eb+"*((?:-\\d)?\\d*)"+eb+"*\\)|)(?=[^-]|$)","i")},qb=/^(?:input|select|textarea|button)$/i,rb=/^h\d$/i,sb=/^[^{]+\{\s*\[native \w/,tb=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,ub=/[+~]/,vb=/'|\\/g,wb=new RegExp("\\\\([\\da-f]{1,6}"+eb+"?|("+eb+")|.)","ig"),xb=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:0>d?String.fromCharCode(d+65536):String.fromCharCode(55296|d>>10,56320|1023&d)};try{ab.apply(Z=bb.call(P.childNodes),P.childNodes),Z[P.childNodes.length].nodeType}catch(yb){ab={apply:Z.length?function(a,b){_.apply(a,bb.call(b))}:function(a,b){for(var c=a.length,d=0;a[c++]=b[d++];);a.length=c-1}}}x=b.support={},B=b.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?"HTML"!==b.nodeName:!1},G=b.setDocument=function(a){var b=a?a.ownerDocument||a:P,c=b.defaultView;return b!==H&&9===b.nodeType&&b.documentElement?(H=b,I=b.documentElement,J=!B(b),c&&c.attachEvent&&c!==c.top&&c.attachEvent("onbeforeunload",function(){G()}),x.attributes=e(function(a){return a.className="i",!a.getAttribute("className")}),x.getElementsByTagName=e(function(a){return a.appendChild(b.createComment("")),!a.getElementsByTagName("*").length}),x.getElementsByClassName=e(function(a){return a.innerHTML="<div class='a'></div><div class='a i'></div>",a.firstChild.className="i",2===a.getElementsByClassName("i").length}),x.getById=e(function(a){return I.appendChild(a).id=O,!b.getElementsByName||!b.getElementsByName(O).length}),x.getById?(z.find.ID=function(a,b){if(typeof b.getElementById!==W&&J){var c=b.getElementById(a);return c&&c.parentNode?[c]:[]}},z.filter.ID=function(a){var b=a.replace(wb,xb);return function(a){return a.getAttribute("id")===b}}):(delete z.find.ID,z.filter.ID=function(a){var b=a.replace(wb,xb);return function(a){var c=typeof a.getAttributeNode!==W&&a.getAttributeNode("id");return c&&c.value===b}}),z.find.TAG=x.getElementsByTagName?function(a,b){return typeof b.getElementsByTagName!==W?b.getElementsByTagName(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){for(;c=f[e++];)1===c.nodeType&&d.push(c);return d}return f},z.find.CLASS=x.getElementsByClassName&&function(a,b){return typeof b.getElementsByClassName!==W&&J?b.getElementsByClassName(a):void 0},L=[],K=[],(x.qsa=sb.test(b.querySelectorAll))&&(e(function(a){a.innerHTML="<select><option selected=''></option></select>",a.querySelectorAll("[selected]").length||K.push("\\["+eb+"*(?:value|"+db+")"),a.querySelectorAll(":checked").length||K.push(":checked")}),e(function(a){var c=b.createElement("input");c.setAttribute("type","hidden"),a.appendChild(c).setAttribute("t",""),a.querySelectorAll("[t^='']").length&&K.push("[*^$]="+eb+"*(?:''|\"\")"),a.querySelectorAll(":enabled").length||K.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),K.push(",.*:")})),(x.matchesSelector=sb.test(M=I.webkitMatchesSelector||I.mozMatchesSelector||I.oMatchesSelector||I.msMatchesSelector))&&e(function(a){x.disconnectedMatch=M.call(a,"div"),M.call(a,"[s!='']:x"),L.push("!=",ib)}),K=K.length&&new RegExp(K.join("|")),L=L.length&&new RegExp(L.join("|")),N=sb.test(I.contains)||I.compareDocumentPosition?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)for(;b=b.parentNode;)if(b===a)return!0;return!1},V=I.compareDocumentPosition?function(a,c){if(a===c)return F=!0,0;var d=c.compareDocumentPosition&&a.compareDocumentPosition&&a.compareDocumentPosition(c);return d?1&d||!x.sortDetached&&c.compareDocumentPosition(a)===d?a===b||N(P,a)?-1:c===b||N(P,c)?1:E?cb.call(E,a)-cb.call(E,c):0:4&d?-1:1:a.compareDocumentPosition?-1:1}:function(a,c){var d,e=0,f=a.parentNode,h=c.parentNode,i=[a],j=[c];if(a===c)return F=!0,0;if(!f||!h)return a===b?-1:c===b?1:f?-1:h?1:E?cb.call(E,a)-cb.call(E,c):0;if(f===h)return g(a,c);for(d=a;d=d.parentNode;)i.unshift(d);for(d=c;d=d.parentNode;)j.unshift(d);for(;i[e]===j[e];)e++;return e?g(i[e],j[e]):i[e]===P?-1:j[e]===P?1:0},b):H},b.matches=function(a,c){return b(a,null,null,c)},b.matchesSelector=function(a,c){if((a.ownerDocument||a)!==H&&G(a),c=c.replace(mb,"='$1']"),!(!x.matchesSelector||!J||L&&L.test(c)||K&&K.test(c)))try{var d=M.call(a,c);if(d||x.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return b(c,H,null,[a]).length>0},b.contains=function(a,b){return(a.ownerDocument||a)!==H&&G(a),N(a,b)},b.attr=function(a,b){(a.ownerDocument||a)!==H&&G(a);var c=z.attrHandle[b.toLowerCase()],d=c&&Y.call(z.attrHandle,b.toLowerCase())?c(a,b,!J):void 0;return void 0!==d?d:x.attributes||!J?a.getAttribute(b):(d=a.getAttributeNode(b))&&d.specified?d.value:null},b.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},b.uniqueSort=function(a){var b,c=[],d=0,e=0;if(F=!x.detectDuplicates,E=!x.sortStable&&a.slice(0),a.sort(V),F){for(;b=a[e++];)b===a[e]&&(d=c.push(e));for(;d--;)a.splice(c[d],1)}return a},A=b.getText=function(a){var b,c="",d=0,e=a.nodeType;if(e){if(1===e||9===e||11===e){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=A(a)}else if(3===e||4===e)return a.nodeValue}else for(;b=a[d++];)c+=A(b);return c},z=b.selectors={cacheLength:50,createPseudo:d,match:pb,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(wb,xb),a[3]=(a[4]||a[5]||"").replace(wb,xb),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||b.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&b.error(a[0]),a},PSEUDO:function(a){var b,c=!a[5]&&a[2];return pb.CHILD.test(a[0])?null:(a[3]&&void 0!==a[4]?a[2]=a[4]:c&&nb.test(c)&&(b=m(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(wb,xb).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=S[a+" "];return b||(b=new RegExp("(^|"+eb+")"+a+"("+eb+"|$)"))&&S(a,function(a){return b.test("string"==typeof a.className&&a.className||typeof a.getAttribute!==W&&a.getAttribute("class")||"")})},ATTR:function(a,c,d){return function(e){var f=b.attr(e,a);return null==f?"!="===c:c?(f+="","="===c?f===d:"!="===c?f!==d:"^="===c?d&&0===f.indexOf(d):"*="===c?d&&f.indexOf(d)>-1:"$="===c?d&&f.slice(-d.length)===d:"~="===c?(" "+f+" ").indexOf(d)>-1:"|="===c?f===d||f.slice(0,d.length+1)===d+"-":!1):!0}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h;if(q){if(f){for(;p;){for(l=b;l=l[p];)if(h?l.nodeName.toLowerCase()===r:1===l.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&s){for(k=q[O]||(q[O]={}),j=k[a]||[],n=j[0]===Q&&j[1],m=j[0]===Q&&j[2],l=n&&q.childNodes[n];l=++n&&l&&l[p]||(m=n=0)||o.pop();)if(1===l.nodeType&&++m&&l===b){k[a]=[Q,n,m];break}}else if(s&&(j=(b[O]||(b[O]={}))[a])&&j[0]===Q)m=j[1];else for(;(l=++n&&l&&l[p]||(m=n=0)||o.pop())&&((h?l.nodeName.toLowerCase()!==r:1!==l.nodeType)||!++m||(s&&((l[O]||(l[O]={}))[a]=[Q,m]),l!==b)););return m-=e,m===d||0===m%d&&m/d>=0}}},PSEUDO:function(a,c){var e,f=z.pseudos[a]||z.setFilters[a.toLowerCase()]||b.error("unsupported pseudo: "+a);return f[O]?f(c):f.length>1?(e=[a,a,"",c],z.setFilters.hasOwnProperty(a.toLowerCase())?d(function(a,b){for(var d,e=f(a,c),g=e.length;g--;)d=cb.call(a,e[g]),a[d]=!(b[d]=e[g])}):function(a){return f(a,0,e)}):f}},pseudos:{not:d(function(a){var b=[],c=[],e=C(a.replace(jb,"$1"));return e[O]?d(function(a,b,c,d){for(var f,g=e(a,null,d,[]),h=a.length;h--;)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,d,f){return b[0]=a,e(b,null,f,c),!c.pop()}}),has:d(function(a){return function(c){return b(a,c).length>0}}),contains:d(function(a){return function(b){return(b.textContent||b.innerText||A(b)).indexOf(a)>-1}}),lang:d(function(a){return ob.test(a||"")||b.error("unsupported lang: "+a),a=a.replace(wb,xb).toLowerCase(),function(b){var c;do if(c=J?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===I},focus:function(a){return a===H.activeElement&&(!H.hasFocus||H.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!z.pseudos.empty(a)},header:function(a){return rb.test(a.nodeName)},input:function(a){return qb.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||b.toLowerCase()===a.type)},first:j(function(){return[0]}),last:j(function(a,b){return[b-1]}),eq:j(function(a,b,c){return[0>c?c+b:c]}),even:j(function(a,b){for(var c=0;b>c;c+=2)a.push(c);return a}),odd:j(function(a,b){for(var c=1;b>c;c+=2)a.push(c);return a}),lt:j(function(a,b,c){for(var d=0>c?c+b:c;--d>=0;)a.push(d);return a}),gt:j(function(a,b,c){for(var d=0>c?c+b:c;++d<b;)a.push(d);return a})}},z.pseudos.nth=z.pseudos.eq;for(w in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})z.pseudos[w]=h(w);for(w in{submit:!0,reset:!0})z.pseudos[w]=i(w);l.prototype=z.filters=z.pseudos,z.setFilters=new l,C=b.compile=function(a,b){var c,d=[],e=[],f=U[a+" "];if(!f){for(b||(b=m(a)),c=b.length;c--;)f=s(b[c]),f[O]?d.push(f):e.push(f);f=U(a,t(e,d))}return f},x.sortStable=O.split("").sort(V).join("")===O,x.detectDuplicates=!!F,G(),x.sortDetached=e(function(a){return 1&a.compareDocumentPosition(H.createElement("div"))}),e(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||f("type|href|height|width",function(a,b,c){return c?void 0:a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),x.attributes&&e(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||f("value",function(a,b,c){return c||"input"!==a.nodeName.toLowerCase()?void 0:a.defaultValue}),e(function(a){return null==a.getAttribute("disabled")})||f(db,function(a,b,c){var d;return c?void 0:a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),"function"==typeof define&&define.amd?define(function(){return b}):"undefined"!=typeof module&&module.exports?module.exports=b:a.Sizzle=b}(window);
/*
*/
;
(function(undefined) {
  // The Opal object that is exposed globally
  var Opal = this.Opal = {};

  // The actual class for BasicObject
  var RubyBasicObject;

  // The actual Object class
  var RubyObject;

  // The actual Module class
  var RubyModule;

  // The actual Class class
  var RubyClass;

  // Constructor for instances of BasicObject
  function BasicObject(){}

  // Constructor for instances of Object
  function Object(){}

  // Constructor for instances of Class
  function Class(){}

  // Constructor for instances of Module
  function Module(){}

  // Constructor for instances of NilClass (nil)
  function NilClass(){}

  // All bridged classes - keep track to donate methods from Object
  var bridged_classes = [];

  // TopScope is used for inheriting constants from the top scope
  var TopScope = function(){};

  // Opal just acts as the top scope
  TopScope.prototype = Opal;

  // To inherit scopes
  Opal.constructor  = TopScope;

  Opal.constants = [];

  // This is a useful reference to global object inside ruby files
  Opal.global = this;

  // Minify common function calls
  var $hasOwn = Opal.hasOwnProperty;
  var $slice  = Opal.slice = Array.prototype.slice;

  // Generates unique id for every ruby object
  var unique_id = 0;

  // Return next unique id
  Opal.uid = function() {
    return unique_id++;
  };

  // Table holds all class variables
  Opal.cvars = {};

  // Globals table
  Opal.gvars = {};

  /*
   * Create a new constants scope for the given class with the given
   * base. Constants are looked up through their parents, so the base
   * scope will be the outer scope of the new klass.
   */
  function create_scope(base, klass, id) {
    var const_alloc   = function() {};
    var const_scope   = const_alloc.prototype = new base.constructor();
    klass._scope      = const_scope;
    const_scope.base  = klass;
    klass._base_module = base.base;
    const_scope.constructor = const_alloc;
    const_scope.constants = [];

    if (id) {
      klass._orig_scope = base;
      base[id] = base.constructor[id] = klass;
      base.constants.push(id);
    }
  }

  Opal.create_scope = create_scope;

  /*
   * A `class Foo; end` expression in ruby is compiled to call this runtime
   * method which either returns an existing class of the given name, or creates
   * a new class in the given `base` scope.
   *
   * If a constant with the given name exists, then we check to make sure that
   * it is a class and also that the superclasses match. If either of these
   * fail, then we raise a `TypeError`. Note, superklass may be null if one was
   * not specified in the ruby code.
   *
   * We pass a constructor to this method of the form `function ClassName() {}`
   * simply so that classes show up with nicely formatted names inside debuggers
   * in the web browser (or node/sprockets).
   *
   * The `base` is the current `self` value where the class is being created
   * from. We use this to get the scope for where the class should be created.
   * If `base` is an object (not a class/module), we simple get its class and
   * use that as the base instead.
   *
   * @param [Object] base where the class is being created
   * @param [Class] superklass superclass of the new class (may be null)
   * @param [String] id the name of the class to be created
   * @param [Function] constructor function to use as constructor
   * @return [Class] new or existing ruby class
   */
  Opal.klass = function(base, superklass, id, constructor) {

    // If base is an object, use its class
    if (!base._isClass) {
      base = base._klass;
    }

    // Not specifying a superclass means we can assume it to be Object
    if (superklass === null) {
      superklass = RubyObject;
    }

    var klass = base._scope[id];

    // If a constant exists in the scope, then we must use that
    if ($hasOwn.call(base._scope, id) && klass._orig_scope === base._scope) {

      // Make sure the existing constant is a class, or raise error
      if (!klass._isClass) {
        throw Opal.TypeError.$new(id + " is not a class");
      }

      // Make sure existing class has same superclass
      if (superklass !== klass._super && superklass !== RubyObject) {
        throw Opal.TypeError.$new("superclass mismatch for class " + id);
      }
    }
    else {
      // if class doesnt exist, create a new one with given superclass
      klass = boot_class(superklass, constructor);

      // name class using base (e.g. Foo or Foo::Baz)
      klass._name = id;

      // every class gets its own constant scope, inherited from current scope
      create_scope(base._scope, klass, id);

      // Name new class directly onto current scope (Opal.Foo.Baz = klass)
      base[id] = base._scope[id] = klass;

      // Copy all parent constants to child, unless parent is Object
      if (superklass !== RubyObject && superklass !== RubyBasicObject) {
        Opal.donate_constants(superklass, klass);
      }

      // call .inherited() hook with new class on the superclass
      if (superklass.$inherited) {
        superklass.$inherited(klass);
      }
    }

    return klass;
  };

  // Create generic class with given superclass.
  var boot_class = Opal.boot = function(superklass, constructor) {
    // instances
    var ctor = function() {};
        ctor.prototype = superklass._proto;

    constructor.prototype = new ctor();

    constructor.prototype.constructor = constructor;

    // class itself
    var mtor = function() {};
    mtor.prototype = superklass.constructor.prototype;

    function OpalClass() {};
    OpalClass.prototype = new mtor();

    var klass = new OpalClass();

    klass._id         = unique_id++;
    klass._alloc      = constructor;
    klass._isClass    = true;
    klass.constructor = OpalClass;
    klass._super      = superklass;
    klass._methods    = [];
    klass.__inc__     = [];
    klass.__parent    = superklass;
    klass._proto      = constructor.prototype;

    constructor.prototype._klass = klass;

    return klass;
  };

  // Define new module (or return existing module)
  Opal.module = function(base, id) {
    var module;

    if (!base._isClass) {
      base = base._klass;
    }

    if ($hasOwn.call(base._scope, id)) {
      module = base._scope[id];

      if (!module.__mod__ && module !== RubyObject) {
        throw Opal.TypeError.$new(id + " is not a module")
      }
    }
    else {
      module = boot_module()
      module._name = id;

      create_scope(base._scope, module, id);

      // Name new module directly onto current scope (Opal.Foo.Baz = module)
      base[id] = base._scope[id] = module;
    }

    return module;
  };

  /*
   * Internal function to create a new module instance. This simply sets up
   * the prototype hierarchy and method tables.
   */
  function boot_module() {
    var mtor = function() {};
    mtor.prototype = RubyModule.constructor.prototype;

    function OpalModule() {};
    OpalModule.prototype = new mtor();

    var module = new OpalModule();

    module._id         = unique_id++;
    module._isClass    = true;
    module.constructor = OpalModule;
    module._super      = RubyModule;
    module._methods    = [];
    module.__inc__     = [];
    module.__parent    = RubyModule;
    module._proto      = {};
    module.__mod__     = true;
    module.__dep__     = [];

    return module;
  }

  // Boot a base class (makes instances).
  var boot_defclass = function(id, constructor, superklass) {
    if (superklass) {
      var ctor           = function() {};
          ctor.prototype = superklass.prototype;

      constructor.prototype = new ctor();
    }

    constructor.prototype.constructor = constructor;

    return constructor;
  };

  // Boot the actual (meta?) classes of core classes
  var boot_makemeta = function(id, constructor, superklass) {

    var mtor = function() {};
    mtor.prototype  = superklass.prototype;

    function OpalClass() {};
    OpalClass.prototype = new mtor();

    var klass = new OpalClass();

    klass._id         = unique_id++;
    klass._alloc      = constructor;
    klass._isClass    = true;
    klass._name       = id;
    klass._super      = superklass;
    klass.constructor = OpalClass;
    klass._methods    = [];
    klass.__inc__     = [];
    klass.__parent    = superklass;
    klass._proto      = constructor.prototype;

    constructor.prototype._klass = klass;

    Opal[id] = klass;
    Opal.constants.push(id);

    return klass;
  };

  /*
   * For performance, some core ruby classes are toll-free bridged to their
   * native javascript counterparts (e.g. a ruby Array is a javascript Array).
   *
   * This method is used to setup a native constructor (e.g. Array), to have
   * its prototype act like a normal ruby class. Firstly, a new ruby class is
   * created using the native constructor so that its prototype is set as the
   * target for th new class. Note: all bridged classes are set to inherit
   * from Object.
   *
   * Bridged classes are tracked in `bridged_classes` array so that methods
   * defined on Object can be "donated" to all bridged classes. This allows
   * us to fake the inheritance of a native prototype from our Object
   * prototype.
   *
   * Example:
   *
   *    bridge_class("Proc", Function);
   *
   * @param [String] name the name of the ruby class to create
   * @param [Function] constructor native javascript constructor to use
   * @return [Class] returns new ruby class
   */
  function bridge_class(name, constructor) {
    var klass = boot_class(RubyObject, constructor);

    klass._name = name;

    create_scope(Opal, klass, name);
    bridged_classes.push(klass);

    return klass;
  };

  /*
   * constant assign
   */
  Opal.casgn = function(base_module, name, value) {
    var scope = base_module._scope;

    if (value._isClass && value._name === nil) {
      value._name = name;
    }

    if (value._isClass) {
      value._base_module = base_module;
    }

    scope.constants.push(name);
    return scope[name] = value;
  };

  /*
   * constant decl
   */
  Opal.cdecl = function(base_scope, name, value) {
    base_scope.constants.push(name);
    return base_scope[name] = value;
  };

  /*
   * constant get
   */
  Opal.cget = function(base_scope, path) {
    if (path == null) {
      path       = base_scope;
      base_scope = Opal.Object;
    }

    var result = base_scope;

    path = path.split('::');
    while (path.length != 0) {
      result = result.$const_get(path.shift());
    }

    return result;
  }

  /*
   * When a source module is included into the target module, we must also copy
   * its constants to the target.
   */
  Opal.donate_constants = function(source_mod, target_mod) {
    var source_constants = source_mod._scope.constants,
        target_scope     = target_mod._scope,
        target_constants = target_scope.constants;

    for (var i = 0, length = source_constants.length; i < length; i++) {
      target_constants.push(source_constants[i]);
      target_scope[source_constants[i]] = source_mod._scope[source_constants[i]];
    }
  };

  /*
   * Methods stubs are used to facilitate method_missing in opal. A stub is a
   * placeholder function which just calls `method_missing` on the receiver.
   * If no method with the given name is actually defined on an object, then it
   * is obvious to say that the stub will be called instead, and then in turn
   * method_missing will be called.
   *
   * When a file in ruby gets compiled to javascript, it includes a call to
   * this function which adds stubs for every method name in the compiled file.
   * It should then be safe to assume that method_missing will work for any
   * method call detected.
   *
   * Method stubs are added to the BasicObject prototype, which every other
   * ruby object inherits, so all objects should handle method missing. A stub
   * is only added if the given property name (method name) is not already
   * defined.
   *
   * Note: all ruby methods have a `$` prefix in javascript, so all stubs will
   * have this prefix as well (to make this method more performant).
   *
   *    Opal.add_stubs(["$foo", "$bar", "$baz="]);
   *
   * All stub functions will have a private `rb_stub` property set to true so
   * that other internal methods can detect if a method is just a stub or not.
   * `Kernel#respond_to?` uses this property to detect a methods presence.
   *
   * @param [Array] stubs an array of method stubs to add
   */
  Opal.add_stubs = function(stubs) {
    for (var i = 0, length = stubs.length; i < length; i++) {
      var stub = stubs[i];

      if (!BasicObject.prototype[stub]) {
        BasicObject.prototype[stub] = true;
        add_stub_for(BasicObject.prototype, stub);
      }
    }
  };

  /*
   * Actuall add a method_missing stub function to the given prototype for the
   * given name.
   *
   * @param [Prototype] prototype the target prototype
   * @param [String] stub stub name to add (e.g. "$foo")
   */
  function add_stub_for(prototype, stub) {
    function method_missing_stub() {
      // Copy any given block onto the method_missing dispatcher
      this.$method_missing._p = method_missing_stub._p;

      // Set block property to null ready for the next call (stop false-positives)
      method_missing_stub._p = null;

      // call method missing with correct args (remove '$' prefix on method name)
      return this.$method_missing.apply(this, [stub.slice(1)].concat($slice.call(arguments)));
    }

    method_missing_stub.rb_stub = true;
    prototype[stub] = method_missing_stub;
  }

  // Expose for other parts of Opal to use
  Opal.add_stub_for = add_stub_for;

  // Const missing dispatcher
  Opal.cm = function(name) {
    return this.base.$const_missing(name);
  };

  // Arity count error dispatcher
  Opal.ac = function(actual, expected, object, meth) {
    var inspect = (object._isClass ? object._name + '.' : object._klass._name + '#') + meth;
    var msg = '[' + inspect + '] wrong number of arguments(' + actual + ' for ' + expected + ')';
    throw Opal.ArgumentError.$new(msg);
  };

  // Super dispatcher
  Opal.find_super_dispatcher = function(obj, jsid, current_func, iter, defs) {
    var dispatcher;

    if (defs) {
      dispatcher = obj._isClass ? defs._super : obj._klass._proto;
    }
    else {
      if (obj._isClass) {
        dispatcher = obj._klass;
      }
      else {
        dispatcher = find_obj_super_dispatcher(obj, jsid, current_func);
      }
    }

    dispatcher = dispatcher['$' + jsid];
    dispatcher._p = iter;

    return dispatcher;
  };

  // Iter dispatcher for super in a block
  Opal.find_iter_super_dispatcher = function(obj, jsid, current_func, iter, defs) {
    if (current_func._def) {
      return Opal.find_super_dispatcher(obj, current_func._jsid, current_func, iter, defs);
    }
    else {
      return Opal.find_super_dispatcher(obj, jsid, current_func, iter, defs);
    }
  };

  var find_obj_super_dispatcher = function(obj, jsid, current_func) {
    var klass = obj.__meta__ || obj._klass;

    while (klass) {
      if (klass._proto['$' + jsid] === current_func) {
        // ok
        break;
      }

      klass = klass.__parent;
    }

    // if we arent in a class, we couldnt find current?
    if (!klass) {
      throw new Error("could not find current class for super()");
    }

    klass = klass.__parent;

    // else, let's find the next one
    while (klass) {
      var working = klass._proto['$' + jsid];

      if (working && working !== current_func) {
        // ok
        break;
      }

      klass = klass.__parent;
    }

    return klass._proto;
  };

  /*
   * Used to return as an expression. Sometimes, we can't simply return from
   * a javascript function as if we were a method, as the return is used as
   * an expression, or even inside a block which must "return" to the outer
   * method. This helper simply throws an error which is then caught by the
   * method. This approach is expensive, so it is only used when absolutely
   * needed.
   */
  Opal.$return = function(val) {
    Opal.returner.$v = val;
    throw Opal.returner;
  };

  // handles yield calls for 1 yielded arg
  Opal.$yield1 = function(block, arg) {
    if (typeof(block) !== "function") {
      throw Opal.LocalJumpError.$new("no block given");
    }

    if (block.length > 1) {
      if (arg._isArray) {
        return block.apply(null, arg);
      }
      else {
        return block(arg);
      }
    }
    else {
      return block(arg);
    }
  };

  // handles yield for > 1 yielded arg
  Opal.$yieldX = function(block, args) {
    if (typeof(block) !== "function") {
      throw Opal.LocalJumpError.$new("no block given");
    }

    if (block.length > 1 && args.length == 1) {
      if (args[0]._isArray) {
        return block.apply(null, args[0]);
      }
    }

    if (!args._isArray) {
      args = $slice.call(args);
    }

    return block.apply(null, args);
  };

  Opal.is_a = function(object, klass) {
    var search = object._klass;

    while (search) {
      if (search === klass) {
        return true;
      }

      search = search._super;
    }

    return false;
  }

  // Helper to convert the given object to an array
  Opal.to_ary = function(value) {
    if (value._isArray) {
      return value;
    }
    else if (value.$to_ary && !value.$to_ary.rb_stub) {
      return value.$to_ary();
    }

    return [value];
  };

  /*
    Call a ruby method on a ruby object with some arguments:

      var my_array = [1, 2, 3, 4]
      Opal.send(my_array, 'length')     # => 4
      Opal.send(my_array, 'reverse!')   # => [4, 3, 2, 1]

    A missing method will be forwarded to the object via
    method_missing.

    The result of either call with be returned.

    @param [Object] recv the ruby object
    @param [String] mid ruby method to call
  */
  Opal.send = function(recv, mid) {
    var args = $slice.call(arguments, 2),
        func = recv['$' + mid];

    if (func) {
      return func.apply(recv, args);
    }

    return recv.$method_missing.apply(recv, [mid].concat(args));
  };

  Opal.block_send = function(recv, mid, block) {
    var args = $slice.call(arguments, 3),
        func = recv['$' + mid];

    if (func) {
      func._p = block;
      return func.apply(recv, args);
    }

    return recv.$method_missing.apply(recv, [mid].concat(args));
  };

  /**
   * Donate methods for a class/module
   */
  Opal.donate = function(klass, defined, indirect) {
    var methods = klass._methods, included_in = klass.__dep__;

    // if (!indirect) {
      klass._methods = methods.concat(defined);
    // }

    if (included_in) {
      for (var i = 0, length = included_in.length; i < length; i++) {
        var includee = included_in[i];
        var dest = includee._proto;

        for (var j = 0, jj = defined.length; j < jj; j++) {
          var method = defined[j];
          dest[method] = klass._proto[method];
          dest[method]._donated = true;
        }

        if (includee.__dep__) {
          Opal.donate(includee, defined, true);
        }
      }
    }
  };

  Opal.defn = function(obj, jsid, body) {
    if (obj.__mod__) {
      obj._proto[jsid] = body;
      Opal.donate(obj, [jsid]);
    }
    else if (obj._isClass) {
      obj._proto[jsid] = body;

      if (obj === RubyBasicObject) {
        define_basic_object_method(jsid, body);
      }
      else if (obj === RubyObject) {
        Opal.donate(obj, [jsid]);
      }
    }
    else {
      obj[jsid] = body;
    }

    return nil;
  };

  /*
   * Define a singleton method on the given object.
   */
  Opal.defs = function(obj, jsid, body) {
    if (obj._isClass || obj.__mod__) {
      obj.constructor.prototype[jsid] = body;
    }
    else {
      obj[jsid] = body;
    }
  };

  function define_basic_object_method(jsid, body) {
    for (var i = 0, len = bridged_classes.length; i < len; i++) {
      bridged_classes[i]._proto[jsid] = body;
    }
  }

  // Initialization
  // --------------

  // Constructors for *instances* of core objects
  boot_defclass('BasicObject', BasicObject);
  boot_defclass('Object', Object, BasicObject);
  boot_defclass('Module', Module, Object);
  boot_defclass('Class', Class, Module);

  // Constructors for *classes* of core objects
  RubyBasicObject = boot_makemeta('BasicObject', BasicObject, Class);
  RubyObject      = boot_makemeta('Object', Object, RubyBasicObject.constructor);
  RubyModule      = boot_makemeta('Module', Module, RubyObject.constructor);
  RubyClass       = boot_makemeta('Class', Class, RubyModule.constructor);

  // Fix booted classes to use their metaclass
  RubyBasicObject._klass = RubyClass;
  RubyObject._klass = RubyClass;
  RubyModule._klass = RubyClass;
  RubyClass._klass = RubyClass;

  // Fix superclasses of booted classes
  RubyBasicObject._super = null;
  RubyObject._super = RubyBasicObject;
  RubyModule._super = RubyObject;
  RubyClass._super = RubyModule;

  // Internally, Object acts like a module as it is "included" into bridged
  // classes. In other words, we donate methods from Object into our bridged
  // classes as their prototypes don't inherit from our root Object, so they
  // act like module includes.
  RubyObject.__dep__ = bridged_classes;

  Opal.base = RubyObject;
  RubyBasicObject._scope = RubyObject._scope = Opal;
  RubyBasicObject._orig_scope = RubyObject._orig_scope = Opal;
  Opal.Kernel = RubyObject;

  RubyModule._scope = RubyObject._scope;
  RubyClass._scope = RubyObject._scope;
  RubyModule._orig_scope = RubyObject._orig_scope;
  RubyClass._orig_scope = RubyObject._orig_scope;

  RubyObject._proto.toString = function() {
    return this.$to_s();
  };

  RubyClass._proto._defn = function(mid, body) { this._proto[mid] = body; };

  Opal.top = new RubyObject._alloc();

  Opal.klass(RubyObject, RubyObject, 'NilClass', NilClass);

  var nil = Opal.nil = new NilClass;
  nil.call = nil.apply = function() { throw Opal.LocalJumpError.$new('no block given'); };

  Opal.breaker  = new Error('unexpected break');
  Opal.returner = new Error('unexpected return');

  bridge_class('Array', Array);
  bridge_class('Boolean', Boolean);
  bridge_class('Numeric', Number);
  bridge_class('String', String);
  bridge_class('Proc', Function);
  bridge_class('Exception', Error);
  bridge_class('Regexp', RegExp);
  bridge_class('Time', Date);

  TypeError._super = Error;
}).call(this);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass;
  $opal.add_stubs(['$attr_reader', '$attr_writer', '$=~', '$raise', '$const_missing', '$to_str', '$append_features', '$included', '$name', '$new', '$to_s']);
  return (function($base, $super) {
    function Module(){};
    var self = Module = $klass($base, $super, 'Module', Module);

    var def = Module._proto, $scope = Module._scope, TMP_1, TMP_2, TMP_3;
    $opal.defs(self, '$new', TMP_1 = function() {
      var self = this, $iter = TMP_1._p, block = $iter || nil;
      TMP_1._p = null;
      
      function AnonModule(){}
      var klass     = Opal.boot(Module, AnonModule);
      klass._name   = nil;
      klass._klass  = Module;
      klass.__dep__ = []
      klass.__mod__ = true;
      klass._proto  = {};

      // inherit scope from parent
      $opal.create_scope(Module._scope, klass);

      if (block !== nil) {
        var block_self = block._s;
        block._s = null;
        block.call(klass);
        block._s = block_self;
      }

      return klass;
    
    });

    def['$==='] = function(object) {
      var $a, self = this;
      if (($a = object == null) !== false && $a !== nil) {
        return false};
      return $opal.is_a(object, self);
    };

    def['$<'] = function(other) {
      var self = this;
      
      var working = self;

      while (working) {
        if (working === other) {
          return true;
        }

        working = working.__parent;
      }

      return false;
    
    };

    def.$alias_method = function(newname, oldname) {
      var self = this;
      
      self._proto['$' + newname] = self._proto['$' + oldname];

      if (self._methods) {
        $opal.donate(self, ['$' + newname ])
      }
    
      return self;
    };

    def.$alias_native = function(mid, jsid) {
      var self = this;
      if (jsid == null) {
        jsid = mid
      }
      return self._proto['$' + mid] = self._proto[jsid];
    };

    def.$ancestors = function() {
      var self = this;
      
      var parent = self,
          result = [];

      while (parent) {
        result.push(parent);
        result = result.concat(parent.__inc__);

        parent = parent._super;
      }

      return result;
    
    };

    def.$append_features = function(klass) {
      var self = this;
      
      var module   = self,
          included = klass.__inc__;

      // check if this module is already included in the klass
      for (var i = 0, length = included.length; i < length; i++) {
        if (included[i] === module) {
          return;
        }
      }

      included.push(module);
      module.__dep__.push(klass);

      // iclass
      var iclass = {
        name: module._name,

        _proto:   module._proto,
        __parent: klass.__parent,
        __iclass: true
      };

      klass.__parent = iclass;

      var donator   = module._proto,
          prototype = klass._proto,
          methods   = module._methods;

      for (var i = 0, length = methods.length; i < length; i++) {
        var method = methods[i];

        if (prototype.hasOwnProperty(method) && !prototype[method]._donated) {
          // if the target class already has a method of the same name defined
          // and that method was NOT donated, then it must be a method defined
          // by the class so we do not want to override it
        }
        else {
          prototype[method] = donator[method];
          prototype[method]._donated = true;
        }
      }

      if (klass.__dep__) {
        $opal.donate(klass, methods.slice(), true);
      }

      $opal.donate_constants(module, klass);
    
      return self;
    };

    def.$attr_accessor = function(names) {
      var $a, $b, self = this;
      names = $slice.call(arguments, 0);
      ($a = self).$attr_reader.apply($a, [].concat(names));
      return ($b = self).$attr_writer.apply($b, [].concat(names));
    };

    def.$attr_reader = function(names) {
      var self = this;
      names = $slice.call(arguments, 0);
      
      var proto = self._proto, cls = self;
      for (var i = 0, length = names.length; i < length; i++) {
        (function(name) {
          proto[name] = nil;
          var func = function() { return this[name] };

          if (cls._isSingleton) {
            proto.constructor.prototype['$' + name] = func;
          }
          else {
            proto['$' + name] = func;
            $opal.donate(self, ['$' + name ]);
          }
        })(names[i]);
      }
    ;
      return nil;
    };

    def.$attr_writer = function(names) {
      var self = this;
      names = $slice.call(arguments, 0);
      
      var proto = self._proto, cls = self;
      for (var i = 0, length = names.length; i < length; i++) {
        (function(name) {
          proto[name] = nil;
          var func = function(value) { return this[name] = value; };

          if (cls._isSingleton) {
            proto.constructor.prototype['$' + name + '='] = func;
          }
          else {
            proto['$' + name + '='] = func;
            $opal.donate(self, ['$' + name + '=']);
          }
        })(names[i]);
      }
    ;
      return nil;
    };

    $opal.defn(self, '$attr', def.$attr_accessor);

    def.$constants = function() {
      var self = this;
      return self._scope.constants;
    };

    def['$const_defined?'] = function(name, inherit) {
      var $a, self = this;
      if (inherit == null) {
        inherit = true
      }
      if (($a = name['$=~'](/^[A-Z]\w*$/)) === false || $a === nil) {
        self.$raise((($a = $scope.NameError) == null ? $opal.cm('NameError') : $a), "wrong constant name " + (name))};
      
      scopes = [self._scope];
      if (inherit || self === Opal.Object) {
        var parent = self._super;
        while (parent !== Opal.BasicObject) {
          scopes.push(parent._scope);
          parent = parent._super;
        }
      }

      for (var i = 0, len = scopes.length; i < len; i++) {
        if (scopes[i].hasOwnProperty(name)) {
          return true;
        }
      }

      return false;
    ;
    };

    def.$const_get = function(name, inherit) {
      var $a, self = this;
      if (inherit == null) {
        inherit = true
      }
      if (($a = name['$=~'](/^[A-Z]\w*$/)) === false || $a === nil) {
        self.$raise((($a = $scope.NameError) == null ? $opal.cm('NameError') : $a), "wrong constant name " + (name))};
      
      var scopes = [self._scope];
      if (inherit || self == Opal.Object) {
        var parent = self._super;
        while (parent !== Opal.BasicObject) {
          scopes.push(parent._scope);
          parent = parent._super;
        }
      }

      for (var i = 0, len = scopes.length; i < len; i++) {
        if (scopes[i].hasOwnProperty(name)) {
          return scopes[i][name];
        }
      }

      return self.$const_missing(name);
    ;
    };

    def.$const_missing = function(const$) {
      var $a, self = this, name = nil;
      name = self._name;
      return self.$raise((($a = $scope.NameError) == null ? $opal.cm('NameError') : $a), "uninitialized constant " + (name) + "::" + (const$));
    };

    def.$const_set = function(name, value) {
      var $a, self = this;
      if (($a = name['$=~'](/^[A-Z]\w*$/)) === false || $a === nil) {
        self.$raise((($a = $scope.NameError) == null ? $opal.cm('NameError') : $a), "wrong constant name " + (name))};
      try {
      name = name.$to_str()
      } catch ($err) {if (true) {
        self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "conversion with #to_str failed")
        }else { throw $err; }
      };
      
      $opal.casgn(self, name, value);
      return value
    ;
    };

    def.$define_method = TMP_2 = function(name, method) {
      var self = this, $iter = TMP_2._p, block = $iter || nil;
      TMP_2._p = null;
      
      if (method) {
        block = method;
      }

      if (block === nil) {
        throw new Error("no block given");
      }

      var jsid    = '$' + name;
      block._jsid = name;
      block._s    = null;
      block._def  = block;

      self._proto[jsid] = block;
      $opal.donate(self, [jsid]);

      return null;
    
    };

    def.$remove_method = function(name) {
      var self = this;
      
      var jsid    = '$' + name;
      var current = self._proto[jsid];
      delete self._proto[jsid];

      // Check if we need to reverse $opal.donate
      // $opal.retire(self, [jsid]);
      return self;
    
    };

    def.$include = function(mods) {
      var self = this;
      mods = $slice.call(arguments, 0);
      
      var i = mods.length - 1, mod;
      while (i >= 0) {
        mod = mods[i];
        i--;

        if (mod === self) {
          continue;
        }

        (mod).$append_features(self);
        (mod).$included(self);
      }

      return self;
    
    };

    def.$instance_method = function(name) {
      var $a, self = this;
      
      var meth = self._proto['$' + name];

      if (!meth || meth.rb_stub) {
        self.$raise((($a = $scope.NameError) == null ? $opal.cm('NameError') : $a), "undefined method `" + (name) + "' for class `" + (self.$name()) + "'");
      }

      return (($a = $scope.UnboundMethod) == null ? $opal.cm('UnboundMethod') : $a).$new(self, meth, name);
    
    };

    def.$instance_methods = function(include_super) {
      var self = this;
      if (include_super == null) {
        include_super = false
      }
      
      var methods = [], proto = self._proto;

      for (var prop in self._proto) {
        if (!include_super && !proto.hasOwnProperty(prop)) {
          continue;
        }

        if (!include_super && proto[prop]._donated) {
          continue;
        }

        if (prop.charAt(0) === '$') {
          methods.push(prop.substr(1));
        }
      }

      return methods;
    ;
    };

    def.$included = function(mod) {
      var self = this;
      return nil;
    };

    def.$module_eval = TMP_3 = function() {
      var self = this, $iter = TMP_3._p, block = $iter || nil;
      TMP_3._p = null;
      
      if (block === nil) {
        throw new Error("no block given");
      }

      var block_self = block._s, result;

      block._s = null;
      result = block.call(self);
      block._s = block_self;

      return result;
    
    };

    $opal.defn(self, '$class_eval', def.$module_eval);

    $opal.defn(self, '$class_exec', def.$module_eval);

    $opal.defn(self, '$module_exec', def.$module_eval);

    def['$method_defined?'] = function(method) {
      var self = this;
      
      var body = self._proto['$' + method];
      return (!!body) && !body.rb_stub;
    ;
    };

    def.$module_function = function(methods) {
      var self = this;
      methods = $slice.call(arguments, 0);
      
      for (var i = 0, length = methods.length; i < length; i++) {
        var meth = methods[i], func = self._proto['$' + meth];

        self.constructor.prototype['$' + meth] = func;
      }

      return self;
    
    };

    def.$name = function() {
      var self = this;
      
      if (self._full_name) {
        return self._full_name;
      }

      var result = [], base = self;

      while (base) {
        if (base._name === nil) {
          return result.length === 0 ? nil : result.join('::');
        }

        result.unshift(base._name);

        base = base._base_module;

        if (base === $opal.Object) {
          break;
        }
      }

      if (result.length === 0) {
        return nil;
      }

      return self._full_name = result.join('::');
    
    };

    def.$public = function() {
      var self = this;
      return nil;
    };

    def.$private_class_method = function(name) {
      var self = this;
      return self['$' + name] || nil;
    };

    $opal.defn(self, '$private', def.$public);

    $opal.defn(self, '$protected', def.$public);

    $opal.defn(self, '$public_instance_methods', def.$instance_methods);

    $opal.defn(self, '$public_method_defined?', def['$method_defined?']);

    def.$remove_class_variable = function() {
      var self = this;
      return nil;
    };

    def.$remove_const = function(name) {
      var self = this;
      
      var old = self._scope[name];
      delete self._scope[name];
      return old;
    ;
    };

    def.$to_s = function() {
      var self = this;
      return self.$name().$to_s();
    };

    return (def.$undef_method = function(symbol) {
      var self = this;
      $opal.add_stub_for(self._proto, "$" + symbol);
      return self;
    }, nil);
  })(self, null)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass;
  $opal.add_stubs(['$raise', '$allocate']);
  return (function($base, $super) {
    function Class(){};
    var self = Class = $klass($base, $super, 'Class', Class);

    var def = Class._proto, $scope = Class._scope, TMP_1, TMP_2;
    $opal.defs(self, '$new', TMP_1 = function(sup) {
      var $a, self = this, $iter = TMP_1._p, block = $iter || nil;
      if (sup == null) {
        sup = (($a = $scope.Object) == null ? $opal.cm('Object') : $a)
      }
      TMP_1._p = null;
      
      if (!sup._isClass || sup.__mod__) {
        self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "superclass must be a Class");
      }

      function AnonClass(){};
      var klass       = Opal.boot(sup, AnonClass)
      klass._name     = nil;
      klass.__parent  = sup;

      // inherit scope from parent
      $opal.create_scope(sup._scope, klass);

      sup.$inherited(klass);

      if (block !== nil) {
        var block_self = block._s;
        block._s = null;
        block.call(klass);
        block._s = block_self;
      }

      return klass;
    ;
    });

    def.$allocate = function() {
      var self = this;
      
      var obj = new self._alloc;
      obj._id = Opal.uid();
      return obj;
    
    };

    def.$inherited = function(cls) {
      var self = this;
      return nil;
    };

    def.$new = TMP_2 = function(args) {
      var self = this, $iter = TMP_2._p, block = $iter || nil;
      args = $slice.call(arguments, 0);
      TMP_2._p = null;
      
      var obj = self.$allocate();

      obj.$initialize._p = block;
      obj.$initialize.apply(obj, args);
      return obj;
    ;
    };

    return (def.$superclass = function() {
      var self = this;
      return self._super || nil;
    }, nil);
  })(self, null)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass;
  $opal.add_stubs(['$raise']);
  return (function($base, $super) {
    function BasicObject(){};
    var self = BasicObject = $klass($base, $super, 'BasicObject', BasicObject);

    var def = BasicObject._proto, $scope = BasicObject._scope, TMP_1, TMP_2, TMP_3, TMP_4;
    $opal.defn(self, '$initialize', function() {
      var self = this;
      return nil;
    });

    $opal.defn(self, '$==', function(other) {
      var self = this;
      return self === other;
    });

    $opal.defn(self, '$__send__', TMP_1 = function(symbol, args) {
      var self = this, $iter = TMP_1._p, block = $iter || nil;
      args = $slice.call(arguments, 1);
      TMP_1._p = null;
      
      var func = self['$' + symbol]

      if (func) {
        if (block !== nil) {
          func._p = block;
        }

        return func.apply(self, args);
      }

      if (block !== nil) {
        self.$method_missing._p = block;
      }

      return self.$method_missing.apply(self, [symbol].concat(args));
    
    });

    $opal.defn(self, '$eql?', def['$==']);

    $opal.defn(self, '$equal?', def['$==']);

    $opal.defn(self, '$instance_eval', TMP_2 = function() {
      var $a, self = this, $iter = TMP_2._p, block = $iter || nil;
      TMP_2._p = null;
      if (($a = block) === false || $a === nil) {
        (($a = $scope.Kernel) == null ? $opal.cm('Kernel') : $a).$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "no block given")};
      
      var block_self = block._s,
          result;

      block._s = null;
      result = block.call(self, self);
      block._s = block_self;

      return result;
    
    });

    $opal.defn(self, '$instance_exec', TMP_3 = function(args) {
      var $a, self = this, $iter = TMP_3._p, block = $iter || nil;
      args = $slice.call(arguments, 0);
      TMP_3._p = null;
      if (($a = block) === false || $a === nil) {
        (($a = $scope.Kernel) == null ? $opal.cm('Kernel') : $a).$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "no block given")};
      
      var block_self = block._s,
          result;

      block._s = null;
      result = block.apply(self, args);
      block._s = block_self;

      return result;
    
    });

    return ($opal.defn(self, '$method_missing', TMP_4 = function(symbol, args) {
      var $a, self = this, $iter = TMP_4._p, block = $iter || nil;
      args = $slice.call(arguments, 1);
      TMP_4._p = null;
      return (($a = $scope.Kernel) == null ? $opal.cm('Kernel') : $a).$raise((($a = $scope.NoMethodError) == null ? $opal.cm('NoMethodError') : $a), "undefined method `" + (symbol) + "' for BasicObject instance");
    }), nil);
  })(self, null)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $gvars = $opal.gvars;
  $opal.add_stubs(['$raise', '$inspect', '$==', '$name', '$class', '$new', '$native?', '$to_a', '$to_proc', '$respond_to?', '$to_ary', '$singleton_class', '$allocate', '$initialize_copy', '$include', '$to_i', '$to_s', '$to_f', '$*', '$===', '$empty?', '$ArgumentError', '$nan?', '$infinite?', '$to_int', '$>', '$length', '$shift', '$print', '$format', '$puts', '$each', '$<=', '$[]', '$nil?', '$is_a?', '$rand']);
  return (function($base) {
    var self = $module($base, 'Kernel');

    var def = self._proto, $scope = self._scope, TMP_1, TMP_2, TMP_3, TMP_4, TMP_5, TMP_6, TMP_8;
    def.$method_missing = TMP_1 = function(symbol, args) {
      var $a, self = this, $iter = TMP_1._p, block = $iter || nil;
      args = $slice.call(arguments, 1);
      TMP_1._p = null;
      return self.$raise((($a = $scope.NoMethodError) == null ? $opal.cm('NoMethodError') : $a), "undefined method `" + (symbol) + "' for " + (self.$inspect()));
    };

    def['$=~'] = function(obj) {
      var self = this;
      return false;
    };

    def['$==='] = function(other) {
      var self = this;
      return self['$=='](other);
    };

    def['$<=>'] = function(other) {
      var self = this;
      
      if (self['$=='](other)) {
        return 0;
      }

      return nil;
    ;
    };

    def.$method = function(name) {
      var $a, self = this;
      
      var meth = self['$' + name];

      if (!meth || meth.rb_stub) {
        self.$raise((($a = $scope.NameError) == null ? $opal.cm('NameError') : $a), "undefined method `" + (name) + "' for class `" + (self.$class().$name()) + "'");
      }

      return (($a = $scope.Method) == null ? $opal.cm('Method') : $a).$new(self, meth, name);
    
    };

    def.$methods = function(all) {
      var self = this;
      if (all == null) {
        all = true
      }
      
      var methods = [];
      for(var k in self) {
        if(k[0] == "$" && typeof (self)[k] === "function") {
          if(all === false || all === nil) {
            if(!Object.hasOwnProperty.call(self, k)) {
              continue;
            }
          }
          methods.push(k.substr(1));
        }
      }
      return methods;
    ;
    };

    def.$Array = TMP_2 = function(object, args) {
      var $a, $b, $c, $d, self = this, $iter = TMP_2._p, block = $iter || nil;
      args = $slice.call(arguments, 1);
      TMP_2._p = null;
      
      if (object == null || object === nil) {
        return [];
      }
      else if (self['$native?'](object)) {
        return ($a = ($b = (($c = ((($d = $scope.Native) == null ? $opal.cm('Native') : $d))._scope).Array == null ? $c.cm('Array') : $c.Array)).$new, $a._p = block.$to_proc(), $a).apply($b, [object].concat(args)).$to_a();
      }
      else if (object['$respond_to?']("to_ary")) {
        return object.$to_ary();
      }
      else if (object['$respond_to?']("to_a")) {
        return object.$to_a();
      }
      else {
        return [object];
      }
    ;
    };

    def.$caller = function() {
      var self = this;
      return [];
    };

    def.$class = function() {
      var self = this;
      return self._klass;
    };

    def.$define_singleton_method = TMP_3 = function(name) {
      var self = this, $iter = TMP_3._p, body = $iter || nil;
      TMP_3._p = null;
      
      if (body === nil) {
        throw new Error("no block given");
      }

      var jsid   = '$' + name;
      body._jsid = name;
      body._s    = null;
      body._def  = body;

      self.$singleton_class()._proto[jsid] = body;

      return self;
    
    };

    def.$dup = function() {
      var self = this, copy = nil;
      copy = self.$class().$allocate();
      
      for (var name in self) {
        if (name.charAt(0) !== '$') {
          if (name !== '_id' && name !== '_klass') {
            copy[name] = self[name];
          }
        }
      }
    
      copy.$initialize_copy(self);
      return copy;
    };

    def.$enum_for = function(method, args) {
      var $a, $b, self = this;
      args = $slice.call(arguments, 1);
      if (method == null) {
        method = "each"
      }
      return ($a = (($b = $scope.Enumerator) == null ? $opal.cm('Enumerator') : $b)).$new.apply($a, [self, method].concat(args));
    };

    def['$equal?'] = function(other) {
      var self = this;
      return self === other;
    };

    def.$extend = function(mods) {
      var self = this;
      mods = $slice.call(arguments, 0);
      
      for (var i = 0, length = mods.length; i < length; i++) {
        self.$singleton_class().$include(mods[i]);
      }

      return self;
    
    };

    def.$format = function(format, args) {
      var self = this;
      args = $slice.call(arguments, 1);
      
      var idx = 0;
      return format.replace(/%(\d+\$)?([-+ 0]*)(\d*|\*(\d+\$)?)(?:\.(\d*|\*(\d+\$)?))?([cspdiubBoxXfgeEG])|(%%)/g, function(str, idx_str, flags, width_str, w_idx_str, prec_str, p_idx_str, spec, escaped) {
        if (escaped) {
          return '%';
        }

        var width,
        prec,
        is_integer_spec = ("diubBoxX".indexOf(spec) != -1),
        is_float_spec = ("eEfgG".indexOf(spec) != -1),
        prefix = '',
        obj;

        if (width_str === undefined) {
          width = undefined;
        } else if (width_str.charAt(0) == '*') {
          var w_idx = idx++;
          if (w_idx_str) {
            w_idx = parseInt(w_idx_str, 10) - 1;
          }
          width = (args[w_idx]).$to_i();
        } else {
          width = parseInt(width_str, 10);
        }
        if (!prec_str) {
          prec = is_float_spec ? 6 : undefined;
        } else if (prec_str.charAt(0) == '*') {
          var p_idx = idx++;
          if (p_idx_str) {
            p_idx = parseInt(p_idx_str, 10) - 1;
          }
          prec = (args[p_idx]).$to_i();
        } else {
          prec = parseInt(prec_str, 10);
        }
        if (idx_str) {
          idx = parseInt(idx_str, 10) - 1;
        }
        switch (spec) {
        case 'c':
          obj = args[idx];
          if (obj._isString) {
            str = obj.charAt(0);
          } else {
            str = String.fromCharCode((obj).$to_i());
          }
          break;
        case 's':
          str = (args[idx]).$to_s();
          if (prec !== undefined) {
            str = str.substr(0, prec);
          }
          break;
        case 'p':
          str = (args[idx]).$inspect();
          if (prec !== undefined) {
            str = str.substr(0, prec);
          }
          break;
        case 'd':
        case 'i':
        case 'u':
          str = (args[idx]).$to_i().toString();
          break;
        case 'b':
        case 'B':
          str = (args[idx]).$to_i().toString(2);
          break;
        case 'o':
          str = (args[idx]).$to_i().toString(8);
          break;
        case 'x':
        case 'X':
          str = (args[idx]).$to_i().toString(16);
          break;
        case 'e':
        case 'E':
          str = (args[idx]).$to_f().toExponential(prec);
          break;
        case 'f':
          str = (args[idx]).$to_f().toFixed(prec);
          break;
        case 'g':
        case 'G':
          str = (args[idx]).$to_f().toPrecision(prec);
          break;
        }
        idx++;
        if (is_integer_spec || is_float_spec) {
          if (str.charAt(0) == '-') {
            prefix = '-';
            str = str.substr(1);
          } else {
            if (flags.indexOf('+') != -1) {
              prefix = '+';
            } else if (flags.indexOf(' ') != -1) {
              prefix = ' ';
            }
          }
        }
        if (is_integer_spec && prec !== undefined) {
          if (str.length < prec) {
            str = "0"['$*'](prec - str.length) + str;
          }
        }
        var total_len = prefix.length + str.length;
        if (width !== undefined && total_len < width) {
          if (flags.indexOf('-') != -1) {
            str = str + " "['$*'](width - total_len);
          } else {
            var pad_char = ' ';
            if (flags.indexOf('0') != -1) {
              str = "0"['$*'](width - total_len) + str;
            } else {
              prefix = " "['$*'](width - total_len) + prefix;
            }
          }
        }
        var result = prefix + str;
        if ('XEG'.indexOf(spec) != -1) {
          result = result.toUpperCase();
        }
        return result;
      });
    
    };

    def.$hash = function() {
      var self = this;
      return self._id;
    };

    def.$initialize_copy = function(other) {
      var self = this;
      return nil;
    };

    def.$inspect = function() {
      var self = this;
      return self.$to_s();
    };

    def['$instance_of?'] = function(klass) {
      var self = this;
      return self._klass === klass;
    };

    def['$instance_variable_defined?'] = function(name) {
      var self = this;
      return self.hasOwnProperty(name.substr(1));
    };

    def.$instance_variable_get = function(name) {
      var self = this;
      
      var ivar = self[name.substr(1)];

      return ivar == null ? nil : ivar;
    
    };

    def.$instance_variable_set = function(name, value) {
      var self = this;
      return self[name.substr(1)] = value;
    };

    def.$instance_variables = function() {
      var self = this;
      
      var result = [];

      for (var name in self) {
        if (name.charAt(0) !== '$') {
          if (name !== '_klass' && name !== '_id') {
            result.push('@' + name);
          }
        }
      }

      return result;
    
    };

    def.$Integer = function(value, base) {
      var $a, $b, self = this, $case = nil;
      if (base == null) {
        base = nil
      }
      if (($a = (($b = $scope.String) == null ? $opal.cm('String') : $b)['$==='](value)) !== false && $a !== nil) {
        if (($a = value['$empty?']()) !== false && $a !== nil) {
          self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "invalid value for Integer: (empty string)")};
        return parseInt(value, ((($a = base) !== false && $a !== nil) ? $a : undefined));};
      if (base !== false && base !== nil) {
        self.$raise(self.$ArgumentError("base is only valid for String values"))};
      return (function() {$case = value;if ((($a = $scope.Integer) == null ? $opal.cm('Integer') : $a)['$===']($case)) {return value}else if ((($a = $scope.Float) == null ? $opal.cm('Float') : $a)['$===']($case)) {if (($a = ((($b = value['$nan?']()) !== false && $b !== nil) ? $b : value['$infinite?']())) !== false && $a !== nil) {
        self.$raise((($a = $scope.FloatDomainError) == null ? $opal.cm('FloatDomainError') : $a), "unable to coerce " + (value) + " to Integer")};
      return value.$to_int();}else if ((($a = $scope.NilClass) == null ? $opal.cm('NilClass') : $a)['$===']($case)) {return self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "can't convert nil into Integer")}else {if (($a = value['$respond_to?']("to_int")) !== false && $a !== nil) {
        return value.$to_int()
      } else if (($a = value['$respond_to?']("to_i")) !== false && $a !== nil) {
        return value.$to_i()
        } else {
        return self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "can't convert " + (value.$class()) + " into Integer")
      }}})();
    };

    def.$Float = function(value) {
      var $a, $b, self = this;
      if (($a = (($b = $scope.String) == null ? $opal.cm('String') : $b)['$==='](value)) !== false && $a !== nil) {
        return parseFloat(value);
      } else if (($a = value['$respond_to?']("to_f")) !== false && $a !== nil) {
        return value.$to_f()
        } else {
        return self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "can't convert " + (value.$class()) + " into Float")
      };
    };

    def['$is_a?'] = function(klass) {
      var self = this;
      return $opal.is_a(self, klass);
    };

    $opal.defn(self, '$kind_of?', def['$is_a?']);

    def.$lambda = TMP_4 = function() {
      var self = this, $iter = TMP_4._p, block = $iter || nil;
      TMP_4._p = null;
      block.is_lambda = true;
      return block;
    };

    def.$loop = TMP_5 = function() {
      var self = this, $iter = TMP_5._p, block = $iter || nil;
      TMP_5._p = null;
      while (true) {;
      if ($opal.$yieldX(block, []) === $breaker) return $breaker.$v;
      };
      return self;
    };

    def['$nil?'] = function() {
      var self = this;
      return false;
    };

    def.$object_id = function() {
      var self = this;
      return self._id || (self._id = Opal.uid());
    };

    def.$printf = function(args) {
      var $a, self = this, fmt = nil;
      args = $slice.call(arguments, 0);
      if (args.$length()['$>'](0)) {
        fmt = args.$shift();
        self.$print(($a = self).$format.apply($a, [fmt].concat(args)));};
      return nil;
    };

    def.$private_methods = function() {
      var self = this;
      return [];
    };

    def.$proc = TMP_6 = function() {
      var $a, self = this, $iter = TMP_6._p, block = $iter || nil;
      TMP_6._p = null;
      
      if (block === nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "no block given");
      }
      block.is_lambda = false;
      return block;
    ;
    };

    def.$puts = function(strs) {
      var $a, self = this;
      strs = $slice.call(arguments, 0);
      return ($a = $gvars["stdout"]).$puts.apply($a, [].concat(strs));
    };

    def.$p = function(args) {
      var TMP_7, $a, $b, self = this;
      args = $slice.call(arguments, 0);
      ($a = ($b = args).$each, $a._p = (TMP_7 = function(obj) {var self = TMP_7._s || this;if (obj == null) obj = nil;
        return $gvars["stdout"].$puts(obj.$inspect())}, TMP_7._s = self, TMP_7), $a).call($b);
      if (args.$length()['$<='](1)) {
        return args['$[]'](0)
        } else {
        return args
      };
    };

    $opal.defn(self, '$print', def.$puts);

    def.$warn = function(strs) {
      var $a, $b, self = this;
      strs = $slice.call(arguments, 0);
      if (($a = ((($b = $gvars["VERBOSE"]['$nil?']()) !== false && $b !== nil) ? $b : strs['$empty?']())) === false || $a === nil) {
        ($a = $gvars["stderr"]).$puts.apply($a, [].concat(strs))};
      return nil;
    };

    def.$raise = function(exception, string) {
      var $a, self = this;
      
      if (exception == null && $gvars["!"]) {
        exception = $gvars["!"];
      }
      else if (typeof(exception) === 'string') {
        exception = (($a = $scope.RuntimeError) == null ? $opal.cm('RuntimeError') : $a).$new(exception);
      }
      else if (!exception['$is_a?']((($a = $scope.Exception) == null ? $opal.cm('Exception') : $a))) {
        exception = exception.$new(string);
      }

      throw exception;
    ;
    };

    $opal.defn(self, '$fail', def.$raise);

    def.$rand = function(max) {
      var self = this;
      
      if(!max) {
        return Math.random();
      } else {
        if (max._isRange) {
          var arr = max.$to_a();
          return arr[self.$rand(arr.length)];
        } else {
          return Math.floor(Math.random() * Math.abs(parseInt(max)));
        }
      }
    
    };

    $opal.defn(self, '$srand', def.$rand);

    def['$respond_to?'] = function(name, include_all) {
      var self = this;
      if (include_all == null) {
        include_all = false
      }
      
      var body = self['$' + name];
      return (!!body) && !body.rb_stub;
    
    };

    $opal.defn(self, '$send', def.$__send__);

    $opal.defn(self, '$public_send', def.$__send__);

    def.$singleton_class = function() {
      var self = this;
      
      if (self._isClass) {
        if (self.__meta__) {
          return self.__meta__;
        }

        var meta = new $opal.Class._alloc;
        meta._klass = $opal.Class;
        self.__meta__ = meta;
        // FIXME - is this right? (probably - methods defined on
        // class' singleton should also go to subclasses?)
        meta._proto = self.constructor.prototype;
        meta._isSingleton = true;
        meta.__inc__ = [];
        meta._methods = [];

        meta._scope = self._scope;

        return meta;
      }

      if (self._isClass) {
        return self._klass;
      }

      if (self.__meta__) {
        return self.__meta__;
      }

      else {
        var orig_class = self._klass,
            class_id   = "#<Class:#<" + orig_class._name + ":" + orig_class._id + ">>";

        var Singleton = function () {};
        var meta = Opal.boot(orig_class, Singleton);
        meta._name = class_id;

        meta._proto = self;
        self.__meta__ = meta;
        meta._klass = orig_class._klass;
        meta._scope = orig_class._scope;
        meta.__parent = orig_class;

        return meta;
      }
    
    };

    $opal.defn(self, '$sprintf', def.$format);

    def.$String = function(str) {
      var self = this;
      return String(str);
    };

    def.$tap = TMP_8 = function() {
      var self = this, $iter = TMP_8._p, block = $iter || nil;
      TMP_8._p = null;
      if ($opal.$yield1(block, self) === $breaker) return $breaker.$v;
      return self;
    };

    def.$to_proc = function() {
      var self = this;
      return self;
    };

    def.$to_s = function() {
      var self = this;
      return "#<" + self._klass._name + ":" + self._id + ">";
    };

    def.$freeze = function() {
      var self = this;
      self.___frozen___ = true;
      return self;
    };

    def['$frozen?'] = function() {
      var $a, self = this;
      if (self.___frozen___ == null) self.___frozen___ = nil;

      return ((($a = self.___frozen___) !== false && $a !== nil) ? $a : false);
    };

    def['$respond_to_missing?'] = function(method_name) {
      var self = this;
      return false;
    };
        ;$opal.donate(self, ["$method_missing", "$=~", "$===", "$<=>", "$method", "$methods", "$Array", "$caller", "$class", "$define_singleton_method", "$dup", "$enum_for", "$equal?", "$extend", "$format", "$hash", "$initialize_copy", "$inspect", "$instance_of?", "$instance_variable_defined?", "$instance_variable_get", "$instance_variable_set", "$instance_variables", "$Integer", "$Float", "$is_a?", "$kind_of?", "$lambda", "$loop", "$nil?", "$object_id", "$printf", "$private_methods", "$proc", "$puts", "$p", "$print", "$warn", "$raise", "$fail", "$rand", "$srand", "$respond_to?", "$send", "$public_send", "$singleton_class", "$sprintf", "$String", "$tap", "$to_proc", "$to_s", "$freeze", "$frozen?", "$respond_to_missing?"]);
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass;
  $opal.add_stubs(['$raise']);
  (function($base, $super) {
    function NilClass(){};
    var self = NilClass = $klass($base, $super, 'NilClass', NilClass);

    var def = NilClass._proto, $scope = NilClass._scope;
    def['$&'] = function(other) {
      var self = this;
      return false;
    };

    def['$|'] = function(other) {
      var self = this;
      return other !== false && other !== nil;
    };

    def['$^'] = function(other) {
      var self = this;
      return other !== false && other !== nil;
    };

    def['$=='] = function(other) {
      var self = this;
      return other === nil;
    };

    def.$dup = function() {
      var $a, self = this;
      return self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a));
    };

    def.$inspect = function() {
      var self = this;
      return "nil";
    };

    def['$nil?'] = function() {
      var self = this;
      return true;
    };

    def.$singleton_class = function() {
      var $a, self = this;
      return (($a = $scope.NilClass) == null ? $opal.cm('NilClass') : $a);
    };

    def.$to_a = function() {
      var self = this;
      return [];
    };

    def.$to_h = function() {
      var self = this;
      return $opal.hash();
    };

    def.$to_i = function() {
      var self = this;
      return 0;
    };

    $opal.defn(self, '$to_f', def.$to_i);

    def.$to_n = function() {
      var self = this;
      return null;
    };

    def.$to_s = function() {
      var self = this;
      return "";
    };

    def.$object_id = function() {
      var $a, self = this;
      return (($a = $scope.NilClass) == null ? $opal.cm('NilClass') : $a)._id || ((($a = $scope.NilClass) == null ? $opal.cm('NilClass') : $a)._id = $opal.uid());
    };

    return $opal.defn(self, '$hash', def.$object_id);
  })(self, null);
  return $opal.cdecl($scope, 'NIL', nil);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var $a, self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass;
  $opal.add_stubs(['$undef_method']);
  (function($base, $super) {
    function Boolean(){};
    var self = Boolean = $klass($base, $super, 'Boolean', Boolean);

    var def = Boolean._proto, $scope = Boolean._scope;
    def._isBoolean = true;

    (function(self) {
      var $scope = self._scope, def = self._proto;
      return self.$undef_method("new")
    })(self.$singleton_class());

    def['$&'] = function(other) {
      var self = this;
      return (self == true) ? (other !== false && other !== nil) : false;
    };

    def['$|'] = function(other) {
      var self = this;
      return (self == true) ? true : (other !== false && other !== nil);
    };

    def['$^'] = function(other) {
      var self = this;
      return (self == true) ? (other === false || other === nil) : (other !== false && other !== nil);
    };

    def['$=='] = function(other) {
      var self = this;
      return (self == true) === other.valueOf();
    };

    $opal.defn(self, '$equal?', def['$==']);

    $opal.defn(self, '$singleton_class', def.$class);

    def.$to_s = function() {
      var self = this;
      return (self == true) ? 'true' : 'false';
    };

    return (def.$to_n = function() {
      var self = this;
      return self.valueOf();
    }, nil);
  })(self, null);
  $opal.cdecl($scope, 'TrueClass', (($a = $scope.Boolean) == null ? $opal.cm('Boolean') : $a));
  $opal.cdecl($scope, 'FalseClass', (($a = $scope.Boolean) == null ? $opal.cm('Boolean') : $a));
  $opal.cdecl($scope, 'TRUE', true);
  return $opal.cdecl($scope, 'FALSE', false);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var $a, self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass, $module = $opal.module;
  $opal.add_stubs(['$attr_reader', '$name', '$class']);
  (function($base, $super) {
    function Exception(){};
    var self = Exception = $klass($base, $super, 'Exception', Exception);

    var def = Exception._proto, $scope = Exception._scope;
    def.message = nil;
    self.$attr_reader("message");

    $opal.defs(self, '$new', function(message) {
      var self = this;
      if (message == null) {
        message = ""
      }
      
      var err = new Error(message);
      err._klass = self;
      err.name = self._name;
      return err;
    
    });

    def.$backtrace = function() {
      var self = this;
      
      var backtrace = self.stack;

      if (typeof(backtrace) === 'string') {
        return backtrace.split("\n").slice(0, 15);
      }
      else if (backtrace) {
        return backtrace.slice(0, 15);
      }

      return [];
    
    };

    def.$inspect = function() {
      var self = this;
      return "#<" + (self.$class().$name()) + ": '" + (self.message) + "'>";
    };

    return $opal.defn(self, '$to_s', def.$message);
  })(self, null);
  (function($base, $super) {
    function StandardError(){};
    var self = StandardError = $klass($base, $super, 'StandardError', StandardError);

    var def = StandardError._proto, $scope = StandardError._scope;
    return nil
  })(self, (($a = $scope.Exception) == null ? $opal.cm('Exception') : $a));
  (function($base, $super) {
    function SystemCallError(){};
    var self = SystemCallError = $klass($base, $super, 'SystemCallError', SystemCallError);

    var def = SystemCallError._proto, $scope = SystemCallError._scope;
    return nil
  })(self, (($a = $scope.StandardError) == null ? $opal.cm('StandardError') : $a));
  (function($base, $super) {
    function NameError(){};
    var self = NameError = $klass($base, $super, 'NameError', NameError);

    var def = NameError._proto, $scope = NameError._scope;
    return nil
  })(self, (($a = $scope.StandardError) == null ? $opal.cm('StandardError') : $a));
  (function($base, $super) {
    function NoMethodError(){};
    var self = NoMethodError = $klass($base, $super, 'NoMethodError', NoMethodError);

    var def = NoMethodError._proto, $scope = NoMethodError._scope;
    return nil
  })(self, (($a = $scope.NameError) == null ? $opal.cm('NameError') : $a));
  (function($base, $super) {
    function RuntimeError(){};
    var self = RuntimeError = $klass($base, $super, 'RuntimeError', RuntimeError);

    var def = RuntimeError._proto, $scope = RuntimeError._scope;
    return nil
  })(self, (($a = $scope.StandardError) == null ? $opal.cm('StandardError') : $a));
  (function($base, $super) {
    function LocalJumpError(){};
    var self = LocalJumpError = $klass($base, $super, 'LocalJumpError', LocalJumpError);

    var def = LocalJumpError._proto, $scope = LocalJumpError._scope;
    return nil
  })(self, (($a = $scope.StandardError) == null ? $opal.cm('StandardError') : $a));
  (function($base, $super) {
    function TypeError(){};
    var self = TypeError = $klass($base, $super, 'TypeError', TypeError);

    var def = TypeError._proto, $scope = TypeError._scope;
    return nil
  })(self, (($a = $scope.StandardError) == null ? $opal.cm('StandardError') : $a));
  (function($base, $super) {
    function ArgumentError(){};
    var self = ArgumentError = $klass($base, $super, 'ArgumentError', ArgumentError);

    var def = ArgumentError._proto, $scope = ArgumentError._scope;
    return nil
  })(self, (($a = $scope.StandardError) == null ? $opal.cm('StandardError') : $a));
  (function($base, $super) {
    function IndexError(){};
    var self = IndexError = $klass($base, $super, 'IndexError', IndexError);

    var def = IndexError._proto, $scope = IndexError._scope;
    return nil
  })(self, (($a = $scope.StandardError) == null ? $opal.cm('StandardError') : $a));
  (function($base, $super) {
    function StopIteration(){};
    var self = StopIteration = $klass($base, $super, 'StopIteration', StopIteration);

    var def = StopIteration._proto, $scope = StopIteration._scope;
    return nil
  })(self, (($a = $scope.IndexError) == null ? $opal.cm('IndexError') : $a));
  (function($base, $super) {
    function KeyError(){};
    var self = KeyError = $klass($base, $super, 'KeyError', KeyError);

    var def = KeyError._proto, $scope = KeyError._scope;
    return nil
  })(self, (($a = $scope.IndexError) == null ? $opal.cm('IndexError') : $a));
  (function($base, $super) {
    function RangeError(){};
    var self = RangeError = $klass($base, $super, 'RangeError', RangeError);

    var def = RangeError._proto, $scope = RangeError._scope;
    return nil
  })(self, (($a = $scope.StandardError) == null ? $opal.cm('StandardError') : $a));
  (function($base, $super) {
    function FloatDomainError(){};
    var self = FloatDomainError = $klass($base, $super, 'FloatDomainError', FloatDomainError);

    var def = FloatDomainError._proto, $scope = FloatDomainError._scope;
    return nil
  })(self, (($a = $scope.RangeError) == null ? $opal.cm('RangeError') : $a));
  (function($base, $super) {
    function IOError(){};
    var self = IOError = $klass($base, $super, 'IOError', IOError);

    var def = IOError._proto, $scope = IOError._scope;
    return nil
  })(self, (($a = $scope.StandardError) == null ? $opal.cm('StandardError') : $a));
  (function($base, $super) {
    function ScriptError(){};
    var self = ScriptError = $klass($base, $super, 'ScriptError', ScriptError);

    var def = ScriptError._proto, $scope = ScriptError._scope;
    return nil
  })(self, (($a = $scope.Exception) == null ? $opal.cm('Exception') : $a));
  (function($base, $super) {
    function SyntaxError(){};
    var self = SyntaxError = $klass($base, $super, 'SyntaxError', SyntaxError);

    var def = SyntaxError._proto, $scope = SyntaxError._scope;
    return nil
  })(self, (($a = $scope.ScriptError) == null ? $opal.cm('ScriptError') : $a));
  (function($base, $super) {
    function NotImplementedError(){};
    var self = NotImplementedError = $klass($base, $super, 'NotImplementedError', NotImplementedError);

    var def = NotImplementedError._proto, $scope = NotImplementedError._scope;
    return nil
  })(self, (($a = $scope.ScriptError) == null ? $opal.cm('ScriptError') : $a));
  (function($base, $super) {
    function SystemExit(){};
    var self = SystemExit = $klass($base, $super, 'SystemExit', SystemExit);

    var def = SystemExit._proto, $scope = SystemExit._scope;
    return nil
  })(self, (($a = $scope.Exception) == null ? $opal.cm('Exception') : $a));
  return (function($base) {
    var self = $module($base, 'Errno');

    var def = self._proto, $scope = self._scope, $a;
    (function($base, $super) {
      function EINVAL(){};
      var self = EINVAL = $klass($base, $super, 'EINVAL', EINVAL);

      var def = EINVAL._proto, $scope = EINVAL._scope, TMP_1;
      return ($opal.defs(self, '$new', TMP_1 = function() {
        var self = this, $iter = TMP_1._p, $yield = $iter || nil;
        TMP_1._p = null;
        return $opal.find_super_dispatcher(self, 'new', TMP_1, null, EINVAL).apply(self, ["Invalid argument"]);
      }), nil)
    })(self, (($a = $scope.SystemCallError) == null ? $opal.cm('SystemCallError') : $a))
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$respond_to?', '$to_str', '$raise', '$class', '$new']);
  return (function($base, $super) {
    function Regexp(){};
    var self = Regexp = $klass($base, $super, 'Regexp', Regexp);

    var def = Regexp._proto, $scope = Regexp._scope;
    def._isRegexp = true;

    $opal.defs(self, '$escape', function(string) {
      var self = this;
      return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\^\$\|]/g, '\\$&');
    });

    $opal.defs(self, '$union', function(parts) {
      var self = this;
      parts = $slice.call(arguments, 0);
      return new RegExp(parts.join(''));
    });

    $opal.defs(self, '$new', function(regexp, options) {
      var self = this;
      return new RegExp(regexp, options);
    });

    def['$=='] = function(other) {
      var self = this;
      return other.constructor == RegExp && self.toString() === other.toString();
    };

    def['$==='] = function(str) {
      var $a, $b, self = this;
      if (($a = ($b = str._isString == null, $b !== false && $b !== nil ?str['$respond_to?']("to_str") : $b)) !== false && $a !== nil) {
        str = str.$to_str()};
      if (($a = str._isString == null) !== false && $a !== nil) {
        return false};
      return self.test(str);
    };

    def['$=~'] = function(string) {
      var $a, self = this;
      if (($a = string === nil) !== false && $a !== nil) {
        $gvars["~"] = $gvars["`"] = $gvars["'"] = nil;
        return nil;};
      if (($a = string._isString == null) !== false && $a !== nil) {
        if (($a = string['$respond_to?']("to_str")) === false || $a === nil) {
          self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "no implicit conversion of " + (string.$class()) + " into String")};
        string = string.$to_str();};
      
      var re = self;

      if (re.global) {
        // should we clear it afterwards too?
        re.lastIndex = 0;
      }
      else {
        // rewrite regular expression to add the global flag to capture pre/post match
        re = new RegExp(re.source, 'g' + (re.multiline ? 'm' : '') + (re.ignoreCase ? 'i' : ''));
      }

      var result = re.exec(string);

      if (result) {
        $gvars["~"] = (($a = $scope.MatchData) == null ? $opal.cm('MatchData') : $a).$new(re, result);
      }
      else {
        $gvars["~"] = $gvars["`"] = $gvars["'"] = nil;
      }

      return result ? result.index : nil;
    
    };

    $opal.defn(self, '$eql?', def['$==']);

    def.$inspect = function() {
      var self = this;
      return self.toString();
    };

    def.$match = function(string, pos) {
      var $a, self = this;
      if (($a = string === nil) !== false && $a !== nil) {
        $gvars["~"] = $gvars["`"] = $gvars["'"] = nil;
        return nil;};
      if (($a = string._isString == null) !== false && $a !== nil) {
        if (($a = string['$respond_to?']("to_str")) === false || $a === nil) {
          self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "no implicit conversion of " + (string.$class()) + " into String")};
        string = string.$to_str();};
      
      var re = self;

      if (re.global) {
        // should we clear it afterwards too?
        re.lastIndex = 0;
      }
      else {
        re = new RegExp(re.source, 'g' + (re.multiline ? 'm' : '') + (re.ignoreCase ? 'i' : ''));
      }

      var result = re.exec(string);

      if (result) {
        return $gvars["~"] = (($a = $scope.MatchData) == null ? $opal.cm('MatchData') : $a).$new(re, result);
      }
      else {
        return $gvars["~"] = $gvars["`"] = $gvars["'"] = nil;
      }
    
    };

    def.$source = function() {
      var self = this;
      return self.source;
    };

    $opal.defn(self, '$to_s', def.$source);

    return (def.$to_n = function() {
      var self = this;
      return self.valueOf();
    }, nil);
  })(self, null)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module;
  $opal.add_stubs(['$===', '$>', '$<', '$equal?', '$<=>', '$==', '$normalize', '$raise', '$class', '$>=', '$<=']);
  return (function($base) {
    var self = $module($base, 'Comparable');

    var def = self._proto, $scope = self._scope;
    $opal.defs(self, '$normalize', function(what) {
      var $a, $b, self = this;
      if (($a = (($b = $scope.Integer) == null ? $opal.cm('Integer') : $b)['$==='](what)) !== false && $a !== nil) {
        return what};
      if (what['$>'](0)) {
        return 1};
      if (what['$<'](0)) {
        return -1};
      return 0;
    });

    def['$=='] = function(other) {
      var $a, self = this, cmp = nil;
      try {
      if (($a = self['$equal?'](other)) !== false && $a !== nil) {
          return true};
        if (($a = cmp = (self['$<=>'](other))) === false || $a === nil) {
          return false};
        return (($a = $scope.Comparable) == null ? $opal.cm('Comparable') : $a).$normalize(cmp)['$=='](0);
      } catch ($err) {if ((($a = $scope.StandardError) == null ? $opal.cm('StandardError') : $a)['$===']($err)) {
        return false
        }else { throw $err; }
      };
    };

    def['$>'] = function(other) {
      var $a, self = this, cmp = nil;
      if (($a = cmp = (self['$<=>'](other))) === false || $a === nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "comparison of " + (self.$class()) + " with " + (other.$class()) + " failed")};
      return (($a = $scope.Comparable) == null ? $opal.cm('Comparable') : $a).$normalize(cmp)['$>'](0);
    };

    def['$>='] = function(other) {
      var $a, self = this, cmp = nil;
      if (($a = cmp = (self['$<=>'](other))) === false || $a === nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "comparison of " + (self.$class()) + " with " + (other.$class()) + " failed")};
      return (($a = $scope.Comparable) == null ? $opal.cm('Comparable') : $a).$normalize(cmp)['$>='](0);
    };

    def['$<'] = function(other) {
      var $a, self = this, cmp = nil;
      if (($a = cmp = (self['$<=>'](other))) === false || $a === nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "comparison of " + (self.$class()) + " with " + (other.$class()) + " failed")};
      return (($a = $scope.Comparable) == null ? $opal.cm('Comparable') : $a).$normalize(cmp)['$<'](0);
    };

    def['$<='] = function(other) {
      var $a, self = this, cmp = nil;
      if (($a = cmp = (self['$<=>'](other))) === false || $a === nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "comparison of " + (self.$class()) + " with " + (other.$class()) + " failed")};
      return (($a = $scope.Comparable) == null ? $opal.cm('Comparable') : $a).$normalize(cmp)['$<='](0);
    };

    def['$between?'] = function(min, max) {
      var self = this;
      if (self['$<'](min)) {
        return false};
      if (self['$>'](max)) {
        return false};
      return true;
    };
        ;$opal.donate(self, ["$==", "$>", "$>=", "$<", "$<=", "$between?"]);
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module;
  $opal.add_stubs(['$falsy?', '$truthy?', '$enum_for', '$==', '$destructure', '$coerce_to', '$raise', '$===', '$new', '$[]=', '$<<', '$[]', '$any?', '$inspect', '$__send__', '$<=>', '$dup', '$map', '$sort', '$call', '$first']);
  return (function($base) {
    var self = $module($base, 'Enumerable');

    var def = self._proto, $scope = self._scope, TMP_1, TMP_2, TMP_3, TMP_4, TMP_5, TMP_6, TMP_7, TMP_8, TMP_9, TMP_10, TMP_11, TMP_12, TMP_13, TMP_16, TMP_17, TMP_18, TMP_19, TMP_20, TMP_21, TMP_22, TMP_23, TMP_25, TMP_29;
    def['$all?'] = TMP_1 = function() {
      var $a, self = this, $iter = TMP_1._p, block = $iter || nil;
      TMP_1._p = null;
      
      var result = true;

      if (block !== nil) {
        self.$each._p = function() {
          var value = $opal.$yieldX(block, arguments);

          if (value === $breaker) {
            result = $breaker.$v;
            return $breaker;
          }

          if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$falsy?'](value)) {
            result = false;
            return $breaker;
          }
        }
      }
      else {
        self.$each._p = function(obj) {
          if (arguments.length == 1 && (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$falsy?'](obj)) {
            result = false;
            return $breaker;
          }
        }
      }

      self.$each();

      return result;
    
    };

    def['$any?'] = TMP_2 = function() {
      var $a, self = this, $iter = TMP_2._p, block = $iter || nil;
      TMP_2._p = null;
      
      var result = false;

      if (block !== nil) {
        self.$each._p = function() {
          var value = $opal.$yieldX(block, arguments);

          if (value === $breaker) {
            result = $breaker.$v;
            return $breaker;
          }

          if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$truthy?'](value)) {
            result = true;
            return $breaker;
          }
        };
      }
      else {
        self.$each._p = function(obj) {
          if (arguments.length != 1 || (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$truthy?'](obj)) {
            result = true;
            return $breaker;
          }
        }
      }

      self.$each();

      return result;
    
    };

    def.$collect = TMP_3 = function() {
      var self = this, $iter = TMP_3._p, block = $iter || nil;
      TMP_3._p = null;
      if (block === nil) {
        return self.$enum_for("collect")};
      
      var result = [];

      self.$each._p = function() {
        var value = $opal.$yieldX(block, arguments);

        if (value === $breaker) {
          result = $breaker.$v;
          return $breaker;
        }

        result.push(value);
      };

      self.$each();

      return result;
    
    };

    def.$count = TMP_4 = function(object) {
      var $a, self = this, $iter = TMP_4._p, block = $iter || nil;
      TMP_4._p = null;
      
      var result = 0;

      if (object != null) {
        block = function() {
          return (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments)['$=='](object);
        };
      }
      else if (block === nil) {
        block = function() { return true; };
      }

      self.$each._p = function() {
        var value = $opal.$yieldX(block, arguments);

        if (value === $breaker) {
          result = $breaker.$v;
          return $breaker;
        }

        if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$truthy?'](value)) {
          result++;
        }
      }

      self.$each();

      return result;
    
    };

    def.$detect = TMP_5 = function(ifnone) {
      var $a, self = this, $iter = TMP_5._p, block = $iter || nil;
      TMP_5._p = null;
      if (block === nil) {
        return self.$enum_for("detect", ifnone)};
      
      var result = undefined;

      self.$each._p = function() {
        var params = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments),
            value  = $opal.$yield1(block, params);

        if (value === $breaker) {
          result = $breaker.$v;
          return $breaker;
        }

        if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$truthy?'](value)) {
          result = params;
          return $breaker;
        }
      };

      self.$each();

      if (result === undefined && ifnone !== undefined) {
        if (typeof(ifnone) === 'function') {
          result = ifnone();
        }
        else {
          result = ifnone;
        }
      }

      return result === undefined ? nil : result;
    
    };

    def.$drop = function(number) {
      var $a, self = this;
      number = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(number, (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int");
      if (($a = number < 0) !== false && $a !== nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "attempt to drop negative size")};
      
      var result  = [],
          current = 0;

      self.$each._p = function() {
        if (number < current) {
          result.push((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments));
        }

        current++;
      };

      self.$each()

      return result;
    
    };

    def.$drop_while = TMP_6 = function() {
      var $a, self = this, $iter = TMP_6._p, block = $iter || nil;
      TMP_6._p = null;
      if (block === nil) {
        return self.$enum_for("drop_while")};
      
      var result = [];

      self.$each._p = function() {
        var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments),
            value = $opal.$yield1(block, param);

        if (value === $breaker) {
          result = $breaker.$v;
          return $breaker;
        }

        if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$truthy?'](value)) {
          return;
        }

        result.push(param);
      };

      self.$each();

      return result;
    
    };

    def.$each_slice = TMP_7 = function(n) {
      var $a, self = this, $iter = TMP_7._p, block = $iter || nil;
      TMP_7._p = null;
      n = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(n, (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int");
      if (block === nil) {
        return self.$enum_for("each_slice", n)};
      
      var result,
          slice = []

      self.$each._p = function() {
        var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments);

        slice.push(param);

        if (slice.length === n) {
          if (block(slice) === $breaker) {
            result = $breaker.$v;
            return $breaker;
          }

          slice = [];
        }
      };

      self.$each();

      if (result !== undefined) {
        return result;
      }

      // our "last" group, if smaller than n then won't have been yielded
      if (slice.length > 0) {
        if (block(slice) === $breaker) {
          return $breaker.$v;
        }
      }
    ;
      return nil;
    };

    def.$each_with_index = TMP_8 = function() {
      var $a, self = this, $iter = TMP_8._p, block = $iter || nil;
      TMP_8._p = null;
      if (block === nil) {
        return self.$enum_for("each_with_index")};
      
      var result,
          index = 0;

      self.$each._p = function() {
        var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments),
            value = block(param, index);

        if (value === $breaker) {
          result = $breaker.$v;
          return $breaker;
        }

        index++;
      };

      self.$each();

      if (result !== undefined) {
        return result;
      }
    
      return nil;
    };

    def.$each_with_object = TMP_9 = function(object) {
      var $a, self = this, $iter = TMP_9._p, block = $iter || nil;
      TMP_9._p = null;
      if (block === nil) {
        return self.$enum_for("each_with_object", object)};
      
      var result;

      self.$each._p = function() {
        var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments),
            value = block(param, object);

        if (value === $breaker) {
          result = $breaker.$v;
          return $breaker;
        }
      };

      self.$each();

      if (result !== undefined) {
        return result;
      }
    
      return object;
    };

    def.$entries = function() {
      var $a, self = this;
      
      var result = [];

      self.$each._p = function() {
        result.push((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments));
      };

      self.$each();

      return result;
    
    };

    $opal.defn(self, '$find', def.$detect);

    def.$find_all = TMP_10 = function() {
      var $a, self = this, $iter = TMP_10._p, block = $iter || nil;
      TMP_10._p = null;
      if (block === nil) {
        return self.$enum_for("find_all")};
      
      var result = [];

      self.$each._p = function() {
        var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments),
            value = $opal.$yield1(block, param);

        if (value === $breaker) {
          result = $breaker.$v;
          return $breaker;
        }

        if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$truthy?'](value)) {
          result.push(param);
        }
      };

      self.$each();

      return result;
    
    };

    def.$find_index = TMP_11 = function(object) {
      var $a, self = this, $iter = TMP_11._p, block = $iter || nil;
      TMP_11._p = null;
      if (($a = object === undefined && block === nil) !== false && $a !== nil) {
        return self.$enum_for("find_index")};
      
      var result = nil,
          index  = 0;

      if (object != null) {
        self.$each._p = function() {
          var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments);

          if ((param)['$=='](object)) {
            result = index;
            return $breaker;
          }

          index += 1;
        };
      }
      else if (block !== nil) {
        self.$each._p = function() {
          var value = $opal.$yieldX(block, arguments);

          if (value === $breaker) {
            result = $breaker.$v;
            return $breaker;
          }

          if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$truthy?'](value)) {
            result = index;
            return $breaker;
          }

          index += 1;
        };
      }

      self.$each();

      return result;
    
    };

    def.$first = function(number) {
      var $a, self = this;
      
      if (number == null) {
        var result = nil;

        self.$each._p = function() {
          result = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments);
          return $breaker;
        };
      }
      else {
        var current = 0,
            result  = [],
            number  = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(number, (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int");

        self.$each._p = function() {
          if (number <= current) {
            return $breaker;
          }

          result.push((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments));

          current++;
        };
      }

      self.$each();

      return result;
    
    };

    def.$grep = TMP_12 = function(pattern) {
      var $a, self = this, $iter = TMP_12._p, block = $iter || nil;
      TMP_12._p = null;
      
      var result = [];

      if (block !== nil) {
        self.$each._p = function() {
          var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments),
              value = pattern['$==='](param);

          if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$truthy?'](value)) {
            value = $opal.$yield1(block, param);

            if (value === $breaker) {
              result = $breaker.$v;
              return $breaker;
            }

            result.push(value);
          }
        };
      }
      else {
        self.$each._p = function() {
          var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments),
              value = pattern['$==='](param);

          if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$truthy?'](value)) {
            result.push(param);
          }
        };
      }

      self.$each();

      return result;
    ;
    };

    def.$group_by = TMP_13 = function() {
      var TMP_14, $a, $b, $c, self = this, $iter = TMP_13._p, block = $iter || nil, hash = nil;
      TMP_13._p = null;
      if (block === nil) {
        return self.$enum_for("group_by")};
      hash = ($a = ($b = (($c = $scope.Hash) == null ? $opal.cm('Hash') : $c)).$new, $a._p = (TMP_14 = function(h, k) {var self = TMP_14._s || this;if (h == null) h = nil;if (k == null) k = nil;
        return h['$[]='](k, [])}, TMP_14._s = self, TMP_14), $a).call($b);
      
      var result;

      self.$each._p = function() {
        var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments),
            value = $opal.$yield1(block, param);

        if (value === $breaker) {
          result = $breaker.$v;
          return $breaker;
        }

        hash['$[]'](value)['$<<'](param);
      }

      self.$each();

      if (result !== undefined) {
        return result;
      }
    
      return hash;
    };

    def['$include?'] = function(obj) {
      var TMP_15, $a, $b, self = this;
      return ($a = ($b = self)['$any?'], $a._p = (TMP_15 = function(v) {var self = TMP_15._s || this;if (v == null) v = nil;
        return v['$=='](obj)}, TMP_15._s = self, TMP_15), $a).call($b);
    };

    def.$inject = TMP_16 = function(object, sym) {
      var $a, self = this, $iter = TMP_16._p, block = $iter || nil;
      TMP_16._p = null;
      
      var result = object;

      if (block !== nil) {
        self.$each._p = function() {
          var value = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments);

          if (result === undefined) {
            result = value;
            return;
          }

          value = $opal.$yieldX(block, [result, value]);

          if (value === $breaker) {
            result = $breaker.$v;
            return $breaker;
          }

          result = value;
        };
      }
      else {
        if (sym === undefined) {
          if (!(($a = $scope.Symbol) == null ? $opal.cm('Symbol') : $a)['$==='](object)) {
            self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "" + (object.$inspect()) + " is not a Symbol");
          }

          sym    = object;
          result = undefined;
        }

        self.$each._p = function() {
          var value = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments);

          if (result === undefined) {
            result = value;
            return;
          }

          result = (result).$__send__(sym, value);
        };
      }

      self.$each();

      return result;
    ;
    };

    $opal.defn(self, '$map', def.$collect);

    def.$max = TMP_17 = function() {
      var $a, self = this, $iter = TMP_17._p, block = $iter || nil;
      TMP_17._p = null;
      
      var result;

      if (block !== nil) {
        self.$each._p = function() {
          var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments);

          if (result === undefined) {
            result = param;
            return;
          }

          var value = block(param, result);

          if (value === $breaker) {
            result = $breaker.$v;
            return $breaker;
          }

          if (value > 0) {
            result = param;
          }
        };
      }
      else {
        self.$each._p = function() {
          var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments);

          if (result === undefined) {
            result = param;
            return;
          }

          if ((param)['$<=>'](result) > 0) {
            result = param;
          }
        };
      }

      self.$each();

      return result === undefined ? nil : result;
    
    };

    def.$max_by = TMP_18 = function() {
      var $a, self = this, $iter = TMP_18._p, block = $iter || nil;
      TMP_18._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("max_by")};
      
      var result,
          by;

      self.$each._p = function() {
        var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments),
            value = $opal.$yield1(block, param);

        if (result === undefined) {
          result = param;
          by     = value;
          return;
        }

        if (value === $breaker) {
          result = $breaker.$v;
          return $breaker;
        }

        if ((value)['$<=>'](by) > 0) {
          result = param
          by     = value;
        }
      };

      self.$each();

      return result === undefined ? nil : result;
    
    };

    $opal.defn(self, '$member?', def['$include?']);

    def.$min = TMP_19 = function() {
      var $a, self = this, $iter = TMP_19._p, block = $iter || nil;
      TMP_19._p = null;
      
      var result;

      if (block !== nil) {
        self.$each._p = function() {
          var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments);

          if (result === undefined) {
            result = param;
            return;
          }

          var value = block(param, result);

          if (value === $breaker) {
            result = $breaker.$v;
            return $breaker;
          }

          if (value < 0) {
            result = param;
          }
        };
      }
      else {
        self.$each._p = function() {
          var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments);

          if (result === undefined) {
            result = param;
            return;
          }

          if ((param)['$<=>'](result) < 0) {
            result = param;
          }
        };
      }

      self.$each();

      return result === undefined ? nil : result;
    
    };

    def.$min_by = TMP_20 = function() {
      var $a, self = this, $iter = TMP_20._p, block = $iter || nil;
      TMP_20._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("min_by")};
      
      var result,
          by;

      self.$each._p = function() {
        var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments),
            value = $opal.$yield1(block, param);

        if (result === undefined) {
          result = param;
          by     = value;
          return;
        }

        if (value === $breaker) {
          result = $breaker.$v;
          return $breaker;
        }

        if ((value)['$<=>'](by) < 0) {
          result = param
          by     = value;
        }
      };

      self.$each();

      return result === undefined ? nil : result;
    
    };

    def['$none?'] = TMP_21 = function() {
      var $a, self = this, $iter = TMP_21._p, block = $iter || nil;
      TMP_21._p = null;
      
      var result = true;

      if (block !== nil) {
        self.$each._p = function() {
          var value = $opal.$yieldX(block, arguments);

          if (value === $breaker) {
            result = $breaker.$v;
            return $breaker;
          }

          if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$truthy?'](value)) {
            result = false;
            return $breaker;
          }
        }
      }
      else {
        self.$each._p = function() {
          var value = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments);

          if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$truthy?'](value)) {
            result = false;
            return $breaker;
          }
        };
      }

      self.$each();

      return result;
    
    };

    def['$one?'] = TMP_22 = function() {
      var $a, self = this, $iter = TMP_22._p, block = $iter || nil;
      TMP_22._p = null;
      
      var result = false;

      if (block !== nil) {
        self.$each._p = function() {
          var value = $opal.$yieldX(block, arguments);

          if (value === $breaker) {
            result = $breaker.$v;
            return $breaker;
          }

          if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$truthy?'](value)) {
            if (result === true) {
              result = false;
              return $breaker;
            }

            result = true;
          }
        }
      }
      else {
        self.$each._p = function() {
          var value = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments);

          if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$truthy?'](value)) {
            if (result === true) {
              result = false;
              return $breaker;
            }

            result = true;
          }
        }
      }

      self.$each();

      return result;
    
    };

    def.$slice_before = TMP_23 = function(pattern) {
      var $a, TMP_24, $b, $c, self = this, $iter = TMP_23._p, block = $iter || nil;
      TMP_23._p = null;
      if (($a = pattern === undefined && block === nil || arguments.length > 1) !== false && $a !== nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "wrong number of arguments (" + (arguments.length) + " for 1)")};
      return ($a = ($b = (($c = $scope.Enumerator) == null ? $opal.cm('Enumerator') : $c)).$new, $a._p = (TMP_24 = function(e) {var self = TMP_24._s || this, $a;if (e == null) e = nil;
        
        var slice = [];

        if (block !== nil) {
          if (pattern === undefined) {
            self.$each._p = function() {
              var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments),
                  value = $opal.$yield1(block, param);

              if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$truthy?'](value) && slice.length > 0) {
                e['$<<'](slice);
                slice = [];
              }

              slice.push(param);
            };
          }
          else {
            self.$each._p = function() {
              var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments),
                  value = block(param, pattern.$dup());

              if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$truthy?'](value) && slice.length > 0) {
                e['$<<'](slice);
                slice = [];
              }

              slice.push(param);
            };
          }
        }
        else {
          self.$each._p = function() {
            var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments),
                value = pattern['$==='](param);

            if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$truthy?'](value) && slice.length > 0) {
              e['$<<'](slice);
              slice = [];
            }

            slice.push(param);
          };
        }

        self.$each();

        if (slice.length > 0) {
          e['$<<'](slice);
        }
      ;}, TMP_24._s = self, TMP_24), $a).call($b);
    };

    def.$sort_by = TMP_25 = function() {
      var TMP_26, $a, $b, TMP_27, $c, $d, TMP_28, $e, $f, self = this, $iter = TMP_25._p, block = $iter || nil;
      TMP_25._p = null;
      if (block === nil) {
        return self.$enum_for("sort_by")};
      return ($a = ($b = ($c = ($d = ($e = ($f = self).$map, $e._p = (TMP_28 = function() {var self = TMP_28._s || this, $a;
        arg = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments);
        return [block.$call(arg), arg];}, TMP_28._s = self, TMP_28), $e).call($f)).$sort, $c._p = (TMP_27 = function(a, b) {var self = TMP_27._s || this;if (a == null) a = nil;if (b == null) b = nil;
        return a['$[]'](0)['$<=>'](b['$[]'](0))}, TMP_27._s = self, TMP_27), $c).call($d)).$map, $a._p = (TMP_26 = function(arg) {var self = TMP_26._s || this;if (arg == null) arg = nil;
        return arg[1];}, TMP_26._s = self, TMP_26), $a).call($b);
    };

    $opal.defn(self, '$select', def.$find_all);

    $opal.defn(self, '$reduce', def.$inject);

    def.$take = function(num) {
      var self = this;
      return self.$first(num);
    };

    def.$take_while = TMP_29 = function() {
      var $a, self = this, $iter = TMP_29._p, block = $iter || nil;
      TMP_29._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("take_while")};
      
      var result = [];

      self.$each._p = function() {
        var param = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$destructure(arguments),
            value = $opal.$yield1(block, param);

        if (value === $breaker) {
          result = $breaker.$v;
          return $breaker;
        }

        if ((($a = $scope.Opal) == null ? $opal.cm('Opal') : $a)['$falsy?'](value)) {
          return $breaker;
        }

        result.push(param);
      };

      self.$each();

      return result;
    
    };

    $opal.defn(self, '$to_a', def.$entries);
        ;$opal.donate(self, ["$all?", "$any?", "$collect", "$count", "$detect", "$drop", "$drop_while", "$each_slice", "$each_with_index", "$each_with_object", "$entries", "$find", "$find_all", "$find_index", "$first", "$grep", "$group_by", "$include?", "$inject", "$map", "$max", "$max_by", "$member?", "$min", "$min_by", "$none?", "$one?", "$slice_before", "$sort_by", "$select", "$reduce", "$take", "$take_while", "$to_a"]);
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass;
  $opal.add_stubs(['$include', '$call', '$enum_for', '$new', '$__send__', '$to_proc', '$to_a', '$empty?', '$raise', '$shift']);
  return (function($base, $super) {
    function Enumerator(){};
    var self = Enumerator = $klass($base, $super, 'Enumerator', Enumerator);

    var def = Enumerator._proto, $scope = Enumerator._scope, $a, TMP_1, TMP_2;
    def.block = def.object = def.method = def.args = def.cache = nil;
    self.$include((($a = $scope.Enumerable) == null ? $opal.cm('Enumerable') : $a));

    (function($base, $super) {
      function Yielder(){};
      var self = Yielder = $klass($base, $super, 'Yielder', Yielder);

      var def = Yielder._proto, $scope = Yielder._scope;
      def.to = def.block = nil;
      def.$initialize = function(enumerator, block, to) {
        var self = this;
        self.enumerator = enumerator;
        self.block = block;
        return self.to = to;
      };

      def.$yield = function(values) {
        var $a, self = this;
        values = $slice.call(arguments, 0);
        return ($a = self.to).$call.apply($a, [].concat(values));
      };

      $opal.defn(self, '$<<', def.$yield);

      return (def.$call = function() {
        var self = this;
        return self.block.$call(self);
      }, nil);
    })(self, null);

    def.$initialize = TMP_1 = function(obj, method, args) {
      var self = this, $iter = TMP_1._p, block = $iter || nil;
      args = $slice.call(arguments, 2);
      if (obj == null) {
        obj = nil
      }
      if (method == null) {
        method = "each"
      }
      TMP_1._p = null;
      if (block !== false && block !== nil) {
        return self.block = block
        } else {
        self.object = obj;
        self.method = method;
        return self.args = args;
      };
    };

    def.$each = TMP_2 = function() {
      var $a, $b, self = this, $iter = TMP_2._p, block = $iter || nil;
      TMP_2._p = null;
      if (block === nil) {
        return self.$enum_for("each")};
      if (($a = self.block) !== false && $a !== nil) {
        return (($a = $scope.Yielder) == null ? $opal.cm('Yielder') : $a).$new(self, self.block, block).$call()
        } else {
        return ($a = ($b = self.object).$__send__, $a._p = block.$to_proc(), $a).apply($b, [self.method].concat(self.args))
      };
    };

    def.$next = function() {
      var $a, self = this;
      ((($a = self.cache) !== false && $a !== nil) ? $a : self.cache = self.$to_a());
      if (($a = self.cache['$empty?']()) !== false && $a !== nil) {
        self.$raise((($a = $scope.StopIteration) == null ? $opal.cm('StopIteration') : $a), "end of enumeration")};
      return self.cache.$shift();
    };

    return (def.$rewind = function() {
      var self = this;
      self.cache = nil;
      return self;
    }, nil);
  })(self, null)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass, $range = $opal.range;
  $opal.add_stubs(['$include', '$new', '$class', '$raise', '$===', '$to_a', '$respond_to?', '$to_ary', '$coerce_to', '$==', '$to_str', '$clone', '$hash', '$<=>', '$enum_for', '$each', '$to_proc', '$>', '$-', '$length', '$begin', '$inspect', '$end', '$exclude_end?', '$flatten', '$replace', '$object_id', '$[]', '$to_s', '$delete_if', '$reverse', '$empty?', '$map', '$rand', '$keep_if', '$shuffle!', '$<', '$sort', '$to_n', '$times', '$[]=', '$<<', '$at']);
  return (function($base, $super) {
    function Array(){};
    var self = Array = $klass($base, $super, 'Array', Array);

    var def = Array._proto, $scope = Array._scope, $a, TMP_1, TMP_2, TMP_3, TMP_4, TMP_5, TMP_6, TMP_7, TMP_8, TMP_9, TMP_10, TMP_11, TMP_12, TMP_13, TMP_14, TMP_15, TMP_17, TMP_18, TMP_19, TMP_20, TMP_21, TMP_24;
    def.length = nil;
    self.$include((($a = $scope.Enumerable) == null ? $opal.cm('Enumerable') : $a));

    def._isArray = true;

    $opal.defs(self, '$[]', function(objects) {
      var self = this;
      objects = $slice.call(arguments, 0);
      return objects;
    });

    def.$initialize = function(args) {
      var $a, self = this;
      args = $slice.call(arguments, 0);
      return ($a = self.$class()).$new.apply($a, [].concat(args));
    };

    $opal.defs(self, '$new', TMP_1 = function(size, obj) {
      var $a, $b, self = this, $iter = TMP_1._p, block = $iter || nil;
      if (size == null) {
        size = nil
      }
      if (obj == null) {
        obj = nil
      }
      TMP_1._p = null;
      if (($a = arguments.length > 2) !== false && $a !== nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "wrong number of arguments (" + (arguments.length) + " for 0..2)")};
      if (($a = arguments.length === 0) !== false && $a !== nil) {
        return []};
      if (($a = arguments.length === 1) !== false && $a !== nil) {
        if (($a = (($b = $scope.Array) == null ? $opal.cm('Array') : $b)['$==='](size)) !== false && $a !== nil) {
          return size.$to_a()
        } else if (($a = size['$respond_to?']("to_ary")) !== false && $a !== nil) {
          return size.$to_ary()}};
      size = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(size, (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int");
      if (($a = size < 0) !== false && $a !== nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "negative array size")};
      
      var result = [];

      if (block === nil) {
        for (var i = 0; i < size; i++) {
          result.push(obj);
        }
      }
      else {
        for (var i = 0, value; i < size; i++) {
          value = block(i);

          if (value === $breaker) {
            return $breaker.$v;
          }

          result[i] = value;
        }
      }

      return result;
    
    });

    $opal.defs(self, '$try_convert', function(obj) {
      var $a, $b, self = this;
      if (($a = (($b = $scope.Array) == null ? $opal.cm('Array') : $b)['$==='](obj)) !== false && $a !== nil) {
        return obj};
      if (($a = obj['$respond_to?']("to_ary")) !== false && $a !== nil) {
        return obj.$to_ary()};
      return nil;
    });

    def['$&'] = function(other) {
      var $a, $b, self = this;
      if (($a = (($b = $scope.Array) == null ? $opal.cm('Array') : $b)['$==='](other)) !== false && $a !== nil) {
        other = other.$to_a()
        } else {
        other = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(other, (($a = $scope.Array) == null ? $opal.cm('Array') : $a), "to_ary")
      };
      
      var result = [],
          seen   = {};

      for (var i = 0, length = self.length; i < length; i++) {
        var item = self[i];

        if (!seen[item]) {
          for (var j = 0, length2 = other.length; j < length2; j++) {
            var item2 = other[j];

            if (!seen[item2] && (item)['$=='](item2)) {
              seen[item] = true;
              result.push(item);
            }
          }
        }
      }

      return result;
    
    };

    def['$*'] = function(other) {
      var $a, self = this;
      if (($a = other['$respond_to?']("to_str")) !== false && $a !== nil) {
        return self.join(other.$to_str())};
      if (($a = other['$respond_to?']("to_int")) === false || $a === nil) {
        self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "no implicit conversion of " + (other.$class()) + " into Integer")};
      other = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(other, (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int");
      if (($a = other < 0) !== false && $a !== nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "negative argument")};
      
      var result = [];

      for (var i = 0; i < other; i++) {
        result = result.concat(self);
      }

      return result;
    
    };

    def['$+'] = function(other) {
      var $a, $b, self = this;
      if (($a = (($b = $scope.Array) == null ? $opal.cm('Array') : $b)['$==='](other)) !== false && $a !== nil) {
        other = other.$to_a()
        } else {
        other = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(other, (($a = $scope.Array) == null ? $opal.cm('Array') : $a), "to_ary")
      };
      return self.concat(other);
    };

    def['$-'] = function(other) {
      var $a, $b, self = this;
      if (($a = (($b = $scope.Array) == null ? $opal.cm('Array') : $b)['$==='](other)) !== false && $a !== nil) {
        other = other.$to_a()
        } else {
        other = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(other, (($a = $scope.Array) == null ? $opal.cm('Array') : $a), "to_ary")
      };
      if (($a = self.length === 0) !== false && $a !== nil) {
        return []};
      if (($a = other.length === 0) !== false && $a !== nil) {
        return self.$clone()};
      
      var seen   = {},
          result = [];

      for (var i = 0, length = other.length; i < length; i++) {
        seen[other[i]] = true;
      }

      for (var i = 0, length = self.length; i < length; i++) {
        var item = self[i];

        if (!seen[item]) {
          result.push(item);
        }
      }

      return result;
    
    };

    def['$<<'] = function(object) {
      var self = this;
      self.push(object);
      return self;
    };

    def['$<=>'] = function(other) {
      var $a, $b, self = this;
      if (($a = (($b = $scope.Array) == null ? $opal.cm('Array') : $b)['$==='](other)) !== false && $a !== nil) {
        other = other.$to_a()
      } else if (($a = other['$respond_to?']("to_ary")) !== false && $a !== nil) {
        other = other.$to_ary()
        } else {
        return nil
      };
      
      if (self.$hash() === other.$hash()) {
        return 0;
      }

      if (self.length != other.length) {
        return (self.length > other.length) ? 1 : -1;
      }

      for (var i = 0, length = self.length; i < length; i++) {
        var tmp = (self[i])['$<=>'](other[i]);

        if (tmp !== 0) {
          return tmp;
        }
      }

      return 0;
    ;
    };

    def['$=='] = function(other) {
      var $a, $b, self = this;
      if (($a = (($b = $scope.Array) == null ? $opal.cm('Array') : $b)['$==='](other)) === false || $a === nil) {
        return false};
      other = other.$to_a();
      
      if (self.length !== other.length) {
        return false;
      }

      for (var i = 0, length = self.length; i < length; i++) {
        var a = self[i],
            b = other[i];

        if (a._isArray && b._isArray && (a === self)) {
          continue;
        }

        if (!((a)['$=='](b))) {
          return false;
        }
      }
    
      return true;
    };

    def['$[]'] = function(index, length) {
      var self = this;
      
      var size = self.length;

      if (typeof index !== 'number' && !index._isNumber) {
        if (index._isRange) {
          var exclude = index.exclude;
          length      = index.end;
          index       = index.begin;

          if (index > size) {
            return nil;
          }

          if (length < 0) {
            length += size;
          }

          if (!exclude) length += 1;
          return self.slice(index, length);
        }
        else {
          self.$raise("bad arg for Array#[]");
        }
      }

      if (index < 0) {
        index += size;
      }

      if (length !== undefined) {
        if (length < 0 || index > size || index < 0) {
          return nil;
        }

        return self.slice(index, index + length);
      }
      else {
        if (index >= size || index < 0) {
          return nil;
        }

        return self[index];
      }
    
    };

    def['$[]='] = function(index, value, extra) {
      var $a, self = this;
      
      var size = self.length;

      if (typeof index !== 'number' && !index._isNumber) {
        if (index._isRange) {
          var exclude = index.exclude;
          extra = value;
          value = index.end;
          index = index.begin;

          if (value < 0) {
            value += size;
          }

          if (!exclude) value += 1;

          value = value - index;
        }
        else {
          self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a));
        }
      }

      if (index < 0) {
        index += size;
      }

      if (extra != null) {
        if (value < 0) {
          self.$raise((($a = $scope.IndexError) == null ? $opal.cm('IndexError') : $a));
        }

        if (index > size) {
          for (var i = size; index > i; i++) {
            self[i] = nil;
          }
        }

        self.splice.apply(self, [index, value].concat(extra));

        return extra;
      }

      if (index > size) {
        for (var i = size; i < index; i++) {
          self[i] = nil;
        }
      }

      return self[index] = value;
    
    };

    def.$assoc = function(object) {
      var self = this;
      
      for (var i = 0, length = self.length, item; i < length; i++) {
        if (item = self[i], item.length && (item[0])['$=='](object)) {
          return item;
        }
      }

      return nil;
    
    };

    def.$at = function(index) {
      var $a, self = this;
      index = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(index, (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int");
      
      if (index < 0) {
        index += self.length;
      }

      if (index < 0 || index >= self.length) {
        return nil;
      }

      return self[index];
    
    };

    def.$cycle = TMP_2 = function(n) {
      var $a, $b, $c, $d, self = this, $iter = TMP_2._p, block = $iter || nil, value = nil, cycles = nil;
      if (n == null) {
        n = nil
      }
      TMP_2._p = null;
      if (($a = self.length === 0 || n === 0) !== false && $a !== nil) {
        return nil};
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("cycle", n)};
      if (($a = n === nil) !== false && $a !== nil) {
        while (($b = true) !== false && $b !== nil) {
        if (($b = (value = ($c = ($d = self).$each, $c._p = block.$to_proc(), $c).call($d)) !== self) !== false && $b !== nil) {
          return value}}
        } else {
        cycles = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(n, (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int");
        if (($a = (($b = $scope.Integer) == null ? $opal.cm('Integer') : $b)['$==='](cycles)) === false || $a === nil) {
          self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "can't convert " + (n.$class()) + " into Integer (" + (n.$class()) + "#to_int gives " + (cycles.$class()))};
        while (cycles['$>'](0)) {
        ($b = ($c = self).$each, $b._p = block.$to_proc(), $b).call($c);
        cycles = cycles['$-'](1);};
      };
      return self;
    };

    def.$clear = function() {
      var self = this;
      self.splice(0, self.length);
      return self;
    };

    def.$clone = function() {
      var self = this;
      return self.slice();
    };

    def.$collect = TMP_3 = function() {
      var self = this, $iter = TMP_3._p, block = $iter || nil;
      TMP_3._p = null;
      if (block === nil) {
        return self.$enum_for("collect")};
      
      var result = [];

      for (var i = 0, length = self.length; i < length; i++) {
        var value = Opal.$yield1(block, self[i]);

        if (value === $breaker) {
          return $breaker.$v;
        }

        result.push(value);
      }

      return result;
    
    };

    def['$collect!'] = TMP_4 = function() {
      var self = this, $iter = TMP_4._p, block = $iter || nil;
      TMP_4._p = null;
      if (block === nil) {
        return self.$enum_for("collect!")};
      
      for (var i = 0, length = self.length; i < length; i++) {
        var value = Opal.$yield1(block, self[i]);

        if (value === $breaker) {
          return $breaker.$v;
        }

        self[i] = value;
      }
    
      return self;
    };

    def.$compact = function() {
      var self = this;
      
      var result = [];

      for (var i = 0, length = self.length, item; i < length; i++) {
        if ((item = self[i]) !== nil) {
          result.push(item);
        }
      }

      return result;
    
    };

    def['$compact!'] = function() {
      var self = this;
      
      var original = self.length;

      for (var i = 0, length = self.length; i < length; i++) {
        if (self[i] === nil) {
          self.splice(i, 1);

          length--;
          i--;
        }
      }

      return self.length === original ? nil : self;
    
    };

    def.$concat = function(other) {
      var self = this;
      
      for (var i = 0, length = other.length; i < length; i++) {
        self.push(other[i]);
      }
    
      return self;
    };

    def.$delete = function(object) {
      var self = this;
      
      var original = self.length;

      for (var i = 0, length = original; i < length; i++) {
        if ((self[i])['$=='](object)) {
          self.splice(i, 1);

          length--;
          i--;
        }
      }

      return self.length === original ? nil : object;
    
    };

    def.$delete_at = function(index) {
      var self = this;
      
      if (index < 0) {
        index += self.length;
      }

      if (index < 0 || index >= self.length) {
        return nil;
      }

      var result = self[index];

      self.splice(index, 1);

      return result;
    
    };

    def.$delete_if = TMP_5 = function() {
      var self = this, $iter = TMP_5._p, block = $iter || nil;
      TMP_5._p = null;
      if (block === nil) {
        return self.$enum_for("delete_if")};
      
      for (var i = 0, length = self.length, value; i < length; i++) {
        if ((value = block(self[i])) === $breaker) {
          return $breaker.$v;
        }

        if (value !== false && value !== nil) {
          self.splice(i, 1);

          length--;
          i--;
        }
      }
    
      return self;
    };

    def.$drop = function(number) {
      var $a, self = this;
      
      if (number < 0) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a))
      }

      return self.slice(number);
    ;
    };

    $opal.defn(self, '$dup', def.$clone);

    def.$each = TMP_6 = function() {
      var self = this, $iter = TMP_6._p, block = $iter || nil;
      TMP_6._p = null;
      if (block === nil) {
        return self.$enum_for("each")};
      
      for (var i = 0, length = self.length; i < length; i++) {
        var value = $opal.$yield1(block, self[i]);

        if (value == $breaker) {
          return $breaker.$v;
        }
      }
    
      return self;
    };

    def.$each_index = TMP_7 = function() {
      var self = this, $iter = TMP_7._p, block = $iter || nil;
      TMP_7._p = null;
      if (block === nil) {
        return self.$enum_for("each_index")};
      
      for (var i = 0, length = self.length; i < length; i++) {
        var value = $opal.$yield1(block, i);

        if (value === $breaker) {
          return $breaker.$v;
        }
      }
    
      return self;
    };

    def['$empty?'] = function() {
      var self = this;
      return self.length === 0;
    };

    def.$fetch = TMP_8 = function(index, defaults) {
      var $a, self = this, $iter = TMP_8._p, block = $iter || nil;
      TMP_8._p = null;
      
      var original = index;

      if (index < 0) {
        index += self.length;
      }

      if (index >= 0 && index < self.length) {
        return self[index];
      }

      if (block !== nil) {
        return block(original);
      }

      if (defaults != null) {
        return defaults;
      }

      self.$raise((($a = $scope.IndexError) == null ? $opal.cm('IndexError') : $a), "Array#fetch");
    
    };

    def.$fill = TMP_9 = function(args) {
      var $a, $b, self = this, $iter = TMP_9._p, block = $iter || nil, one = nil, two = nil, obj = nil, left = nil, right = nil;
      args = $slice.call(arguments, 0);
      TMP_9._p = null;
      if (block !== false && block !== nil) {
        if (($a = args.length > 2) !== false && $a !== nil) {
          self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "wrong number of arguments (" + (args.$length()) + " for 0..2)")};
        $a = $opal.to_ary(args), one = ($a[0] == null ? nil : $a[0]), two = ($a[1] == null ? nil : $a[1]);
        } else {
        if (($a = args.length == 0) !== false && $a !== nil) {
          self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "wrong number of arguments (0 for 1..3)")
        } else if (($a = args.length > 3) !== false && $a !== nil) {
          self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "wrong number of arguments (" + (args.$length()) + " for 1..3)")};
        $a = $opal.to_ary(args), obj = ($a[0] == null ? nil : $a[0]), one = ($a[1] == null ? nil : $a[1]), two = ($a[2] == null ? nil : $a[2]);
      };
      if (($a = (($b = $scope.Range) == null ? $opal.cm('Range') : $b)['$==='](one)) !== false && $a !== nil) {
        if (two !== false && two !== nil) {
          self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "length invalid with range")};
        left = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(one.$begin(), (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int");
        if (($a = left < 0) !== false && $a !== nil) {
          left += self.length;};
        if (($a = left < 0) !== false && $a !== nil) {
          self.$raise((($a = $scope.RangeError) == null ? $opal.cm('RangeError') : $a), "" + (one.$inspect()) + " out of range")};
        right = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(one.$end(), (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int");
        if (($a = right < 0) !== false && $a !== nil) {
          right += self.length;};
        if (($a = one['$exclude_end?']()) === false || $a === nil) {
          right += 1;};
        if (($a = right <= left) !== false && $a !== nil) {
          return self};
      } else if (one !== false && one !== nil) {
        left = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(one, (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int");
        if (($a = left < 0) !== false && $a !== nil) {
          left += self.length;};
        if (($a = left < 0) !== false && $a !== nil) {
          left = 0};
        if (two !== false && two !== nil) {
          right = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(two, (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int");
          if (($a = right == 0) !== false && $a !== nil) {
            return self};
          right += left;
          } else {
          right = self.length
        };
        } else {
        left = 0;
        right = self.length;
      };
      if (($a = right > 2147483648) !== false && $a !== nil) {
        self.$raise((($a = $scope.RangeError) == null ? $opal.cm('RangeError') : $a), "bignum too big to convert into `long'")
      } else if (($a = right >= 536870910) !== false && $a !== nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "argument too big")};
      if (($a = left > self.length) !== false && $a !== nil) {
        
        for (var i = self.length; i < right; i++) {
          self[i] = nil;
        }
      ;};
      if (($a = right > self.length) !== false && $a !== nil) {
        self.length = right};
      if (block !== false && block !== nil) {
        
        for (var length = self.length; left < right; left++) {
          var value = block(left);

          if (value === $breaker) {
            return $breaker.$v;
          }

          self[left] = value;
        }
      ;
        } else {
        
        for (var length = self.length; left < right; left++) {
          self[left] = obj;
        }
      ;
      };
      return self;
    };

    def.$first = function(count) {
      var $a, self = this;
      
      if (count != null) {

        if (count < 0) {
          self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a));
        }

        return self.slice(0, count);
      }

      return self.length === 0 ? nil : self[0];
    ;
    };

    def.$flatten = function(level) {
      var self = this;
      
      var result = [];

      for (var i = 0, length = self.length; i < length; i++) {
        var item = self[i];

        if ((item)['$respond_to?']("to_ary")) {
          item = (item).$to_ary();

          if (level == null) {
            result = result.concat((item).$flatten());
          }
          else if (level === 0) {
            result.push(item);
          }
          else {
            result = result.concat((item).$flatten(level - 1));
          }
        }
        else {
          result.push(item);
        }
      }

      return result;
    ;
    };

    def['$flatten!'] = function(level) {
      var self = this;
      
      var flattened = self.$flatten(level);

      if (self.length == flattened.length) {
        for (var i = 0, length = self.length; i < length; i++) {
          if (self[i] !== flattened[i]) {
            break;
          }
        }

        if (i == length) {
          return nil;
        }
      }

      self.$replace(flattened);
    ;
      return self;
    };

    def.$hash = function() {
      var self = this;
      return self._id || (self._id = Opal.uid());
    };

    def['$include?'] = function(member) {
      var self = this;
      
      for (var i = 0, length = self.length; i < length; i++) {
        if ((self[i])['$=='](member)) {
          return true;
        }
      }

      return false;
    
    };

    def.$index = TMP_10 = function(object) {
      var self = this, $iter = TMP_10._p, block = $iter || nil;
      TMP_10._p = null;
      
      if (object != null) {
        for (var i = 0, length = self.length; i < length; i++) {
          if ((self[i])['$=='](object)) {
            return i;
          }
        }
      }
      else if (block !== nil) {
        for (var i = 0, length = self.length, value; i < length; i++) {
          if ((value = block(self[i])) === $breaker) {
            return $breaker.$v;
          }

          if (value !== false && value !== nil) {
            return i;
          }
        }
      }
      else {
        return self.$enum_for("index");
      }

      return nil;
    
    };

    def.$insert = function(index, objects) {
      var $a, self = this;
      objects = $slice.call(arguments, 1);
      
      if (objects.length > 0) {
        if (index < 0) {
          index += self.length + 1;

          if (index < 0) {
            self.$raise((($a = $scope.IndexError) == null ? $opal.cm('IndexError') : $a), "" + (index) + " is out of bounds");
          }
        }
        if (index > self.length) {
          for (var i = self.length; i < index; i++) {
            self.push(nil);
          }
        }

        self.splice.apply(self, [index, 0].concat(objects));
      }
    
      return self;
    };

    def.$inspect = function() {
      var self = this;
      
      var i, inspect, el, el_insp, length, object_id;

      inspect = [];
      object_id = self.$object_id();
      length = self.length;

      for (i = 0; i < length; i++) {
        el = self['$[]'](i);

        // Check object_id to ensure it's not the same array get into an infinite loop
        el_insp = (el).$object_id() === object_id ? '[...]' : (el).$inspect();

        inspect.push(el_insp);
      }
      return '[' + inspect.join(', ') + ']';
    ;
    };

    def.$join = function(sep) {
      var self = this;
      if (sep == null) {
        sep = ""
      }
      
      var result = [];

      for (var i = 0, length = self.length; i < length; i++) {
        result.push((self[i]).$to_s());
      }

      return result.join(sep);
    
    };

    def.$keep_if = TMP_11 = function() {
      var self = this, $iter = TMP_11._p, block = $iter || nil;
      TMP_11._p = null;
      if (block === nil) {
        return self.$enum_for("keep_if")};
      
      for (var i = 0, length = self.length, value; i < length; i++) {
        if ((value = block(self[i])) === $breaker) {
          return $breaker.$v;
        }

        if (value === false || value === nil) {
          self.splice(i, 1);

          length--;
          i--;
        }
      }
    
      return self;
    };

    def.$last = function(count) {
      var $a, self = this;
      
      var length = self.length;

      if (count === nil || typeof(count) == 'string') {
        self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "no implicit conversion to integer");
      }

      if (typeof(count) == 'object') {
        if (count['$respond_to?']("to_int")) {
          count = count['$to_int']();
        }
        else {
          self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "no implicit conversion to integer");
        }
      }

      if (count == null) {
        return length === 0 ? nil : self[length - 1];
      }
      else if (count < 0) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "negative count given");
      }

      if (count > length) {
        count = length;
      }

      return self.slice(length - count, length);
    
    };

    def.$length = function() {
      var self = this;
      return self.length;
    };

    $opal.defn(self, '$map', def.$collect);

    $opal.defn(self, '$map!', def['$collect!']);

    def.$pop = function(count) {
      var $a, self = this;
      
      var length = self.length;

      if (count == null) {
        return length === 0 ? nil : self.pop();
      }

      if (count < 0) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "negative count given");
      }

      return count > length ? self.splice(0, self.length) : self.splice(length - count, length);
    
    };

    def.$push = function(objects) {
      var self = this;
      objects = $slice.call(arguments, 0);
      
      for (var i = 0, length = objects.length; i < length; i++) {
        self.push(objects[i]);
      }
    
      return self;
    };

    def.$rassoc = function(object) {
      var self = this;
      
      for (var i = 0, length = self.length, item; i < length; i++) {
        item = self[i];

        if (item.length && item[1] !== undefined) {
          if ((item[1])['$=='](object)) {
            return item;
          }
        }
      }

      return nil;
    
    };

    def.$reject = TMP_12 = function() {
      var self = this, $iter = TMP_12._p, block = $iter || nil;
      TMP_12._p = null;
      if (block === nil) {
        return self.$enum_for("reject")};
      
      var result = [];

      for (var i = 0, length = self.length, value; i < length; i++) {
        if ((value = block(self[i])) === $breaker) {
          return $breaker.$v;
        }

        if (value === false || value === nil) {
          result.push(self[i]);
        }
      }
      return result;
    
    };

    def['$reject!'] = TMP_13 = function() {
      var $a, $b, self = this, $iter = TMP_13._p, block = $iter || nil;
      TMP_13._p = null;
      if (block === nil) {
        return self.$enum_for("reject!")};
      
      var original = self.length;
      ($a = ($b = self).$delete_if, $a._p = block.$to_proc(), $a).call($b);
      return self.length === original ? nil : self;
    
    };

    def.$replace = function(other) {
      var self = this;
      
      self.splice(0, self.length);
      self.push.apply(self, other);
    
      return self;
    };

    def.$reverse = function() {
      var self = this;
      return self.slice(0).reverse();
    };

    def['$reverse!'] = function() {
      var self = this;
      return self.reverse();
    };

    def.$reverse_each = TMP_14 = function() {
      var $a, $b, self = this, $iter = TMP_14._p, block = $iter || nil;
      TMP_14._p = null;
      if (block === nil) {
        return self.$enum_for("reverse_each")};
      ($a = ($b = self.$reverse()).$each, $a._p = block.$to_proc(), $a).call($b);
      return self;
    };

    def.$rindex = TMP_15 = function(object) {
      var self = this, $iter = TMP_15._p, block = $iter || nil;
      TMP_15._p = null;
      
      if (object != null) {
        for (var i = self.length - 1; i >= 0; i--) {
          if ((self[i])['$=='](object)) {
            return i;
          }
        }
      }
      else if (block !== nil) {
        for (var i = self.length - 1, value; i >= 0; i--) {
          if ((value = block(self[i])) === $breaker) {
            return $breaker.$v;
          }

          if (value !== false && value !== nil) {
            return i;
          }
        }
      }
      else if (object == null) {
        return self.$enum_for("rindex");
      }

      return nil;
    
    };

    def.$sample = function(n) {
      var $a, $b, $c, TMP_16, self = this;
      if (n == null) {
        n = nil
      }
      if (($a = ($b = ($c = n, ($c === nil || $c === false)), $b !== false && $b !== nil ?self['$empty?']() : $b)) !== false && $a !== nil) {
        return nil};
      if (($a = (($b = n !== false && n !== nil) ? self['$empty?']() : $b)) !== false && $a !== nil) {
        return []};
      if (n !== false && n !== nil) {
        return ($a = ($b = ($range(1, n, false))).$map, $a._p = (TMP_16 = function() {var self = TMP_16._s || this;
          return self['$[]'](self.$rand(self.$length()))}, TMP_16._s = self, TMP_16), $a).call($b)
        } else {
        return self['$[]'](self.$rand(self.$length()))
      };
    };

    def.$select = TMP_17 = function() {
      var self = this, $iter = TMP_17._p, block = $iter || nil;
      TMP_17._p = null;
      if (block === nil) {
        return self.$enum_for("select")};
      
      var result = [];

      for (var i = 0, length = self.length, item, value; i < length; i++) {
        item = self[i];

        if ((value = block(item)) === $breaker) {
          return $breaker.$v;
        }

        if (value !== false && value !== nil) {
          result.push(item);
        }
      }

      return result;
    
    };

    def['$select!'] = TMP_18 = function() {
      var $a, $b, self = this, $iter = TMP_18._p, block = $iter || nil;
      TMP_18._p = null;
      if (block === nil) {
        return self.$enum_for("select!")};
      
      var original = self.length;
      ($a = ($b = self).$keep_if, $a._p = block.$to_proc(), $a).call($b);
      return self.length === original ? nil : self;
    
    };

    def.$shift = function(count) {
      var self = this;
      
      if (self.length === 0) {
        return nil;
      }

      return count == null ? self.shift() : self.splice(0, count)
    
    };

    $opal.defn(self, '$size', def.$length);

    def.$shuffle = function() {
      var self = this;
      return self.$clone()['$shuffle!']();
    };

    def['$shuffle!'] = function() {
      var self = this;
      
      for (var i = self.length - 1; i > 0; i--) {
        var tmp = self[i],
            j   = Math.floor(Math.random() * (i + 1));

        self[i] = self[j];
        self[j] = tmp;
      }
    
      return self;
    };

    $opal.defn(self, '$slice', def['$[]']);

    def['$slice!'] = function(index, length) {
      var self = this;
      
      if (index < 0) {
        index += self.length;
      }

      if (length != null) {
        return self.splice(index, length);
      }

      if (index < 0 || index >= self.length) {
        return nil;
      }

      return self.splice(index, 1)[0];
    
    };

    def.$sort = TMP_19 = function() {
      var $a, self = this, $iter = TMP_19._p, block = $iter || nil;
      TMP_19._p = null;
      if (($a = self.length > 1) === false || $a === nil) {
        return self};
      
      if (!(block !== nil)) {
        block = function(a, b) {
          return (a)['$<=>'](b);
        };
      }

      try {
        return self.slice().sort(function(x, y) {
          var ret = block(x, y);

          if (ret === $breaker) {
            throw $breaker;
          }
          else if (ret === nil) {
            self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "comparison of " + ((x).$inspect()) + " with " + ((y).$inspect()) + " failed");
          }

          return (ret)['$>'](0) ? 1 : ((ret)['$<'](0) ? -1 : 0);
        });
      }
      catch (e) {
        if (e === $breaker) {
          return $breaker.$v;
        }
        else {
          throw e;
        }
      }
    ;
    };

    def['$sort!'] = TMP_20 = function() {
      var $a, $b, self = this, $iter = TMP_20._p, block = $iter || nil;
      TMP_20._p = null;
      
      var result;

      if ((block !== nil)) {
        result = ($a = ($b = (self.slice())).$sort, $a._p = block.$to_proc(), $a).call($b);
      }
      else {
        result = (self.slice()).$sort();
      }

      self.length = 0;
      for(var i = 0, length = result.length; i < length; i++) {
        self.push(result[i]);
      }

      return self;
    ;
    };

    def.$take = function(count) {
      var $a, self = this;
      
      if (count < 0) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a));
      }

      return self.slice(0, count);
    ;
    };

    def.$take_while = TMP_21 = function() {
      var self = this, $iter = TMP_21._p, block = $iter || nil;
      TMP_21._p = null;
      
      var result = [];

      for (var i = 0, length = self.length, item, value; i < length; i++) {
        item = self[i];

        if ((value = block(item)) === $breaker) {
          return $breaker.$v;
        }

        if (value === false || value === nil) {
          return result;
        }

        result.push(item);
      }

      return result;
    
    };

    def.$to_a = function() {
      var self = this;
      return self;
    };

    $opal.defn(self, '$to_ary', def.$to_a);

    def.$to_n = function() {
      var self = this;
      
      var result = [], obj

      for (var i = 0, len = self.length; i < len; i++) {
        obj = self[i];

        if ((obj)['$respond_to?']("to_n")) {
          result.push((obj).$to_n());
        }
        else {
          result.push(obj);
        }
      }

      return result;
    ;
    };

    $opal.defn(self, '$to_s', def.$inspect);

    def.$transpose = function() {
      var $a, TMP_22, $b, self = this, result = nil, max = nil;
      if (($a = self['$empty?']()) !== false && $a !== nil) {
        return []};
      result = [];
      max = nil;
      ($a = ($b = self).$each, $a._p = (TMP_22 = function(row) {var self = TMP_22._s || this, $a, $b, TMP_23;if (row == null) row = nil;
        if (($a = (($b = $scope.Array) == null ? $opal.cm('Array') : $b)['$==='](row)) !== false && $a !== nil) {
          row = row.$to_a()
          } else {
          row = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(row, (($a = $scope.Array) == null ? $opal.cm('Array') : $a), "to_ary")
        };
        ((($a = max) !== false && $a !== nil) ? $a : max = row.length);
        if (($a = ($b = (row.length)['$=='](max), ($b === nil || $b === false))) !== false && $a !== nil) {
          self.$raise((($a = $scope.IndexError) == null ? $opal.cm('IndexError') : $a), "element size differs (" + (row.length) + " should be " + (max))};
        return ($a = ($b = (row.length)).$times, $a._p = (TMP_23 = function(i) {var self = TMP_23._s || this, $a, $b, $c, entry = nil;if (i == null) i = nil;
          entry = (($a = i, $b = result, ((($c = $b['$[]']($a)) !== false && $c !== nil) ? $c : $b['$[]=']($a, []))));
          return entry['$<<'](row.$at(i));}, TMP_23._s = self, TMP_23), $a).call($b);}, TMP_22._s = self, TMP_22), $a).call($b);
      return result;
    };

    def.$uniq = function() {
      var self = this;
      
      var result = [],
          seen   = {};
   
      for (var i = 0, length = self.length, item, hash; i < length; i++) {
        item = self[i];
        hash = item;
   
        if (!seen[hash]) {
          seen[hash] = true;
   
          result.push(item);
        }
      }
   
      return result;
    
    };

    def['$uniq!'] = function() {
      var self = this;
      
      var original = self.length,
          seen     = {};

      for (var i = 0, length = original, item, hash; i < length; i++) {
        item = self[i];
        hash = item;

        if (!seen[hash]) {
          seen[hash] = true;
        }
        else {
          self.splice(i, 1);

          length--;
          i--;
        }
      }

      return self.length === original ? nil : self;
    
    };

    def.$unshift = function(objects) {
      var self = this;
      objects = $slice.call(arguments, 0);
      
      for (var i = objects.length - 1; i >= 0; i--) {
        self.unshift(objects[i]);
      }
    
      return self;
    };

    return (def.$zip = TMP_24 = function(others) {
      var self = this, $iter = TMP_24._p, block = $iter || nil;
      others = $slice.call(arguments, 0);
      TMP_24._p = null;
      
      var result = [], size = self.length, part, o;

      for (var i = 0; i < size; i++) {
        part = [self[i]];

        for (var j = 0, jj = others.length; j < jj; j++) {
          o = others[j][i];

          if (o == null) {
            o = nil;
          }

          part[j + 1] = o;
        }

        result[i] = part;
      }

      if (block !== nil) {
        for (var i = 0; i < size; i++) {
          block(result[i]);
        }

        return nil;
      }

      return result;
    
    }, nil);
  })(self, null)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass;
  $opal.add_stubs(['$include', '$==', '$call', '$enum_for', '$raise', '$flatten', '$inspect', '$alias_method', '$respond_to?', '$to_n']);
  return (function($base, $super) {
    function Hash(){};
    var self = Hash = $klass($base, $super, 'Hash', Hash);

    var def = Hash._proto, $scope = Hash._scope, $a, TMP_1, TMP_2, TMP_3, TMP_4, TMP_5, TMP_6, TMP_7, TMP_8, TMP_9, TMP_10, TMP_11, TMP_12;
    def.proc = def.none = nil;
    self.$include((($a = $scope.Enumerable) == null ? $opal.cm('Enumerable') : $a));

    
    var $hash = Opal.hash = function() {
      if (arguments.length == 1 && arguments[0]._klass == Hash) {
        return arguments[0];
      }

      var hash   = new Hash._alloc,
          keys   = [],
          assocs = {};

      hash.map   = assocs;
      hash.keys  = keys;

      if (arguments.length == 1 && arguments[0]._isArray) {
        var args = arguments[0];

        for (var i = 0, length = args.length; i < length; i++) {
          var key = args[i][0], obj = args[i][1];

          if (assocs[key] == null) {
            keys.push(key);
          }

          assocs[key] = obj;
        }
      }
      else {
        for (var i = 0, length = arguments.length, key; i < length; i++) {
          var key = arguments[i], obj = arguments[++i];

          if (assocs[key] == null) {
            keys.push(key);
          }

          assocs[key] = obj;
        }
      }

      return hash;
    };
  

    
    var $hash2 = Opal.hash2 = function(keys, map) {
      var hash = new Hash._alloc;
      hash.keys = keys;
      hash.map = map;
      return hash;
    };
  

    var $hasOwn = {}.hasOwnProperty;

    $opal.defs(self, '$[]', function(objs) {
      var self = this;
      objs = $slice.call(arguments, 0);
      return $hash.apply(null, objs);
    });

    $opal.defs(self, '$allocate', function() {
      var self = this;
      
      var hash = new self._alloc;
      hash.map = {};
      hash.keys = [];
      return hash;
    
    });

    def.$initialize = TMP_1 = function(defaults) {
      var self = this, $iter = TMP_1._p, block = $iter || nil;
      TMP_1._p = null;
      
      if (defaults != null) {
        if (defaults.constructor == Object) {
          var map = self.map, keys = self.keys;

          for (var key in defaults) {
            keys.push(key);
            map[key] = defaults[key];
          }
        }
        else {
          self.none = defaults;
        }
      }
      else if (block !== nil) {
          self.proc = block;
      }

      return self;
    
    };

    def['$=='] = function(other) {
      var $a, self = this;
      
      if (self === other) {
        return true;
      }

      if (!other.map || !other.keys) {
        return false;
      }

      if (self.keys.length !== other.keys.length) {
        return false;
      }

      var map  = self.map,
          map2 = other.map;

      for (var i = 0, length = self.keys.length; i < length; i++) {
        var key = self.keys[i], obj = map[key], obj2 = map2[key];

        if (($a = (obj)['$=='](obj2), ($a === nil || $a === false))) {
          return false;
        }
      }

      return true;
    
    };

    def['$[]'] = function(key) {
      var self = this;
      
      var map = self.map;

      if ($hasOwn.call(map, key)) {
        return map[key];
      }

      var proc = self.proc;

      if (proc !== nil) {
        return (proc).$call(self, key);
      }

      return self.none;
    
    };

    def['$[]='] = function(key, value) {
      var self = this;
      
      var map = self.map;

      if (!$hasOwn.call(map, key)) {
        self.keys.push(key);
      }

      map[key] = value;

      return value;
    
    };

    def.$assoc = function(object) {
      var self = this;
      
      var keys = self.keys, key;

      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];

        if ((key)['$=='](object)) {
          return [key, self.map[key]];
        }
      }

      return nil;
    
    };

    def.$clear = function() {
      var self = this;
      
      self.map = {};
      self.keys = [];
      return self;
    
    };

    def.$clone = function() {
      var self = this;
      
      var result = new self._klass._alloc();

      result.map = {}; result.keys = [];

      var map    = self.map,
          map2   = result.map,
          keys2  = result.keys;

      for (var i = 0, length = self.keys.length; i < length; i++) {
        keys2.push(self.keys[i]);
        map2[self.keys[i]] = map[self.keys[i]];
      }

      return result;
    
    };

    def.$default = function(val) {
      var self = this;
      return self.none;
    };

    def['$default='] = function(object) {
      var self = this;
      return self.none = object;
    };

    def.$default_proc = function() {
      var self = this;
      return self.proc;
    };

    def['$default_proc='] = function(proc) {
      var self = this;
      return self.proc = proc;
    };

    def.$delete = function(key) {
      var self = this;
      
      var map  = self.map, result = map[key];

      if (result != null) {
        delete map[key];
        self.keys.$delete(key);

        return result;
      }

      return nil;
    
    };

    def.$delete_if = TMP_2 = function() {
      var $a, self = this, $iter = TMP_2._p, block = $iter || nil;
      TMP_2._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("delete_if")};
      
      var map = self.map, keys = self.keys, value;

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i], obj = map[key];

        if ((value = block(key, obj)) === $breaker) {
          return $breaker.$v;
        }

        if (value !== false && value !== nil) {
          keys.splice(i, 1);
          delete map[key];

          length--;
          i--;
        }
      }

      return self;
    
    };

    $opal.defn(self, '$dup', def.$clone);

    def.$each = TMP_3 = function() {
      var $a, self = this, $iter = TMP_3._p, block = $iter || nil;
      TMP_3._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("each")};
      
      var map  = self.map,
          keys = self.keys;

      for (var i = 0, length = keys.length; i < length; i++) {
        var key   = keys[i],
            value = $opal.$yield1(block, [key, map[key]]);

        if (value === $breaker) {
          return $breaker.$v;
        }
      }

      return self;
    
    };

    def.$each_key = TMP_4 = function() {
      var $a, self = this, $iter = TMP_4._p, block = $iter || nil;
      TMP_4._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("each_key")};
      
      var keys = self.keys;

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i];

        if (block(key) === $breaker) {
          return $breaker.$v;
        }
      }

      return self;
    
    };

    $opal.defn(self, '$each_pair', def.$each);

    def.$each_value = TMP_5 = function() {
      var $a, self = this, $iter = TMP_5._p, block = $iter || nil;
      TMP_5._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("each_value")};
      
      var map = self.map, keys = self.keys;

      for (var i = 0, length = keys.length; i < length; i++) {
        if (block(map[keys[i]]) === $breaker) {
          return $breaker.$v;
        }
      }

      return self;
    
    };

    def['$empty?'] = function() {
      var self = this;
      return self.keys.length === 0;
    };

    $opal.defn(self, '$eql?', def['$==']);

    def.$fetch = TMP_6 = function(key, defaults) {
      var $a, self = this, $iter = TMP_6._p, block = $iter || nil;
      TMP_6._p = null;
      
      var value = self.map[key];

      if (value != null) {
        return value;
      }

      if (block !== nil) {
        var value;

        if ((value = block(key)) === $breaker) {
          return $breaker.$v;
        }

        return value;
      }

      if (defaults != null) {
        return defaults;
      }

      self.$raise((($a = $scope.KeyError) == null ? $opal.cm('KeyError') : $a), "key not found");
    
    };

    def.$flatten = function(level) {
      var self = this;
      
      var map = self.map, keys = self.keys, result = [];

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i], value = map[key];

        result.push(key);

        if (value._isArray) {
          if (level == null || level === 1) {
            result.push(value);
          }
          else {
            result = result.concat((value).$flatten(level - 1));
          }
        }
        else {
          result.push(value);
        }
      }

      return result;
    
    };

    def['$has_key?'] = function(key) {
      var self = this;
      return $hasOwn.call(self.map, key);
    };

    def['$has_value?'] = function(value) {
      var self = this;
      
      for (var assoc in self.map) {
        if ((self.map[assoc])['$=='](value)) {
          return true;
        }
      }

      return false;
    ;
    };

    def.$hash = function() {
      var self = this;
      return self._id;
    };

    $opal.defn(self, '$include?', def['$has_key?']);

    def.$index = function(object) {
      var self = this;
      
      var map = self.map, keys = self.keys;

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i];

        if ((map[key])['$=='](object)) {
          return key;
        }
      }

      return nil;
    
    };

    def.$indexes = function(keys) {
      var self = this;
      keys = $slice.call(arguments, 0);
      
      var result = [], map = self.map, val;

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i], val = map[key];

        if (val != null) {
          result.push(val);
        }
        else {
          result.push(self.none);
        }
      }

      return result;
    
    };

    $opal.defn(self, '$indices', def.$indexes);

    def.$inspect = function() {
      var self = this;
      
      var inspect = [], keys = self.keys, map = self.map;

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i], val = map[key];

        if (val === self) {
          inspect.push((key).$inspect() + '=>' + '{...}');
        } else {
          inspect.push((key).$inspect() + '=>' + (map[key]).$inspect());
        }
      }

      return '{' + inspect.join(', ') + '}';
    ;
    };

    def.$invert = function() {
      var self = this;
      
      var result = $hash(), keys = self.keys, map = self.map,
          keys2 = result.keys, map2 = result.map;

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i], obj = map[key];

        keys2.push(obj);
        map2[obj] = key;
      }

      return result;
    
    };

    def.$keep_if = TMP_7 = function() {
      var $a, self = this, $iter = TMP_7._p, block = $iter || nil;
      TMP_7._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("keep_if")};
      
      var map = self.map, keys = self.keys, value;

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i], obj = map[key];

        if ((value = block(key, obj)) === $breaker) {
          return $breaker.$v;
        }

        if (value === false || value === nil) {
          keys.splice(i, 1);
          delete map[key];

          length--;
          i--;
        }
      }

      return self;
    
    };

    $opal.defn(self, '$key', def.$index);

    $opal.defn(self, '$key?', def['$has_key?']);

    def.$keys = function() {
      var self = this;
      return self.keys.slice(0);
    };

    def.$length = function() {
      var self = this;
      return self.keys.length;
    };

    $opal.defn(self, '$member?', def['$has_key?']);

    def.$merge = TMP_8 = function(other) {
      var self = this, $iter = TMP_8._p, block = $iter || nil;
      TMP_8._p = null;
      
      var keys = self.keys, map = self.map,
          result = $hash(), keys2 = result.keys, map2 = result.map;

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i];

        keys2.push(key);
        map2[key] = map[key];
      }

      var keys = other.keys, map = other.map;

      if (block === nil) {
        for (var i = 0, length = keys.length; i < length; i++) {
          var key = keys[i];

          if (map2[key] == null) {
            keys2.push(key);
          }

          map2[key] = map[key];
        }
      }
      else {
        for (var i = 0, length = keys.length; i < length; i++) {
          var key = keys[i];

          if (map2[key] == null) {
            keys2.push(key);
            map2[key] = map[key];
          }
          else {
            map2[key] = block(key, map2[key], map[key]);
          }
        }
      }

      return result;
    
    };

    def['$merge!'] = TMP_9 = function(other) {
      var self = this, $iter = TMP_9._p, block = $iter || nil;
      TMP_9._p = null;
      
      var keys = self.keys, map = self.map,
          keys2 = other.keys, map2 = other.map;

      if (block === nil) {
        for (var i = 0, length = keys2.length; i < length; i++) {
          var key = keys2[i];

          if (map[key] == null) {
            keys.push(key);
          }

          map[key] = map2[key];
        }
      }
      else {
        for (var i = 0, length = keys2.length; i < length; i++) {
          var key = keys2[i];

          if (map[key] == null) {
            keys.push(key);
            map[key] = map2[key];
          }
          else {
            map[key] = block(key, map[key], map2[key]);
          }
        }
      }

      return self;
    
    };

    def.$rassoc = function(object) {
      var self = this;
      
      var keys = self.keys, map = self.map;

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i], obj = map[key];

        if ((obj)['$=='](object)) {
          return [key, obj];
        }
      }

      return nil;
    
    };

    def.$reject = TMP_10 = function() {
      var $a, self = this, $iter = TMP_10._p, block = $iter || nil;
      TMP_10._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("reject")};
      
      var keys = self.keys, map = self.map,
          result = $hash(), map2 = result.map, keys2 = result.keys;

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i], obj = map[key], value;

        if ((value = block(key, obj)) === $breaker) {
          return $breaker.$v;
        }

        if (value === false || value === nil) {
          keys2.push(key);
          map2[key] = obj;
        }
      }

      return result;
    
    };

    def.$replace = function(other) {
      var self = this;
      
      var map = self.map = {}, keys = self.keys = [];

      for (var i = 0, length = other.keys.length; i < length; i++) {
        var key = other.keys[i];
        keys.push(key);
        map[key] = other.map[key];
      }

      return self;
    
    };

    def.$select = TMP_11 = function() {
      var $a, self = this, $iter = TMP_11._p, block = $iter || nil;
      TMP_11._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("select")};
      
      var keys = self.keys, map = self.map,
          result = $hash(), map2 = result.map, keys2 = result.keys;

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i], obj = map[key], value;

        if ((value = block(key, obj)) === $breaker) {
          return $breaker.$v;
        }

        if (value !== false && value !== nil) {
          keys2.push(key);
          map2[key] = obj;
        }
      }

      return result;
    
    };

    def['$select!'] = TMP_12 = function() {
      var $a, self = this, $iter = TMP_12._p, block = $iter || nil;
      TMP_12._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("select!")};
      
      var map = self.map, keys = self.keys, value, result = nil;

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i], obj = map[key];

        if ((value = block(key, obj)) === $breaker) {
          return $breaker.$v;
        }

        if (value === false || value === nil) {
          keys.splice(i, 1);
          delete map[key];

          length--;
          i--;
          result = self
        }
      }

      return result;
    
    };

    def.$shift = function() {
      var self = this;
      
      var keys = self.keys, map = self.map;

      if (keys.length) {
        var key = keys[0], obj = map[key];

        delete map[key];
        keys.splice(0, 1);

        return [key, obj];
      }

      return nil;
    
    };

    $opal.defn(self, '$size', def.$length);

    self.$alias_method("store", "[]=");

    def.$to_a = function() {
      var self = this;
      
      var keys = self.keys, map = self.map, result = [];

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i];
        result.push([key, map[key]]);
      }

      return result;
    
    };

    def.$to_hash = function() {
      var self = this;
      return self;
    };

    def.$to_n = function() {
      var self = this;
      
      var result = {},
          keys   = self.keys,
          map    = self.map,
          bucket,
          value;

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i],
            obj = map[key];

        if ((obj)['$respond_to?']("to_n")) {
          result[key] = (obj).$to_n();
        }
        else {
          result[key] = obj;
        }
      }

      return result;
    ;
    };

    $opal.defn(self, '$to_s', def.$inspect);

    $opal.defn(self, '$update', def['$merge!']);

    $opal.defn(self, '$value?', def['$has_value?']);

    $opal.defn(self, '$values_at', def.$indexes);

    return (def.$values = function() {
      var self = this;
      
      var map    = self.map,
          result = [];

      for (var key in map) {
        result.push(map[key]);
      }

      return result;
    
    }, nil);
  })(self, null)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var $a, self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$include', '$to_str', '$===', '$format', '$respond_to?', '$raise', '$name', '$class', '$=~', '$<=>', '$ljust', '$floor', '$/', '$+', '$rjust', '$ceil', '$to_a', '$each_char', '$enum_for', '$split', '$chomp', '$escape', '$to_i', '$each_line', '$match', '$to_proc', '$new', '$is_a?', '$[]', '$str', '$to_s', '$value', '$try_convert']);
  (function($base, $super) {
    function String(){};
    var self = String = $klass($base, $super, 'String', String);

    var def = String._proto, $scope = String._scope, $a, TMP_1, TMP_2, TMP_3, TMP_4, TMP_5, TMP_6;
    def.length = nil;
    self.$include((($a = $scope.Comparable) == null ? $opal.cm('Comparable') : $a));

    def._isString = true;

    var native_string = "".constructor;

    $opal.defs(self, '$try_convert', function(what) {
      var self = this;
      try {
      return what.$to_str()
      } catch ($err) {if (true) {
        return nil
        }else { throw $err; }
      };
    });

    $opal.defs(self, '$new', function(str) {
      var self = this;
      if (str == null) {
        str = ""
      }
      return new native_string(str);
    });

    def['$%'] = function(data) {
      var $a, $b, self = this;
      if (($a = (($b = $scope.Array) == null ? $opal.cm('Array') : $b)['$==='](data)) !== false && $a !== nil) {
        return ($a = self).$format.apply($a, [self].concat(data))
        } else {
        return self.$format(self, data)
      };
    };

    def['$*'] = function(count) {
      var self = this;
      
      if (count < 1) {
        return '';
      }

      var result  = '',
          pattern = self;

      while (count > 0) {
        if (count & 1) {
          result += pattern;
        }

        count >>= 1;
        pattern += pattern;
      }

      return result;
    
    };

    def['$+'] = function(other) {
      var $a, self = this;
      
      if (other._isString) {
        return self + other;
      }
    
      if (($a = other['$respond_to?']("to_str")) === false || $a === nil) {
        self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "no implicit conversion of " + (other.$class().$name()) + " into String")};
      return self + other.$to_str();
    };

    def['$<=>'] = function(other) {
      var $a, self = this;
      
      if (other._isString) {
        return self > other ? 1 : (self < other ? -1 : 0);
      }
    
      if (($a = other['$respond_to?']("to_str")) !== false && $a !== nil) {
        other = other.$to_str();
        return self > other ? 1 : (self < other ? -1 : 0);
        } else {
        return nil
      };
    };

    def['$=='] = function(other) {
      var self = this;
      return !!(other._isString && self.valueOf() === other.valueOf());
    };

    $opal.defn(self, '$===', def['$==']);

    def['$=~'] = function(other) {
      var $a, self = this;
      
      if (other._isString) {
        self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "type mismatch: String given");
      }

      return other['$=~'](self);
    ;
    };

    def['$[]'] = function(index, length) {
      var self = this;
      
      var size = self.length;

      if (index._isRange) {
        var exclude = index.exclude,
            length  = index.end,
            index   = index.begin;

        if (index < 0) {
          index += size;
        }

        if (length < 0) {
          length += size;
        }

        if (!exclude) {
          length += 1;
        }

        if (index > size) {
          return nil;
        }

        length = length - index;

        if (length < 0) {
          length = 0;
        }

        return self.substr(index, length);
      }

      if (index < 0) {
        index += self.length;
      }

      if (length == null) {
        if (index >= self.length || index < 0) {
          return nil;
        }

        return self.substr(index, 1);
      }

      if (index > self.length || index < 0) {
        return nil;
      }

      return self.substr(index, length);
    
    };

    def.$capitalize = function() {
      var self = this;
      return self.charAt(0).toUpperCase() + self.substr(1).toLowerCase();
    };

    def.$casecmp = function(other) {
      var $a, self = this;
      
      if (other._isString) {
        return (self.toLowerCase())['$<=>'](other.toLowerCase());
      }
    ;
      if (($a = other['$respond_to?']("to_str")) === false || $a === nil) {
        self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "no implicit conversion of " + (other.$class().$name()) + " into String")};
      return (self.toLowerCase())['$<=>'](other.$to_str().toLowerCase());
    };

    def.$center = function(width, padstr) {
      var $a, self = this;
      if (padstr == null) {
        padstr = " "
      }
      if (($a = width === self.length) !== false && $a !== nil) {
        return self};
      
      var ljustified = self.$ljust((width['$+'](self.length))['$/'](2).$floor(), padstr),
          rjustified = self.$rjust((width['$+'](self.length))['$/'](2).$ceil(), padstr);

      return ljustified + rjustified.slice(self.length);
    ;
    };

    def.$chars = function() {
      var self = this;
      return self.$each_char().$to_a();
    };

    def.$chomp = function(separator) {
      var $a, self = this;
      if (separator == null) {
        separator = $gvars["/"]
      }
      if (($a = separator === nil || self.length === 0) !== false && $a !== nil) {
        return self};
      if (($a = separator._isString == null) !== false && $a !== nil) {
        if (($a = separator['$respond_to?']("to_str")) === false || $a === nil) {
          self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "no implicit conversion of " + (separator.$class().$name()) + " into String")};
        separator = separator.$to_str();};
      
      if (separator === "\n") {
        return self.replace(/\r?\n?$/, '');
      }
      else if (separator === "") {
        return self.replace(/(\r?\n)+$/, '');
      }
      else if (self.length > separator.length) {
        var tail = self.substr(-1 * separator.length);

        if (tail === separator) {
          return self.substr(0, self.length - separator.length);
        }
      }
    
      return self;
    };

    def.$chop = function() {
      var self = this;
      return self.substr(0, self.length - 1);
    };

    def.$chr = function() {
      var self = this;
      return self.charAt(0);
    };

    def.$clone = function() {
      var self = this;
      return self.slice();
    };

    def.$count = function(str) {
      var self = this;
      return (self.length - self.replace(new RegExp(str, 'g'), '').length) / str.length;
    };

    $opal.defn(self, '$dup', def.$clone);

    def.$downcase = function() {
      var self = this;
      return self.toLowerCase();
    };

    def.$each_char = TMP_1 = function() {
      var $a, self = this, $iter = TMP_1._p, block = $iter || nil;
      TMP_1._p = null;
      if (block === nil) {
        return self.$enum_for("each_char")};
      
      for (var i = 0, length = self.length; i < length; i++) {
        ((($a = $opal.$yield1(block, self.charAt(i))) === $breaker) ? $breaker.$v : $a);
      }
    
      return self;
    };

    def.$each_line = TMP_2 = function(separator) {
      var $a, self = this, $iter = TMP_2._p, $yield = $iter || nil;
      if (separator == null) {
        separator = $gvars["/"]
      }
      TMP_2._p = null;
      if ($yield === nil) {
        return self.$split(separator)};
      
      var chomped  = self.$chomp(),
          trailing = self.length != chomped.length,
          splitted = chomped.split(separator);

      for (var i = 0, length = splitted.length; i < length; i++) {
        if (i < length - 1 || trailing) {
          ((($a = $opal.$yield1($yield, splitted[i] + separator)) === $breaker) ? $breaker.$v : $a);
        }
        else {
          ((($a = $opal.$yield1($yield, splitted[i])) === $breaker) ? $breaker.$v : $a);
        }
      }
    ;
      return self;
    };

    def['$empty?'] = function() {
      var self = this;
      return self.length === 0;
    };

    def['$end_with?'] = function(suffixes) {
      var self = this;
      suffixes = $slice.call(arguments, 0);
      
      for (var i = 0, length = suffixes.length; i < length; i++) {
        var suffix = suffixes[i];

        if (self.length >= suffix.length && self.substr(0 - suffix.length) === suffix) {
          return true;
        }
      }
    
      return false;
    };

    $opal.defn(self, '$eql?', def['$==']);

    $opal.defn(self, '$equal?', def['$===']);

    def.$gsub = TMP_3 = function(pattern, replace) {
      var $a, $b, $c, self = this, $iter = TMP_3._p, block = $iter || nil;
      TMP_3._p = null;
      if (($a = ((($b = (($c = $scope.String) == null ? $opal.cm('String') : $c)['$==='](pattern)) !== false && $b !== nil) ? $b : pattern['$respond_to?']("to_str"))) !== false && $a !== nil) {
        pattern = (new RegExp("" + (($a = $scope.Regexp) == null ? $opal.cm('Regexp') : $a).$escape(pattern.$to_str())))};
      if (($a = (($b = $scope.Regexp) == null ? $opal.cm('Regexp') : $b)['$==='](pattern)) === false || $a === nil) {
        self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "wrong argument type " + (pattern.$class()) + " (expected Regexp)")};
      
      var pattern = pattern.toString(),
          options = pattern.substr(pattern.lastIndexOf('/') + 1) + 'g',
          regexp  = pattern.substr(1, pattern.lastIndexOf('/') - 1);

      self.$sub._p = block;
      return self.$sub(new RegExp(regexp, options), replace);
    
    };

    def.$hash = function() {
      var self = this;
      return self.toString();
    };

    def.$hex = function() {
      var self = this;
      return self.$to_i(16);
    };

    def['$include?'] = function(other) {
      var $a, self = this;
      
      if (other._isString) {
        return self.indexOf(other) !== -1;
      }
    
      if (($a = other['$respond_to?']("to_str")) === false || $a === nil) {
        self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "no implicit conversion of " + (other.$class().$name()) + " into String")};
      return self.indexOf(other.$to_str()) !== -1;
    };

    def.$index = function(what, offset) {
      var $a, self = this;
      if (offset == null) {
        offset = nil
      }
      
      if (!(what._isString || what._isRegexp)) {
        self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "type mismatch: " + (what.$class()) + " given");
      }

      var result = -1;

      if (offset !== nil) {
        if (offset < 0) {
          offset = offset + self.length;
        }

        if (offset > self.length) {
          return nil;
        }

        if (what._isRegexp) {
          result = ((($a = (what['$=~'](self.substr(offset)))) !== false && $a !== nil) ? $a : -1)
        }
        else {
          result = self.substr(offset).indexOf(what);
        }

        if (result !== -1) {
          result += offset;
        }
      }
      else {
        if (what._isRegexp) {
          result = ((($a = (what['$=~'](self))) !== false && $a !== nil) ? $a : -1)
        }
        else {
          result = self.indexOf(what);
        }
      }

      return result === -1 ? nil : result;
    ;
    };

    def.$inspect = function() {
      var self = this;
      
      var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
          meta      = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
          };

      escapable.lastIndex = 0;

      return escapable.test(self) ? '"' + self.replace(escapable, function(a) {
        var c = meta[a];

        return typeof c === 'string' ? c :
          '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      }) + '"' : '"' + self + '"';
    
    };

    def.$intern = function() {
      var self = this;
      return self;
    };

    def.$lines = function(separator) {
      var self = this;
      if (separator == null) {
        separator = $gvars["/"]
      }
      return self.$each_line(separator).$to_a();
    };

    def.$length = function() {
      var self = this;
      return self.length;
    };

    def.$ljust = function(width, padstr) {
      var $a, self = this;
      if (padstr == null) {
        padstr = " "
      }
      if (($a = width <= self.length) !== false && $a !== nil) {
        return self};
      
      var index  = -1,
          result = "";

      width -= self.length;

      while (++index < width) {
        result += padstr;
      }

      return self + result.slice(0, width);
    
    };

    def.$lstrip = function() {
      var self = this;
      return self.replace(/^\s*/, '');
    };

    def.$match = TMP_4 = function(pattern, pos) {
      var $a, $b, $c, self = this, $iter = TMP_4._p, block = $iter || nil;
      TMP_4._p = null;
      if (($a = ((($b = (($c = $scope.String) == null ? $opal.cm('String') : $c)['$==='](pattern)) !== false && $b !== nil) ? $b : pattern['$respond_to?']("to_str"))) !== false && $a !== nil) {
        pattern = (new RegExp("" + (($a = $scope.Regexp) == null ? $opal.cm('Regexp') : $a).$escape(pattern.$to_str())))};
      if (($a = (($b = $scope.Regexp) == null ? $opal.cm('Regexp') : $b)['$==='](pattern)) === false || $a === nil) {
        self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "wrong argument type " + (pattern.$class()) + " (expected Regexp)")};
      return ($a = ($b = pattern).$match, $a._p = block.$to_proc(), $a).call($b, self, pos);
    };

    def.$next = function() {
      var self = this;
      
      if (self.length === 0) {
        return "";
      }

      var initial = self.substr(0, self.length - 1);
      var last    = native_string.fromCharCode(self.charCodeAt(self.length - 1) + 1);

      return initial + last;
    ;
    };

    def.$ord = function() {
      var self = this;
      return self.charCodeAt(0);
    };

    def.$partition = function(str) {
      var self = this;
      
      var result = self.split(str);
      var splitter = (result[0].length === self.length ? "" : str);

      return [result[0], splitter, result.slice(1).join(str.toString())];
    ;
    };

    def.$reverse = function() {
      var self = this;
      return self.split('').reverse().join('');
    };

    def.$rindex = function(search, offset) {
      var $a, self = this;
      
      var search_type = (search == null ? Opal.NilClass : search.constructor);
      if (search_type != native_string && search_type != RegExp) {
        var msg = "type mismatch: " + search_type + " given";
        self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a).$new(msg));
      }

      if (self.length == 0) {
        return search.length == 0 ? 0 : nil;
      }

      var result = -1;
      if (offset != null) {
        if (offset < 0) {
          offset = self.length + offset;
        }

        if (search_type == native_string) {
          result = self.lastIndexOf(search, offset);
        }
        else {
          result = self.substr(0, offset + 1).$reverse().search(search);
          if (result !== -1) {
            result = offset - result;
          }
        }
      }
      else {
        if (search_type == native_string) {
          result = self.lastIndexOf(search);
        }
        else {
          result = self.$reverse().search(search);
          if (result !== -1) {
            result = self.length - 1 - result;
          }
        }
      }

      return result === -1 ? nil : result;
    
    };

    def.$rjust = function(width, padstr) {
      var $a, self = this;
      if (padstr == null) {
        padstr = " "
      }
      if (($a = width <= self.length) !== false && $a !== nil) {
        return self};
      
      var chars     = Math.floor(width - self.length),
          patterns  = Math.floor(chars / padstr.length),
          result    = Array(patterns + 1).join(padstr),
          remaining = chars - result.length;

      return result + padstr.slice(0, remaining) + self;
    
    };

    def.$rstrip = function() {
      var self = this;
      return self.replace(/\s*$/, '');
    };

    def.$scan = TMP_5 = function(pattern) {
      var $a, self = this, $iter = TMP_5._p, block = $iter || nil;
      TMP_5._p = null;
      
      if (pattern.global) {
        // should we clear it afterwards too?
        pattern.lastIndex = 0;
      }
      else {
        // rewrite regular expression to add the global flag to capture pre/post match
        pattern = new RegExp(pattern.source, 'g' + (pattern.multiline ? 'm' : '') + (pattern.ignoreCase ? 'i' : ''));
      }

      var result = [];
      var match;

      while ((match = pattern.exec(self)) != null) {
        var match_data = (($a = $scope.MatchData) == null ? $opal.cm('MatchData') : $a).$new(pattern, match);
        if (block === nil) {
          match.length == 1 ? result.push(match[0]) : result.push(match.slice(1));
        }
        else {
          match.length == 1 ? block(match[0]) : block.apply(self, match.slice(1));
        }
      }

      return (block !== nil ? self : result);
    ;
    };

    $opal.defn(self, '$size', def.$length);

    $opal.defn(self, '$slice', def['$[]']);

    def.$split = function(pattern, limit) {
      var self = this, $a;
      if (pattern == null) {
        pattern = ((($a = $gvars[";"]) !== false && $a !== nil) ? $a : " ")
      }
      return self.split(pattern, limit);
    };

    def['$start_with?'] = function(prefixes) {
      var self = this;
      prefixes = $slice.call(arguments, 0);
      
      for (var i = 0, length = prefixes.length; i < length; i++) {
        if (self.indexOf(prefixes[i]) === 0) {
          return true;
        }
      }

      return false;
    
    };

    def.$strip = function() {
      var self = this;
      return self.replace(/^\s*/, '').replace(/\s*$/, '');
    };

    def.$sub = TMP_6 = function(pattern, replace) {
      var $a, self = this, $iter = TMP_6._p, block = $iter || nil;
      TMP_6._p = null;
      
      if (typeof(replace) === 'string') {
        // convert Ruby back reference to JavaScript back reference
        replace = replace.replace(/\\([1-9])/g, '$$$1')
        return self.replace(pattern, replace);
      }
      if (block !== nil) {
        return self.replace(pattern, function() {
          // FIXME: this should be a formal MatchData object with all the goodies
          var match_data = []
          for (var i = 0, len = arguments.length; i < len; i++) {
            var arg = arguments[i];
            if (arg == undefined) {
              match_data.push(nil);
            }
            else {
              match_data.push(arg);
            }
          }

          var str = match_data.pop();
          var offset = match_data.pop();
          var match_len = match_data.length;

          // $1, $2, $3 not being parsed correctly in Ruby code
          //for (var i = 1; i < match_len; i++) {
          //  __gvars[String(i)] = match_data[i];
          //}
          $gvars["&"] = match_data[0];
          $gvars["~"] = match_data;
          return block(match_data[0]);
        });
      }
      else if (replace !== undefined) {
        if (replace['$is_a?']((($a = $scope.Hash) == null ? $opal.cm('Hash') : $a))) {
          return self.replace(pattern, function(str) {
            var value = replace['$[]'](self.$str());

            return (value == null) ? nil : self.$value().$to_s();
          });
        }
        else {
          replace = (($a = $scope.String) == null ? $opal.cm('String') : $a).$try_convert(replace);

          if (replace == null) {
            self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "can't convert " + (replace.$class()) + " into String");
          }

          return self.replace(pattern, replace);
        }
      }
      else {
        // convert Ruby back reference to JavaScript back reference
        replace = replace.toString().replace(/\\([1-9])/g, '$$$1')
        return self.replace(pattern, replace);
      }
    ;
    };

    $opal.defn(self, '$succ', def.$next);

    def.$sum = function(n) {
      var self = this;
      if (n == null) {
        n = 16
      }
      
      var result = 0;

      for (var i = 0, length = self.length; i < length; i++) {
        result += (self.charCodeAt(i) % ((1 << n) - 1));
      }

      return result;
    
    };

    def.$swapcase = function() {
      var self = this;
      
      var str = self.replace(/([a-z]+)|([A-Z]+)/g, function($0,$1,$2) {
        return $1 ? $0.toUpperCase() : $0.toLowerCase();
      });

      if (self.constructor === native_string) {
        return str;
      }

      return self.$class().$new(str);
    ;
    };

    def.$to_a = function() {
      var self = this;
      
      if (self.length === 0) {
        return [];
      }

      return [self];
    ;
    };

    def.$to_f = function() {
      var self = this;
      
      var result = parseFloat(self);

      return isNaN(result) ? 0 : result;
    ;
    };

    def.$to_i = function(base) {
      var self = this;
      if (base == null) {
        base = 10
      }
      
      var result = parseInt(self, base);

      if (isNaN(result)) {
        return 0;
      }

      return result;
    ;
    };

    def.$to_proc = function() {
      var self = this;
      
      var name = '$' + self;

      return function(arg) {
        var meth = arg[name];
        return meth ? meth.call(arg) : arg.$method_missing(name);
      };
    ;
    };

    def.$to_s = function() {
      var self = this;
      return self.toString();
    };

    $opal.defn(self, '$to_str', def.$to_s);

    $opal.defn(self, '$to_sym', def.$intern);

    def.$to_n = function() {
      var self = this;
      return self.valueOf();
    };

    def.$tr = function(from, to) {
      var self = this;
      
      if (from.length == 0 || from === to) {
        return self;
      }

      var subs = {};
      var from_chars = from.split('');
      var from_length = from_chars.length;
      var to_chars = to.split('');
      var to_length = to_chars.length;

      var inverse = false;
      var global_sub = null;
      if (from_chars[0] === '^') {
        inverse = true;
        from_chars.shift();
        global_sub = to_chars[to_length - 1]
        from_length -= 1;
      }

      var from_chars_expanded = [];
      var last_from = null;
      var in_range = false;
      for (var i = 0; i < from_length; i++) {
        var char = from_chars[i];
        if (last_from == null) {
          last_from = char;
          from_chars_expanded.push(char);
        }
        else if (char === '-') {
          if (last_from === '-') {
            from_chars_expanded.push('-');
            from_chars_expanded.push('-');
          }
          else if (i == from_length - 1) {
            from_chars_expanded.push('-');
          }
          else {
            in_range = true;
          }
        }
        else if (in_range) {
          var start = last_from.charCodeAt(0) + 1;
          var end = char.charCodeAt(0);
          for (var c = start; c < end; c++) {
            from_chars_expanded.push(native_string.fromCharCode(c));
          }
          from_chars_expanded.push(char);
          in_range = null;
          last_from = null;
        }
        else {
          from_chars_expanded.push(char);
        }
      }

      from_chars = from_chars_expanded;
      from_length = from_chars.length;

      if (inverse) {
        for (var i = 0; i < from_length; i++) {
          subs[from_chars[i]] = true;
        }
      }
      else {
        if (to_length > 0) {
          var to_chars_expanded = [];
          var last_to = null;
          var in_range = false;
          for (var i = 0; i < to_length; i++) {
            var char = to_chars[i];
            if (last_from == null) {
              last_from = char;
              to_chars_expanded.push(char);
            }
            else if (char === '-') {
              if (last_to === '-') {
                to_chars_expanded.push('-');
                to_chars_expanded.push('-');
              }
              else if (i == to_length - 1) {
                to_chars_expanded.push('-');
              }
              else {
                in_range = true;
              }
            }
            else if (in_range) {
              var start = last_from.charCodeAt(0) + 1;
              var end = char.charCodeAt(0);
              for (var c = start; c < end; c++) {
                to_chars_expanded.push(native_string.fromCharCode(c));
              }
              to_chars_expanded.push(char);
              in_range = null;
              last_from = null;
            }
            else {
              to_chars_expanded.push(char);
            }
          }

          to_chars = to_chars_expanded;
          to_length = to_chars.length;
        }

        var length_diff = from_length - to_length;
        if (length_diff > 0) {
          var pad_char = (to_length > 0 ? to_chars[to_length - 1] : '');
          for (var i = 0; i < length_diff; i++) {
            to_chars.push(pad_char);
          }
        }

        for (var i = 0; i < from_length; i++) {
          subs[from_chars[i]] = to_chars[i];
        }
      }

      var new_str = ''
      for (var i = 0, length = self.length; i < length; i++) {
        var char = self.charAt(i);
        var sub = subs[char];
        if (inverse) {
          new_str += (sub == null ? global_sub : char);
        }
        else {
          new_str += (sub != null ? sub : char);
        }
      }
      return new_str;
    ;
    };

    def.$tr_s = function(from, to) {
      var self = this;
      
      if (from.length == 0) {
        return self;
      }

      var subs = {};
      var from_chars = from.split('');
      var from_length = from_chars.length;
      var to_chars = to.split('');
      var to_length = to_chars.length;

      var inverse = false;
      var global_sub = null;
      if (from_chars[0] === '^') {
        inverse = true;
        from_chars.shift();
        global_sub = to_chars[to_length - 1]
        from_length -= 1;
      }

      var from_chars_expanded = [];
      var last_from = null;
      var in_range = false;
      for (var i = 0; i < from_length; i++) {
        var char = from_chars[i];
        if (last_from == null) {
          last_from = char;
          from_chars_expanded.push(char);
        }
        else if (char === '-') {
          if (last_from === '-') {
            from_chars_expanded.push('-');
            from_chars_expanded.push('-');
          }
          else if (i == from_length - 1) {
            from_chars_expanded.push('-');
          }
          else {
            in_range = true;
          }
        }
        else if (in_range) {
          var start = last_from.charCodeAt(0) + 1;
          var end = char.charCodeAt(0);
          for (var c = start; c < end; c++) {
            from_chars_expanded.push(native_string.fromCharCode(c));
          }
          from_chars_expanded.push(char);
          in_range = null;
          last_from = null;
        }
        else {
          from_chars_expanded.push(char);
        }
      }

      from_chars = from_chars_expanded;
      from_length = from_chars.length;

      if (inverse) {
        for (var i = 0; i < from_length; i++) {
          subs[from_chars[i]] = true;
        }
      }
      else {
        if (to_length > 0) {
          var to_chars_expanded = [];
          var last_to = null;
          var in_range = false;
          for (var i = 0; i < to_length; i++) {
            var char = to_chars[i];
            if (last_from == null) {
              last_from = char;
              to_chars_expanded.push(char);
            }
            else if (char === '-') {
              if (last_to === '-') {
                to_chars_expanded.push('-');
                to_chars_expanded.push('-');
              }
              else if (i == to_length - 1) {
                to_chars_expanded.push('-');
              }
              else {
                in_range = true;
              }
            }
            else if (in_range) {
              var start = last_from.charCodeAt(0) + 1;
              var end = char.charCodeAt(0);
              for (var c = start; c < end; c++) {
                to_chars_expanded.push(native_string.fromCharCode(c));
              }
              to_chars_expanded.push(char);
              in_range = null;
              last_from = null;
            }
            else {
              to_chars_expanded.push(char);
            }
          }

          to_chars = to_chars_expanded;
          to_length = to_chars.length;
        }

        var length_diff = from_length - to_length;
        if (length_diff > 0) {
          var pad_char = (to_length > 0 ? to_chars[to_length - 1] : '');
          for (var i = 0; i < length_diff; i++) {
            to_chars.push(pad_char);
          }
        }

        for (var i = 0; i < from_length; i++) {
          subs[from_chars[i]] = to_chars[i];
        }
      }
      var new_str = ''
      var last_substitute = null
      for (var i = 0, length = self.length; i < length; i++) {
        var char = self.charAt(i);
        var sub = subs[char]
        if (inverse) {
          if (sub == null) {
            if (last_substitute == null) {
              new_str += global_sub;
              last_substitute = true;
            }
          }
          else {
            new_str += char;
            last_substitute = null;
          }
        }
        else {
          if (sub != null) {
            if (last_substitute == null || last_substitute !== sub) {
              new_str += sub;
              last_substitute = sub;
            }
          }
          else {
            new_str += char;
            last_substitute = null;
          }
        }
      }
      return new_str;
    ;
    };

    def.$upcase = function() {
      var self = this;
      return self.toUpperCase();
    };

    def.$freeze = function() {
      var self = this;
      return self;
    };

    return (def['$frozen?'] = function() {
      var self = this;
      return true;
    }, nil);
  })(self, null);
  return $opal.cdecl($scope, 'Symbol', (($a = $scope.String) == null ? $opal.cm('String') : $a));
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$attr_reader', '$pre_match', '$post_match', '$[]', '$===', '$==', '$raise', '$inspect']);
  return (function($base, $super) {
    function MatchData(){};
    var self = MatchData = $klass($base, $super, 'MatchData', MatchData);

    var def = MatchData._proto, $scope = MatchData._scope, TMP_1;
    def.string = def.matches = def.begin = nil;
    self.$attr_reader("post_match", "pre_match", "regexp", "string");

    $opal.defs(self, '$new', TMP_1 = function(regexp, match_groups) {
      var self = this, $iter = TMP_1._p, $yield = $iter || nil, data = nil;
      TMP_1._p = null;
      data = $opal.find_super_dispatcher(self, 'new', TMP_1, null, MatchData).apply(self, [regexp, match_groups]);
      $gvars["`"] = data.$pre_match();
      $gvars["'"] = data.$post_match();
      $gvars["~"] = data;
      return data;
    });

    def.$initialize = function(regexp, match_groups) {
      var self = this;
      self.regexp = regexp;
      self.begin = match_groups.index;
      self.string = match_groups.input;
      self.pre_match = self.string.substr(0, regexp.lastIndex - match_groups[0].length);
      self.post_match = self.string.substr(regexp.lastIndex);
      self.matches = [];
      
      for (var i = 0, length = match_groups.length; i < length; i++) {
        var group = match_groups[i];

        if (group == null) {
          self.matches.push(nil);
        }
        else {
          self.matches.push(group);
        }
      }
    
    };

    def['$[]'] = function(args) {
      var $a, self = this;
      args = $slice.call(arguments, 0);
      return ($a = self.matches)['$[]'].apply($a, [].concat(args));
    };

    def['$=='] = function(other) {
      var $a, $b, $c, $d, self = this;
      if (($a = (($b = $scope.MatchData) == null ? $opal.cm('MatchData') : $b)['$==='](other)) === false || $a === nil) {
        return false};
      return ($a = ($b = ($c = ($d = self.string == other.string, $d !== false && $d !== nil ?self.regexp == other.regexp : $d), $c !== false && $c !== nil ?self.pre_match == other.pre_match : $c), $b !== false && $b !== nil ?self.post_match == other.post_match : $b), $a !== false && $a !== nil ?self.begin == other.begin : $a);
    };

    def.$begin = function(pos) {
      var $a, $b, $c, self = this;
      if (($a = ($b = ($c = pos['$=='](0), ($c === nil || $c === false)), $b !== false && $b !== nil ?($c = pos['$=='](1), ($c === nil || $c === false)) : $b)) !== false && $a !== nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "MatchData#begin only supports 0th element")};
      return self.begin;
    };

    def.$captures = function() {
      var self = this;
      return self.matches.slice(1);
    };

    def.$inspect = function() {
      var self = this;
      
      var str = "#<MatchData " + (self.matches[0]).$inspect();

      for (var i = 1, length = self.matches.length; i < length; i++) {
        str += " " + i + ":" + (self.matches[i]).$inspect();
      }

      return str + ">";
    ;
    };

    def.$length = function() {
      var self = this;
      return self.matches.length;
    };

    $opal.defn(self, '$size', def.$length);

    def.$to_a = function() {
      var self = this;
      return self.matches;
    };

    def.$to_s = function() {
      var self = this;
      return self.matches[0];
    };

    def.$to_n = function() {
      var self = this;
      return self.matches;
    };

    return (def.$values_at = function(indexes) {
      var self = this;
      indexes = $slice.call(arguments, 0);
      
      var values       = [],
          match_length = self.matches.length;

      for (var i = 0, length = indexes.length; i < length; i++) {
        var pos = indexes[i];

        if (pos >= 0) {
          values.push(self.matches[pos]);
        }
        else {
          pos += match_length;

          if (pos > 0) {
            values.push(self.matches[pos]);
          }
          else {
            values.push(nil);
          }
        }
      }

      return values;
    ;
    }, nil);
  })(self, null)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var TMP_4, $a, $b, $c, TMP_6, $d, TMP_8, $e, self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass, $hash2 = $opal.hash2;
  $opal.add_stubs(['$+', '$[]', '$new', '$to_proc', '$each', '$const_set', '$sub', '$===', '$const_get', '$==', '$name', '$include?', '$names', '$constants', '$raise', '$attr_accessor', '$attr_reader', '$register', '$length', '$bytes', '$to_a', '$each_byte', '$bytesize', '$enum_for', '$find', '$getbyte']);
  (function($base, $super) {
    function Encoding(){};
    var self = Encoding = $klass($base, $super, 'Encoding', Encoding);

    var def = Encoding._proto, $scope = Encoding._scope, TMP_1;
    def.ascii = def.dummy = def.name = nil;
    $opal.defs(self, '$register', TMP_1 = function(name, options) {
      var $a, $b, $c, TMP_2, self = this, $iter = TMP_1._p, block = $iter || nil, names = nil, encoding = nil;
      if (options == null) {
        options = $hash2([], {})
      }
      TMP_1._p = null;
      names = [name]['$+']((((($a = options['$[]']("aliases")) !== false && $a !== nil) ? $a : [])));
      encoding = ($a = ($b = (($c = $scope.Class) == null ? $opal.cm('Class') : $c)).$new, $a._p = block.$to_proc(), $a).call($b, self).$new(name, names, ((($a = options['$[]']("ascii")) !== false && $a !== nil) ? $a : false), ((($a = options['$[]']("dummy")) !== false && $a !== nil) ? $a : false));
      return ($a = ($c = names).$each, $a._p = (TMP_2 = function(name) {var self = TMP_2._s || this;if (name == null) name = nil;
        return self.$const_set(name.$sub("-", "_"), encoding)}, TMP_2._s = self, TMP_2), $a).call($c);
    });

    $opal.defs(self, '$find', function(name) {try {

      var $a, TMP_3, $b, self = this;
      if (($a = self['$==='](name)) !== false && $a !== nil) {
        return name};
      ($a = ($b = self.$constants()).$each, $a._p = (TMP_3 = function(const$) {var self = TMP_3._s || this, $a, $b, encoding = nil;if (const$ == null) const$ = nil;
        encoding = self.$const_get(const$);
        if (($a = ((($b = encoding.$name()['$=='](name)) !== false && $b !== nil) ? $b : encoding.$names()['$include?'](name))) !== false && $a !== nil) {
          $opal.$return(encoding)
          } else {
          return nil
        };}, TMP_3._s = self, TMP_3), $a).call($b);
      return self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "unknown encoding name - " + (name));
      } catch ($returner) { if ($returner === $opal.returner) { return $returner.$v } throw $returner; }
    });

    (function(self) {
      var $scope = self._scope, def = self._proto;
      return self.$attr_accessor("default_external")
    })(self.$singleton_class());

    self.$attr_reader("name", "names");

    def.$initialize = function(name, names, ascii, dummy) {
      var self = this;
      self.name = name;
      self.names = names;
      self.ascii = ascii;
      return self.dummy = dummy;
    };

    def['$ascii_compatible?'] = function() {
      var self = this;
      return self.ascii;
    };

    def['$dummy?'] = function() {
      var self = this;
      return self.dummy;
    };

    def.$to_s = function() {
      var self = this;
      return self.name;
    };

    def.$inspect = function() {
      var $a, self = this;
      return "#<Encoding:" + (self.name) + ((function() {if (($a = self.dummy) !== false && $a !== nil) {
        return " (dummy)"
        } else {
        return nil
      }; return nil; })()) + ">";
    };

    def.$each_byte = function() {
      var $a, self = this;
      return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
    };

    def.$getbyte = function() {
      var $a, self = this;
      return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
    };

    return (def.$bytesize = function() {
      var $a, self = this;
      return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
    }, nil);
  })(self, null);
  ($a = ($b = (($c = $scope.Encoding) == null ? $opal.cm('Encoding') : $c)).$register, $a._p = (TMP_4 = function() {var self = TMP_4._s || this, TMP_5;
    $opal.defn(self, '$each_byte', TMP_5 = function(string) {
      var $a, self = this, $iter = TMP_5._p, block = $iter || nil;
      TMP_5._p = null;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var code = string.charCodeAt(i);

        if (code <= 0x7f) {
          ((($a = $opal.$yield1(block, code)) === $breaker) ? $breaker.$v : $a);
        }
        else {
          var encoded = encodeURIComponent(string.charAt(i)).substr(1).split('%');

          for (var j = 0, encoded_length = encoded.length; j < encoded_length; j++) {
            ((($a = $opal.$yield1(block, parseInt(encoded[j], 16))) === $breaker) ? $breaker.$v : $a);
          }
        }
      }
    
    });
    return ($opal.defn(self, '$bytesize', function() {
      var self = this;
      return self.$bytes().$length();
    }), nil);}, TMP_4._s = self, TMP_4), $a).call($b, "UTF-8", $hash2(["aliases", "ascii"], {"aliases": ["CP65001"], "ascii": true}));
  ($a = ($c = (($d = $scope.Encoding) == null ? $opal.cm('Encoding') : $d)).$register, $a._p = (TMP_6 = function() {var self = TMP_6._s || this, TMP_7;
    $opal.defn(self, '$each_byte', TMP_7 = function(string) {
      var $a, self = this, $iter = TMP_7._p, block = $iter || nil;
      TMP_7._p = null;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var code = string.charCodeAt(i);

        ((($a = $opal.$yield1(block, code & 0xff)) === $breaker) ? $breaker.$v : $a);
        ((($a = $opal.$yield1(block, code >> 8)) === $breaker) ? $breaker.$v : $a);
      }
    
    });
    return ($opal.defn(self, '$bytesize', function() {
      var self = this;
      return self.$bytes().$length();
    }), nil);}, TMP_6._s = self, TMP_6), $a).call($c, "UTF-16LE");
  ($a = ($d = (($e = $scope.Encoding) == null ? $opal.cm('Encoding') : $e)).$register, $a._p = (TMP_8 = function() {var self = TMP_8._s || this, TMP_9;
    $opal.defn(self, '$each_byte', TMP_9 = function(string) {
      var $a, self = this, $iter = TMP_9._p, block = $iter || nil;
      TMP_9._p = null;
      
      for (var i = 0, length = string.length; i < length; i++) {
        ((($a = $opal.$yield1(block, string.charCodeAt(i) & 0xff)) === $breaker) ? $breaker.$v : $a);
      }
    
    });
    return ($opal.defn(self, '$bytesize', function() {
      var self = this;
      return self.$bytes().$length();
    }), nil);}, TMP_8._s = self, TMP_8), $a).call($d, "ASCII-8BIT", $hash2(["aliases", "ascii"], {"aliases": ["BINARY"], "ascii": true}));
  return (function($base, $super) {
    function String(){};
    var self = String = $klass($base, $super, 'String', String);

    var def = String._proto, $scope = String._scope, $a, $b, TMP_10;
    def.encoding = nil;
    def.encoding = (($a = ((($b = $scope.Encoding) == null ? $opal.cm('Encoding') : $b))._scope).UTF_16LE == null ? $a.cm('UTF_16LE') : $a.UTF_16LE);

    def.$bytes = function() {
      var self = this;
      return self.$each_byte().$to_a();
    };

    def.$bytesize = function() {
      var self = this;
      return self.encoding.$bytesize(self);
    };

    def.$each_byte = TMP_10 = function() {
      var $a, $b, self = this, $iter = TMP_10._p, block = $iter || nil;
      TMP_10._p = null;
      if (block === nil) {
        return self.$enum_for("each_byte")};
      ($a = ($b = self.encoding).$each_byte, $a._p = block.$to_proc(), $a).call($b, self);
      return self;
    };

    def.$encoding = function() {
      var self = this;
      return self.encoding;
    };

    def.$force_encoding = function(encoding) {
      var $a, self = this;
      encoding = (($a = $scope.Encoding) == null ? $opal.cm('Encoding') : $a).$find(encoding);
      if (encoding['$=='](self.encoding)) {
        return self};
      
      var result = new native_string(self);
      result.encoding = encoding;

      return result;
    
    };

    return (def.$getbyte = function(idx) {
      var self = this;
      return self.encoding.$getbyte(self, idx);
    }, nil);
  })(self, null);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var $a, self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass;
  $opal.add_stubs(['$include', '$undef_method', '$coerce', '$===', '$raise', '$class', '$__send__', '$send_coerced', '$to_int', '$respond_to?', '$==', '$enum_for', '$<', '$>', '$floor', '$/', '$%']);
  (function($base, $super) {
    function Numeric(){};
    var self = Numeric = $klass($base, $super, 'Numeric', Numeric);

    var def = Numeric._proto, $scope = Numeric._scope, $a, TMP_1, TMP_2, TMP_3, TMP_4, TMP_5;
    self.$include((($a = $scope.Comparable) == null ? $opal.cm('Comparable') : $a));

    def._isNumber = true;

    (function(self) {
      var $scope = self._scope, def = self._proto;
      return self.$undef_method("new")
    })(self.$singleton_class());

    def.$coerce = function(other, type) {
      var $a, self = this, $case = nil;
      if (type == null) {
        type = "operation"
      }
      try {
      
      if (other._isNumber) {
        return [self, other];
      }
      else {
        return other.$coerce(self);
      }
    
      } catch ($err) {if (true) {
        return (function() {$case = type;if ("operation"['$===']($case)) {return self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "" + (other.$class()) + " can't be coerce into Numeric")}else if ("comparison"['$===']($case)) {return self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "comparison of " + (self.$class()) + " with " + (other.$class()) + " failed")}else { return nil }})()
        }else { throw $err; }
      };
    };

    def.$send_coerced = function(method, other) {
      var $a, self = this, type = nil, $case = nil, a = nil, b = nil;
      type = (function() {$case = method;if ("+"['$===']($case) || "-"['$===']($case) || "*"['$===']($case) || "/"['$===']($case) || "%"['$===']($case) || "&"['$===']($case) || "|"['$===']($case) || "^"['$===']($case) || "**"['$===']($case)) {return "operation"}else if (">"['$===']($case) || ">="['$===']($case) || "<"['$===']($case) || "<="['$===']($case) || "<=>"['$===']($case)) {return "comparison"}else { return nil }})();
      $a = $opal.to_ary(self.$coerce(other, type)), a = ($a[0] == null ? nil : $a[0]), b = ($a[1] == null ? nil : $a[1]);
      return a.$__send__(method, b);
    };

    def['$+'] = function(other) {
      var self = this;
      
      if (other._isNumber) {
        return self + other;
      }
      else {
        return self.$send_coerced("+", other);
      }
    
    };

    def['$-'] = function(other) {
      var self = this;
      
      if (other._isNumber) {
        return self - other;
      }
      else {
        return self.$send_coerced("-", other);
      }
    
    };

    def['$*'] = function(other) {
      var self = this;
      
      if (other._isNumber) {
        return self * other;
      }
      else {
        return self.$send_coerced("*", other);
      }
    
    };

    def['$/'] = function(other) {
      var self = this;
      
      if (other._isNumber) {
        return self / other;
      }
      else {
        return self.$send_coerced("/", other);
      }
    
    };

    def['$%'] = function(other) {
      var self = this;
      
      if (other._isNumber) {
        if (other < 0 || self < 0) {
          return (self % other + other) % other;
        }
        else {
          return self % other;
        }
      }
      else {
        return self.$send_coerced("%", other);
      }
    
    };

    def['$&'] = function(other) {
      var self = this;
      
      if (other._isNumber) {
        return self & other;
      }
      else {
        return self.$send_coerced("&", other);
      }
    
    };

    def['$|'] = function(other) {
      var self = this;
      
      if (other._isNumber) {
        return self | other;
      }
      else {
        return self.$send_coerced("|", other);
      }
    
    };

    def['$^'] = function(other) {
      var self = this;
      
      if (other._isNumber) {
        return self ^ other;
      }
      else {
        return self.$send_coerced("^", other);
      }
    
    };

    def['$<'] = function(other) {
      var self = this;
      
      if (other._isNumber) {
        return self < other;
      }
      else {
        return self.$send_coerced("<", other);
      }
    
    };

    def['$<='] = function(other) {
      var self = this;
      
      if (other._isNumber) {
        return self <= other;
      }
      else {
        return self.$send_coerced("<=", other);
      }
    
    };

    def['$>'] = function(other) {
      var self = this;
      
      if (other._isNumber) {
        return self > other;
      }
      else {
        return self.$send_coerced(">", other);
      }
    
    };

    def['$>='] = function(other) {
      var self = this;
      
      if (other._isNumber) {
        return self >= other;
      }
      else {
        return self.$send_coerced(">=", other);
      }
    
    };

    def['$<=>'] = function(other) {
      var $a, self = this;
      try {
      
      if (other._isNumber) {
        return self > other ? 1 : (self < other ? -1 : 0);
      }
      else {
        return self.$send_coerced("<=>", other);
      }
    
      } catch ($err) {if ((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a)['$===']($err)) {
        return nil
        }else { throw $err; }
      };
    };

    def['$<<'] = function(count) {
      var self = this;
      return self << count.$to_int();
    };

    def['$>>'] = function(count) {
      var self = this;
      return self >> count.$to_int();
    };

    def['$+@'] = function() {
      var self = this;
      return +self;
    };

    def['$-@'] = function() {
      var self = this;
      return -self;
    };

    def['$~'] = function() {
      var self = this;
      return ~self;
    };

    def['$**'] = function(other) {
      var self = this;
      
      if (other._isNumber) {
        return Math.pow(self, other);
      }
      else {
        return self.$send_coerced("**", other);
      }
    
    };

    def['$=='] = function(other) {
      var self = this;
      
      if (other._isNumber) {
        return self == Number(other);
      }
      else if (other['$respond_to?']("==")) {
        return other['$=='](self);
      }
      else {
        return false;
      }
    ;
    };

    def.$abs = function() {
      var self = this;
      return Math.abs(self);
    };

    def.$ceil = function() {
      var self = this;
      return Math.ceil(self);
    };

    def.$chr = function() {
      var self = this;
      return String.fromCharCode(self);
    };

    def.$conj = function() {
      var self = this;
      return self;
    };

    $opal.defn(self, '$conjugate', def.$conj);

    def.$downto = TMP_1 = function(finish) {
      var $a, self = this, $iter = TMP_1._p, block = $iter || nil;
      TMP_1._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("downto", finish)};
      
      for (var i = self; i >= finish; i--) {
        if (block(i) === $breaker) {
          return $breaker.$v;
        }
      }
    
      return self;
    };

    $opal.defn(self, '$eql?', def['$==']);

    $opal.defn(self, '$equal?', def['$==']);

    def['$even?'] = function() {
      var self = this;
      return self % 2 === 0;
    };

    def.$floor = function() {
      var self = this;
      return Math.floor(self);
    };

    def.$hash = function() {
      var self = this;
      return self.toString();
    };

    def['$integer?'] = function() {
      var self = this;
      return self % 1 === 0;
    };

    def['$is_a?'] = TMP_2 = function(klass) {var $zuper = $slice.call(arguments, 0);
      var $a, $b, $c, self = this, $iter = TMP_2._p, $yield = $iter || nil;
      TMP_2._p = null;
      if (($a = (($b = klass['$==']((($c = $scope.Float) == null ? $opal.cm('Float') : $c))) ? (($c = $scope.Float) == null ? $opal.cm('Float') : $c)['$==='](self) : $b)) !== false && $a !== nil) {
        return true};
      if (($a = (($b = klass['$==']((($c = $scope.Integer) == null ? $opal.cm('Integer') : $c))) ? (($c = $scope.Integer) == null ? $opal.cm('Integer') : $c)['$==='](self) : $b)) !== false && $a !== nil) {
        return true};
      return $opal.find_super_dispatcher(self, 'is_a?', TMP_2, $iter).apply(self, $zuper);
    };

    $opal.defn(self, '$magnitude', def.$abs);

    $opal.defn(self, '$modulo', def['$%']);

    def.$next = function() {
      var self = this;
      return self + 1;
    };

    def['$nonzero?'] = function() {
      var self = this;
      return self == 0 ? nil : self;
    };

    def['$odd?'] = function() {
      var self = this;
      return self % 2 !== 0;
    };

    def.$ord = function() {
      var self = this;
      return self;
    };

    def.$pred = function() {
      var self = this;
      return self - 1;
    };

    def.$step = TMP_3 = function(limit, step) {
      var $a, self = this, $iter = TMP_3._p, block = $iter || nil;
      if (step == null) {
        step = 1
      }
      TMP_3._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("step", limit, step)};
      if (($a = step == 0) !== false && $a !== nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "step cannot be 0")};
      
      var value = self;

      if (step > 0) {
        while (value <= limit) {
          block(value);
          value += step;
        }
      }
      else {
        while (value >= limit) {
          block(value);
          value += step;
        }
      }
    
      return self;
    };

    $opal.defn(self, '$succ', def.$next);

    def.$times = TMP_4 = function() {
      var $a, self = this, $iter = TMP_4._p, block = $iter || nil;
      TMP_4._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("times")};
      
      for (var i = 0; i < self; i++) {
        if (block(i) === $breaker) {
          return $breaker.$v;
        }
      }
    
      return self;
    };

    def.$to_f = function() {
      var self = this;
      return parseFloat(self);
    };

    def.$to_i = function() {
      var self = this;
      return parseInt(self);
    };

    $opal.defn(self, '$to_int', def.$to_i);

    def.$to_s = function(base) {
      var $a, $b, self = this;
      if (base == null) {
        base = 10
      }
      if (($a = ((($b = base['$<'](2)) !== false && $b !== nil) ? $b : base['$>'](36))) !== false && $a !== nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "base must be between 2 and 36")};
      return self.toString(base);
    };

    $opal.defn(self, '$inspect', def.$to_s);

    def.$divmod = function(rhs) {
      var self = this, q = nil, r = nil;
      q = (self['$/'](rhs)).$floor();
      r = self['$%'](rhs);
      return [q, r];
    };

    def.$to_n = function() {
      var self = this;
      return self.valueOf();
    };

    def.$upto = TMP_5 = function(finish) {
      var $a, self = this, $iter = TMP_5._p, block = $iter || nil;
      TMP_5._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("upto", finish)};
      
      for (var i = self; i <= finish; i++) {
        if (block(i) === $breaker) {
          return $breaker.$v;
        }
      }
    
      return self;
    };

    def['$zero?'] = function() {
      var self = this;
      return self == 0;
    };

    def.$size = function() {
      var self = this;
      return 4;
    };

    def['$nan?'] = function() {
      var self = this;
      return isNaN(self);
    };

    def['$finite?'] = function() {
      var self = this;
      return self == Infinity || self == -Infinity;
    };

    return (def['$infinite?'] = function() {
      var $a, self = this;
      if (($a = self == Infinity) !== false && $a !== nil) {
        return +1;
      } else if (($a = self == -Infinity) !== false && $a !== nil) {
        return -1;
        } else {
        return nil
      };
    }, nil);
  })(self, null);
  $opal.cdecl($scope, 'Fixnum', (($a = $scope.Numeric) == null ? $opal.cm('Numeric') : $a));
  (function($base, $super) {
    function Integer(){};
    var self = Integer = $klass($base, $super, 'Integer', Integer);

    var def = Integer._proto, $scope = Integer._scope;
    return ($opal.defs(self, '$===', function(other) {
      var self = this;
      return !!(other._isNumber && (other % 1) == 0);
    }), nil)
  })(self, (($a = $scope.Numeric) == null ? $opal.cm('Numeric') : $a));
  return (function($base, $super) {
    function Float(){};
    var self = Float = $klass($base, $super, 'Float', Float);

    var def = Float._proto, $scope = Float._scope;
    return ($opal.defs(self, '$===', function(other) {
      var self = this;
      return !!(other._isNumber && (other % 1) != 0);
    }), nil)
  })(self, (($a = $scope.Numeric) == null ? $opal.cm('Numeric') : $a));
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass;
  $opal.add_stubs(['$raise']);
  return (function($base, $super) {
    function Proc(){};
    var self = Proc = $klass($base, $super, 'Proc', Proc);

    var def = Proc._proto, $scope = Proc._scope, TMP_1, TMP_2;
    def._isProc = true;

    def.is_lambda = false;

    $opal.defs(self, '$new', TMP_1 = function() {
      var $a, self = this, $iter = TMP_1._p, block = $iter || nil;
      TMP_1._p = null;
      if (($a = block) === false || $a === nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "tried to create a Proc object without a block")};
      return block;
    });

    def.$call = TMP_2 = function(args) {
      var self = this, $iter = TMP_2._p, block = $iter || nil;
      args = $slice.call(arguments, 0);
      TMP_2._p = null;
      
      if (block !== nil) {
        self._p = block;
      }

      var result;

      if (self.is_lambda) {
        result = self.apply(null, args);
      }
      else {
        result = Opal.$yieldX(self, args);
      }

      if (result === $breaker) {
        return $breaker.$v;
      }

      return result;
    
    };

    $opal.defn(self, '$[]', def.$call);

    def.$to_proc = function() {
      var self = this;
      return self;
    };

    def['$lambda?'] = function() {
      var self = this;
      return !!self.is_lambda;
    };

    def.$arity = function() {
      var self = this;
      return self.length;
    };

    return (def.$to_n = function() {
      var self = this;
      return self;
    }, nil);
  })(self, null)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass;
  $opal.add_stubs(['$attr_reader', '$class', '$arity', '$new', '$name']);
  (function($base, $super) {
    function Method(){};
    var self = Method = $klass($base, $super, 'Method', Method);

    var def = Method._proto, $scope = Method._scope, TMP_1;
    def.method = def.object = def.owner = def.name = def.obj = nil;
    self.$attr_reader("owner", "receiver", "name");

    def.$initialize = function(receiver, method, name) {
      var self = this;
      self.receiver = receiver;
      self.owner = receiver.$class();
      self.name = name;
      return self.method = method;
    };

    def.$arity = function() {
      var self = this;
      return self.method.$arity();
    };

    def.$call = TMP_1 = function(args) {
      var self = this, $iter = TMP_1._p, block = $iter || nil;
      args = $slice.call(arguments, 0);
      TMP_1._p = null;
      
      self.method._p = block;

      return self.method.apply(self.object, args);
    ;
    };

    $opal.defn(self, '$[]', def.$call);

    def.$unbind = function() {
      var $a, self = this;
      return (($a = $scope.UnboundMethod) == null ? $opal.cm('UnboundMethod') : $a).$new(self.owner, self.method, self.name);
    };

    def.$to_proc = function() {
      var self = this;
      return self.method;
    };

    return (def.$inspect = function() {
      var self = this;
      return "#<Method: " + (self.obj.$class().$name()) + "#" + (self.name) + "}>";
    }, nil);
  })(self, null);
  return (function($base, $super) {
    function UnboundMethod(){};
    var self = UnboundMethod = $klass($base, $super, 'UnboundMethod', UnboundMethod);

    var def = UnboundMethod._proto, $scope = UnboundMethod._scope;
    def.method = def.name = def.owner = nil;
    self.$attr_reader("owner", "name");

    def.$initialize = function(owner, method, name) {
      var self = this;
      self.owner = owner;
      self.method = method;
      return self.name = name;
    };

    def.$arity = function() {
      var self = this;
      return self.method.$arity();
    };

    def.$bind = function(object) {
      var $a, self = this;
      return (($a = $scope.Method) == null ? $opal.cm('Method') : $a).$new(object, self.method, self.name);
    };

    return (def.$inspect = function() {
      var self = this;
      return "#<UnboundMethod: " + (self.owner.$name()) + "#" + (self.name) + ">";
    }, nil);
  })(self, null);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass;
  $opal.add_stubs(['$include', '$attr_reader', '$include?', '$<=', '$<', '$enum_for', '$succ', '$==', '$===', '$exclude_end?', '$eql?', '$begin', '$end', '$cover?', '$raise', '$inspect']);
  return (function($base, $super) {
    function Range(){};
    var self = Range = $klass($base, $super, 'Range', Range);

    var def = Range._proto, $scope = Range._scope, $a, TMP_1, TMP_2, TMP_3;
    def.begin = def.exclude = def.end = nil;
    self.$include((($a = $scope.Enumerable) == null ? $opal.cm('Enumerable') : $a));

    
    Range._proto._isRange = true;

    Opal.range = function(first, last, exc) {
      var range         = new Range._alloc;
          range.begin   = first;
          range.end     = last;
          range.exclude = exc;

      return range;
    };
  

    self.$attr_reader("begin", "end");

    def.$initialize = function(first, last, exclude) {
      var self = this;
      if (exclude == null) {
        exclude = false
      }
      self.begin = first;
      self.end = last;
      return self.exclude = exclude;
    };

    def['$=='] = function(other) {
      var self = this;
      
      if (!other._isRange) {
        return false;
      }

      return self.exclude === other.exclude &&
             self.begin   ==  other.begin &&
             self.end     ==  other.end;
    
    };

    def['$==='] = function(obj) {
      var self = this;
      return self['$include?'](obj);
    };

    def['$cover?'] = function(value) {
      var $a, $b, self = this;
      return (($a = self.begin['$<='](value)) ? ((function() {if (($b = self.exclude) !== false && $b !== nil) {
        return value['$<'](self.end)
        } else {
        return value['$<='](self.end)
      }; return nil; })()) : $a);
    };

    $opal.defn(self, '$last', def.$end);

    def.$each = TMP_1 = function() {
      var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil, current = nil, last = nil;
      TMP_1._p = null;
      if (block === nil) {
        return self.$enum_for("each")};
      current = self.begin;
      last = self.end;
      while (current['$<'](last)) {
      if ($opal.$yield1(block, current) === $breaker) return $breaker.$v;
      current = current.$succ();};
      if (($a = ($b = ($c = self.exclude, ($c === nil || $c === false)), $b !== false && $b !== nil ?current['$=='](last) : $b)) !== false && $a !== nil) {
        if ($opal.$yield1(block, current) === $breaker) return $breaker.$v};
      return self;
    };

    def['$eql?'] = function(other) {
      var $a, $b, self = this;
      if (($a = (($b = $scope.Range) == null ? $opal.cm('Range') : $b)['$==='](other)) === false || $a === nil) {
        return false};
      return ($a = ($b = self.exclude['$==='](other['$exclude_end?']()), $b !== false && $b !== nil ?self.begin['$eql?'](other.$begin()) : $b), $a !== false && $a !== nil ?self.end['$eql?'](other.$end()) : $a);
    };

    def['$exclude_end?'] = function() {
      var self = this;
      return self.exclude;
    };

    $opal.defn(self, '$first', def.$begin);

    def['$include?'] = function(obj) {
      var self = this;
      return self['$cover?'](obj);
    };

    def.$max = TMP_2 = function() {var $zuper = $slice.call(arguments, 0);
      var self = this, $iter = TMP_2._p, $yield = $iter || nil;
      TMP_2._p = null;
      if (($yield !== nil)) {
        return $opal.find_super_dispatcher(self, 'max', TMP_2, $iter).apply(self, $zuper)
        } else {
        return self.exclude ? self.end - 1 : self.end;
      };
    };

    def.$min = TMP_3 = function() {var $zuper = $slice.call(arguments, 0);
      var self = this, $iter = TMP_3._p, $yield = $iter || nil;
      TMP_3._p = null;
      if (($yield !== nil)) {
        return $opal.find_super_dispatcher(self, 'min', TMP_3, $iter).apply(self, $zuper)
        } else {
        return self.begin
      };
    };

    $opal.defn(self, '$member?', def['$include?']);

    def.$step = function(n) {
      var $a, self = this;
      if (n == null) {
        n = 1
      }
      return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
    };

    def.$to_s = function() {
      var self = this;
      return self.begin.$inspect() + (self.exclude ? '...' : '..') + self.end.$inspect();
    };

    return $opal.defn(self, '$inspect', def.$to_s);
  })(self, null)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass;
  $opal.add_stubs(['$include', '$raise', '$kind_of?', '$to_i', '$coerce_to', '$between?', '$new', '$compact', '$nil?', '$===', '$<=>', '$to_f', '$is_a?', '$zero?', '$warn', '$yday', '$rjust', '$ljust', '$zone', '$strftime', '$sec', '$min', '$hour', '$day', '$month', '$year', '$wday', '$isdst']);
  (function($base, $super) {
    function Time(){};
    var self = Time = $klass($base, $super, 'Time', Time);

    var def = Time._proto, $scope = Time._scope, $a;
    self.$include((($a = $scope.Comparable) == null ? $opal.cm('Comparable') : $a));

    
    var days_of_week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        short_days   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        short_months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        long_months  = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  ;

    $opal.defs(self, '$at', function(seconds, frac) {
      var self = this;
      if (frac == null) {
        frac = 0
      }
      return new Date(seconds * 1000 + frac);
    });

    $opal.defs(self, '$new', function(year, month, day, hour, minute, second, utc_offset) {
      var $a, self = this;
      
      switch (arguments.length) {
        case 1:
          return new Date(year, 0);

        case 2:
          return new Date(year, month - 1);

        case 3:
          return new Date(year, month - 1, day);

        case 4:
          return new Date(year, month - 1, day, hour);

        case 5:
          return new Date(year, month - 1, day, hour, minute);

        case 6:
          return new Date(year, month - 1, day, hour, minute, second);

        case 7:
          self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));

        default:
          return new Date();
      }
    
    });

    $opal.defs(self, '$local', function(year, month, day, hour, minute, second, millisecond) {
      var $a, $b, self = this;
      if (month == null) {
        month = nil
      }
      if (day == null) {
        day = nil
      }
      if (hour == null) {
        hour = nil
      }
      if (minute == null) {
        minute = nil
      }
      if (second == null) {
        second = nil
      }
      if (millisecond == null) {
        millisecond = nil
      }
      if (($a = arguments.length === 10) !== false && $a !== nil) {
        
        var args = $slice.call(arguments).reverse();

        second = args[9];
        minute = args[8];
        hour   = args[7];
        day    = args[6];
        month  = args[5];
        year   = args[4];
      };
      year = (function() {if (($a = year['$kind_of?']((($b = $scope.String) == null ? $opal.cm('String') : $b))) !== false && $a !== nil) {
        return year.$to_i()
        } else {
        return (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(year, (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int")
      }; return nil; })();
      month = (function() {if (($a = month['$kind_of?']((($b = $scope.String) == null ? $opal.cm('String') : $b))) !== false && $a !== nil) {
        return month.$to_i()
        } else {
        return (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(((($a = month) !== false && $a !== nil) ? $a : 1), (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int")
      }; return nil; })();
      if (($a = month['$between?'](1, 12)) === false || $a === nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "month out of range: " + (month))};
      day = (function() {if (($a = day['$kind_of?']((($b = $scope.String) == null ? $opal.cm('String') : $b))) !== false && $a !== nil) {
        return day.$to_i()
        } else {
        return (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(((($a = day) !== false && $a !== nil) ? $a : 1), (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int")
      }; return nil; })();
      if (($a = day['$between?'](1, 31)) === false || $a === nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "day out of range: " + (day))};
      hour = (function() {if (($a = hour['$kind_of?']((($b = $scope.String) == null ? $opal.cm('String') : $b))) !== false && $a !== nil) {
        return hour.$to_i()
        } else {
        return (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(((($a = hour) !== false && $a !== nil) ? $a : 0), (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int")
      }; return nil; })();
      if (($a = hour['$between?'](0, 24)) === false || $a === nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "hour out of range: " + (hour))};
      minute = (function() {if (($a = minute['$kind_of?']((($b = $scope.String) == null ? $opal.cm('String') : $b))) !== false && $a !== nil) {
        return minute.$to_i()
        } else {
        return (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(((($a = minute) !== false && $a !== nil) ? $a : 0), (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int")
      }; return nil; })();
      if (($a = minute['$between?'](0, 59)) === false || $a === nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "minute out of range: " + (minute))};
      second = (function() {if (($a = second['$kind_of?']((($b = $scope.String) == null ? $opal.cm('String') : $b))) !== false && $a !== nil) {
        return second.$to_i()
        } else {
        return (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(((($a = second) !== false && $a !== nil) ? $a : 0), (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int")
      }; return nil; })();
      if (($a = second['$between?'](0, 59)) === false || $a === nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "second out of range: " + (second))};
      return ($a = self).$new.apply($a, [].concat([year, month, day, hour, minute, second].$compact()));
    });

    $opal.defs(self, '$gm', function(year, month, day, hour, minute, second, utc_offset) {
      var $a, self = this;
      if (($a = year['$nil?']()) !== false && $a !== nil) {
        self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "missing year (got nil)")};
      
      switch (arguments.length) {
        case 1:
          return new Date(Date.UTC(year, 0));

        case 2:
          return new Date(Date.UTC(year, month - 1));

        case 3:
          return new Date(Date.UTC(year, month - 1, day));

        case 4:
          return new Date(Date.UTC(year, month - 1, day, hour));

        case 5:
          return new Date(Date.UTC(year, month - 1, day, hour, minute));

        case 6:
          return new Date(Date.UTC(year, month - 1, day, hour, minute, second));

        case 7:
          self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
      }
    
    });

    (function(self) {
      var $scope = self._scope, def = self._proto;
      self._proto.$mktime = self._proto.$local;
      return self._proto.$utc = self._proto.$gm;
    })(self.$singleton_class());

    $opal.defs(self, '$now', function() {
      var self = this;
      return new Date();
    });

    def['$+'] = function(other) {
      var $a, $b, self = this;
      if (($a = (($b = $scope.Time) == null ? $opal.cm('Time') : $b)['$==='](other)) !== false && $a !== nil) {
        self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "time + time?")};
      other = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(other, (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int");
      return new Date(self.getTime() + (other * 1000));
    };

    def['$-'] = function(other) {
      var $a, $b, self = this;
      if (($a = (($b = $scope.Time) == null ? $opal.cm('Time') : $b)['$==='](other)) !== false && $a !== nil) {
        return (self.getTime() - other.getTime()) / 1000;
        } else {
        other = (($a = $scope.Opal) == null ? $opal.cm('Opal') : $a).$coerce_to(other, (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "to_int");
        return new Date(self.getTime() - (other * 1000));
      };
    };

    def['$<=>'] = function(other) {
      var self = this;
      return self.$to_f()['$<=>'](other.$to_f());
    };

    def['$=='] = function(other) {
      var self = this;
      return self.$to_f() === other.$to_f();
    };

    def.$day = function() {
      var self = this;
      return self.getDate();
    };

    def.$yday = function() {
      var self = this;
      
      // http://javascript.about.com/library/bldayyear.htm
      var onejan = new Date(self.getFullYear(), 0, 1);
      return Math.ceil((self - onejan) / 86400000);
    
    };

    def.$isdst = function() {
      var $a, self = this;
      return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
    };

    def['$eql?'] = function(other) {
      var $a, $b, self = this;
      return ($a = other['$is_a?']((($b = $scope.Time) == null ? $opal.cm('Time') : $b)), $a !== false && $a !== nil ?(self['$<=>'](other))['$zero?']() : $a);
    };

    def['$friday?'] = function() {
      var self = this;
      return self.getDay() === 5;
    };

    def.$hour = function() {
      var self = this;
      return self.getHours();
    };

    def.$inspect = function() {
      var self = this;
      return self.toString();
    };

    $opal.defn(self, '$mday', def.$day);

    def.$min = function() {
      var self = this;
      return self.getMinutes();
    };

    def.$mon = function() {
      var self = this;
      return self.getMonth() + 1;
    };

    def['$monday?'] = function() {
      var self = this;
      return self.getDay() === 1;
    };

    $opal.defn(self, '$month', def.$mon);

    def['$saturday?'] = function() {
      var self = this;
      return self.getDay() === 6;
    };

    def.$sec = function() {
      var self = this;
      return self.getSeconds();
    };

    def.$usec = function() {
      var self = this;
      self.$warn("Microseconds are not supported");
      return 0;
    };

    def.$zone = function() {
      var self = this;
      
      var string = self.toString(),
          result;

      if (string.indexOf('(') == -1) {
        result = string.match(/[A-Z]{3,4}/)[0];
      }
      else {
        result = string.match(/\([^)]+\)/)[0].match(/[A-Z]/g).join('');
      }

      if (result == "GMT" && /(GMT\W*\d{4})/.test(string)) {
        return RegExp.$1;
      }
      else {
        return result;
      }
    
    };

    def.$gmt_offset = function() {
      var self = this;
      return -self.getTimezoneOffset() * 60;
    };

    def.$strftime = function(format) {
      var self = this;
      
      return format.replace(/%([\-_#^0]*:{0,2})(\d+)?([EO]*)(.)/g, function(full, flags, width, _, conv) {
        var result = "",
            width  = parseInt(width),
            zero   = flags.indexOf('0') !== -1,
            pad    = flags.indexOf('-') === -1,
            blank  = flags.indexOf('_') !== -1,
            upcase = flags.indexOf('^') !== -1,
            invert = flags.indexOf('#') !== -1,
            colons = (flags.match(':') || []).length;

        if (zero && blank) {
          if (flags.indexOf('0') < flags.indexOf('_')) {
            zero = false;
          }
          else {
            blank = false;
          }
        }

        switch (conv) {
          case 'Y':
            result += self.getFullYear();
            break;

          case 'C':
            zero    = !blank;
            result += Match.round(self.getFullYear() / 100);
            break;

          case 'y':
            zero    = !blank;
            result += (self.getFullYear() % 100);
            break;

          case 'm':
            zero    = !blank;
            result += (self.getMonth() + 1);
            break;

          case 'B':
            result += long_months[self.getMonth()];
            break;

          case 'b':
          case 'h':
            blank   = !zero;
            result += short_months[self.getMonth()];
            break;

          case 'd':
            zero    = !blank
            result += self.getDate();
            break;

          case 'e':
            blank   = !zero
            result += self.getDate();
            break;

          case 'j':
            result += self.$yday();
            break;

          case 'H':
            zero    = !blank;
            result += self.getHours();
            break;

          case 'k':
            blank   = !zero;
            result += self.getHours();
            break;

          case 'I':
            zero    = !blank;
            result += (self.getHours() % 12 || 12);
            break;

          case 'l':
            blank   = !zero;
            result += (self.getHours() % 12 || 12);
            break;

          case 'P':
            result += (self.getHours() >= 12 ? "pm" : "am");
            break;

          case 'p':
            result += (self.getHours() >= 12 ? "PM" : "AM");
            break;

          case 'M':
            zero    = !blank;
            result += self.getMinutes();
            break;

          case 'S':
            zero    = !blank;
            result += self.getSeconds();
            break;

          case 'L':
            zero    = !blank;
            width   = isNaN(width) ? 3 : width;
            result += self.getMilliseconds();
            break;

          case 'N':
            width   = isNaN(width) ? 9 : width;
            result += (self.getMilliseconds().toString()).$rjust(3, "0");
            result  = (result).$ljust(width, "0");
            break;

          case 'z':
            var offset  = self.getTimezoneOffset(),
                hours   = Math.floor(Math.abs(offset) / 60),
                minutes = Math.abs(offset) % 60;

            result += offset < 0 ? "+" : "-";
            result += hours < 10 ? "0" : "";
            result += hours;

            if (colons > 0) {
              result += ":";
            }

            result += minutes < 10 ? "0" : "";
            result += minutes;

            if (colons > 1) {
              result += ":00";
            }

            break;

          case 'Z':
            result += self.$zone();
            break;

          case 'A':
            result += days_of_week[self.getDay()];
            break;

          case 'a':
            result += short_days[self.getDay()];
            break;

          case 'u':
            result += (self.getDay() + 1);
            break;

          case 'w':
            result += self.getDay();
            break;

          // TODO: week year
          // TODO: week number

          case 's':
            result += parseInt(self.getTime() / 1000)
            break;

          case 'n':
            result += "\n";
            break;

          case 't':
            result += "\t";
            break;

          case '%':
            result += "%";
            break;

          case 'c':
            result += self.$strftime("%a %b %e %T %Y");
            break;

          case 'D':
          case 'x':
            result += self.$strftime("%m/%d/%y");
            break;

          case 'F':
            result += self.$strftime("%Y-%m-%d");
            break;

          case 'v':
            result += self.$strftime("%e-%^b-%4Y");
            break;

          case 'r':
            result += self.$strftime("%I:%M:%S %p");
            break;

          case 'R':
            result += self.$strftime("%H:%M");
            break;

          case 'T':
          case 'X':
            result += self.$strftime("%H:%M:%S");
            break;

          default:
            return full;
        }

        if (upcase) {
          result = result.toUpperCase();
        }

        if (invert) {
          result = result.replace(/[A-Z]/, function(c) { c.toLowerCase() }).
                          replace(/[a-z]/, function(c) { c.toUpperCase() });
        }

        if (pad && (zero || blank)) {
          result = (result).$rjust(isNaN(width) ? 2 : width, blank ? " " : "0");
        }

        return result;
      });
    
    };

    def['$sunday?'] = function() {
      var self = this;
      return self.getDay() === 0;
    };

    def['$thursday?'] = function() {
      var self = this;
      return self.getDay() === 4;
    };

    def.$to_a = function() {
      var self = this;
      return [self.$sec(), self.$min(), self.$hour(), self.$day(), self.$month(), self.$year(), self.$wday(), self.$yday(), self.$isdst(), self.$zone()];
    };

    def.$to_f = function() {
      var self = this;
      return self.getTime() / 1000;
    };

    def.$to_i = function() {
      var self = this;
      return parseInt(self.getTime() / 1000);
    };

    $opal.defn(self, '$to_s', def.$inspect);

    def['$tuesday?'] = function() {
      var self = this;
      return self.getDay() === 2;
    };

    def.$wday = function() {
      var self = this;
      return self.getDay();
    };

    def['$wednesday?'] = function() {
      var self = this;
      return self.getDay() === 3;
    };

    def.$year = function() {
      var self = this;
      return self.getFullYear();
    };

    return (def.$to_n = function() {
      var self = this;
      return self;
    }, nil);
  })(self, null);
  return (function($base, $super) {
    function Time(){};
    var self = Time = $klass($base, $super, 'Time', Time);

    var def = Time._proto, $scope = Time._scope;
    $opal.defs(self, '$parse', function(str) {
      var self = this;
      return new Date(Date.parse(str));
    });

    return (def.$iso8601 = function() {
      var self = this;
      return self.$strftime("%FT%T%z");
    }, nil);
  })(self, null);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass;
  $opal.add_stubs(['$==', '$[]', '$upcase', '$const_set', '$new', '$unshift', '$each', '$define_struct_attribute', '$instance_eval', '$to_proc', '$raise', '$<<', '$members', '$define_method', '$instance_variable_get', '$instance_variable_set', '$include', '$length', '$native?', '$Native', '$each_with_index', '$class', '$===', '$>=', '$size', '$include?', '$to_sym', '$enum_for', '$hash', '$all?', '$map', '$each_pair', '$to_n', '$+', '$name', '$join', '$inspect']);
  return (function($base, $super) {
    function Struct(){};
    var self = Struct = $klass($base, $super, 'Struct', Struct);

    var def = Struct._proto, $scope = Struct._scope, TMP_1, $a, TMP_9, TMP_11;
    $opal.defs(self, '$new', TMP_1 = function(name, args) {var $zuper = $slice.call(arguments, 0);
      var $a, $b, TMP_2, $c, $d, self = this, $iter = TMP_1._p, block = $iter || nil;
      args = $slice.call(arguments, 1);
      TMP_1._p = null;
      if (($a = self['$==']((($b = $scope.Struct) == null ? $opal.cm('Struct') : $b))) === false || $a === nil) {
        return $opal.find_super_dispatcher(self, 'new', TMP_1, $iter, Struct).apply(self, $zuper)};
      if (name['$[]'](0)['$=='](name['$[]'](0).$upcase())) {
        return (($a = $scope.Struct) == null ? $opal.cm('Struct') : $a).$const_set(name, ($a = self).$new.apply($a, [].concat(args)))
        } else {
        args.$unshift(name);
        return ($b = ($c = (($d = $scope.Class) == null ? $opal.cm('Class') : $d)).$new, $b._p = (TMP_2 = function() {var self = TMP_2._s || this, TMP_3, $a, $b, $c;
          ($a = ($b = args).$each, $a._p = (TMP_3 = function(arg) {var self = TMP_3._s || this;if (arg == null) arg = nil;
            return self.$define_struct_attribute(arg)}, TMP_3._s = self, TMP_3), $a).call($b);
          if (block !== false && block !== nil) {
            return ($a = ($c = self).$instance_eval, $a._p = block.$to_proc(), $a).call($c)
            } else {
            return nil
          };}, TMP_2._s = self, TMP_2), $b).call($c, self);
      };
    });

    $opal.defs(self, '$define_struct_attribute', function(name) {
      var $a, TMP_4, $b, TMP_5, $c, self = this;
      if (self['$==']((($a = $scope.Struct) == null ? $opal.cm('Struct') : $a))) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "you cannot define attributes to the Struct class")};
      self.$members()['$<<'](name);
      ($a = ($b = self).$define_method, $a._p = (TMP_4 = function() {var self = TMP_4._s || this;
        return self.$instance_variable_get("@" + (name))}, TMP_4._s = self, TMP_4), $a).call($b, name);
      return ($a = ($c = self).$define_method, $a._p = (TMP_5 = function(value) {var self = TMP_5._s || this;if (value == null) value = nil;
        return self.$instance_variable_set("@" + (name), value)}, TMP_5._s = self, TMP_5), $a).call($c, "" + (name) + "=");
    });

    $opal.defs(self, '$members', function() {
      var $a, self = this;
      if (self.members == null) self.members = nil;

      if (self['$==']((($a = $scope.Struct) == null ? $opal.cm('Struct') : $a))) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "the Struct class has no members")};
      return ((($a = self.members) !== false && $a !== nil) ? $a : self.members = []);
    });

    $opal.defs(self, '$inherited', function(klass) {
      var $a, TMP_6, $b, self = this, members = nil;
      if (self.members == null) self.members = nil;

      if (self['$==']((($a = $scope.Struct) == null ? $opal.cm('Struct') : $a))) {
        return nil};
      members = self.members;
      return ($a = ($b = klass).$instance_eval, $a._p = (TMP_6 = function() {var self = TMP_6._s || this;
        return self.members = members}, TMP_6._s = self, TMP_6), $a).call($b);
    });

    self.$include((($a = $scope.Enumerable) == null ? $opal.cm('Enumerable') : $a));

    def.$initialize = function(args) {
      var $a, $b, TMP_7, TMP_8, $c, self = this, object = nil;
      args = $slice.call(arguments, 0);
      if (($a = (($b = args.$length()['$=='](1)) ? self['$native?'](args['$[]'](0)) : $b)) !== false && $a !== nil) {
        object = args['$[]'](0);
        return ($a = ($b = self.$members()).$each, $a._p = (TMP_7 = function(name) {var self = TMP_7._s || this;if (name == null) name = nil;
          return self.$instance_variable_set("@" + (name), self.$Native(object[name]))}, TMP_7._s = self, TMP_7), $a).call($b);
        } else {
        return ($a = ($c = self.$members()).$each_with_index, $a._p = (TMP_8 = function(name, index) {var self = TMP_8._s || this;if (name == null) name = nil;if (index == null) index = nil;
          return self.$instance_variable_set("@" + (name), args['$[]'](index))}, TMP_8._s = self, TMP_8), $a).call($c)
      };
    };

    def.$members = function() {
      var self = this;
      return self.$class().$members();
    };

    def['$[]'] = function(name) {
      var $a, $b, self = this;
      if (($a = (($b = $scope.Integer) == null ? $opal.cm('Integer') : $b)['$==='](name)) !== false && $a !== nil) {
        if (name['$>='](self.$members().$size())) {
          self.$raise((($a = $scope.IndexError) == null ? $opal.cm('IndexError') : $a), "offset " + (name) + " too large for struct(size:" + (self.$members().$size()) + ")")};
        name = self.$members()['$[]'](name);
      } else if (($a = self.$members()['$include?'](name.$to_sym())) === false || $a === nil) {
        self.$raise((($a = $scope.NameError) == null ? $opal.cm('NameError') : $a), "no member '" + (name) + "' in struct")};
      return self.$instance_variable_get("@" + (name));
    };

    def['$[]='] = function(name, value) {
      var $a, $b, self = this;
      if (($a = (($b = $scope.Integer) == null ? $opal.cm('Integer') : $b)['$==='](name)) !== false && $a !== nil) {
        if (name['$>='](self.$members().$size())) {
          self.$raise((($a = $scope.IndexError) == null ? $opal.cm('IndexError') : $a), "offset " + (name) + " too large for struct(size:" + (self.$members().$size()) + ")")};
        name = self.$members()['$[]'](name);
      } else if (($a = self.$members()['$include?'](name.$to_sym())) === false || $a === nil) {
        self.$raise((($a = $scope.NameError) == null ? $opal.cm('NameError') : $a), "no member '" + (name) + "' in struct")};
      return self.$instance_variable_set("@" + (name), value);
    };

    def.$each = TMP_9 = function() {
      var TMP_10, $a, $b, self = this, $iter = TMP_9._p, $yield = $iter || nil;
      TMP_9._p = null;
      if ($yield === nil) {
        return self.$enum_for("each")};
      return ($a = ($b = self.$members()).$each, $a._p = (TMP_10 = function(name) {var self = TMP_10._s || this, $a;if (name == null) name = nil;
        return $a = $opal.$yield1($yield, self['$[]'](name)), $a === $breaker ? $a : $a}, TMP_10._s = self, TMP_10), $a).call($b);
    };

    def.$each_pair = TMP_11 = function() {
      var TMP_12, $a, $b, self = this, $iter = TMP_11._p, $yield = $iter || nil;
      TMP_11._p = null;
      if ($yield === nil) {
        return self.$enum_for("each_pair")};
      return ($a = ($b = self.$members()).$each, $a._p = (TMP_12 = function(name) {var self = TMP_12._s || this, $a;if (name == null) name = nil;
        return $a = $opal.$yieldX($yield, [name, self['$[]'](name)]), $a === $breaker ? $a : $a}, TMP_12._s = self, TMP_12), $a).call($b);
    };

    def['$eql?'] = function(other) {
      var $a, TMP_13, $b, $c, self = this;
      return ((($a = self.$hash()['$=='](other.$hash())) !== false && $a !== nil) ? $a : ($b = ($c = other.$each_with_index())['$all?'], $b._p = (TMP_13 = function(object, index) {var self = TMP_13._s || this;if (object == null) object = nil;if (index == null) index = nil;
        return self['$[]'](self.$members()['$[]'](index))['$=='](object)}, TMP_13._s = self, TMP_13), $b).call($c));
    };

    def.$length = function() {
      var self = this;
      return self.$members().$length();
    };

    $opal.defn(self, '$size', def.$length);

    def.$to_a = function() {
      var TMP_14, $a, $b, self = this;
      return ($a = ($b = self.$members()).$map, $a._p = (TMP_14 = function(name) {var self = TMP_14._s || this;if (name == null) name = nil;
        return self['$[]'](name)}, TMP_14._s = self, TMP_14), $a).call($b);
    };

    $opal.defn(self, '$values', def.$to_a);

    def.$to_n = function() {
      var TMP_15, $a, $b, self = this, result = nil;
      result = {};
      ($a = ($b = self).$each_pair, $a._p = (TMP_15 = function(name, value) {var self = TMP_15._s || this;if (name == null) name = nil;if (value == null) value = nil;
        return result[name] = value.$to_n();}, TMP_15._s = self, TMP_15), $a).call($b);
      return result;
    };

    return (def.$inspect = function() {
      var $a, TMP_16, $b, self = this, result = nil;
      result = "#<struct ";
      if (self.$class()['$==']((($a = $scope.Struct) == null ? $opal.cm('Struct') : $a))) {
        result = result['$+']("" + (self.$class().$name()) + " ")};
      result = result['$+'](($a = ($b = self.$each_pair()).$map, $a._p = (TMP_16 = function(name, value) {var self = TMP_16._s || this;if (name == null) name = nil;if (value == null) value = nil;
        return "" + (name) + "=" + (value.$inspect())}, TMP_16._s = self, TMP_16), $a).call($b).$join(", "));
      result = result['$+'](">");
      return result;
    }, nil);
  })(self, null)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var $a, self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $range = $opal.range, $hash2 = $opal.hash2, $gvars = $opal.gvars;
  $opal.add_stubs(['$native?', '$new', '$end_with?', '$define_method', '$[]', '$convert', '$call', '$to_proc', '$to_n', '$instance_eval', '$extend', '$raise', '$include', '$length', '$enum_for', '$<', '$+', '$===', '$Native', '$-', '$>=', '$<<', '$inspect', '$to_a', '$try_convert', '$respond_to?', '$method_missing', '$[]=', '$slice']);
  (function($base) {
    var self = $module($base, 'Kernel');

    var def = self._proto, $scope = self._scope;
    def['$native?'] = function(value) {
      var self = this;
      return value == null || !value._klass;
    };

    def.$Native = function(obj) {
      var $a, self = this;
      if (($a = obj == null) !== false && $a !== nil) {
        return nil
      } else if (($a = self['$native?'](obj)) !== false && $a !== nil) {
        return (($a = $scope.Native) == null ? $opal.cm('Native') : $a).$new(obj)
        } else {
        return obj
      };
    };
        ;$opal.donate(self, ["$native?", "$Native"]);
  })(self);
  (function($base, $super) {
    function Native(){};
    var self = Native = $klass($base, $super, 'Native', Native);

    var def = Native._proto, $scope = Native._scope, TMP_7, $a, TMP_8, TMP_9;
    def['native'] = nil;
    (function($base) {
      var self = $module($base, 'Base');

      var def = self._proto, $scope = self._scope;
      (function($base) {
        var self = $module($base, 'Helpers');

        var def = self._proto, $scope = self._scope;
        def.$alias_native = function(new$, old, options) {
          var $a, TMP_1, $b, TMP_2, $c, TMP_3, $d, self = this, as = nil;
          if (old == null) {
            old = new$
          }
          if (options == null) {
            options = $hash2([], {})
          }
          if (($a = old['$end_with?']("=")) !== false && $a !== nil) {
            return ($a = ($b = self).$define_method, $a._p = (TMP_1 = function(value) {var self = TMP_1._s || this, $a;
              if (self['native'] == null) self['native'] = nil;
if (value == null) value = nil;
              self['native'][old['$[]']($range(0, -2, false))] = (($a = $scope.Native) == null ? $opal.cm('Native') : $a).$convert(value);
              return value;}, TMP_1._s = self, TMP_1), $a).call($b, new$)
          } else if (($a = as = options['$[]']("as")) !== false && $a !== nil) {
            return ($a = ($c = self).$define_method, $a._p = (TMP_2 = function(args) {var self = TMP_2._s || this, block, $a, $b, $c, $d;
              if (self['native'] == null) self['native'] = nil;
args = $slice.call(arguments, 0);
              block = TMP_2._p || nil, TMP_2._p = null;
              if (($a = value = ($b = ($c = (($d = $scope.Native) == null ? $opal.cm('Native') : $d)).$call, $b._p = block.$to_proc(), $b).apply($c, [self['native'], old].concat(args))) !== false && $a !== nil) {
                return as.$new(value.$to_n())
                } else {
                return nil
              }}, TMP_2._s = self, TMP_2), $a).call($c, new$)
            } else {
            return ($a = ($d = self).$define_method, $a._p = (TMP_3 = function(args) {var self = TMP_3._s || this, block, $a, $b, $c;
              if (self['native'] == null) self['native'] = nil;
args = $slice.call(arguments, 0);
              block = TMP_3._p || nil, TMP_3._p = null;
              return ($a = ($b = (($c = $scope.Native) == null ? $opal.cm('Native') : $c)).$call, $a._p = block.$to_proc(), $a).apply($b, [self['native'], old].concat(args))}, TMP_3._s = self, TMP_3), $a).call($d, new$)
          };
        }
                ;$opal.donate(self, ["$alias_native"]);
      })(self);

      $opal.defs(self, '$included', function(klass) {
        var TMP_4, $a, $b, self = this;
        return ($a = ($b = klass).$instance_eval, $a._p = (TMP_4 = function() {var self = TMP_4._s || this, $a;
          return self.$extend((($a = $scope.Helpers) == null ? $opal.cm('Helpers') : $a))}, TMP_4._s = self, TMP_4), $a).call($b);
      });

      def.$initialize = function(native$) {
        var $a, $b, self = this;
        if (($a = (($b = $scope.Kernel) == null ? $opal.cm('Kernel') : $b)['$native?'](native$)) === false || $a === nil) {
          (($a = $scope.Kernel) == null ? $opal.cm('Kernel') : $a).$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "the passed value isn't native")};
        return self['native'] = native$;
      };

      def.$to_n = function() {
        var self = this;
        if (self['native'] == null) self['native'] = nil;

        return self['native'];
      };
            ;$opal.donate(self, ["$initialize", "$to_n"]);
    })(self);

    (function($base, $super) {
      function Array(){};
      var self = Array = $klass($base, $super, 'Array', Array);

      var def = Array._proto, $scope = Array._scope, $a, TMP_5, TMP_6;
      def.named = def['native'] = def.get = def.block = def.set = def.length = nil;
      self.$include((($a = $scope.Base) == null ? $opal.cm('Base') : $a));

      self.$include((($a = $scope.Enumerable) == null ? $opal.cm('Enumerable') : $a));

      def.$initialize = TMP_5 = function(native$, options) {
        var $a, self = this, $iter = TMP_5._p, block = $iter || nil;
        if (options == null) {
          options = $hash2([], {})
        }
        TMP_5._p = null;
        $opal.find_super_dispatcher(self, 'initialize', TMP_5, null).apply(self, [native$]);
        self.get = ((($a = options['$[]']("get")) !== false && $a !== nil) ? $a : options['$[]']("access"));
        self.named = options['$[]']("named");
        self.set = ((($a = options['$[]']("set")) !== false && $a !== nil) ? $a : options['$[]']("access"));
        self.length = ((($a = options['$[]']("length")) !== false && $a !== nil) ? $a : "length");
        self.block = block;
        if (($a = self.$length() == null) !== false && $a !== nil) {
          return self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "no length found on the array-like object")
          } else {
          return nil
        };
      };

      def.$each = TMP_6 = function() {
        var $a, self = this, $iter = TMP_6._p, block = $iter || nil, index = nil, length = nil;
        TMP_6._p = null;
        if (($a = block) === false || $a === nil) {
          return self.$enum_for("each")};
        index = 0;
        length = self.$length();
        while (index['$<'](length)) {
        block.$call(self['$[]'](index));
        index = index['$+'](1);};
        return self;
      };

      def['$[]'] = function(index) {
        var $a, self = this, result = nil, $case = nil;
        result = (function() {$case = index;if ((($a = $scope.String) == null ? $opal.cm('String') : $a)['$===']($case) || (($a = $scope.Symbol) == null ? $opal.cm('Symbol') : $a)['$===']($case)) {if (($a = self.named) !== false && $a !== nil) {
          return self['native'][self.named](index);
          } else {
          return self['native'][index];
        }}else if ((($a = $scope.Integer) == null ? $opal.cm('Integer') : $a)['$===']($case)) {if (($a = self.get) !== false && $a !== nil) {
          return self['native'][self.get](index);
          } else {
          return self['native'][index];
        }}else { return nil }})();
        if (result !== false && result !== nil) {
          if (($a = self.block) !== false && $a !== nil) {
            return self.block.$call(result)
            } else {
            return self.$Native(result)
          }
          } else {
          return nil
        };
      };

      def['$[]='] = function(index, value) {
        var $a, self = this;
        if (($a = self.set) !== false && $a !== nil) {
          return self['native'][self.set](index, value);
          } else {
          return self['native'][index] = value;
        };
      };

      def.$last = function(count) {
        var $a, self = this, index = nil, result = nil;
        if (count == null) {
          count = nil
        }
        if (count !== false && count !== nil) {
          index = self.$length()['$-'](1);
          result = [];
          while (index['$>='](0)) {
          result['$<<'](self['$[]'](index));
          index = index['$-'](1);};
          return result;
          } else {
          return self['$[]'](self.$length()['$-'](1))
        };
      };

      def.$length = function() {
        var self = this;
        return self['native'][self.length];
      };

      $opal.defn(self, '$to_ary', def.$to_a);

      return (def.$inspect = function() {
        var self = this;
        return self.$to_a().$inspect();
      }, nil);
    })(self, null);

    $opal.defs(self, '$is_a?', function(object, klass) {
      var $a, self = this;
      
      try {
        return object instanceof (($a = $scope.Native) == null ? $opal.cm('Native') : $a).$try_convert(klass);
      }
      catch (e) {
        return false;
      }
    ;
    });

    $opal.defs(self, '$try_convert', function(value) {
      var self = this;
      
      if (self['$native?'](value)) {
        return value;
      }
      else if (value['$respond_to?']("to_n")) {
        return value.$to_n();
      }
      else {
        return nil;
      }
    ;
    });

    $opal.defs(self, '$convert', function(value) {
      var $a, self = this, native$ = nil;
      native$ = self.$try_convert(value);
      if (($a = native$ === nil) !== false && $a !== nil) {
        self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "the passed value isn't a native")};
      return native$;
    });

    $opal.defs(self, '$call', TMP_7 = function(obj, key, args) {
      var self = this, $iter = TMP_7._p, block = $iter || nil;
      args = $slice.call(arguments, 2);
      TMP_7._p = null;
      if (block !== false && block !== nil) {
        args['$<<'](block)};
      
      var prop = obj[key];

      if (prop == null) {
        return nil;
      }
      else if (prop instanceof Function) {
        var result = prop.apply(obj, args);

        return result == null ? nil : result;
      }
      else if (self['$native?'](prop)) {
        return self.$Native(prop);
      }
      else {
        return prop;
      }
    ;
    });

    self.$include((($a = $scope.Base) == null ? $opal.cm('Base') : $a));

    def['$has_key?'] = function(name) {
      var self = this;
      return self['native'].hasOwnProperty(name);
    };

    $opal.defn(self, '$key?', def['$has_key?']);

    $opal.defn(self, '$include?', def['$has_key?']);

    $opal.defn(self, '$member?', def['$has_key?']);

    def.$each = TMP_8 = function(args) {
      var $a, self = this, $iter = TMP_8._p, $yield = $iter || nil;
      args = $slice.call(arguments, 0);
      TMP_8._p = null;
      if (($yield !== nil)) {
        
        for (var key in self['native']) {
          ((($a = $opal.$yieldX($yield, [key, self['native'][key]])) === $breaker) ? $breaker.$v : $a)
        }
      ;
        return self;
        } else {
        return ($a = self).$method_missing.apply($a, ["each"].concat(args))
      };
    };

    def['$[]'] = function(key) {
      var $a, self = this;
      
      var prop = self['native'][key];

      if (prop instanceof Function) {
        return prop;
      }
      else {
        return (($a = $opal.Object._scope.Native) == null ? $opal.cm('Native') : $a).$call(self['native'], key)
      }
    ;
    };

    def['$[]='] = function(key, value) {
      var $a, self = this, native$ = nil;
      native$ = (($a = $scope.Native) == null ? $opal.cm('Native') : $a).$try_convert(value);
      if (($a = native$ === nil) !== false && $a !== nil) {
        return self['native'][key] = value;
        } else {
        return self['native'][key] = native$;
      };
    };

    def.$method_missing = TMP_9 = function(mid, args) {
      var $a, $b, $c, self = this, $iter = TMP_9._p, block = $iter || nil;
      args = $slice.call(arguments, 1);
      TMP_9._p = null;
      
      if (mid.charAt(mid.length - 1) === '=') {
        return self['$[]='](mid.$slice(0, mid.$length()['$-'](1)), args['$[]'](0));
      }
      else {
        return ($a = ($b = (($c = $opal.Object._scope.Native) == null ? $opal.cm('Native') : $c)).$call, $a._p = block.$to_proc(), $a).apply($b, [self['native'], mid].concat(args));
      }
    ;
    };

    return (def['$nil?'] = function() {
      var self = this;
      return false;
    }, nil);
  })(self, (($a = $scope.BasicObject) == null ? $opal.cm('BasicObject') : $a));
  return $gvars["$"] = $gvars["global"] = self.$Native(Opal.global);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var $a, self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass, $module = $opal.module, $gvars = $opal.gvars;
  $opal.add_stubs(['$write', '$join', '$map', '$String', '$getbyte', '$getc', '$raise', '$new', '$puts', '$to_s']);
  (function($base, $super) {
    function IO(){};
    var self = IO = $klass($base, $super, 'IO', IO);

    var def = IO._proto, $scope = IO._scope;
    $opal.cdecl($scope, 'SEEK_SET', 0);

    $opal.cdecl($scope, 'SEEK_CUR', 1);

    $opal.cdecl($scope, 'SEEK_END', 2);

    (function($base) {
      var self = $module($base, 'Writable');

      var def = self._proto, $scope = self._scope;
      def['$<<'] = function(string) {
        var self = this;
        self.$write(string);
        return self;
      };

      def.$print = function(args) {
        var TMP_1, $a, $b, self = this;
        args = $slice.call(arguments, 0);
        return self.$write(($a = ($b = args).$map, $a._p = (TMP_1 = function(arg) {var self = TMP_1._s || this;if (arg == null) arg = nil;
          return self.$String(arg)}, TMP_1._s = self, TMP_1), $a).call($b).$join($gvars[","]));
      };

      def.$puts = function(args) {
        var TMP_2, $a, $b, self = this;
        args = $slice.call(arguments, 0);
        return self.$write(($a = ($b = args).$map, $a._p = (TMP_2 = function(arg) {var self = TMP_2._s || this;if (arg == null) arg = nil;
          return self.$String(arg)}, TMP_2._s = self, TMP_2), $a).call($b).$join($gvars["/"]));
      };
            ;$opal.donate(self, ["$<<", "$print", "$puts"]);
    })(self);

    return (function($base) {
      var self = $module($base, 'Readable');

      var def = self._proto, $scope = self._scope;
      def.$readbyte = function() {
        var self = this;
        return self.$getbyte();
      };

      def.$readchar = function() {
        var self = this;
        return self.$getc();
      };

      def.$readline = function(sep) {
        var $a, self = this;
        if (sep == null) {
          sep = $gvars["/"]
        }
        return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
      };

      def.$readpartial = function(integer, outbuf) {
        var $a, self = this;
        if (outbuf == null) {
          outbuf = nil
        }
        return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
      };
            ;$opal.donate(self, ["$readbyte", "$readchar", "$readline", "$readpartial"]);
    })(self);
  })(self, null);
  $opal.cdecl($scope, 'STDERR', $gvars["stderr"] = (($a = $scope.IO) == null ? $opal.cm('IO') : $a).$new());
  $opal.cdecl($scope, 'STDIN', $gvars["stdin"] = (($a = $scope.IO) == null ? $opal.cm('IO') : $a).$new());
  $opal.cdecl($scope, 'STDOUT', $gvars["stdout"] = (($a = $scope.IO) == null ? $opal.cm('IO') : $a).$new());
  $opal.defs($gvars["stdout"], '$puts', function(strs) {
    var $a, self = this;
    strs = $slice.call(arguments, 0);
    
    for (var i = 0; i < strs.length; i++) {
      if(strs[i] instanceof Array) {
        ($a = self).$puts.apply($a, [].concat((strs[i])))
      } else {
        console.log((strs[i]).$to_s());
      }
    }
  ;
    return nil;
  });
  return ($opal.defs($gvars["stderr"], '$puts', function(strs) {
    var $a, self = this;
    strs = $slice.call(arguments, 0);
    
    for (var i = 0; i < strs.length; i++) {
      if(strs[i] instanceof Array) {
        ($a = self).$puts.apply($a, [].concat((strs[i])))
      } else {
        console.warn((strs[i]).$to_s());
      }
    }
  ;
    return nil;
  }), nil);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice;
  $opal.add_stubs(['$include']);
  $opal.defs(self, '$to_s', function() {
    var self = this;
    return "main";
  });
  return ($opal.defs(self, '$include', function(mod) {
    var $a, self = this;
    return (($a = $scope.Object) == null ? $opal.cm('Object') : $a).$include(mod);
  }), nil);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var $a, self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $gvars = $opal.gvars, $hash2 = $opal.hash2, $module = $opal.module;
  $opal.add_stubs(['$new', '$===', '$respond_to?', '$raise', '$class', '$__send__']);
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  $gvars["&"] = $gvars["~"] = $gvars["`"] = $gvars["'"] = nil;
  $gvars[":"] = [];
  $gvars["/"] = "\n";
  $gvars[","] = " ";
  $opal.cdecl($scope, 'ARGV', []);
  $opal.cdecl($scope, 'ARGF', (($a = $scope.Object) == null ? $opal.cm('Object') : $a).$new());
  $opal.cdecl($scope, 'ENV', $hash2([], {}));
  $opal.cdecl($scope, 'RUBY_PLATFORM', "opal");
  $opal.cdecl($scope, 'RUBY_ENGINE', "opal");
  $opal.cdecl($scope, 'RUBY_VERSION', "1.9.3");
  $opal.cdecl($scope, 'RUBY_ENGINE_VERSION', "0.4.4");
  $opal.cdecl($scope, 'RUBY_RELEASE_DATE', "2013-08-13");
  return (function($base) {
    var self = $module($base, 'Opal');

    var def = self._proto, $scope = self._scope;
    $opal.defs(self, '$coerce_to', function(object, type, method) {
      var $a, self = this;
      if (($a = type['$==='](object)) !== false && $a !== nil) {
        return object};
      if (($a = object['$respond_to?'](method)) === false || $a === nil) {
        self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "no implicit conversion of " + (object.$class()) + " into " + (type))};
      return object.$__send__(method);
    });

    $opal.defs(self, '$truthy?', function(value) {
      var self = this;
      if (value !== false && value !== nil) {
        return true
        } else {
        return false
      };
    });

    $opal.defs(self, '$falsy?', function(value) {
      var self = this;
      if (value !== false && value !== nil) {
        return false
        } else {
        return true
      };
    });

    $opal.defs(self, '$destructure', function(args) {
      var self = this;
      
      if (args.length == 1) {
        return args[0];
      }
      else if (args._isArray) {
        return args;
      }
      else {
        return $slice.call(args);
      }
    
    });
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$new', '$[]', '$map', '$split', '$decode_uri_component', '$join', '$encode_uri_component', '$to_s']);
  (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope, $a;
    $opal.cdecl($scope, 'Size', (($a = $scope.Struct) == null ? $opal.cm('Struct') : $a).$new("width", "height"));

    $opal.cdecl($scope, 'Position', (($a = $scope.Struct) == null ? $opal.cm('Struct') : $a).$new("x", "y"));
    
  })(self);
  (function($base, $super) {
    function String(){};
    var self = String = $klass($base, $super, 'String', String);

    var def = String._proto, $scope = String._scope;
    def.$encode_uri_component = function() {
      var self = this;
      return encodeURIComponent(self);
    };

    def.$encode_uri = function() {
      var self = this;
      return encodeURI(self);
    };

    def.$decode_uri_component = function() {
      var self = this;
      return decodeURIComponent(self);
    };

    return (def.$decode_uri = function() {
      var self = this;
      return decodeURI(self);
    }, nil);
  })(self, null);
  return (function($base, $super) {
    function Hash(){};
    var self = Hash = $klass($base, $super, 'Hash', Hash);

    var def = Hash._proto, $scope = Hash._scope;
    $opal.defs(self, '$decode_uri', function(string) {
      var TMP_1, $a, $b, self = this;
      return self['$[]'](($a = ($b = string.$split("&")).$map, $a._p = (TMP_1 = function(part) {var self = TMP_1._s || this, $a, name = nil, value = nil;if (part == null) part = nil;
        $a = $opal.to_ary(part.$split("=")), name = ($a[0] == null ? nil : $a[0]), value = ($a[1] == null ? nil : $a[1]);
        return [name.$decode_uri_component(), value.$decode_uri_component()];}, TMP_1._s = self, TMP_1), $a).call($b));
    });

    return (def.$encode_uri = function() {
      var TMP_2, $a, $b, self = this;
      return ($a = ($b = self).$map, $a._p = (TMP_2 = function(name, value) {var self = TMP_2._s || this;if (name == null) name = nil;if (value == null) value = nil;
        return "" + (name.$to_s().$encode_uri_component()) + "=" + (value.$to_s().$encode_uri_component())}, TMP_2._s = self, TMP_2), $a).call($b).$join("&");
    }, nil);
  })(self, null);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module;
  $opal.add_stubs(['$downcase', '$==', '$length']);
  $opal.cdecl($scope, 'BROWSER_ENGINE', (function() {try {return (/MSIE|WebKit|Presto|Gecko/.exec(navigator.userAgent)[0]).$downcase() } catch ($err) { return "unknown" }})());
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope, $a;
    (function($base) {
      var self = $module($base, 'Compatibility');

      var def = self._proto, $scope = self._scope;
      $opal.defs(self, '$sizzle?', function() {
        var self = this;
        return (typeof(window.Sizzle) !== "undefined");
      });

      $opal.defs(self, '$respond_to?', function(args) {
        var $a, self = this, parent = nil, object = nil, method = nil;
        args = $slice.call(arguments, 0);
        if (args.$length()['$=='](2)) {
          parent = window;
          $a = $opal.to_ary(args), object = ($a[0] == null ? nil : $a[0]), method = ($a[1] == null ? nil : $a[1]);
          } else {
          $a = $opal.to_ary(args), parent = ($a[0] == null ? nil : $a[0]), object = ($a[1] == null ? nil : $a[1]), method = ($a[2] == null ? nil : $a[2])
        };
        
      if (!parent) {
        return false;
      }

      var klass = parent[object];

      if (!klass) {
        return false;
      }

      return typeof(klass.prototype[method]) === "function";
    ;
      });

      $opal.defs(self, '$has?', function(args) {
        var $a, self = this, parent = nil, name = nil;
        args = $slice.call(arguments, 0);
        if (args.$length()['$=='](1)) {
          parent = window;
          $a = $opal.to_ary(args), name = ($a[0] == null ? nil : $a[0]);
          } else {
          $a = $opal.to_ary(args), parent = ($a[0] == null ? nil : $a[0]), name = ($a[1] == null ? nil : $a[1])
        };
        
      if (!parent) {
        return false;
      }

      return parent[name] != null;
    ;
      });
      
    })(self);

    $opal.cdecl($scope, 'C', (($a = $scope.Compatibility) == null ? $opal.cm('Compatibility') : $a));
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$attr_reader', '$convert', '$start', '$aborted?', '$raise', '$stopped?', '$to_n', '$block']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Interval(){};
      var self = Interval = $klass($base, $super, 'Interval', Interval);

      var def = Interval._proto, $scope = Interval._scope, TMP_1;
      def.stopped = def.aborted = def.window = def.id = nil;
      self.$attr_reader("every");

      def.$initialize = TMP_1 = function(window, time) {
        var $a, self = this, $iter = TMP_1._p, block = $iter || nil;
        TMP_1._p = null;
        self.window = (($a = $scope.Native) == null ? $opal.cm('Native') : $a).$convert(window);
        self.every = time;
        self.block = block;
        self.aborted = false;
        self.stopped = true;
        return self.$start();
      };

      def['$stopped?'] = function() {
        var self = this;
        return self.stopped;
      };

      def['$aborted?'] = function() {
        var self = this;
        return self.aborted;
      };

      def.$abort = function() {
        var self = this;
        self.window.clearInterval(self.id);
        self.aborted = true;
        self.id = nil;
        return self;
      };

      def.$stop = function() {
        var self = this;
        self.window.clearInterval(self.id);
        self.stopped = true;
        return self.id = nil;
      };

      return (def.$start = function() {
        var $a, self = this;
        if (($a = self['$aborted?']()) !== false && $a !== nil) {
          self.$raise("the interval has been aborted")};
        if (($a = self['$stopped?']()) === false || $a === nil) {
          return nil};
        self.id = self.window.setInterval(self.$block().$to_n(), time * 1000);
        return self;
      }, nil);
    })(self, null)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$attr_reader', '$convert', '$to_n']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Timeout(){};
      var self = Timeout = $klass($base, $super, 'Timeout', Timeout);

      var def = Timeout._proto, $scope = Timeout._scope, TMP_1;
      def.window = def.id = nil;
      self.$attr_reader("after");

      def.$initialize = TMP_1 = function(window, time) {
        var $a, self = this, $iter = TMP_1._p, block = $iter || nil;
        TMP_1._p = null;
        self.window = (($a = $scope.Native) == null ? $opal.cm('Native') : $a).$convert(window);
        self.after = time;
        self.block = block;
        return self.id = self.window.setTimeout(block.$to_n(), time * 1000);
      };

      return (def.$abort = function() {
        var self = this;
        self.window.clearTimeout(self.id);
        return self;
      }, nil);
    })(self, null)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$to_n']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Window(){};
      var self = Window = $klass($base, $super, 'Window', Window);

      var def = Window._proto, $scope = Window._scope;
      return (function($base, $super) {
        function View(){};
        var self = View = $klass($base, $super, 'View', View);

        var def = View._proto, $scope = View._scope;
        def['native'] = nil;
        def.$initialize = function(window) {
          var self = this;
          self.window = window;
          return self['native'] = window.$to_n();
        };

        def.$width = function() {
          var self = this;
          return self['native'].innerWidth;
        };

        return (def.$height = function() {
          var self = this;
          return self['native'].innerHeight;
        }, nil);
      })(self, null)
    })(self, null)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $hash2 = $opal.hash2;
  $opal.add_stubs(['$to_n', '$[]', '$width', '$height', '$set']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Window(){};
      var self = Window = $klass($base, $super, 'Window', Window);

      var def = Window._proto, $scope = Window._scope;
      return (function($base, $super) {
        function Size(){};
        var self = Size = $klass($base, $super, 'Size', Size);

        var def = Size._proto, $scope = Size._scope;
        def['native'] = nil;
        def.$initialize = function(window) {
          var self = this;
          self.window = window;
          return self['native'] = window.$to_n();
        };

        def.$set = function(what) {
          var $a, self = this, width = nil, height = nil;
          width = ((($a = what['$[]']("width")) !== false && $a !== nil) ? $a : self.$width());
          height = ((($a = what['$[]']("height")) !== false && $a !== nil) ? $a : self.$height());
          self['native'].resizeTo(width, height);
          return self;
        };

        def.$width = function() {
          var self = this;
          return self['native'].outerWidth;
        };

        def['$width='] = function(value) {
          var self = this;
          return self.$set($hash2(["width"], {"width": value}));
        };

        def.$height = function() {
          var self = this;
          return self['native'].outerHeight;
        };

        return (def['$height='] = function(value) {
          var self = this;
          return self.$set($hash2(["height"], {"height": value}));
        }, nil);
      })(self, null)
    })(self, null)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$to_n', '$new', '$x', '$position', '$y', '$[]']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Window(){};
      var self = Window = $klass($base, $super, 'Window', Window);

      var def = Window._proto, $scope = Window._scope;
      return (function($base, $super) {
        function Scroll(){};
        var self = Scroll = $klass($base, $super, 'Scroll', Scroll);

        var def = Scroll._proto, $scope = Scroll._scope;
        def['native'] = nil;
        def.$initialize = function(window) {
          var self = this;
          self.window = window;
          return self['native'] = window.$to_n();
        };

        def.$position = function() {
          var $a, self = this;
          
      var doc  = self['native'].document,
          root = doc.documentElement,
          body = doc.body;

      var x = root.scrollLeft || body.scrollLeft,
          y = root.scrollTop  || body.scrollTop;
    ;
          return (($a = $scope.Position) == null ? $opal.cm('Position') : $a).$new(x, y);
        };

        def.$x = function() {
          var self = this;
          return self.$position().$x();
        };

        def.$y = function() {
          var self = this;
          return self.$position().$y();
        };

        def.$to = function(what) {
          var $a, self = this, x = nil, y = nil;
          x = ((($a = what['$[]']("x")) !== false && $a !== nil) ? $a : self.$x());
          y = ((($a = what['$[]']("y")) !== false && $a !== nil) ? $a : self.$y());
          self['native'].scrollTo(x, y);
          return self;
        };

        return (def.$by = function(what) {
          var $a, self = this, x = nil, y = nil;
          x = ((($a = what['$[]']("x")) !== false && $a !== nil) ? $a : 0);
          y = ((($a = what['$[]']("y")) !== false && $a !== nil) ? $a : 0);
          self['native'].scrollBy(x, y);
          return self;
        }, nil);
      })(self, null)
    })(self, null)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$has?']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Window(){};
      var self = Window = $klass($base, $super, 'Window', Window);

      var def = Window._proto, $scope = Window._scope;
      return (function($base, $super) {
        function View(){};
        var self = View = $klass($base, $super, 'View', View);

        var def = View._proto, $scope = View._scope, $a, $b;
        def['native'] = nil;
        if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$has?']("innerHeight")) !== false && $a !== nil) {
          return nil
          } else {
          def.$width = function() {
            var self = this;
            return self['native'].document.documentElement.clientWidth;
          };

          return (def.$height = function() {
            var self = this;
            return self['native'].document.documentElement.clientHeight;
          }, nil);
        }
      })(self, null)
    })(self, null)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$has?', '$raise']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Window(){};
      var self = Window = $klass($base, $super, 'Window', Window);

      var def = Window._proto, $scope = Window._scope;
      return (function($base, $super) {
        function Size(){};
        var self = Size = $klass($base, $super, 'Size', Size);

        var def = Size._proto, $scope = Size._scope, $a, $b;
        if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$has?']("outerHeight")) !== false && $a !== nil) {
          return nil
          } else {
          def.$width = function() {
            var $a, self = this;
            return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a), "window outer size not supported");
          };

          return (def.$height = function() {
            var $a, self = this;
            return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a), "window outer size not supported");
          }, nil);
        }
      })(self, null)
    })(self, null)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$has?', '$new', '$x', '$y', '$raise']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Window(){};
      var self = Window = $klass($base, $super, 'Window', Window);

      var def = Window._proto, $scope = Window._scope;
      return (function($base, $super) {
        function Scroll(){};
        var self = Scroll = $klass($base, $super, 'Scroll', Scroll);

        var def = Scroll._proto, $scope = Scroll._scope, $a, $b;
        def['native'] = nil;
        if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$has?'](document.documentElement, "scrollLeft")) !== false && $a !== nil) {
          return nil
        } else if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$has?']("pageXOffset")) !== false && $a !== nil) {
          def.$position = function() {
            var $a, self = this;
            return (($a = $scope.Position) == null ? $opal.cm('Position') : $a).$new(self.$x(), self.$y());
          };

          def.$x = function() {
            var self = this;
            return self['native'].pageXOffset;
          };

          return (def.$y = function() {
            var self = this;
            return self['native'].pageYOffset;
          }, nil);
          } else {
          def.$x = function() {
            var $a, self = this;
            return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a), "window scroll unsupported");
          };

          return (def.$y = function() {
            var $a, self = this;
            return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a), "window scroll unsupported");
          }, nil);
        }
      })(self, null)
    })(self, null)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice;
  $opal.add_stubs([]);
  ;
  ;
  return true;
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var $a, $b, self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $hash2 = $opal.hash2, $gvars = $opal.gvars;
  $opal.add_stubs(['$delete', '$join', '$map', '$===', '$new', '$include', '$[]', '$to_proc', '$alert', '$once', '$every']);
  ;
  ;
  ;
  ;
  ;
  ;
  (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Window(){};
      var self = Window = $klass($base, $super, 'Window', Window);

      var def = Window._proto, $scope = Window._scope, $a, $b, TMP_2, TMP_3;
      def['native'] = nil;
      $opal.defs(self, '$open', function(url, options) {
        var TMP_1, $a, $b, self = this, name = nil, features = nil;
        name = options.$delete("name");
        features = ($a = ($b = options).$map, $a._p = (TMP_1 = function(key, value) {var self = TMP_1._s || this, $case = nil;if (key == null) key = nil;if (value == null) value = nil;
          value = (function() {$case = value;if (true['$===']($case)) {return "yes"}else if (false['$===']($case)) {return "no"}else {return value}})();
          return "" + (key) + "=" + (value);}, TMP_1._s = self, TMP_1), $a).call($b).$join(",");
        
      var win = window.open(url, name, features);

      if (win == null) {
        return nil;
      }

      return self.$new(win);
    ;
      });

      self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

      def.$alert = function(value) {
        var self = this;
        self['native'].alert(value);
        return value;
      };

      def.$view = function() {
        var $a, self = this;
        return (($a = $scope.View) == null ? $opal.cm('View') : $a).$new(self);
      };

      def.$size = function() {
        var $a, self = this;
        return (($a = $scope.Size) == null ? $opal.cm('Size') : $a).$new(self);
      };

      def.$scroll = function() {
        var $a, self = this;
        return (($a = $scope.Scroll) == null ? $opal.cm('Scroll') : $a).$new(self);
      };

      def['$send!'] = function(message, options) {
        var $a, self = this;
        if (options == null) {
          options = $hash2([], {})
        }
        return self['native'].postMessage(message, ((($a = options['$[]']("to")) !== false && $a !== nil) ? $a : "*"));
      };

      def.$every = TMP_2 = function(time) {
        var $a, $b, $c, self = this, $iter = TMP_2._p, block = $iter || nil;
        TMP_2._p = null;
        return ($a = ($b = (($c = $scope.Interval) == null ? $opal.cm('Interval') : $c)).$new, $a._p = block.$to_proc(), $a).call($b, self['native'], time);
      };

      def.$once = TMP_3 = function(time) {
        var $a, $b, $c, self = this, $iter = TMP_3._p, block = $iter || nil;
        TMP_3._p = null;
        return ($a = ($b = (($c = $scope.Timeout) == null ? $opal.cm('Timeout') : $c)).$new, $a._p = block.$to_proc(), $a).call($b, self['native'], time);
      };

      $opal.defn(self, '$once_after', def.$once);

      return $opal.defn(self, '$after', def.$once);
    })(self, null)
    
  })(self);
  $gvars["window"] = (($a = ((($b = $scope.Browser) == null ? $opal.cm('Browser') : $b))._scope).Window == null ? $a.cm('Window') : $a.Window).$new(window);
  return (function($base) {
    var self = $module($base, 'Kernel');

    var def = self._proto, $scope = self._scope, TMP_4, TMP_5;
    def.$alert = function(value) {
      var self = this;
      return $gvars["window"].$alert(value);
    };

    def.$once = TMP_4 = function(time) {
      var $a, $b, self = this, $iter = TMP_4._p, block = $iter || nil;
      TMP_4._p = null;
      return ($a = ($b = $gvars["window"]).$once, $a._p = block.$to_proc(), $a).call($b, time);
    };

    $opal.defn(self, '$once_after', def.$once);

    $opal.defn(self, '$after', def.$once);

    def.$every = TMP_5 = function(time) {
      var $a, $b, self = this, $iter = TMP_5._p, block = $iter || nil;
      TMP_5._p = null;
      return ($a = ($b = $gvars["window"]).$every, $a._p = block.$to_proc(), $a).call($b, time);
    };
        ;$opal.donate(self, ["$alert", "$once", "$once_after", "$after", "$every"]);
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $hash2 = $opal.hash2;
  $opal.add_stubs(['$include', '$call', '$to_n', '$<<', '$converters', '$native?', '$each', '$instance_eval', '$register', '$to_proc', '$attr_reader', '$new', '$stopped?', '$arguments', '$off', '$target', '$===', '$matches?', '$on', '$deferred', '$added', '$observe', '$raise', '$name_for', '$push', '$callbacks', '$css', '$delete', '$name', '$include?', '$gsub', '$delete_if', '$==', '$=~', '$clear', '$is_a?', '$create']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope;
        (function($base, $super) {
          function Definition(){};
          var self = Definition = $klass($base, $super, 'Definition', Definition);

          var def = Definition._proto, $scope = Definition._scope, $a, $b, TMP_1;
          def['native'] = nil;
          self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

          $opal.defs(self, '$new', TMP_1 = function() {
            var self = this, $iter = TMP_1._p, block = $iter || nil, data = nil;
            TMP_1._p = null;
            data = $opal.find_super_dispatcher(self, 'new', TMP_1, null, Definition).apply(self, [{}]);
            if (block !== false && block !== nil) {
              block.$call(data)};
            return data.$to_n();
          });

          def['$bubbles!'] = function() {
            var self = this;
            return self['native'].bubbles = true;
          };

          return (def['$cancelable!'] = function() {
            var self = this;
            return self['native'].cancelable = true;
          }, nil);
        })(self, null);

        return (function($base) {
          var self = $module($base, 'Target');

          var def = self._proto, $scope = self._scope, TMP_2, TMP_11, TMP_15;
          $opal.defs(self, '$converters', function() {
            var $a, self = this;
            if (self.converters == null) self.converters = nil;

            return ((($a = self.converters) !== false && $a !== nil) ? $a : self.converters = []);
          });

          $opal.defs(self, '$register', TMP_2 = function() {
            var self = this, $iter = TMP_2._p, block = $iter || nil;
            TMP_2._p = null;
            return self.$converters()['$<<'](block);
          });

          $opal.defs(self, '$convert', function(value) {try {

            var $a, TMP_3, $b, self = this;
            if (($a = self['$native?'](value)) === false || $a === nil) {
              return value};
            ($a = ($b = self.$converters()).$each, $a._p = (TMP_3 = function(block) {var self = TMP_3._s || this, $a, result = nil;if (block == null) block = nil;
              if (($a = result = block.$call(value)) !== false && $a !== nil) {
                $opal.$return(result)
                } else {
                return nil
              }}, TMP_3._s = self, TMP_3), $a).call($b);
            return nil;
            } catch ($returner) { if ($returner === $opal.returner) { return $returner.$v } throw $returner; }
          });

          $opal.defs(self, '$included', function(klass) {
            var TMP_4, $a, $b, self = this;
            return ($a = ($b = klass).$instance_eval, $a._p = (TMP_4 = function() {var self = TMP_4._s || this, TMP_5;
              return ($opal.defs(self, '$target', TMP_5 = function() {
                var $a, $b, $c, $d, $e, self = this, $iter = TMP_5._p, block = $iter || nil;
                TMP_5._p = null;
                return ($a = ($b = (($c = ((($d = ((($e = $scope.DOM) == null ? $opal.cm('DOM') : $e))._scope).Event == null ? $d.cm('Event') : $d.Event))._scope).Target == null ? $c.cm('Target') : $c.Target)).$register, $a._p = block.$to_proc(), $a).call($b);
              }), nil)}, TMP_4._s = self, TMP_4), $a).call($b);
          });

          (function($base, $super) {
            function Callback(){};
            var self = Callback = $klass($base, $super, 'Callback', Callback);

            var def = Callback._proto, $scope = Callback._scope, TMP_6;
            def['function'] = nil;
            self.$attr_reader("target", "name", "selector");

            def.$initialize = TMP_6 = function(target, name, selector) {
              var $a, $b, $c, self = this, $iter = TMP_6._p, block = $iter || nil;
              if (selector == null) {
                selector = nil
              }
              TMP_6._p = null;
              
        callback = self;
        func     = function(event) {
          event = (($a = ((($b = ((($c = $opal.Object._scope.Browser) == null ? $opal.cm('Browser') : $c))._scope).DOM == null ? $b.cm('DOM') : $b.DOM))._scope).Event == null ? $a.cm('Event') : $a.Event).$new(event, callback);

          if (!(event)['$stopped?']()) {
            ($a = block).$call.apply($a, [event].concat((event).$arguments()));
          }

          return !(event)['$stopped?']();
        }
      ;
              self['function'] = func;
              self.target = target;
              self.name = name;
              return self.selector = selector;
            };

            def.$off = function() {
              var self = this;
              return self.$target().$off(self);
            };

            return (def.$to_n = function() {
              var self = this;
              return self['function'];
            }, nil);
          })(self, null);

          def.$callbacks = function() {
            var self = this;
            if (self['native'] == null) self['native'] = nil;

            
      if (!self['native'].$callbacks) {
        self['native'].$callbacks = [];
      }

      return self['native'].$callbacks;
    ;
          };

          def.$observe = function() {
            var TMP_7, $a, $b, $c, self = this;
            if (self['native'] == null) self['native'] = nil;

            
      if (!self['native'].$observer) {
        self['native'].$observer = ($a = ($b = (($c = $scope.MutationObserver) == null ? $opal.cm('MutationObserver') : $c)).$new, $a._p = (TMP_7 = function(mutations) {var self = TMP_7._s || this, TMP_8, $a, $b;if (mutations == null) mutations = nil;
              return ($a = ($b = mutations).$each, $a._p = (TMP_8 = function(mutation) {var self = TMP_8._s || this, TMP_9, $a, $b;if (mutation == null) mutation = nil;
                return ($a = ($b = mutation.$added()).$each, $a._p = (TMP_9 = function(node) {var self = TMP_9._s || this, $a, $b, TMP_10;if (node == null) node = nil;
                  if (($a = (($b = $scope.Element) == null ? $opal.cm('Element') : $b)['$==='](node)) === false || $a === nil) {
                    return nil;};
                  return ($a = ($b = self.$deferred()).$each, $a._p = (TMP_10 = function(name, selector, block) {var self = TMP_10._s || this, $a, $b;if (name == null) name = nil;if (selector == null) selector = nil;if (block == null) block = nil;
                    if (($a = node['$matches?'](selector)) !== false && $a !== nil) {
                      return ($a = ($b = node).$on, $a._p = block.$to_proc(), $a).call($b, name)
                      } else {
                      return nil
                    }}, TMP_10._s = self, TMP_10), $a).call($b);}, TMP_9._s = self, TMP_9), $a).call($b)}, TMP_8._s = self, TMP_8), $a).call($b)}, TMP_7._s = self, TMP_7), $a).call($b);

        (self['native'].$observer).$observe(self['native'], $hash2(["children", "tree"], {"children": true, "tree": true}))
      }
    ;
          };

          def.$deferred = function() {
            var self = this;
            if (self['native'] == null) self['native'] = nil;

            
      if (!self['native'].$deferred) {
        self['native'].$deferred = [];
      }

      return self['native'].$deferred;
    ;
          };

          def.$on = TMP_11 = function(name, selector) {
            var $a, $b, $c, self = this, $iter = TMP_11._p, block = $iter || nil, callback = nil;
            if (self['native'] == null) self['native'] = nil;

            if (selector == null) {
              selector = nil
            }
            TMP_11._p = null;
            if (($a = block) === false || $a === nil) {
              self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "no block has been passed")};
            name = (($a = $scope.Event) == null ? $opal.cm('Event') : $a).$name_for(name);
            callback = ($a = ($b = (($c = $scope.Callback) == null ? $opal.cm('Callback') : $c)).$new, $a._p = block.$to_proc(), $a).call($b, self, name, selector);
            self.$callbacks().$push(callback);
            if (selector !== false && selector !== nil) {
              self.$observe();
              self.$deferred()['$<<']([name, selector, block]);
              ($a = ($c = self.$css(selector)).$on, $a._p = block.$to_proc(), $a).call($c, name);
              } else {
              self['native'].addEventListener(name, callback.$to_n());
            };
            return callback;
          };

          def.$off = function(what) {
            var $a, $b, TMP_12, TMP_13, $c, TMP_14, $d, self = this, $case = nil;
            if (self['native'] == null) self['native'] = nil;

            if (what == null) {
              what = nil
            }
            return (function() {$case = what;if ((($a = $scope.Callback) == null ? $opal.cm('Callback') : $a)['$===']($case)) {self.$callbacks().$delete(what);
            return self['native'].removeEventListener(what.$name(), what.$to_n(), false);}else if ((($a = $scope.String) == null ? $opal.cm('String') : $a)['$===']($case)) {if (($a = ((($b = what['$include?']("*")) !== false && $b !== nil) ? $b : what['$include?']("?"))) !== false && $a !== nil) {
              return self.$off((($a = $scope.Regexp) == null ? $opal.cm('Regexp') : $a).$new(what.$gsub(/\*/, ".*?").$gsub(/\?/, ".")))
              } else {
              what = (($a = $scope.Event) == null ? $opal.cm('Event') : $a).$name_for(what);
              return ($a = ($b = self.$callbacks()).$delete_if, $a._p = (TMP_12 = function(callback) {var self = TMP_12._s || this;
                if (self['native'] == null) self['native'] = nil;
if (callback == null) callback = nil;
                if (callback.$name()['$=='](what)) {
                  self['native'].removeEventListener(callback.$name(), callback.$to_n(), false);
                  return true;
                  } else {
                  return nil
                }}, TMP_12._s = self, TMP_12), $a).call($b);
            }}else if ((($a = $scope.Regexp) == null ? $opal.cm('Regexp') : $a)['$===']($case)) {return ($a = ($c = self.$callbacks()).$delete_if, $a._p = (TMP_13 = function(callback) {var self = TMP_13._s || this, $a;
              if (self['native'] == null) self['native'] = nil;
if (callback == null) callback = nil;
              if (($a = callback.$name()['$=~'](what)) !== false && $a !== nil) {
                self['native'].removeEventListener(callback.$name(), callback.$to_n(), false);
                return true;
                } else {
                return nil
              }}, TMP_13._s = self, TMP_13), $a).call($c)}else {($a = ($d = self.$callbacks()).$each, $a._p = (TMP_14 = function(callback) {var self = TMP_14._s || this;
              if (self['native'] == null) self['native'] = nil;
if (callback == null) callback = nil;
              return self['native'].removeEventListener(callback.$name(), callback.$to_n(), false);}, TMP_14._s = self, TMP_14), $a).call($d);
            return self.$callbacks().$clear();}})();
          };

          def.$trigger = TMP_15 = function(event, args) {
            var $a, $b, $c, self = this, $iter = TMP_15._p, block = $iter || nil;
            if (self['native'] == null) self['native'] = nil;

            args = $slice.call(arguments, 1);
            TMP_15._p = null;
            if (($a = event['$is_a?']((($b = $scope.String) == null ? $opal.cm('String') : $b))) !== false && $a !== nil) {
              event = ($a = ($b = (($c = $scope.Event) == null ? $opal.cm('Event') : $c)).$create, $a._p = block.$to_proc(), $a).apply($b, [event].concat(args))};
            return self['native'].dispatchEvent(event.$to_n());
          };
                    ;$opal.donate(self, ["$callbacks", "$observe", "$deferred", "$on", "$off", "$trigger"]);
        })(self);
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$new', '$to_proc', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function UI(){};
          var self = UI = $klass($base, $super, 'UI', UI);

          var def = UI._proto, $scope = UI._scope, $a, TMP_1;
          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            def['$detail='] = function(value) {
              var self = this;
              return self['native'].detail = value;
            };

            return (def['$view='] = function(value) {
              var self = this;
              return self['native'].view = value;
            }, nil);
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new UIEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          self.$alias_native("detail");

          return self.$alias_native("view");
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$include', '$new', '$try_convert', '$to_proc', '$x', '$screen', '$y', '$DOM', '$==', '$downcase', '$name']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function Mouse(){};
          var self = Mouse = $klass($base, $super, 'Mouse', Mouse);

          var def = Mouse._proto, $scope = Mouse._scope, $a, $b, TMP_1;
          def['native'] = nil;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("MouseEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            (function($base, $super) {
              function Client(){};
              var self = Client = $klass($base, $super, 'Client', Client);

              var def = Client._proto, $scope = Client._scope, $a, $b;
              def['native'] = nil;
              self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

              def['$x='] = function(value) {
                var self = this;
                return self['native'].clientX = value;
              };

              return (def['$y='] = function(value) {
                var self = this;
                return self['native'].clientY = value;
              }, nil);
            })(self, null);

            (function($base, $super) {
              function Layer(){};
              var self = Layer = $klass($base, $super, 'Layer', Layer);

              var def = Layer._proto, $scope = Layer._scope, $a, $b;
              def['native'] = nil;
              self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

              def['$x='] = function(value) {
                var self = this;
                return self['native'].layerX = value;
              };

              return (def['$y='] = function(value) {
                var self = this;
                return self['native'].layerY = value;
              }, nil);
            })(self, null);

            (function($base, $super) {
              function Offset(){};
              var self = Offset = $klass($base, $super, 'Offset', Offset);

              var def = Offset._proto, $scope = Offset._scope, $a, $b;
              def['native'] = nil;
              self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

              def['$x='] = function(value) {
                var self = this;
                return self['native'].offsetX = value;
              };

              return (def['$y='] = function(value) {
                var self = this;
                return self['native'].offsetY= value;
              }, nil);
            })(self, null);

            (function($base, $super) {
              function Page(){};
              var self = Page = $klass($base, $super, 'Page', Page);

              var def = Page._proto, $scope = Page._scope, $a, $b;
              def['native'] = nil;
              self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

              def['$x='] = function(value) {
                var self = this;
                return self['native'].pageX = value;
              };

              return (def['$y='] = function(value) {
                var self = this;
                return self['native'].pageY = value;
              }, nil);
            })(self, null);

            (function($base, $super) {
              function Screen(){};
              var self = Screen = $klass($base, $super, 'Screen', Screen);

              var def = Screen._proto, $scope = Screen._scope, $a, $b;
              def['native'] = nil;
              self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

              def['$x='] = function(value) {
                var self = this;
                return self['native'].screenX = value;
              };

              return (def['$y='] = function(value) {
                var self = this;
                return self['native'].screenY = value;
              }, nil);
            })(self, null);

            (function($base, $super) {
              function Ancestor(){};
              var self = Ancestor = $klass($base, $super, 'Ancestor', Ancestor);

              var def = Ancestor._proto, $scope = Ancestor._scope, $a, $b;
              def['native'] = nil;
              self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

              def['$x='] = function(value) {
                var self = this;
                return self['native'].x = value;
              };

              return (def['$y='] = function(value) {
                var self = this;
                return self['native'].y = value;
              }, nil);
            })(self, null);

            def['$x='] = function(value) {
              var self = this;
              return self['native'].screenX = value;
            };

            def['$y='] = function(value) {
              var self = this;
              return self['native'].screenY = value;
            };

            def['$alt!'] = function() {
              var self = this;
              return self['native'].altKey = true;
            };

            def['$ctrl!'] = function() {
              var self = this;
              return self['native'].ctrlKey = true;
            };

            def['$meta!'] = function() {
              var self = this;
              return self['native'].metaKey = true;
            };

            def['$button='] = function(value) {
              var self = this;
              return self['native'].button = value;
            };

            def.$client = function() {
              var $a, self = this;
              return (($a = $scope.Client) == null ? $opal.cm('Client') : $a).$new(self['native']);
            };

            def.$layer = function() {
              var $a, self = this;
              return (($a = $scope.Layer) == null ? $opal.cm('Layer') : $a).$new(self['native']);
            };

            def.$offset = function() {
              var $a, self = this;
              return (($a = $scope.Offset) == null ? $opal.cm('Offset') : $a).$new(self['native']);
            };

            def.$page = function() {
              var $a, self = this;
              return (($a = $scope.Page) == null ? $opal.cm('Page') : $a).$new(self['native']);
            };

            def.$screen = function() {
              var $a, self = this;
              return (($a = $scope.Screen) == null ? $opal.cm('Screen') : $a).$new(self['native']);
            };

            def.$ancestor = function() {
              var $a, self = this;
              return (($a = $scope.Ancestor) == null ? $opal.cm('Ancestor') : $a).$new(self['native']);
            };

            def['$related='] = function(elem) {
              var $a, self = this;
              return self['native'].relatedTarget = (($a = $scope.Native) == null ? $opal.cm('Native') : $a).$try_convert(elem);
            };

            def['$from='] = function(elem) {
              var $a, self = this;
              return self['native'].fromElement = (($a = $scope.Native) == null ? $opal.cm('Native') : $a).$try_convert(elem);
            };

            return (def['$to='] = function(elem) {
              var $a, self = this;
              return self['native'].toElement = (($a = $scope.Native) == null ? $opal.cm('Native') : $a).$try_convert(elem);
            }, nil);
          })(self, (($a = ((($b = $scope.UI) == null ? $opal.cm('UI') : $b))._scope).Definition == null ? $a.cm('Definition') : $a.Definition));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new MouseEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          $opal.cdecl($scope, 'Position', (($a = $scope.Struct) == null ? $opal.cm('Struct') : $a).$new("x", "y"));

          def['$alt?'] = function() {
            var self = this;
            return self['native'].altKey;
          };

          def['$ctrl?'] = function() {
            var self = this;
            return self['native'].ctrlKey;
          };

          def['$meta?'] = function() {
            var self = this;
            return self['native'].metaKey;
          };

          def['$shift?'] = function() {
            var self = this;
            return self['native'].shiftKey;
          };

          def.$button = function() {
            var self = this;
            return self['native'].button;
          };

          def.$client = function() {
            var $a, self = this;
            return (($a = $scope.Position) == null ? $opal.cm('Position') : $a).$new(self['native'].clientX, self['native'].clientY);
          };

          def.$layer = function() {
            var $a, self = this;
            if (($a = (typeof(self['native'].layerX) !== "undefined")) !== false && $a !== nil) {
              return (($a = $scope.Position) == null ? $opal.cm('Position') : $a).$new(self['native'].layerX, self['native'].layerY)
              } else {
              return nil
            };
          };

          def.$offset = function() {
            var $a, self = this;
            if (($a = (typeof(self['native'].offsetX) !== "undefined")) !== false && $a !== nil) {
              return (($a = $scope.Position) == null ? $opal.cm('Position') : $a).$new(self['native'].offsetX, self['native'].offsetY)
              } else {
              return nil
            };
          };

          def.$page = function() {
            var $a, self = this;
            if (($a = (typeof(self['native'].pageX) !== "undefined")) !== false && $a !== nil) {
              return (($a = $scope.Position) == null ? $opal.cm('Position') : $a).$new(self['native'].pageX, self['native'].pageY)
              } else {
              return nil
            };
          };

          def.$screen = function() {
            var $a, self = this;
            if (($a = (typeof(self['native'].screenX) !== "undefined")) !== false && $a !== nil) {
              return (($a = $scope.Position) == null ? $opal.cm('Position') : $a).$new(self['native'].screenX, self['native'].screenY)
              } else {
              return nil
            };
          };

          def.$ancestor = function() {
            var $a, self = this;
            if (($a = (typeof(self['native'].x) !== "undefined")) !== false && $a !== nil) {
              return (($a = $scope.Position) == null ? $opal.cm('Position') : $a).$new(self['native'].x, self['native'].y)
              } else {
              return nil
            };
          };

          def.$x = function() {
            var self = this;
            return self.$screen().$x();
          };

          def.$y = function() {
            var self = this;
            return self.$screen().$y();
          };

          def.$related = function() {
            var self = this;
            return self.$DOM(self['native'].relatedTarget);
          };

          def.$from = function() {
            var self = this;
            return self.$DOM(self['native'].fromElement);
          };

          def.$to = function() {
            var self = this;
            return self.$DOM(self['native'].toElement);
          };

          def['$click?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("click");
          };

          def['$double_click?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("dblclick");
          };

          def['$down?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("mousedown");
          };

          def['$enter?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("mouseenter");
          };

          def['$leave?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("mouseleave");
          };

          def['$move?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("mousemove");
          };

          def['$out?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("mouseout");
          };

          def['$over?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("mouseover");
          };

          def['$up?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("mouseup");
          };

          return (def['$show?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("show");
          }, nil);
        })(self, (($a = $scope.UI) == null ? $opal.cm('UI') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc', '$code', '$chr', '$==', '$downcase', '$name']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function Keyboard(){};
          var self = Keyboard = $klass($base, $super, 'Keyboard', Keyboard);

          var def = Keyboard._proto, $scope = Keyboard._scope, $a, $b, TMP_1;
          def['native'] = nil;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("KeyboardEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            def['$alt!'] = function() {
              var self = this;
              return self['native'].altKey = true;
            };

            def['$ctrl!'] = function() {
              var self = this;
              return self['native'].ctrlKey = true;
            };

            def['$meta!'] = function() {
              var self = this;
              return self['native'].metaKey = true;
            };

            def['$shift!'] = function() {
              var self = this;
              return self['native'].shiftKey = true;
            };

            def['$code='] = function(code) {
              var self = this;
              return self['native'].keyCode = self['native'].which = code;
            };

            def['$key='] = function(key) {
              var self = this;
              return self['native'].key = key;
            };

            def['$char='] = function(char$) {
              var self = this;
              return self['native'].char = self['native'].charCode = char$;
            };

            return (def['$repeat!'] = function() {
              var self = this;
              return self['native'].repeat = true;
            }, nil);
          })(self, (($a = ((($b = $scope.UI) == null ? $opal.cm('UI') : $b))._scope).Definition == null ? $a.cm('Definition') : $a.Definition));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new KeyboardEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          def['$alt?'] = function() {
            var self = this;
            return self['native'].altKey;
          };

          def['$ctrl?'] = function() {
            var self = this;
            return self['native'].ctrlKey;
          };

          def['$meta?'] = function() {
            var self = this;
            return self['native'].metaKey;
          };

          def['$shift?'] = function() {
            var self = this;
            return self['native'].shiftKey;
          };

          def['$repeat?'] = function() {
            var self = this;
            return self['native'].repeat;
          };

          def.$key = function() {
            var self = this;
            return self['native'].key || self['native'].keyIdentifier || nil;
          };

          def.$code = function() {
            var self = this;
            return self['native'].keyCode || self['native'].which || nil;
          };

          def.$char = function() {
            var $a, self = this;
            return self['native'].char || self['native'].charCode || (function() {if (($a = self.$code()) !== false && $a !== nil) {
              return self.$code().$chr()
              } else {
              return nil
            }; return nil; })();
          };

          $opal.defn(self, '$to_i', def.$key);

          def['$down?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("keydown");
          };

          def['$press?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("keypress");
          };

          return (def['$up?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("keyup");
          }, nil);
        })(self, (($a = $scope.UI) == null ? $opal.cm('UI') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$try_convert', '$new', '$to_proc', '$DOM']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function Focus(){};
          var self = Focus = $klass($base, $super, 'Focus', Focus);

          var def = Focus._proto, $scope = Focus._scope, $a, $b, TMP_1;
          def['native'] = nil;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("FocusEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            return (def['$related='] = function(elem) {
              var $a, self = this;
              return self['native'].relatedTarget = (($a = $scope.Native) == null ? $opal.cm('Native') : $a).$try_convert(elem);
            }, nil)
          })(self, (($a = ((($b = $scope.UI) == null ? $opal.cm('UI') : $b))._scope).Definition == null ? $a.cm('Definition') : $a.Definition));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new FocusEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          return (def.$related = function() {
            var self = this;
            return self.$DOM(self['native'].relatedTarget);
          }, nil);
        })(self, (($a = $scope.UI) == null ? $opal.cm('UI') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$===', '$new', '$to_proc', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function Wheel(){};
          var self = Wheel = $klass($base, $super, 'Wheel', Wheel);

          var def = Wheel._proto, $scope = Wheel._scope, $a, TMP_1;
          def['native'] = nil;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("WheelEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            def['$x='] = function(value) {
              var self = this;
              return self['native'].deltaX = value;
            };

            def['$y='] = function(value) {
              var self = this;
              return self['native'].deltaY = value;
            };

            def['$z='] = function(value) {
              var self = this;
              return self['native'].deltaZ = value;
            };

            return (def['$mode='] = function(value) {
              var self = this, $case = nil;
              value = (function() {$case = value;if ("pixel"['$===']($case)) {return WheelEvent.DOM_DELTA_PIXEL;}else if ("line"['$===']($case)) {return WheelEvent.DOM_DELTA_LINE;}else if ("page"['$===']($case)) {return WheelEvent.DOM_DELTA_PAGE;}else { return nil }})();
              return self['native'].deltaMode = value;
            }, nil);
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new WheelEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          self.$alias_native("x", "deltaX");

          self.$alias_native("y", "deltaY");

          self.$alias_native("z", "deltaZ");

          return (def.$mode = function() {
            var self = this, $case = nil;
            return (function() {$case = self['native'].deltaMode;if ((WheelEvent.DOM_DELTA_PIXEL)['$===']($case)) {return "pixel"}else if ((WheelEvent.DOM_DELTA_LINE)['$===']($case)) {return "line"}else if ((WheelEvent.DOM_DELTA_PAGE)['$===']($case)) {return "page"}else { return nil }})();
          }, nil);
        })(self, (($a = $scope.UI) == null ? $opal.cm('UI') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc', '$alias_native', '$==', '$downcase', '$name']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function Composition(){};
          var self = Composition = $klass($base, $super, 'Composition', Composition);

          var def = Composition._proto, $scope = Composition._scope, $a, $b, TMP_1;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("CompositionEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            def['$data='] = function(value) {
              var self = this;
              return self['native'].data = value;
            };

            return (def['$locale='] = function(value) {
              var self = this;
              return self['native'].locale = value;
            }, nil);
          })(self, (($a = ((($b = $scope.UI) == null ? $opal.cm('UI') : $b))._scope).Definition == null ? $a.cm('Definition') : $a.Definition));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new CompositionEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          self.$alias_native("data");

          self.$alias_native("locale");

          def['$start?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("compositionstart");
          };

          def['$update?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("compositionupdate");
          };

          return (def['$end?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("compositionend");
          }, nil);
        })(self, (($a = $scope.UI) == null ? $opal.cm('UI') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function Animation(){};
          var self = Animation = $klass($base, $super, 'Animation', Animation);

          var def = Animation._proto, $scope = Animation._scope, $a, TMP_1;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("AnimationEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            def['$animation='] = function(value) {
              var self = this;
              return self['native'].animationName = value;
            };

            return (def['$elapsed='] = function(value) {
              var self = this;
              return self['native'].elapsedTime = value;
            }, nil);
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new AnimationEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          self.$alias_native("name", "animationName");

          return self.$alias_native("elapsed", "elapsedTime");
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function AudioProcessing(){};
          var self = AudioProcessing = $klass($base, $super, 'AudioProcessing', AudioProcessing);

          var def = AudioProcessing._proto, $scope = AudioProcessing._scope, $a, TMP_1;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("AudioProcessingEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            def['$time='] = function(value) {
              var self = this;
              return self['native'].playbackTime = value;
            };

            def['$input='] = function(value) {
              var self = this;
              return self['native'].inputBuffer = value;
            };

            return (def['$output='] = function(value) {
              var self = this;
              return self['native'].outputBuffer = value;
            }, nil);
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new AudioProcessingEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          self.$alias_native("time", "playbackTime");

          self.$alias_native("input", "inputBuffer");

          return self.$alias_native("output", "outputBuffer");
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function BeforeUnload(){};
          var self = BeforeUnload = $klass($base, $super, 'BeforeUnload', BeforeUnload);

          var def = BeforeUnload._proto, $scope = BeforeUnload._scope, TMP_1;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("BeforeUnloadEvent")['$nil?'](), ($a === nil || $a === false));
          });

          return ($opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new BeforeUnloadEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          }), nil);
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function Clipboard(){};
          var self = Clipboard = $klass($base, $super, 'Clipboard', Clipboard);

          var def = Clipboard._proto, $scope = Clipboard._scope, $a, TMP_1;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("ClipboardEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            def['$data='] = function(value) {
              var self = this;
              return self['native'].data = value;
            };

            return (def['$type='] = function(value) {
              var self = this;
              return self['native'].dataType = value;
            }, nil);
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new ClipboardEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          self.$alias_native("data");

          return self.$alias_native("type", "dataType");
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function DeviceLight(){};
          var self = DeviceLight = $klass($base, $super, 'DeviceLight', DeviceLight);

          var def = DeviceLight._proto, $scope = DeviceLight._scope, $a, TMP_1;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("DeviceLightEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            return (def['$value='] = function(value) {
              var self = this;
              return self['native'].value = value;
            }, nil)
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new DeviceLightEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          return self.$alias_native("value");
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_n', '$to_proc', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function DeviceMotion(){};
          var self = DeviceMotion = $klass($base, $super, 'DeviceMotion', DeviceMotion);

          var def = DeviceMotion._proto, $scope = DeviceMotion._scope, $a, TMP_1;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("DeviceMotionEvent")['$nil?'](), ($a === nil || $a === false));
          });

          $opal.cdecl($scope, 'Acceleration', (($a = $scope.Struct) == null ? $opal.cm('Struct') : $a).$new("x", "y", "z"));

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            def['$acceleration='] = function(value) {
              var self = this;
              return self['native'].acceleration = value.$to_n();
            };

            def['$acceleration_with_gravity='] = function(value) {
              var self = this;
              return self['native'].accelerationIncludingGravity = value.$to_n();
            };

            def['$rotation='] = function(value) {
              var self = this;
              return self['native'].rotationRate = value;
            };

            return (def['$interval='] = function(value) {
              var self = this;
              return self['native'].interval = value;
            }, nil);
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new DeviceMotionEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          self.$alias_native("acceleration");

          self.$alias_native("acceleration_with_gravity", "accelerationIncludingGravity");

          self.$alias_native("rotation", "rotationRate");

          return self.$alias_native("interval");
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function DeviceOrientation(){};
          var self = DeviceOrientation = $klass($base, $super, 'DeviceOrientation', DeviceOrientation);

          var def = DeviceOrientation._proto, $scope = DeviceOrientation._scope, $a, TMP_1;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("DeviceOrientationEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            def['$absolute='] = function(value) {
              var self = this;
              return self['native'].absolute = value;
            };

            def['$alpha='] = function(value) {
              var self = this;
              return self['native'].alpha = value;
            };

            def['$beta='] = function(value) {
              var self = this;
              return self['native'].beta = value;
            };

            return (def['$gamma='] = function(value) {
              var self = this;
              return self['native'].gamma = value;
            }, nil);
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new DeviceOrientationEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          self.$alias_native("absolute");

          self.$alias_native("alpha");

          self.$alias_native("beta");

          return self.$alias_native("gamma");
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function DeviceProximity(){};
          var self = DeviceProximity = $klass($base, $super, 'DeviceProximity', DeviceProximity);

          var def = DeviceProximity._proto, $scope = DeviceProximity._scope, $a, TMP_1;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("DeviceProximityEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            def['$value='] = function(value) {
              var self = this;
              return self['native'].value = value;
            };

            def['$min='] = function(value) {
              var self = this;
              return self['native'].min = value;
            };

            return (def['$max='] = function(value) {
              var self = this;
              return self['native'].max = value;
            }, nil);
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new DeviceProximityEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          self.$alias_native("value");

          self.$alias_native("min");

          return self.$alias_native("max");
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$include', '$new', '$try_convert', '$to_proc', '$x', '$screen', '$y', '$DOM']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function Drag(){};
          var self = Drag = $klass($base, $super, 'Drag', Drag);

          var def = Drag._proto, $scope = Drag._scope, $a, TMP_1;
          def['native'] = nil;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("DragEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            (function($base, $super) {
              function Client(){};
              var self = Client = $klass($base, $super, 'Client', Client);

              var def = Client._proto, $scope = Client._scope, $a, $b;
              def['native'] = nil;
              self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

              def['$x='] = function(value) {
                var self = this;
                return self['native'].clientX = value;
              };

              return (def['$y='] = function(value) {
                var self = this;
                return self['native'].clientY = value;
              }, nil);
            })(self, null);

            (function($base, $super) {
              function Screen(){};
              var self = Screen = $klass($base, $super, 'Screen', Screen);

              var def = Screen._proto, $scope = Screen._scope, $a, $b;
              def['native'] = nil;
              self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

              def['$x='] = function(value) {
                var self = this;
                return self['native'].screenX = value;
              };

              return (def['$y='] = function(value) {
                var self = this;
                return self['native'].screenY = value;
              }, nil);
            })(self, null);

            def['$alt!'] = function() {
              var self = this;
              return self['native'].altKey = true;
            };

            def['$ctrl!'] = function() {
              var self = this;
              return self['native'].ctrlKey = true;
            };

            def['$meta!'] = function() {
              var self = this;
              return self['native'].metaKey = true;
            };

            def['$button='] = function(value) {
              var self = this;
              return self['native'].button = value;
            };

            def.$client = function() {
              var $a, self = this;
              return (($a = $scope.Client) == null ? $opal.cm('Client') : $a).$new(self['native']);
            };

            def.$screen = function() {
              var $a, self = this;
              return (($a = $scope.Screen) == null ? $opal.cm('Screen') : $a).$new(self['native']);
            };

            return (def['$related='] = function(elem) {
              var $a, self = this;
              return self['native'].relatedTarget = (($a = $scope.Native) == null ? $opal.cm('Native') : $a).$try_convert(elem);
            }, nil);
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new DragEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          $opal.cdecl($scope, 'Position', (($a = $scope.Struct) == null ? $opal.cm('Struct') : $a).$new("x", "y"));

          def['$alt?'] = function() {
            var self = this;
            return self['native'].altKey;
          };

          def['$ctrl?'] = function() {
            var self = this;
            return self['native'].ctrlKey;
          };

          def['$meta?'] = function() {
            var self = this;
            return self['native'].metaKey;
          };

          def['$shift?'] = function() {
            var self = this;
            return self['native'].shiftKey;
          };

          def.$button = function() {
            var self = this;
            return self['native'].button;
          };

          def.$client = function() {
            var $a, self = this;
            return (($a = $scope.Position) == null ? $opal.cm('Position') : $a).$new(self['native'].clientX, self['native'].clientY);
          };

          def.$screen = function() {
            var $a, self = this;
            if (($a = (typeof(self['native'].screenX) !== "undefined")) !== false && $a !== nil) {
              return (($a = $scope.Position) == null ? $opal.cm('Position') : $a).$new(self['native'].screenX, self['native'].screenY)
              } else {
              return nil
            };
          };

          def.$x = function() {
            var self = this;
            return self.$screen().$x();
          };

          def.$y = function() {
            var self = this;
            return self.$screen().$y();
          };

          return (def.$related = function() {
            var self = this;
            return self.$DOM(self['native'].relatedTarget);
          }, nil);
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc', '$each', '$define_method']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function Gamepad(){};
          var self = Gamepad = $klass($base, $super, 'Gamepad', Gamepad);

          var def = Gamepad._proto, $scope = Gamepad._scope, $a, TMP_2, TMP_3, $b;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("GamepadEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope, TMP_1;
            def['native'] = nil;
            def.$initialize = TMP_1 = function() {var $zuper = $slice.call(arguments, 0);
              var self = this, $iter = TMP_1._p, $yield = $iter || nil;
              TMP_1._p = null;
              $opal.find_super_dispatcher(self, 'initialize', TMP_1, $iter).apply(self, $zuper);
              return self['native'].gamepad = {};
            };

            def['$id='] = function(value) {
              var self = this;
              return self['native'].gamepad.id = value;
            };

            def['$index='] = function(value) {
              var self = this;
              return self['native'].gamepad.index = value;
            };

            def['$timestamp='] = function(value) {
              var self = this;
              return self['native'].gamepad.timestamp = value;
            };

            def['$axes='] = function(value) {
              var self = this;
              return self['native'].gamepad.axes = value;
            };

            return (def['$buttons='] = function(value) {
              var self = this;
              return self['native'].gamepad.buttons = value;
            }, nil);
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_2 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_2._p, block = $iter || nil;
            TMP_2._p = null;
            return self.$new(new GamepadEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          return ($a = ($b = ["id", "index", "timestamp", "axes", "buttons"]).$each, $a._p = (TMP_3 = function(name) {var self = TMP_3._s || this, TMP_4, $a, $b;if (name == null) name = nil;
            return ($a = ($b = self).$define_method, $a._p = (TMP_4 = function() {var self = TMP_4._s || this;
              if (self['native'] == null) self['native'] = nil;

              return self['native'].gamepad[name];}, TMP_4._s = self, TMP_4), $a).call($b, name)}, TMP_3._s = self, TMP_3), $a).call($b);
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function HashChange(){};
          var self = HashChange = $klass($base, $super, 'HashChange', HashChange);

          var def = HashChange._proto, $scope = HashChange._scope, $a, TMP_1;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("HashChangeEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            def['$old='] = function(value) {
              var self = this;
              return self['native'].oldURL = value;
            };

            return (def['$new='] = function(value) {
              var self = this;
              return self['native'].newURL = value;
            }, nil);
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new HashChangeEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          self.$alias_native("old", "oldURL");

          return self.$alias_native("new", "newURL");
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function Progress(){};
          var self = Progress = $klass($base, $super, 'Progress', Progress);

          var def = Progress._proto, $scope = Progress._scope, $a, TMP_1;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("ProgressEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            def['$computable='] = function(value) {
              var self = this;
              return self['native'].computableLength = value;
            };

            def['$loaded='] = function(value) {
              var self = this;
              return self['native'].loaded = value;
            };

            return (def['$total='] = function(value) {
              var self = this;
              return self['native'].total = value;
            }, nil);
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new ProgressEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          self.$alias_native("computable?", "computableLength");

          self.$alias_native("loaded");

          return self.$alias_native("total");
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function PageTransition(){};
          var self = PageTransition = $klass($base, $super, 'PageTransition', PageTransition);

          var def = PageTransition._proto, $scope = PageTransition._scope, $a, TMP_1;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("PageTransitionEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            return (def['$persisted='] = function(value) {
              var self = this;
              return self['native'].persisted = value;
            }, nil)
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new PageTransitionEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          return self.$alias_native("persisted?", "persisted");
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function PopState(){};
          var self = PopState = $klass($base, $super, 'PopState', PopState);

          var def = PopState._proto, $scope = PopState._scope, $a, TMP_1;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("PopStateEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            return (def['$state='] = function(value) {
              var self = this;
              return self['native'].state = value;
            }, nil)
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new PopStateEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          return self.$alias_native("state", "state");
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function Storage(){};
          var self = Storage = $klass($base, $super, 'Storage', Storage);

          var def = Storage._proto, $scope = Storage._scope, $a, TMP_1;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("StorageEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            def['$key='] = function(value) {
              var self = this;
              return self['native'].key = value;
            };

            def['$new='] = function(value) {
              var self = this;
              return self['native'].newValue = value;
            };

            def['$old='] = function(value) {
              var self = this;
              return self['native'].oldValue = value;
            };

            def['$area='] = function(value) {
              var self = this;
              return self['native'].storageArea = value;
            };

            return (def['$url='] = function(value) {
              var self = this;
              return self['native'].url = value;
            }, nil);
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new StorageEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          self.$alias_native("key");

          self.$alias_native("new", "newValue");

          self.$alias_native("old", "oldValue");

          self.$alias_native("area", "storageArea");

          return self.$alias_native("url");
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc', '$==', '$downcase', '$name']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function Touch(){};
          var self = Touch = $klass($base, $super, 'Touch', Touch);

          var def = Touch._proto, $scope = Touch._scope, $a, TMP_1;
          def['native'] = nil;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("TouchEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            def['$alt!'] = function() {
              var self = this;
              return self['native'].altKey = true;
            };

            def['$ctrl!'] = function() {
              var self = this;
              return self['native'].ctrlKey = true;
            };

            def['$meta!'] = function() {
              var self = this;
              return self['native'].metaKey = true;
            };

            return (def['$shift!'] = function() {
              var self = this;
              return self['native'].shiftKey = true;
            }, nil);
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new TouchEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          def['$alt?'] = function() {
            var self = this;
            return self['native'].altKey;
          };

          def['$ctrl?'] = function() {
            var self = this;
            return self['native'].ctrlKey;
          };

          def['$meta?'] = function() {
            var self = this;
            return self['native'].metaKey;
          };

          def['$shift?'] = function() {
            var self = this;
            return self['native'].shiftKey;
          };

          def['$cancel?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("touchcancel");
          };

          def['$end?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("touchend");
          };

          def['$leave?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("touchleave");
          };

          def['$move?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("touchmove");
          };

          return (def['$start?'] = function() {
            var self = this;
            return self.$name().$downcase()['$==']("touchstart");
          }, nil);
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function Sensor(){};
          var self = Sensor = $klass($base, $super, 'Sensor', Sensor);

          var def = Sensor._proto, $scope = Sensor._scope, TMP_1;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("SensorEvent")['$nil?'](), ($a === nil || $a === false));
          });

          return ($opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new SensorEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          }), nil);
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass, $hash2 = $opal.hash2, $range = $opal.range;
  $opal.add_stubs(['$each_pair', '$[]=', '$to_sym', '$[]', '$end_with?', '$enum_for', '$is_a?', '$==', '$instance_variable_get', '$===', '$eql?', '$dup', '$to_n', '$hash', '$class', '$join', '$map', '$inspect']);
  return (function($base, $super) {
    function OpenStruct(){};
    var self = OpenStruct = $klass($base, $super, 'OpenStruct', OpenStruct);

    var def = OpenStruct._proto, $scope = OpenStruct._scope, TMP_2;
    def.table = nil;
    def.$initialize = function(hash) {
      var TMP_1, $a, $b, self = this;
      if (hash == null) {
        hash = nil
      }
      self.table = $hash2([], {});
      if (hash !== false && hash !== nil) {
        return ($a = ($b = hash).$each_pair, $a._p = (TMP_1 = function(key, value) {var self = TMP_1._s || this;
          if (self.table == null) self.table = nil;
if (key == null) key = nil;if (value == null) value = nil;
          return self.table['$[]='](key.$to_sym(), value)}, TMP_1._s = self, TMP_1), $a).call($b)
        } else {
        return nil
      };
    };

    def['$[]'] = function(name) {
      var self = this;
      return self.table['$[]'](name.$to_sym());
    };

    def['$[]='] = function(name, value) {
      var self = this;
      return self.table['$[]='](name.$to_sym(), value);
    };

    def.$method_missing = function(name, args) {
      var $a, self = this;
      args = $slice.call(arguments, 1);
      if (($a = name['$end_with?']("=")) !== false && $a !== nil) {
        return self.table['$[]='](name['$[]']($range(0, -2, false)).$to_sym(), args['$[]'](0))
        } else {
        return self.table['$[]'](name.$to_sym())
      };
    };

    def.$each_pair = TMP_2 = function() {
      var TMP_3, $a, $b, self = this, $iter = TMP_2._p, $yield = $iter || nil;
      TMP_2._p = null;
      if ($yield === nil) {
        return self.$enum_for("each_pair")};
      return ($a = ($b = self.table).$each_pair, $a._p = (TMP_3 = function(pair) {var self = TMP_3._s || this, $a;if (pair == null) pair = nil;
        return $a = $opal.$yield1($yield, pair), $a === $breaker ? $a : $a}, TMP_3._s = self, TMP_3), $a).call($b);
    };

    def['$=='] = function(other) {
      var $a, $b, self = this;
      if (($a = other['$is_a?']((($b = $scope.OpenStruct) == null ? $opal.cm('OpenStruct') : $b))) === false || $a === nil) {
        return false};
      return self.table['$=='](other.$instance_variable_get("@table"));
    };

    def['$==='] = function(other) {
      var $a, $b, self = this;
      if (($a = other['$is_a?']((($b = $scope.OpenStruct) == null ? $opal.cm('OpenStruct') : $b))) === false || $a === nil) {
        return false};
      return self.table['$==='](other.$instance_variable_get("@table"));
    };

    def['$eql?'] = function(other) {
      var $a, $b, self = this;
      if (($a = other['$is_a?']((($b = $scope.OpenStruct) == null ? $opal.cm('OpenStruct') : $b))) === false || $a === nil) {
        return false};
      return self.table['$eql?'](other.$instance_variable_get("@table"));
    };

    def.$to_h = function() {
      var self = this;
      return self.table.$dup();
    };

    def.$to_n = function() {
      var self = this;
      return self.table.$to_n();
    };

    def.$hash = function() {
      var self = this;
      return self.table.$hash();
    };

    return (def.$inspect = function() {
      var TMP_4, $a, $b, self = this;
      return "#<" + (self.$class()) + ": " + (($a = ($b = self.$each_pair()).$map, $a._p = (TMP_4 = function(name, value) {var self = TMP_4._s || this;if (name == null) name = nil;if (value == null) value = nil;
        return "" + (name) + "=" + (self['$[]'](name).$inspect())}, TMP_4._s = self, TMP_4), $a).call($b).$join(" ")) + ">";
    }, nil);
  })(self, null)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$call', '$to_n', '$has_key?']);
  ;
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function Custom(){};
          var self = Custom = $klass($base, $super, 'Custom', Custom);

          var def = Custom._proto, $scope = Custom._scope, TMP_1, TMP_2, TMP_3;
          def.detail = nil;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("CustomEvent")['$nil?'](), ($a === nil || $a === false));
          });

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, self = this, $iter = TMP_1._p, block = $iter || nil, data = nil;
            TMP_1._p = null;
            data = (($a = $scope.OpenStruct) == null ? $opal.cm('OpenStruct') : $a).$new();
            if (block !== false && block !== nil) {
              block.$call(data)};
            return self.$new(new CustomEvent(name, { detail: data.$to_n() }));
          });

          def.$initialize = TMP_2 = function(native$) {
            var $a, self = this, $iter = TMP_2._p, $yield = $iter || nil;
            TMP_2._p = null;
            $opal.find_super_dispatcher(self, 'initialize', TMP_2, null).apply(self, [native$]);
            self['native'] = native$;
            return self.detail = (($a = $scope.Hash) == null ? $opal.cm('Hash') : $a).$new(native$.detail);
          };

          return (def.$method_missing = TMP_3 = function(id) {var $zuper = $slice.call(arguments, 0);
            var $a, self = this, $iter = TMP_3._p, $yield = $iter || nil;
            TMP_3._p = null;
            if (($a = self.detail['$has_key?'](id)) !== false && $a !== nil) {
              return self.detail['$[]'](id)};
            return $opal.find_super_dispatcher(self, 'method_missing', TMP_3, $iter).apply(self, $zuper);
          }, nil);
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var $a, self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$[]', '$name_for', '$include', '$attr_reader', '$==', '$for', '$to_n', '$enum_for']);
  return (function($base, $super) {
    function Buffer(){};
    var self = Buffer = $klass($base, $super, 'Buffer', Buffer);

    var def = Buffer._proto, $scope = Buffer._scope, $a;
    return (function($base, $super) {
      function Array(){};
      var self = Array = $klass($base, $super, 'Array', Array);

      var def = Array._proto, $scope = Array._scope, $a, TMP_1, TMP_2;
      def['native'] = nil;
      $opal.defs(self, '$for', function(bits, type) {
        var $a, self = this;
        return $gvars["$"]['$[]']("" + ((($a = $scope.Buffer) == null ? $opal.cm('Buffer') : $a).$name_for(bits, type)) + "Array");
      });

      self.$include((($a = $scope.Enumerable) == null ? $opal.cm('Enumerable') : $a));

      self.$attr_reader("buffer", "type");

      def.$initialize = TMP_1 = function(buffer, bits, type) {
        var $a, self = this, $iter = TMP_1._p, $yield = $iter || nil;
        if (bits == null) {
          bits = nil
        }
        if (type == null) {
          type = nil
        }
        TMP_1._p = null;
        if ((($a = $scope.Native) == null ? $opal.cm('Native') : $a)['$=='](buffer)) {
          $opal.find_super_dispatcher(self, 'initialize', TMP_1, null).apply(self, [buffer])
          } else {
          
        var klass = (($a = $scope.Array) == null ? $opal.cm('Array') : $a).$for(bits, type);

        $opal.find_super_dispatcher(self, 'initialize', TMP_1, null).apply(self, [new klass(buffer.$to_n())])
      ;
        };
        self.buffer = buffer;
        return self.type = type;
      };

      def.$bits = function() {
        var self = this;
        return self['native'].BYTES_PER_ELEMENT * 8;
      };

      def['$[]'] = function(index, offset) {
        var self = this;
        if (offset == null) {
          offset = nil
        }
        if (offset !== false && offset !== nil) {
          return self['native'].subarray(index, offset);
          } else {
          return self['native'][index];
        };
      };

      def['$[]='] = function(index, value) {
        var self = this;
        return self['native'][index] = value;
      };

      def.$bytesize = function() {
        var self = this;
        return self['native'].byteLength;
      };

      def.$each = TMP_2 = function() {
        var $a, self = this, $iter = TMP_2._p, $yield = $iter || nil;
        TMP_2._p = null;
        if ($yield === nil) {
          return self.$enum_for("each")};
        
      for (var i = 0, length = self['native'].length; i < length; i++) {
        ((($a = $opal.$yield1($yield, self['native'][i])) === $breaker) ? $breaker.$v : $a)
      }
    ;
        return self;
      };

      def.$length = function() {
        var self = this;
        return self['native'].length;
      };

      def['$merge!'] = function(other, offset) {
        var self = this;
        return self['native'].set(other.$to_n(), offset);
      };

      return $opal.defn(self, '$size', def.$length);
    })(self, (($a = $scope.Native) == null ? $opal.cm('Native') : $a))
  })(self, (($a = $scope.Native) == null ? $opal.cm('Native') : $a))
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$include', '$nil?', '$[]', '$attr_reader', '$native?', '$to_n', '$name_for']);
  return (function($base, $super) {
    function Buffer(){};
    var self = Buffer = $klass($base, $super, 'Buffer', Buffer);

    var def = Buffer._proto, $scope = Buffer._scope;
    return (function($base, $super) {
      function View(){};
      var self = View = $klass($base, $super, 'View', View);

      var def = View._proto, $scope = View._scope, $a, $b, TMP_1;
      def['native'] = nil;
      self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

      $opal.defs(self, '$supported?', function() {
        var $a, self = this;
        return ($a = $gvars["$"]['$[]']("DataView")['$nil?'](), ($a === nil || $a === false));
      });

      self.$attr_reader("buffer", "offset");

      def.$initialize = TMP_1 = function(buffer, offset, length) {
        var $a, $b, self = this, $iter = TMP_1._p, $yield = $iter || nil;
        if (offset == null) {
          offset = nil
        }
        if (length == null) {
          length = nil
        }
        TMP_1._p = null;
        if (($a = self['$native?'](buffer)) !== false && $a !== nil) {
          $opal.find_super_dispatcher(self, 'initialize', TMP_1, null).apply(self, [buffer])
        } else if (($a = (($b = offset !== false && offset !== nil) ? length : $b)) !== false && $a !== nil) {
          $opal.find_super_dispatcher(self, 'initialize', TMP_1, null).apply(self, [new DataView(buffer.$to_n(), offset.$to_n(), length.$to_n())])
        } else if (offset !== false && offset !== nil) {
          $opal.find_super_dispatcher(self, 'initialize', TMP_1, null).apply(self, [new DataView(buffer.$to_n(), offset.$to_n())])
          } else {
          $opal.find_super_dispatcher(self, 'initialize', TMP_1, null).apply(self, [new DataView(buffer.$to_n())])
        };
        self.buffer = buffer;
        return self.offset = offset;
      };

      def.$length = function() {
        var self = this;
        return self['native'].byteLength;
      };

      $opal.defn(self, '$size', def.$length);

      def.$get = function(offset, bits, type, little) {
        var $a, self = this;
        if (bits == null) {
          bits = 8
        }
        if (type == null) {
          type = "unsigned"
        }
        if (little == null) {
          little = false
        }
        return self['native']["get" + (($a = $scope.Buffer) == null ? $opal.cm('Buffer') : $a).$name_for(bits, type)](offset, little);
      };

      $opal.defn(self, '$[]', def.$get);

      def.$set = function(offset, value, bits, type, little) {
        var $a, self = this;
        if (bits == null) {
          bits = 8
        }
        if (type == null) {
          type = "unsigned"
        }
        if (little == null) {
          little = false
        }
        return self['native']["set" + (($a = $scope.Buffer) == null ? $opal.cm('Buffer') : $a).$name_for(bits, type)](offset, value, little);
      };

      $opal.defn(self, '$[]=', def.$set);

      def.$get_int8 = function(offset, little) {
        var self = this;
        if (little == null) {
          little = false
        }
        return self['native'].getInt8(offset, little);
      };

      def.$set_int8 = function(offset, value, little) {
        var self = this;
        if (little == null) {
          little = false
        }
        return self['native'].setInt8(offset, value, little);
      };

      def.$get_uint8 = function(offset, little) {
        var self = this;
        if (little == null) {
          little = false
        }
        return self['native'].getUint8(offset, little);
      };

      def.$set_uint8 = function(offset, value, little) {
        var self = this;
        if (little == null) {
          little = false
        }
        return self['native'].setUint8(offset, value, little);
      };

      def.$get_int16 = function(offset, little) {
        var self = this;
        if (little == null) {
          little = false
        }
        return self['native'].getInt16(offset, little);
      };

      def.$set_int16 = function(offset, value, little) {
        var self = this;
        if (little == null) {
          little = false
        }
        return self['native'].setInt16(offset, value, little);
      };

      def.$get_uint16 = function(offset, little) {
        var self = this;
        if (little == null) {
          little = false
        }
        return self['native'].getUint16(offset, little);
      };

      def.$set_uint16 = function(offset, value, little) {
        var self = this;
        if (little == null) {
          little = false
        }
        return self['native'].setUint16(offset, value, little);
      };

      def.$get_int32 = function(offset, little) {
        var self = this;
        if (little == null) {
          little = false
        }
        return self['native'].getInt32(offset, little);
      };

      def.$set_int32 = function(offset, value, little) {
        var self = this;
        if (little == null) {
          little = false
        }
        return self['native'].setInt32(offset, value, little);
      };

      def.$get_uint32 = function(offset, little) {
        var self = this;
        if (little == null) {
          little = false
        }
        return self['native'].getUint32(offset, little);
      };

      def.$set_uint32 = function(offset, value, little) {
        var self = this;
        if (little == null) {
          little = false
        }
        return self['native'].setUint32(offset, value, little);
      };

      def.$get_float32 = function(offset, little) {
        var self = this;
        if (little == null) {
          little = false
        }
        return self['native'].getFloat32(offset, little);
      };

      def.$set_float32 = function(offset, value, little) {
        var self = this;
        if (little == null) {
          little = false
        }
        return self['native'].setFloat32(offset, value, little);
      };

      def.$get_float64 = function(offset, little) {
        var self = this;
        if (little == null) {
          little = false
        }
        return self['native'].getFloat64(offset, little);
      };

      return (def.$set_float64 = function(offset, value, little) {
        var self = this;
        if (little == null) {
          little = false
        }
        return self['native'].setFloat64(offset, value, little);
      }, nil);
    })(self, null)
  })(self, null)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$include', '$nil?', '$[]', '$===', '$native?', '$new']);
  ;
  ;
  return (function($base, $super) {
    function Buffer(){};
    var self = Buffer = $klass($base, $super, 'Buffer', Buffer);

    var def = Buffer._proto, $scope = Buffer._scope, $a, $b, TMP_1;
    def['native'] = nil;
    self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

    $opal.defs(self, '$supported?', function() {
      var $a, self = this;
      return ($a = $gvars["$"]['$[]']("ArrayBuffer")['$nil?'](), ($a === nil || $a === false));
    });

    $opal.defs(self, '$name_for', function(bits, type) {
      var self = this, $case = nil;
      return "" + ((function() {$case = type;if ("unsigned"['$===']($case)) {return "Uint"}else if ("signed"['$===']($case)) {return "Int"}else if ("float"['$===']($case)) {return "Float"}else { return nil }})()) + (bits);
    });

    def.$initialize = TMP_1 = function(size, bits) {
      var $a, self = this, $iter = TMP_1._p, $yield = $iter || nil;
      if (bits == null) {
        bits = 8
      }
      TMP_1._p = null;
      if (($a = self['$native?'](size)) !== false && $a !== nil) {
        return $opal.find_super_dispatcher(self, 'initialize', TMP_1, null).apply(self, [size])
        } else {
        return $opal.find_super_dispatcher(self, 'initialize', TMP_1, null).apply(self, [new ArrayBuffer(size * (bits / 8))])
      };
    };

    def.$length = function() {
      var self = this;
      return self['native'].byteLength;
    };

    $opal.defn(self, '$size', def.$length);

    def.$to_a = function(bits, type) {
      var $a, self = this;
      if (bits == null) {
        bits = 8
      }
      if (type == null) {
        type = "unsigned"
      }
      return (($a = $scope.Array) == null ? $opal.cm('Array') : $a).$new(self, bits, type);
    };

    return (def.$view = function(offset, length) {
      var $a, self = this;
      if (offset == null) {
        offset = nil
      }
      if (length == null) {
        length = nil
      }
      return (($a = $scope.View) == null ? $opal.cm('View') : $a).$new(self, offset, length);
    }, nil);
  })(self, null);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$to_n', '$new', '$to_proc', '$alias_native']);
  ;
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function Message(){};
          var self = Message = $klass($base, $super, 'Message', Message);

          var def = Message._proto, $scope = Message._scope, $a, TMP_1;
          def['native'] = nil;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("MessageEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            return (def['$data='] = function(value) {
              var self = this;
              return self['native'].data = value.$to_n();
            }, nil)
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new MessageEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          def.$data = function() {
            var $a, self = this;
            
      if (self['native'].data instanceof ArrayBuffer) {
        return (($a = $scope.Buffer) == null ? $opal.cm('Buffer') : $a).$new(self['native'].data);
      }
      else if (self['native'].data instanceof Blob) {
        return (($a = $scope.Blob) == null ? $opal.cm('Blob') : $a).$new(self['native'].data);
      }
      else {
        return self['native'].data;
      }
    ;
          };

          self.$alias_native("origin");

          return (def.$source = function() {
            var $a, self = this;
            
      var source = self['native'].source;

      if (source instanceof window.Window) {
        return (($a = $scope.Window) == null ? $opal.cm('Window') : $a).$new(source);
      }
      else {
        return nil;
      }
    ;
          }, nil);
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$nil?', '$[]', '$new', '$to_proc', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a;
        return (function($base, $super) {
          function Close(){};
          var self = Close = $klass($base, $super, 'Close', Close);

          var def = Close._proto, $scope = Close._scope, $a, TMP_1;
          $opal.defs(self, '$supported?', function() {
            var $a, self = this;
            return ($a = $gvars["$"]['$[]']("CloseEvent")['$nil?'](), ($a === nil || $a === false));
          });

          (function($base, $super) {
            function Definition(){};
            var self = Definition = $klass($base, $super, 'Definition', Definition);

            var def = Definition._proto, $scope = Definition._scope;
            def['native'] = nil;
            def['$code='] = function(value) {
              var self = this;
              return self['native'].code = value;
            };

            def['$reason='] = function(value) {
              var self = this;
              return self['native'].reason = value;
            };

            def['$clean!'] = function(value) {
              var self = this;
              return self['native'].wasClean = true;
            };

            return (def['$not_clean!'] = function(value) {
              var self = this;
              return self['native'].wasClean = false;
            }, nil);
          })(self, (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a));

          $opal.defs(self, '$create', TMP_1 = function(name) {
            var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            return self.$new(new CloseEvent(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)));
          });

          self.$alias_native("code");

          self.$alias_native("reason");

          return self.$alias_native("clean?", "wasClean");
        })(self, (($a = $scope.Event) == null ? $opal.cm('Event') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $hash2 = $opal.hash2, $hash = $opal.hash, $gvars = $opal.gvars;
  $opal.add_stubs(['$include', '$new', '$merge!', '$gsub', '$[]', '$names', '$name_for', '$===', '$==', '$supported?', '$class_for', '$to_proc', '$create', '$arguments=', '$find', '$is_a?', '$classes', '$attr_reader', '$convert', '$off', '$alias_native']);
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Event(){};
        var self = Event = $klass($base, $super, 'Event', Event);

        var def = Event._proto, $scope = Event._scope, $a, $b, TMP_2, TMP_4, TMP_5;
        def['native'] = def.callback = nil;
        self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

        $opal.defs(self, '$names', function() {
          var $a, TMP_1, $b, $c, self = this;
          if (self.names == null) self.names = nil;

          if (($a = self.names) !== false && $a !== nil) {
            return self.names};
          self.names = ($a = ($b = (($c = $scope.Hash) == null ? $opal.cm('Hash') : $c)).$new, $a._p = (TMP_1 = function(_, k) {var self = TMP_1._s || this;if (_ == null) _ = nil;if (k == null) k = nil;
            return k}, TMP_1._s = self, TMP_1), $a).call($b);
          return self.names['$merge!']($hash2(["load", "hover"], {"load": "DOMContentLoaded", "hover": "mouse:over"}));
        });

        $opal.defs(self, '$name_for', function(name) {
          var self = this;
          return self.$names()['$[]'](name).$gsub(":", "");
        });

        $opal.defs(self, '$classes', function() {
          var $a, $b, self = this;
          if (self.classes == null) self.classes = nil;

          return ((($a = self.classes) !== false && $a !== nil) ? $a : self.classes = $hash((($b = $scope.Animation) == null ? $opal.cm('Animation') : $b), $gvars["$"]['$[]']("AnimationEvent"), (($b = $scope.AudioProcessing) == null ? $opal.cm('AudioProcessing') : $b), $gvars["$"]['$[]']("AudioProcessingEvent"), (($b = $scope.BeforeUnload) == null ? $opal.cm('BeforeUnload') : $b), $gvars["$"]['$[]']("BeforeUnloadEvent"), (($b = $scope.Composition) == null ? $opal.cm('Composition') : $b), $gvars["$"]['$[]']("CompositionEvent"), (($b = $scope.Clipboard) == null ? $opal.cm('Clipboard') : $b), $gvars["$"]['$[]']("ClipboardEvent"), (($b = $scope.DeviceLight) == null ? $opal.cm('DeviceLight') : $b), $gvars["$"]['$[]']("DeviceLightEvent"), (($b = $scope.DeviceMotion) == null ? $opal.cm('DeviceMotion') : $b), $gvars["$"]['$[]']("DeviceMotionEvent"), (($b = $scope.DeviceOrientation) == null ? $opal.cm('DeviceOrientation') : $b), $gvars["$"]['$[]']("DeviceOrientationEvent"), (($b = $scope.DeviceProximity) == null ? $opal.cm('DeviceProximity') : $b), $gvars["$"]['$[]']("DeviceProximityEvent"), (($b = $scope.Drag) == null ? $opal.cm('Drag') : $b), $gvars["$"]['$[]']("DragEvent"), (($b = $scope.Gamepad) == null ? $opal.cm('Gamepad') : $b), $gvars["$"]['$[]']("GamepadEvent"), (($b = $scope.HashChange) == null ? $opal.cm('HashChange') : $b), $gvars["$"]['$[]']("HashChangeEvent"), (($b = $scope.Progress) == null ? $opal.cm('Progress') : $b), $gvars["$"]['$[]']("ProgressEvent"), (($b = $scope.PageTransition) == null ? $opal.cm('PageTransition') : $b), $gvars["$"]['$[]']("PageTransitionEvent"), (($b = $scope.PopState) == null ? $opal.cm('PopState') : $b), $gvars["$"]['$[]']("PopStateEvent"), (($b = $scope.Storage) == null ? $opal.cm('Storage') : $b), $gvars["$"]['$[]']("StorageEvent"), (($b = $scope.Touch) == null ? $opal.cm('Touch') : $b), $gvars["$"]['$[]']("TouchEvent"), (($b = $scope.Sensor) == null ? $opal.cm('Sensor') : $b), $gvars["$"]['$[]']("SensorEvent"), (($b = $scope.Mouse) == null ? $opal.cm('Mouse') : $b), $gvars["$"]['$[]']("MouseEvent"), (($b = $scope.Keyboard) == null ? $opal.cm('Keyboard') : $b), $gvars["$"]['$[]']("KeyboardEvent"), (($b = $scope.Focus) == null ? $opal.cm('Focus') : $b), $gvars["$"]['$[]']("FocusEvent"), (($b = $scope.Wheel) == null ? $opal.cm('Wheel') : $b), $gvars["$"]['$[]']("WheelEvent"), (($b = $scope.Custom) == null ? $opal.cm('Custom') : $b), $gvars["$"]['$[]']("CustomEvent")));
        });

        $opal.defs(self, '$class_for', function(name) {
          var $a, $b, $c, $d, self = this, type = nil, $case = nil;
          type = (function() {$case = self.$name_for(name);if ("animationend"['$===']($case) || "animationiteration"['$===']($case) || "animationstart"['$===']($case)) {return (($a = $scope.Animation) == null ? $opal.cm('Animation') : $a)}else if ("audioprocess"['$===']($case)) {return (($a = $scope.AudioProcessing) == null ? $opal.cm('AudioProcessing') : $a)}else if ("beforeunload"['$===']($case)) {return (($a = $scope.BeforeUnload) == null ? $opal.cm('BeforeUnload') : $a)}else if ("compositionend"['$===']($case) || "compositionstart"['$===']($case) || "compositionupdate"['$===']($case)) {return (($a = $scope.Composition) == null ? $opal.cm('Composition') : $a)}else if ("copy"['$===']($case) || "cut"['$===']($case)) {return (($a = $scope.Clipboard) == null ? $opal.cm('Clipboard') : $a)}else if ("devicelight"['$===']($case)) {return (($a = $scope.DeviceLight) == null ? $opal.cm('DeviceLight') : $a)}else if ("devicemotion"['$===']($case)) {return (($a = $scope.DeviceMotion) == null ? $opal.cm('DeviceMotion') : $a)}else if ("deviceorientation"['$===']($case)) {return (($a = $scope.DeviceOrientation) == null ? $opal.cm('DeviceOrientation') : $a)}else if ("deviceproximity"['$===']($case)) {return (($a = $scope.DeviceProximity) == null ? $opal.cm('DeviceProximity') : $a)}else if ("drag"['$===']($case) || "dragend"['$===']($case) || "dragleave"['$===']($case) || "dragover"['$===']($case) || "dragstart"['$===']($case) || "drop"['$===']($case)) {return (($a = $scope.Drag) == null ? $opal.cm('Drag') : $a)}else if ("gamepadconnected"['$===']($case) || "gamepaddisconnected"['$===']($case)) {return (($a = $scope.Gamepad) == null ? $opal.cm('Gamepad') : $a)}else if ("hashchange"['$===']($case)) {return (($a = $scope.HashChange) == null ? $opal.cm('HashChange') : $a)}else if ("load"['$===']($case) || "loadend"['$===']($case) || "loadstart"['$===']($case)) {return (($a = $scope.Progress) == null ? $opal.cm('Progress') : $a)}else if ("pagehide"['$===']($case) || "pageshow"['$===']($case)) {return (($a = $scope.PageTransition) == null ? $opal.cm('PageTransition') : $a)}else if ("popstate"['$===']($case)) {return (($a = $scope.PopState) == null ? $opal.cm('PopState') : $a)}else if ("storage"['$===']($case)) {return (($a = $scope.Storage) == null ? $opal.cm('Storage') : $a)}else if ("touchcancel"['$===']($case) || "touchend"['$===']($case) || "touchleave"['$===']($case) || "touchmove"['$===']($case) || "touchstart"['$===']($case)) {return (($a = $scope.Touch) == null ? $opal.cm('Touch') : $a)}else if ("compassneedscalibration"['$===']($case) || "userproximity"['$===']($case)) {return (($a = $scope.Sensor) == null ? $opal.cm('Sensor') : $a)}else if ("message"['$===']($case)) {return (($a = $scope.Message) == null ? $opal.cm('Message') : $a)}else if ("close"['$===']($case)) {return (($a = $scope.Close) == null ? $opal.cm('Close') : $a)}else if ("click"['$===']($case) || "contextmenu"['$===']($case) || "dblclick"['$===']($case) || "mousedown"['$===']($case) || "mouseenter"['$===']($case) || "mouseleave"['$===']($case) || "mousemove"['$===']($case) || "mouseout"['$===']($case) || "mouseover"['$===']($case) || "mouseup"['$===']($case) || "show"['$===']($case)) {return (($a = $scope.Mouse) == null ? $opal.cm('Mouse') : $a)}else if ("keydown"['$===']($case) || "keypress"['$===']($case) || "keyup"['$===']($case)) {return (($a = $scope.Keyboard) == null ? $opal.cm('Keyboard') : $a)}else if ("blur"['$===']($case) || "focus"['$===']($case) || "focusin"['$===']($case) || "focusout"['$===']($case)) {return (($a = $scope.Focus) == null ? $opal.cm('Focus') : $a)}else if ("wheel"['$===']($case)) {return (($a = $scope.Wheel) == null ? $opal.cm('Wheel') : $a)}else if ("abort"['$===']($case) || "afterprint"['$===']($case) || "beforeprint"['$===']($case) || "cached"['$===']($case) || "canplay"['$===']($case) || "canplaythrough"['$===']($case) || "change"['$===']($case) || "chargingchange"['$===']($case) || "chargingtimechange"['$===']($case) || "checking"['$===']($case) || "close"['$===']($case) || "dischargingtimechange"['$===']($case) || "DOMContentLoaded"['$===']($case) || "downloading"['$===']($case) || "durationchange"['$===']($case) || "emptied"['$===']($case) || "ended"['$===']($case) || "error"['$===']($case) || "fullscreenchange"['$===']($case) || "fullscreenerror"['$===']($case) || "input"['$===']($case) || "invalid"['$===']($case) || "levelchange"['$===']($case) || "loadeddata"['$===']($case) || "loadedmetadata"['$===']($case) || "noupdate"['$===']($case) || "obsolete"['$===']($case) || "offline"['$===']($case) || "online"['$===']($case) || "open"['$===']($case) || "orientationchange"['$===']($case) || "pause"['$===']($case) || "pointerlockchange"['$===']($case) || "pointerlockerror"['$===']($case) || "play"['$===']($case) || "playing"['$===']($case) || "ratechange"['$===']($case) || "readystatechange"['$===']($case) || "reset"['$===']($case) || "seeked"['$===']($case) || "seeking"['$===']($case) || "stalled"['$===']($case) || "submit"['$===']($case) || "success"['$===']($case) || "suspend"['$===']($case) || "timeupdate"['$===']($case) || "updateready"['$===']($case) || "visibilitychange"['$===']($case) || "volumechange"['$===']($case) || "waiting"['$===']($case)) {return (($a = $scope.Event) == null ? $opal.cm('Event') : $a)}else {return (($a = $scope.Custom) == null ? $opal.cm('Custom') : $a)}})();
          if (($a = ($b = ($c = type['$==']((($d = $scope.Event) == null ? $opal.cm('Event') : $d)), ($c === nil || $c === false)), $b !== false && $b !== nil ?type['$supported?']() : $b)) !== false && $a !== nil) {
            return type
            } else {
            return (($a = $scope.Event) == null ? $opal.cm('Event') : $a)
          };
        });

        $opal.defs(self, '$create', TMP_2 = function(name, args) {
          var $a, $b, $c, self = this, $iter = TMP_2._p, block = $iter || nil, klass = nil, event = nil;
          args = $slice.call(arguments, 1);
          TMP_2._p = null;
          name = self.$name_for(name);
          klass = self.$class_for(name);
          event = (function() {if (klass['$=='](self)) {
            return self.$new(new window.Event(name, ($a = ($b = (($c = $scope.Definition) == null ? $opal.cm('Definition') : $c)).$new, $a._p = block.$to_proc(), $a).call($b)))
            } else {
            return ($a = ($c = klass).$create, $a._p = block.$to_proc(), $a).call($c, name)
          }; return nil; })();
          event['$arguments='](args);
          return event;
        });

        $opal.defs(self, '$new', TMP_4 = function(value, args) {
          var $a, TMP_3, $b, $c, $d, self = this, $iter = TMP_4._p, $yield = $iter || nil, klass = nil;
          args = $slice.call(arguments, 1);
          TMP_4._p = null;
          $a = $opal.to_ary(($b = ($c = self.$classes()).$find, $b._p = (TMP_3 = function(_, constructor) {var self = TMP_3._s || this, $a;if (_ == null) _ = nil;if (constructor == null) constructor = nil;
            return (($a = $scope.Native) == null ? $opal.cm('Native') : $a)['$is_a?'](value, constructor)}, TMP_3._s = self, TMP_3), $b).call($c)), klass = ($a[0] == null ? nil : $a[0]), _ = ($a[1] == null ? nil : $a[1]);
          if (($a = ((($b = ($d = klass, ($d === nil || $d === false))) !== false && $b !== nil) ? $b : klass['$=='](self))) !== false && $a !== nil) {
            return $opal.find_super_dispatcher(self, 'new', TMP_4, null, Event).apply(self, [value].concat(args))
            } else {
            return ($a = klass).$new.apply($a, [value].concat(args))
          };
        });

        self.$attr_reader("target", "callback");

        def.$initialize = TMP_5 = function(native$, callback) {
          var $a, self = this, $iter = TMP_5._p, $yield = $iter || nil;
          if (callback == null) {
            callback = nil
          }
          TMP_5._p = null;
          $opal.find_super_dispatcher(self, 'initialize', TMP_5, null).apply(self, [native$]);
          self.target = (($a = $scope.Target) == null ? $opal.cm('Target') : $a).$convert(self['native'].target);
          return $a = $opal.to_ary(callback), self.callback = ($a[0] == null ? nil : $a[0]);
        };

        def.$off = function() {
          var $a, self = this;
          if (($a = self.callback) !== false && $a !== nil) {
            return self.callback.$off()
            } else {
            return nil
          };
        };

        def.$arguments = function() {
          var self = this;
          return self['native'].arguments || [];
        };

        def['$arguments='] = function(args) {
          var self = this;
          return self['native'].arguments = args;
        };

        self.$alias_native("bubbles?", "bubbles");

        self.$alias_native("cancelable?", "cancelable");

        self.$alias_native("name", "type");

        self.$alias_native("data");

        self.$alias_native("phase", "eventPhase");

        self.$alias_native("at", "timeStamp");

        def['$stopped?'] = function() {
          var self = this;
          return !!self['native'].stopped;
        };

        return (def['$stop!'] = function() {
          var $a, self = this;
          if (($a = (typeof(self['native'].stopPropagation) !== "undefined")) !== false && $a !== nil) {
            self['native'].stopPropagation();};
          if (($a = (typeof(self['native'].preventDefault) !== "undefined")) !== false && $a !== nil) {
            self['native'].preventDefault();};
          return self['native'].stopped = true;
        }, nil);
      })(self, null)
      
    })(self)
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $range = $opal.range;
  $opal.add_stubs(['$attr_reader', '$each', '$===', '$concat', '$to_a', '$push', '$DOM', '$try_convert', '$respond_to?', '$__send__', '$to_proc', '$new', '$document', '$dup', '$to_ary', '$select', '$matches?', '$after', '$last', '$raise', '$before', '$first', '$children', '$uniq', '$flatten', '$map', '$search', '$[]', '$inspect']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function NodeSet(){};
        var self = NodeSet = $klass($base, $super, 'NodeSet', NodeSet);

        var def = NodeSet._proto, $scope = NodeSet._scope, TMP_2;
        def.literal = def.document = def.internal = nil;
        self.$attr_reader("document");

        def.$initialize = function(document, list) {
          var TMP_1, $a, $b, self = this;
          if (list == null) {
            list = []
          }
          self.document = document;
          self.literal = [];
          return ($a = ($b = list).$each, $a._p = (TMP_1 = function(el) {var self = TMP_1._s || this, $a, $b;
            if (self.literal == null) self.literal = nil;
if (el == null) el = nil;
            if (($a = (($b = $scope.NodeSet) == null ? $opal.cm('NodeSet') : $b)['$==='](el)) !== false && $a !== nil) {
              return self.literal.$concat(el.$to_a())
              } else {
              return self.literal.$push(self.$DOM((($a = $scope.Native) == null ? $opal.cm('Native') : $a).$try_convert(el)))
            }}, TMP_1._s = self, TMP_1), $a).call($b);
        };

        def.$method_missing = TMP_2 = function(name, args) {
          var $a, TMP_3, $b, $c, $d, self = this, $iter = TMP_2._p, block = $iter || nil, result = nil;
          args = $slice.call(arguments, 1);
          TMP_2._p = null;
          if (($a = self.literal['$respond_to?'](name)) === false || $a === nil) {
            ($a = ($b = self).$each, $a._p = (TMP_3 = function(el) {var self = TMP_3._s || this, $a, $b;if (el == null) el = nil;
              return ($a = ($b = el).$__send__, $a._p = block.$to_proc(), $a).apply($b, [name].concat(args))}, TMP_3._s = self, TMP_3), $a).call($b);
            return self;};
          result = ($a = ($c = self.literal).$__send__, $a._p = block.$to_proc(), $a).apply($c, [name].concat(args));
          if (($a = result === self.literal) !== false && $a !== nil) {
            return self
          } else if (($a = (($d = $scope.Array) == null ? $opal.cm('Array') : $d)['$==='](result)) !== false && $a !== nil) {
            return (($a = $scope.NodeSet) == null ? $opal.cm('NodeSet') : $a).$new(self.document, result)
            } else {
            return result
          };
        };

        def.$dup = function() {
          var $a, self = this;
          return (($a = $scope.NodeSet) == null ? $opal.cm('NodeSet') : $a).$new(self.$document(), self.$to_ary().$dup());
        };

        def.$filter = function(expression) {
          var $a, TMP_4, $b, self = this;
          return (($a = $scope.NodeSet) == null ? $opal.cm('NodeSet') : $a).$new(self.$document(), ($a = ($b = self.internal).$select, $a._p = (TMP_4 = function(node) {var self = TMP_4._s || this;if (node == null) node = nil;
            return node['$matches?'](expression)}, TMP_4._s = self, TMP_4), $a).call($b));
        };

        def.$after = function(node) {
          var self = this;
          return self.$last().$after(node);
        };

        def.$at = function(path) {
          var $a, self = this;
          return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
        };

        def.$at_css = function(rules) {
          var $a, self = this;
          rules = $slice.call(arguments, 0);
          return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
        };

        def.$at_xpath = function(paths) {
          var $a, self = this;
          paths = $slice.call(arguments, 0);
          return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
        };

        def.$before = function() {
          var self = this;
          return self.$first().$before();
        };

        def.$children = function() {
          var $a, TMP_5, $b, self = this, result = nil;
          result = (($a = $scope.NodeSet) == null ? $opal.cm('NodeSet') : $a).$new(self.$document());
          ($a = ($b = self).$each, $a._p = (TMP_5 = function(n) {var self = TMP_5._s || this;if (n == null) n = nil;
            return result.$concat(n.$children())}, TMP_5._s = self, TMP_5), $a).call($b);
          return result;
        };

        def.$css = function(paths) {
          var $a, self = this;
          paths = $slice.call(arguments, 0);
          return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
        };

        def.$search = function(what) {
          var TMP_6, $a, $b, self = this;
          what = $slice.call(arguments, 0);
          return ($a = ($b = self).$map, $a._p = (TMP_6 = function(n) {var self = TMP_6._s || this, $a;if (n == null) n = nil;
            return ($a = n).$search.apply($a, [].concat(what))}, TMP_6._s = self, TMP_6), $a).call($b).$flatten().$uniq();
        };

        return (def.$inspect = function() {
          var self = this;
          return "#<DOM::NodeSet: " + (self.internal.$inspect()['$[]']($range(1, -2, false)));
        }, nil);
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $hash2 = $opal.hash2;
  $opal.add_stubs(['$include', '$==', '$[]', '$new', '$raise', '$try_convert', '$downcase', '$name', '$add_child', '$===', '$each', '$parent', '$document', '$last', '$<<', '$pop', '$select', '$matches?', '$detach', '$clear', '$remove_child', '$to_proc', '$children', '$node_type', '$first', '$DOM', '$element_children', '$to_s', '$next', '$element?', '$previous']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Node(){};
        var self = Node = $klass($base, $super, 'Node', Node);

        var def = Node._proto, $scope = Node._scope, $a, $b, TMP_1, TMP_4;
        def['native'] = nil;
        self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

        $opal.cdecl($scope, 'ELEMENT_NODE', 1);

        $opal.cdecl($scope, 'ATTRIBUTE_NODE', 2);

        $opal.cdecl($scope, 'TEXT_NODE', 3);

        $opal.cdecl($scope, 'CDATA_SECTION_NODE', 4);

        $opal.cdecl($scope, 'ENTITY_REFERENCE_NOCE', 5);

        $opal.cdecl($scope, 'ENTITY_NODE', 6);

        $opal.cdecl($scope, 'PROCESSING_INSTRUCTION_NODE', 7);

        $opal.cdecl($scope, 'COMMENT_NODE', 8);

        $opal.cdecl($scope, 'DOCUMENT_NODE', 9);

        $opal.cdecl($scope, 'DOCUMENT_TYPE_NODE', 10);

        $opal.cdecl($scope, 'DOCUMENT_FRAGMENT_NODE', 11);

        $opal.cdecl($scope, 'NOTATION_NODE', 12);

        $opal.defs(self, '$new', TMP_1 = function(value) {var $zuper = $slice.call(arguments, 0);
          var $a, $b, self = this, $iter = TMP_1._p, $yield = $iter || nil, klass = nil;
          if (self.classes == null) self.classes = nil;

          TMP_1._p = null;
          if (self['$==']((($a = $scope.Node) == null ? $opal.cm('Node') : $a))) {
            ((($a = self.classes) !== false && $a !== nil) ? $a : self.classes = [nil, (($b = $scope.Element) == null ? $opal.cm('Element') : $b), (($b = $scope.Attribute) == null ? $opal.cm('Attribute') : $b), (($b = $scope.Text) == null ? $opal.cm('Text') : $b), (($b = $scope.CDATA) == null ? $opal.cm('CDATA') : $b), nil, nil, nil, (($b = $scope.Comment) == null ? $opal.cm('Comment') : $b), (($b = $scope.Document) == null ? $opal.cm('Document') : $b), nil, (($b = $scope.DocumentFragment) == null ? $opal.cm('DocumentFragment') : $b)]);
            if (($a = klass = self.classes['$[]'](value.nodeType)) !== false && $a !== nil) {
              return klass.$new(value)
              } else {
              return self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "cannot instantiate a non derived Node object")
            };
            } else {
            return $opal.find_super_dispatcher(self, 'new', TMP_1, $iter, Node).apply(self, $zuper)
          };
        });

        def['$=='] = function(other) {
          var $a, self = this;
          return self['native'] === (($a = $scope.Native) == null ? $opal.cm('Native') : $a).$try_convert(other);
        };

        def['$=~'] = function(name) {
          var self = this;
          return self.$name().$downcase()['$=='](name.$downcase());
        };

        def['$<<'] = function(node) {
          var self = this;
          return self.$add_child(node);
        };

        def['$<=>'] = function(other) {
          var $a, self = this;
          return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
        };

        def.$add_child = function(node) {
          var $a, $b, TMP_2, $c, self = this;
          if (($a = (($b = $scope.NodeSet) == null ? $opal.cm('NodeSet') : $b)['$==='](node)) !== false && $a !== nil) {
            ($a = ($b = node).$each, $a._p = (TMP_2 = function(node) {var self = TMP_2._s || this;if (node == null) node = nil;
              return self.$add_child(node)}, TMP_2._s = self, TMP_2), $a).call($b)
          } else if (($a = (($c = $scope.String) == null ? $opal.cm('String') : $c)['$==='](node)) !== false && $a !== nil) {
            self['native'].appendChild(self['native'].ownerDocument.createTextNode(node));
            } else {
            self['native'].appendChild((($a = $scope.Native) == null ? $opal.cm('Native') : $a).$try_convert(node));
          };
          return self;
        };

        def.$add_next_sibling = function(node) {
          var self = this;
          self['native'].parentNode.insertBefore(node, self['native'].nextSibling);
          return self;
        };

        def.$add_previous_sibling = function(node) {
          var self = this;
          self['native'].parentNode.insertBefore(node, self['native']);
          return self;
        };

        $opal.defn(self, '$after', def.$add_next_sibling);

        def.$append_to = function(element) {
          var self = this;
          element.$add_child(self);
          return self;
        };

        def.$ancestors = function(expression) {
          var $a, $b, TMP_3, self = this, parents = nil, parent = nil;
          if (expression == null) {
            expression = nil
          }
          if (($a = self.$parent()) === false || $a === nil) {
            return (($a = $scope.NodeSet) == null ? $opal.cm('NodeSet') : $a).$new(self.$document())};
          parents = [self.$parent()];
          while (($b = parent = parents.$last().$parent()) !== false && $b !== nil) {
          parents['$<<'](parent)};
          if (($a = (($b = $scope.Document) == null ? $opal.cm('Document') : $b)['$==='](parents.$last())) !== false && $a !== nil) {
            parents.$pop()};
          if (($a = expression) === false || $a === nil) {
            return (($a = $scope.NodeSet) == null ? $opal.cm('NodeSet') : $a).$new(self.$document(), parents)};
          return (($a = $scope.NodeSet) == null ? $opal.cm('NodeSet') : $a).$new(self.$document(), ($a = ($b = parents).$select, $a._p = (TMP_3 = function(p) {var self = TMP_3._s || this;if (p == null) p = nil;
            return p['$matches?'](expression)}, TMP_3._s = self, TMP_3), $a).call($b));
        };

        $opal.defn(self, '$before', def.$add_previous_sibling);

        def.$remove = function() {
          var self = this;
          self.$detach();
          self.$clear();
          return self;
        };

        def.$detach = function() {
          var $a, self = this;
          if (($a = self.$parent()) !== false && $a !== nil) {
            self.$parent().$remove_child(self)};
          return self;
        };

        def.$clear = function() {
          var self = this;
          return nil;
        };

        def.$remove_child = function(element) {
          var $a, self = this;
          self['native'].removeChild((($a = $scope.Native) == null ? $opal.cm('Native') : $a).$try_convert(element));
          return self;
        };

        def.$clear = function() {
          var $a, $b, self = this;
          return ($a = ($b = self.$children()).$each, $a._p = "remove".$to_proc(), $a).call($b);
        };

        def['$blank?'] = function() {
          var $a, self = this;
          return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
        };

        def['$cdata?'] = function() {
          var $a, self = this;
          return self.$node_type()['$==']((($a = $scope.CDATA_SECTION_NODE) == null ? $opal.cm('CDATA_SECTION_NODE') : $a));
        };

        def.$child = function() {
          var self = this;
          return self.$children().$first();
        };

        def.$children = function() {
          var $a, $b, self = this;
          return (($a = $scope.NodeSet) == null ? $opal.cm('NodeSet') : $a).$new(self.$document(), (($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Array == null ? $a.cm('Array') : $a.Array).$new(self['native'].childNodes));
        };

        def['$children='] = function(node) {
          var $a, self = this;
          return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
        };

        def['$comment?'] = function() {
          var $a, self = this;
          return self.$node_type()['$==']((($a = $scope.COMMENT_NODE) == null ? $opal.cm('COMMENT_NODE') : $a));
        };

        def.$document = function() {
          var self = this;
          return self.$DOM(self['native'].ownerDocument);
        };

        def['$document?'] = function() {
          var $a, self = this;
          return self.$node_type()['$==']((($a = $scope.DOCUMENT_NODE) == null ? $opal.cm('DOCUMENT_NODE') : $a));
        };

        def['$elem?'] = function() {
          var $a, self = this;
          return self.$node_type()['$==']((($a = $scope.ELEMENT_NODE) == null ? $opal.cm('ELEMENT_NODE') : $a));
        };

        $opal.defn(self, '$element?', def['$elem?']);

        def.$element_children = function() {
          var $a, $b, self = this;
          return ($a = ($b = self.$children()).$select, $a._p = "element?".$to_proc(), $a).call($b);
        };

        $opal.defn(self, '$elements', def.$element_children);

        def.$first_element_child = function() {
          var self = this;
          return self.$element_children().$first();
        };

        def['$fragment?'] = function() {
          var $a, self = this;
          return self.$node_type()['$==']((($a = $scope.DOCUMENT_FRAGMENT_NODE) == null ? $opal.cm('DOCUMENT_FRAGMENT_NODE') : $a));
        };

        def.$hash = function() {
          var self = this;
          return nil;
        };

        def.$inner_html = function() {
          var self = this;
          return self['native'].innerHTML;
        };

        def['$inner_html='] = function(value) {
          var self = this;
          return self['native'].innerHTML = value;
        };

        def.$inner_text = function() {
          var self = this;
          return self['native'].textContent;
        };

        $opal.defn(self, '$content', def.$inner_text);

        def['$inner_text='] = function(value) {
          var self = this;
          return self['native'].textContent = value;
        };

        $opal.defn(self, '$content=', def['$inner_text=']);

        def.$last_element_child = function() {
          var self = this;
          return self.$element_children().$last();
        };

        def['$matches?'] = function(expression) {
          var self = this;
          return false;
        };

        def.$name = function() {
          var self = this;
          return self['native'].nodeName || nil;
        };

        def['$name='] = function(value) {
          var self = this;
          return self['native'].nodeName = value.$to_s();
        };

        def.$namespace = function() {
          var self = this;
          return self['native'].namespaceURI || nil;
        };

        def.$next = function() {
          var $a, self = this;
          if (($a = self['native'].nextSibling != null) !== false && $a !== nil) {
            return self.$DOM(self['native'].nextSibling)
            } else {
            return nil
          };
        };

        def.$next_element = function() {
          var $a, $b, $c, $d, self = this, current = nil;
          current = self.$next();
          while (($b = (($c = current !== false && current !== nil) ? ($d = current['$element?'](), ($d === nil || $d === false)) : $c)) !== false && $b !== nil) {
          current = current.$next()};
          return current;
        };

        $opal.defn(self, '$next_sibling', def.$next);

        $opal.defn(self, '$node_name', def.$name);

        $opal.defn(self, '$node_name=', def['$name=']);

        def.$node_type = function() {
          var self = this;
          return self['native'].nodeType;
        };

        def.$parent = function() {
          var $a, self = this;
          if (($a = self['native'].parentNode != null) !== false && $a !== nil) {
            return self.$DOM(self['native'].parentNode)
            } else {
            return nil
          };
        };

        def['$parent='] = function(node) {
          var $a, self = this;
          return self['native'].parentNode = (($a = $scope.Native) == null ? $opal.cm('Native') : $a).$try_convert(node);
        };

        def.$parse = function(text, options) {
          var $a, self = this;
          if (options == null) {
            options = $hash2([], {})
          }
          return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
        };

        def.$path = function() {
          var $a, self = this;
          return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
        };

        def.$previous = function() {
          var $a, self = this;
          if (($a = self['native'].previousSibling != null) !== false && $a !== nil) {
            return self.$DOM(self['native'].previousSibling)
            } else {
            return nil
          };
        };

        $opal.defn(self, '$previous=', def.$add_previous_sibling);

        def.$previous_element = function() {
          var $a, $b, $c, $d, self = this, current = nil;
          current = self.$previous();
          while (($b = (($c = current !== false && current !== nil) ? ($d = current['$element?'](), ($d === nil || $d === false)) : $c)) !== false && $b !== nil) {
          current = current.$previous()};
          return current;
        };

        $opal.defn(self, '$previous_sibling', def.$previous);

        def.$replace = function(node) {
          var $a, self = this;
          self['native'].parentNode.replaceChild(self['native'], (($a = $scope.Native) == null ? $opal.cm('Native') : $a).$try_convert(node));
          return node;
        };

        $opal.defn(self, '$text', def.$inner_text);

        $opal.defn(self, '$text=', def['$inner_text=']);

        def['$text?'] = function() {
          var $a, self = this;
          return self.$node_type()['$==']((($a = $scope.TEXT_NODE) == null ? $opal.cm('TEXT_NODE') : $a));
        };

        def.$traverse = TMP_4 = function() {
          var $a, self = this, $iter = TMP_4._p, block = $iter || nil;
          TMP_4._p = null;
          return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
        };

        $opal.defn(self, '$type', def.$node_type);

        def.$value = function() {
          var self = this;
          return self['native'].nodeValue || nil;
        };

        def['$value='] = function(value) {
          var self = this;
          return self['native'].nodeValue = value;
        };

        return (def.$inspect = function() {
          var self = this;
          return "#<DOM::Node: " + (self.$name()) + ">";
        }, nil);
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$include']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Attribute(){};
        var self = Attribute = $klass($base, $super, 'Attribute', Attribute);

        var def = Attribute._proto, $scope = Attribute._scope, $a, $b;
        def['native'] = nil;
        self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

        def['$id?'] = function() {
          var self = this;
          return self['native'].isId;
        };

        def.$name = function() {
          var self = this;
          return self['native'].name;
        };

        return (def.$value = function() {
          var self = this;
          return self['native'].value;
        }, nil);
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs([]);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope, $a;
      (function($base, $super) {
        function CharacterData(){};
        var self = CharacterData = $klass($base, $super, 'CharacterData', CharacterData);

        var def = CharacterData._proto, $scope = CharacterData._scope;
        def['native'] = nil;
        def.$data = function() {
          var self = this;
          return self['native'].data;
        };

        def.$append = function(string) {
          var self = this;
          self['native'].appendData(string);
          return self;
        };

        def.$insert = function(string, offset) {
          var self = this;
          if (offset == null) {
            offset = 0
          }
          self['native'].insertData(offset, string);
          return self;
        };

        def.$delete = function(count, offset) {
          var self = this;
          if (offset == null) {
            offset = 0
          }
          self['native'].deleteData(offset, count);
          return self;
        };

        def.$replace = function(string, offset, count) {
          var self = this;
          if (offset == null) {
            offset = 0
          }
          if (count == null) {
            count = self['native'].length
          }
          self['native'].replaceData(offset, count, string);
          return self;
        };

        return (def.$substring = function(count, offset) {
          var self = this;
          if (offset == null) {
            offset = 0
          }
          return self['native'].substringData(offset, count);
        }, nil);
      })(self, (($a = $scope.Node) == null ? $opal.cm('Node') : $a))
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$create_text', '$data']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope, $a;
      (function($base, $super) {
        function Text(){};
        var self = Text = $klass($base, $super, 'Text', Text);

        var def = Text._proto, $scope = Text._scope;
        def['native'] = nil;
        $opal.defs(self, '$create', function(args) {
          var $a, self = this;
          args = $slice.call(arguments, 0);
          return ($a = $gvars["document"]).$create_text.apply($a, [].concat(args));
        });

        def.$whole = function() {
          var self = this;
          return self['native'].wholeText;
        };

        def.$split = function(offset) {
          var self = this;
          return self['native'].splitText(offset);
        };

        return (def.$inspect = function() {
          var self = this;
          return "#<DOM::Text: " + (self.$data()) + ">";
        }, nil);
      })(self, (($a = $scope.CharacterData) == null ? $opal.cm('CharacterData') : $a))
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$value']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope, $a;
      (function($base, $super) {
        function CDATA(){};
        var self = CDATA = $klass($base, $super, 'CDATA', CDATA);

        var def = CDATA._proto, $scope = CDATA._scope;
        return (def.$inspect = function() {
          var self = this;
          return "#<DOM::CDATA: " + (self.$value()) + ">";
        }, nil)
      })(self, (($a = $scope.Text) == null ? $opal.cm('Text') : $a))
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$value']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope, $a;
      (function($base, $super) {
        function Comment(){};
        var self = Comment = $klass($base, $super, 'Comment', Comment);

        var def = Comment._proto, $scope = Comment._scope;
        return (def.$inspect = function() {
          var self = this;
          return "#<DOM::Comment: " + (self.$value()) + ">";
        }, nil)
      })(self, (($a = $scope.CharacterData) == null ? $opal.cm('CharacterData') : $a))
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$to_n', '$offset', '$get', '$parent', '$new', '$==', '$[]', '$style', '$=~', '$x=', '$+', '$x', '$to_i', '$y=', '$y', '$-']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope, $a;
      (function($base, $super) {
        function Element(){};
        var self = Element = $klass($base, $super, 'Element', Element);

        var def = Element._proto, $scope = Element._scope;
        return (function($base, $super) {
          function Position(){};
          var self = Position = $klass($base, $super, 'Position', Position);

          var def = Position._proto, $scope = Position._scope;
          def.element = nil;
          def.$initialize = function(element) {
            var self = this;
            self.element = element;
            return self['native'] = element.$to_n();
          };

          def.$get = function() {
            var $a, $b, self = this, offset = nil, position = nil, parent = nil, parent_offset = nil;
            offset = self.element.$offset();
            position = offset.$get();
            parent = offset.$parent();
            parent_offset = (($a = ((($b = $scope.Browser) == null ? $opal.cm('Browser') : $b))._scope).Position == null ? $a.cm('Position') : $a.Position).$new(0, 0);
            if (self.element.$style()['$[]']("position")['$==']("fixed")) {
              if (($a = parent['$=~']("html")) === false || $a === nil) {
                parent_offset = parent.$offset()};
              ($a = parent_offset, $a['$x=']($a.$x()['$+'](parent.$style()['$[]']("border-top-width").$to_i())));
              ($a = parent_offset, $a['$y=']($a.$y()['$+'](parent.$style()['$[]']("border-left-width").$to_i())));};
            return (($a = ((($b = $scope.Browser) == null ? $opal.cm('Browser') : $b))._scope).Position == null ? $a.cm('Position') : $a.Position).$new(position.$x()['$-'](parent_offset.$x())['$-'](self.element.$style()['$[]']("margin-left").$to_i()), position.$y()['$-'](parent_offset.$y())['$-'](self.element.$style()['$[]']("margin-top").$to_i()));
          };

          def.$x = function() {
            var self = this;
            return self.$get().$x();
          };

          return (def.$y = function() {
            var self = this;
            return self.$get().$y();
          }, nil);
        })(self, null)
      })(self, (($a = $scope.Node) == null ? $opal.cm('Node') : $a))
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$to_n', '$DOM', '$root', '$document', '$x', '$get', '$set', '$y', '$window', '$new', '$[]', '$style!', '$==', '$[]=', '$style', '$to_u', '$===', '$first', '$+', '$-', '$px']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope, $a;
      (function($base, $super) {
        function Element(){};
        var self = Element = $klass($base, $super, 'Element', Element);

        var def = Element._proto, $scope = Element._scope;
        return (function($base, $super) {
          function Offset(){};
          var self = Offset = $klass($base, $super, 'Offset', Offset);

          var def = Offset._proto, $scope = Offset._scope;
          def['native'] = def.element = nil;
          def.$initialize = function(element) {
            var self = this;
            self.element = element;
            return self['native'] = element.$to_n();
          };

          def.$parent = function() {
            var self = this;
            return self.$DOM(self['native'].offsetParent || self.element.$document().$root().$to_n());
          };

          def.$x = function() {
            var self = this;
            return self.$get().$x();
          };

          def['$x='] = function(value) {
            var self = this;
            return self.$set(value, nil);
          };

          def.$y = function() {
            var self = this;
            return self.$get().$y();
          };

          def['$y='] = function(value) {
            var self = this;
            return self.$set(nil, value);
          };

          def.$get = function() {
            var $a, $b, self = this, doc = nil, root = nil, win = nil;
            doc = self.element.$document();
            root = doc.$root().$to_n();
            win = doc.$window().$to_n();
            
      var box = self['native'].getBoundingClientRect(),
          y   = box.top + (win.pageYOffset || root.scrollTop) - (root.clientTop || 0),
          x   = box.left + (win.pageXOffset || root.scrollLeft) - (root.clientLeft || 0);
    ;
            return (($a = ((($b = $scope.Browser) == null ? $opal.cm('Browser') : $b))._scope).Position == null ? $a.cm('Position') : $a.Position).$new(x, y);
          };

          return (def.$set = function(value) {
            var $a, $b, $c, self = this, position = nil, offset = nil, top = nil, left = nil, x = nil, y = nil;
            value = $slice.call(arguments, 0);
            position = self.element['$style!']()['$[]']("position");
            if (position['$==']("static")) {
              self.element.$style()['$[]=']("position", "relative")};
            offset = self.$get();
            top = self.element['$style!']()['$[]']("top").$to_u();
            left = self.element['$style!']()['$[]']("left").$to_u();
            if (($a = (($b = ((($c = $scope.Browser) == null ? $opal.cm('Browser') : $c))._scope).Position == null ? $b.cm('Position') : $b.Position)['$==='](value.$first())) !== false && $a !== nil) {
              $a = [value.$first().$x(), value.$first().$y()], x = $a[0], y = $a[1]
            } else if (($a = (($b = $scope.Hash) == null ? $opal.cm('Hash') : $b)['$==='](value.$first())) !== false && $a !== nil) {
              $a = [value.$first()['$[]']("x"), value.$first()['$[]']("y")], x = $a[0], y = $a[1]
              } else {
              $a = $opal.to_ary(value), x = ($a[0] == null ? nil : $a[0]), y = ($a[1] == null ? nil : $a[1])
            };
            if (x !== false && x !== nil) {
              self.element.$style()['$[]=']("left", (x.$px()['$-'](offset.$x()))['$+'](left))};
            if (y !== false && y !== nil) {
              return self.element.$style()['$[]=']("top", (y.$px()['$-'](offset.$y()))['$+'](top))
              } else {
              return nil
            };
          }, nil);
        })(self, null)
      })(self, (($a = $scope.Node) == null ? $opal.cm('Node') : $a))
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$to_n', '$new', '$x', '$position', '$y', '$[]']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope, $a;
      (function($base, $super) {
        function Element(){};
        var self = Element = $klass($base, $super, 'Element', Element);

        var def = Element._proto, $scope = Element._scope;
        return (function($base, $super) {
          function Scroll(){};
          var self = Scroll = $klass($base, $super, 'Scroll', Scroll);

          var def = Scroll._proto, $scope = Scroll._scope;
          def['native'] = nil;
          def.$initialize = function(element) {
            var self = this;
            self.element = element;
            return self['native'] = element.$to_n();
          };

          def.$position = function() {
            var $a, $b, self = this;
            return (($a = ((($b = $scope.Browser) == null ? $opal.cm('Browser') : $b))._scope).Position == null ? $a.cm('Position') : $a.Position).$new(self['native'].scrollLeft, self['native'].scrollTop);
          };

          def.$x = function() {
            var self = this;
            return self.$position().$x();
          };

          def.$y = function() {
            var self = this;
            return self.$position().$y();
          };

          def.$to = function(what) {
            var $a, self = this, x = nil, y = nil;
            x = ((($a = what['$[]']("x")) !== false && $a !== nil) ? $a : self.$x());
            y = ((($a = what['$[]']("y")) !== false && $a !== nil) ? $a : self.$y());
            self['native'].scrollTo(x, y);
            return self;
          };

          return (def.$by = function(what) {
            var $a, self = this, x = nil, y = nil;
            x = ((($a = what['$[]']("x")) !== false && $a !== nil) ? $a : 0);
            y = ((($a = what['$[]']("y")) !== false && $a !== nil) ? $a : 0);
            self['native'].scrollBy(x, y);
            return self;
          }, nil);
        })(self, null)
      })(self, (($a = $scope.Node) == null ? $opal.cm('Node') : $a))
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs([]);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope, $a;
      (function($base, $super) {
        function Element(){};
        var self = Element = $klass($base, $super, 'Element', Element);

        var def = Element._proto, $scope = Element._scope, $a;
        return (function($base, $super) {
          function Input(){};
          var self = Input = $klass($base, $super, 'Input', Input);

          var def = Input._proto, $scope = Input._scope;
          def['native'] = nil;
          def.$value = function() {
            var self = this;
            return self['native'].value;
          };

          def['$value='] = function(value) {
            var self = this;
            return self['native'].value = value;
          };

          return (def.$clear = function() {
            var self = this;
            return self['native'].value = '';
          }, nil);
        })(self, (($a = $scope.Element) == null ? $opal.cm('Element') : $a))
      })(self, (($a = $scope.Node) == null ? $opal.cm('Node') : $a))
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars, $hash2 = $opal.hash2;
  $opal.add_stubs(['$create_element', '$==', '$downcase', '$===', '$new', '$include', '$target', '$DOM', '$alias_native', '$join', '$uniq', '$+', '$class_names', '$-', '$reject', '$to_proc', '$split', '$[]', '$to_s', '$attributes_nodesmap', '$map', '$attribute_nodes', '$enum_for', '$each', '$attributes', '$empty?', '$set', '$offset', '$document', '$clear', '$<<', '$flatten', '$xpath', '$first', '$css', '$concat', '$to_a', '$is_a?', '$replace', '$assign', '$apply', '$to_n', '$window', '$name', '$attr_reader', '$value', '$get_attribute', '$set_attribute', '$[]=']);
  ;
  ;
  ;
  ;
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope, $a;
      (function($base, $super) {
        function Element(){};
        var self = Element = $klass($base, $super, 'Element', Element);

        var def = Element._proto, $scope = Element._scope, TMP_1, $a, $b, TMP_2, TMP_4, TMP_5, TMP_10;
        def['native'] = nil;
        $opal.defs(self, '$create', function(args) {
          var $a, self = this;
          args = $slice.call(arguments, 0);
          return ($a = $gvars["document"]).$create_element.apply($a, [].concat(args));
        });

        $opal.defs(self, '$new', TMP_1 = function(node) {var $zuper = $slice.call(arguments, 0);
          var $a, self = this, $iter = TMP_1._p, $yield = $iter || nil, $case = nil;
          TMP_1._p = null;
          if (self['$==']((($a = $scope.Element) == null ? $opal.cm('Element') : $a))) {
            return (function() {$case = (node.nodeName).$downcase();if ("input"['$===']($case)) {return (($a = $scope.Input) == null ? $opal.cm('Input') : $a).$new(node)}else {return $opal.find_super_dispatcher(self, 'new', TMP_1, $iter, Element).apply(self, $zuper)}})()
            } else {
            return $opal.find_super_dispatcher(self, 'new', TMP_1, $iter, Element).apply(self, $zuper)
          };
        });

        self.$include((($a = ((($b = $scope.Event) == null ? $opal.cm('Event') : $b))._scope).Target == null ? $a.cm('Target') : $a.Target));

        ($a = ($b = self).$target, $a._p = (TMP_2 = function(value) {var self = TMP_2._s || this;if (value == null) value = nil;
          try {return self.$DOM(value) } catch ($err) { return nil }}, TMP_2._s = self, TMP_2), $a).call($b);

        self.$alias_native("id");

        def.$add_class = function(names) {
          var self = this;
          names = $slice.call(arguments, 0);
          self['native'].className = (self.$class_names()['$+'](names)).$uniq().$join(" ");
          return self;
        };

        def.$remove_class = function(names) {
          var self = this;
          names = $slice.call(arguments, 0);
          self['native'].className = (self.$class_names()['$-'](names)).$join(" ");
          return self;
        };

        self.$alias_native("class_name", "className");

        def.$class_names = function() {
          var $a, $b, self = this;
          return ($a = ($b = (self['native'].className).$split(/\s+/)).$reject, $a._p = "empty?".$to_proc(), $a).call($b);
        };

        $opal.defn(self, '$attribute', def.$attr);

        def.$attribute_nodes = function() {
          var TMP_3, $a, $b, $c, $d, self = this;
          return ($a = ($b = (($c = ((($d = $scope.Native) == null ? $opal.cm('Native') : $d))._scope).Array == null ? $c.cm('Array') : $c.Array)).$new, $a._p = (TMP_3 = function(e) {var self = TMP_3._s || this;if (e == null) e = nil;
            return self.$DOM(e)}, TMP_3._s = self, TMP_3), $a).call($b, self['native'].attributes, $hash2(["get"], {"get": "item"}));
        };

        def.$attributes = function(options) {
          var $a, self = this;
          if (options == null) {
            options = $hash2([], {})
          }
          return (($a = $scope.Attributes) == null ? $opal.cm('Attributes') : $a).$new(self, options);
        };

        def.$get = function(name, options) {
          var $a, self = this, namespace = nil;
          if (options == null) {
            options = $hash2([], {})
          }
          if (($a = namespace = options['$[]']("namespace")) !== false && $a !== nil) {
            return self['native'].getAttributeNS(namespace.$to_s(), name.$to_s()) || nil;
            } else {
            return self['native'].getAttribute(name.$to_s()) || nil;
          };
        };

        def.$set = function(name, value, options) {
          var $a, self = this, namespace = nil;
          if (options == null) {
            options = $hash2([], {})
          }
          if (($a = namespace = options['$[]']("namespace")) !== false && $a !== nil) {
            return self['native'].setAttributeNS(namespace.$to_s(), name.$to_s(), value);
            } else {
            return self['native'].setAttribute(name.$to_s(), value.$to_s());
          };
        };

        $opal.defn(self, '$[]', def.$get);

        $opal.defn(self, '$[]=', def.$set);

        $opal.defn(self, '$attr', def.$get);

        $opal.defn(self, '$attribute', def.$get);

        $opal.defn(self, '$get_attribute', def.$get);

        $opal.defn(self, '$set_attribute', def.$set);

        def['$key?'] = function(name) {
          var $a, $b, self = this;
          return ($a = ($b = self['$[]'](name), ($b === nil || $b === false)), ($a === nil || $a === false));
        };

        def.$keys = function() {
          var $a, $b, self = this;
          return ($a = ($b = self).$attributes_nodesmap, $a._p = "name".$to_proc(), $a).call($b);
        };

        def.$values = function() {
          var $a, $b, self = this;
          return ($a = ($b = self.$attribute_nodes()).$map, $a._p = "value".$to_proc(), $a).call($b);
        };

        def.$each = TMP_4 = function(options) {
          var $a, $b, self = this, $iter = TMP_4._p, block = $iter || nil;
          if (options == null) {
            options = $hash2([], {})
          }
          TMP_4._p = null;
          if (($a = block) === false || $a === nil) {
            return self.$enum_for("each", options)};
          return ($a = ($b = self.$attributes(options)).$each, $a._p = block.$to_proc(), $a).call($b);
        };

        def.$remove_attribute = function(name) {
          var self = this;
          return self['native'].removeAttribute(name);
        };

        def.$size = function(inc) {
          var $a, self = this;
          inc = $slice.call(arguments, 0);
          return (($a = $scope.Size) == null ? $opal.cm('Size') : $a).$new(self['native'].offsetWidth, self['native'].offsetHeight);
        };

        def.$position = function() {
          var $a, self = this;
          return (($a = $scope.Position) == null ? $opal.cm('Position') : $a).$new(self);
        };

        def.$offset = function(values) {
          var $a, self = this, off = nil;
          values = $slice.call(arguments, 0);
          off = (($a = $scope.Offset) == null ? $opal.cm('Offset') : $a).$new(self);
          if (($a = values['$empty?']()) === false || $a === nil) {
            ($a = off).$set.apply($a, [].concat(values))};
          return off;
        };

        def['$offset='] = function(value) {
          var $a, self = this;
          return ($a = self.$offset()).$set.apply($a, [].concat(value));
        };

        def.$scroll = function() {
          var $a, self = this;
          return (($a = $scope.Scroll) == null ? $opal.cm('Scroll') : $a).$new(self);
        };

        def.$inner_dom = TMP_5 = function() {
          var $a, $b, $c, self = this, $iter = TMP_5._p, block = $iter || nil, doc = nil;
          TMP_5._p = null;
          doc = self.$document();
          self.$clear();
          ($a = ($b = (($c = $scope.Builder) == null ? $opal.cm('Builder') : $c)).$new, $a._p = block.$to_proc(), $a).call($b, doc, self);
          return self;
        };

        def['$inner_dom='] = function(node) {
          var self = this;
          self.$clear();
          return self['$<<'](node);
        };

        def['$/'] = function(paths) {
          var TMP_6, $a, $b, self = this;
          paths = $slice.call(arguments, 0);
          return ($a = ($b = paths).$map, $a._p = (TMP_6 = function(path) {var self = TMP_6._s || this;if (path == null) path = nil;
            return self.$xpath(path)}, TMP_6._s = self, TMP_6), $a).call($b).$flatten().$uniq();
        };

        def.$at = function(path) {
          var $a, self = this;
          return ((($a = self.$xpath(path).$first()) !== false && $a !== nil) ? $a : self.$css(path).$first());
        };

        def.$at_css = function(rules) {try {

          var TMP_7, $a, $b, self = this;
          rules = $slice.call(arguments, 0);
          ($a = ($b = rules).$each, $a._p = (TMP_7 = function(rule) {var self = TMP_7._s || this, found = nil;if (rule == null) rule = nil;
            found = self.$css(rule).$first();
            if (found !== false && found !== nil) {
              $opal.$return(found)
              } else {
              return nil
            };}, TMP_7._s = self, TMP_7), $a).call($b);
          return nil;
          } catch ($returner) { if ($returner === $opal.returner) { return $returner.$v } throw $returner; }
        };

        def.$at_xpath = function(paths) {try {

          var TMP_8, $a, $b, self = this;
          paths = $slice.call(arguments, 0);
          ($a = ($b = paths).$each, $a._p = (TMP_8 = function(path) {var self = TMP_8._s || this, found = nil;if (path == null) path = nil;
            found = self.$xpath(path).$first();
            if (found !== false && found !== nil) {
              $opal.$return(found)
              } else {
              return nil
            };}, TMP_8._s = self, TMP_8), $a).call($b);
          return nil;
          } catch ($returner) { if ($returner === $opal.returner) { return $returner.$v } throw $returner; }
        };

        def.$search = function(selectors) {
          var $a, TMP_9, $b, self = this;
          selectors = $slice.call(arguments, 0);
          return (($a = $scope.NodeSet) == null ? $opal.cm('NodeSet') : $a).$new(self.$document(), ($a = ($b = selectors).$map, $a._p = (TMP_9 = function(selector) {var self = TMP_9._s || this;if (selector == null) selector = nil;
            return self.$xpath(selector).$to_a().$concat(self.$css(selector).$to_a())}, TMP_9._s = self, TMP_9), $a).call($b).$flatten().$uniq());
        };

        def.$css = function(path) {
          var $a, $b, self = this;
          return (($a = $scope.NodeSet) == null ? $opal.cm('NodeSet') : $a).$new(self.$document(), (($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Array == null ? $a.cm('Array') : $a.Array).$new(self['native'].querySelectorAll(path)));
        };

        def.$xpath = function(path) {
          var $a, $b, self = this, result = nil;
          result = [];
          try {
          
        var tmp = (self['native'].ownerDocument || self['native']).evaluate(
          path, self['native'], null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        result = (($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Array == null ? $a.cm('Array') : $a.Array).$new(tmp, $hash2(["get", "length"], {"get": "snapshotItem", "length": "snapshotLength"}));
      ;
          } catch ($err) {if (true) {
            nil
            }else { throw $err; }
          };
          return (($a = $scope.NodeSet) == null ? $opal.cm('NodeSet') : $a).$new(self.$document(), result);
        };

        def.$style = TMP_10 = function(data) {
          var $a, $b, self = this, $iter = TMP_10._p, block = $iter || nil, style = nil;
          if (data == null) {
            data = nil
          }
          TMP_10._p = null;
          style = (($a = ((($b = $scope.CSS) == null ? $opal.cm('CSS') : $b))._scope).Declaration == null ? $a.cm('Declaration') : $a.Declaration).$new(self['native'].style);
          if (($a = ((($b = data) !== false && $b !== nil) ? $b : block)) === false || $a === nil) {
            return style};
          if (($a = data['$is_a?']((($b = $scope.String) == null ? $opal.cm('String') : $b))) !== false && $a !== nil) {
            style.$replace(data)
          } else if (($a = data['$is_a?']((($b = $scope.Enumerable) == null ? $opal.cm('Enumerable') : $b))) !== false && $a !== nil) {
            style.$assign(data)};
          if (block !== false && block !== nil) {
            ($a = ($b = style).$apply, $a._p = block.$to_proc(), $a).call($b)};
          return self;
        };

        def['$style!'] = function() {
          var $a, $b, self = this;
          return (($a = ((($b = $scope.CSS) == null ? $opal.cm('CSS') : $b))._scope).Declaration == null ? $a.cm('Declaration') : $a.Declaration).$new(self.$window().$to_n().getComputedStyle(self['native'], null));
        };

        def.$data = function(what) {
          var $a, $b, TMP_11, self = this;
          if (($a = (typeof(self['native'].$data) !== "undefined")) === false || $a === nil) {
            self['native'].$data = {};};
          if (($a = (($b = $scope.Hash) == null ? $opal.cm('Hash') : $b)['$==='](what)) !== false && $a !== nil) {
            return ($a = ($b = what).$each, $a._p = (TMP_11 = function(name, value) {var self = TMP_11._s || this;
              if (self['native'] == null) self['native'] = nil;
if (name == null) name = nil;if (value == null) value = nil;
              return self['native'].$data[name] = value;}, TMP_11._s = self, TMP_11), $a).call($b)
            } else {
            
        var value = self['native'].$data[what];

        if (value === undefined) {
          return nil;
        }
        else {
          return value;
        }
      ;
          };
        };

        def['$matches?'] = function(selector) {
          var self = this;
          return self['native'].matches(selector);
        };

        def.$window = function() {
          var self = this;
          return self.$document().$window();
        };

        def.$inspect = function() {
          var self = this;
          return "#<DOM::Element: " + (self.$name()) + ">";
        };

        return (function($base, $super) {
          function Attributes(){};
          var self = Attributes = $klass($base, $super, 'Attributes', Attributes);

          var def = Attributes._proto, $scope = Attributes._scope, $a, TMP_12;
          def.element = def.namespace = nil;
          self.$include((($a = $scope.Enumerable) == null ? $opal.cm('Enumerable') : $a));

          self.$attr_reader("namespace");

          def.$initialize = function(element, options) {
            var self = this;
            self.element = element;
            return self.namespace = options['$[]']("namespace");
          };

          def.$each = TMP_12 = function() {
            var TMP_13, $a, $b, self = this, $iter = TMP_12._p, block = $iter || nil;
            TMP_12._p = null;
            if (block === nil) {
              return self.$enum_for("each")};
            ($a = ($b = self.element.$attribute_nodes()).$each, $a._p = (TMP_13 = function(attr) {var self = TMP_13._s || this, $a;if (attr == null) attr = nil;
              return $a = $opal.$yieldX($yield, [attr.$name(), attr.$value()]), $a === $breaker ? $a : $a}, TMP_13._s = self, TMP_13), $a).call($b);
            return self;
          };

          def['$[]'] = function(name) {
            var self = this;
            return self.element.$get_attribute(name, $hash2(["namespace"], {"namespace": self.namespace}));
          };

          def['$[]='] = function(name, value) {
            var self = this;
            return self.element.$set_attribute(name, value, $hash2(["namespace"], {"namespace": self.namespace}));
          };

          return (def['$merge!'] = function(hash) {
            var TMP_14, $a, $b, self = this;
            ($a = ($b = hash).$each, $a._p = (TMP_14 = function(name, value) {var self = TMP_14._s || this;if (name == null) name = nil;if (value == null) value = nil;
              return self['$[]='](name, value)}, TMP_14._s = self, TMP_14), $a).call($b);
            return self;
          }, nil);
        })(self, null);
      })(self, (($a = $scope.Node) == null ? $opal.cm('Node') : $a))
      
    })(self)
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$include', '$to_s', '$alias_native', '$new']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Location(){};
      var self = Location = $klass($base, $super, 'Location', Location);

      var def = Location._proto, $scope = Location._scope, $a, $b;
      def['native'] = nil;
      self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

      def.$assign = function(url) {
        var self = this;
        return self['native'].assign(url.$to_s());
      };

      def.$replace = function(url) {
        var self = this;
        return self['native'].replace(url.$to_s());
      };

      def.$reload = function(force) {
        var self = this;
        if (force == null) {
          force = false
        }
        return self['native'].reload(force);
      };

      def.$to_s = function() {
        var self = this;
        return self['native'].toString();
      };

      self.$alias_native("fragment", "hash");

      self.$alias_native("fragment=", "hash=");

      self.$alias_native("host");

      self.$alias_native("host=");

      self.$alias_native("uri", "href");

      self.$alias_native("uri=", "href=");

      self.$alias_native("path", "pathname");

      self.$alias_native("path=", "pathname=");

      self.$alias_native("port");

      self.$alias_native("port=");

      self.$alias_native("scheme", "protocol");

      self.$alias_native("scheme=", "protocol=");

      self.$alias_native("query", "search");

      return self.$alias_native("query=", "search=");
    })(self, null);

    (function($base, $super) {
      function Window(){};
      var self = Window = $klass($base, $super, 'Window', Window);

      var def = Window._proto, $scope = Window._scope;
      def['native'] = nil;
      return (def.$location = function() {
        var $a, self = this;
        if (($a = self['native'].location) !== false && $a !== nil) {
          return (($a = $scope.Location) == null ? $opal.cm('Location') : $a).$new(self['native'].location)
          } else {
          return nil
        };
      }, nil)
    })(self, null);
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $hash2 = $opal.hash2;
  $opal.add_stubs(['$[]', '$DOM', '$new', '$first', '$xpath', '$css', '$inspect', '$children', '$convert', '$object_id']);
  ;
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope, $a;
      (function($base, $super) {
        function Document(){};
        var self = Document = $klass($base, $super, 'Document', Document);

        var def = Document._proto, $scope = Document._scope;
        def['native'] = nil;
        def.$create_element = function(name, options) {
          var $a, self = this, ns = nil;
          if (options == null) {
            options = $hash2([], {})
          }
          if (($a = ns = options['$[]']("namespace")) !== false && $a !== nil) {
            return self.$DOM(self['native'].createElementNS(ns, name))
            } else {
            return self.$DOM(self['native'].createElement(name))
          };
        };

        def.$window = function() {
          var $a, self = this;
          return (($a = $scope.Window) == null ? $opal.cm('Window') : $a).$new(self['native'].defaultView);
        };

        def.$create_text = function(content) {
          var self = this;
          return self.$DOM(self['native'].createTextNode(content));
        };

        def['$[]'] = function(what) {
          var $a, self = this;
          
      var result = self['native'].getElementById(what);

      if (result) {
        return self.$DOM(result);
      }
    ;
          return ((($a = self.$xpath(what).$first()) !== false && $a !== nil) ? $a : self.$css(what).$first());
        };

        $opal.defn(self, '$at', def['$[]']);

        def.$cookies = function() {
          var $a, self = this;
          if (($a = (typeof(self['native'].cookie) !== "undefined")) !== false && $a !== nil) {
            return (($a = $scope.Cookies) == null ? $opal.cm('Cookies') : $a).$new(self['native'])
            } else {
            return nil
          };
        };

        def.$document = function() {
          var self = this;
          return self;
        };

        def.$inspect = function() {
          var self = this;
          return "#<DOM::Document: " + (self.$children().$inspect()) + ">";
        };

        def.$location = function() {
          var $a, self = this;
          if (($a = self['native'].location) !== false && $a !== nil) {
            return (($a = $scope.Location) == null ? $opal.cm('Location') : $a).$new(self['native'].location)
            } else {
            return nil
          };
        };

        def.$title = function() {
          var self = this;
          return self['native'].title;
        };

        def['$title='] = function(value) {
          var self = this;
          return self['native'].title = value;
        };

        def.$root = function() {
          var self = this;
          return self.$DOM(self['native'].documentElement);
        };

        def.$head = function() {
          var self = this;
          return self.$xpath("//head").$first();
        };

        def.$body = function() {
          var self = this;
          return self.$DOM(document.body);
        };

        def.$style_sheets = function() {
          var TMP_1, $a, $b, $c, $d, self = this;
          return ($a = ($b = (($c = ((($d = $scope.Native) == null ? $opal.cm('Native') : $d))._scope).Array == null ? $c.cm('Array') : $c.Array)).$new, $a._p = (TMP_1 = function(e) {var self = TMP_1._s || this, $a, $b;if (e == null) e = nil;
            return (($a = ((($b = $scope.CSS) == null ? $opal.cm('CSS') : $b))._scope).StyleSheet == null ? $a.cm('StyleSheet') : $a.StyleSheet).$new(e)}, TMP_1._s = self, TMP_1), $a).call($b, self['native'].styleSheets);
        };

        def['$root='] = function(element) {
          var $a, self = this;
          return self['native'].documentElement = (($a = $scope.Native) == null ? $opal.cm('Native') : $a).$convert(element);
        };

        return (def.$inspect = function() {
          var self = this;
          return "#<DOM::Document:" + (self.$object_id()) + ">";
        }, nil);
      })(self, (($a = $scope.Element) == null ? $opal.cm('Element') : $a))
      
    })(self)
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs([]);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope, $a;
      (function($base, $super) {
        function DocumentFragment(){};
        var self = DocumentFragment = $klass($base, $super, 'DocumentFragment', DocumentFragment);

        var def = DocumentFragment._proto, $scope = DocumentFragment._scope;
        return nil
      })(self, (($a = $scope.Element) == null ? $opal.cm('Element') : $a))
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $range = $opal.range, $hash2 = $opal.hash2;
  $opal.add_stubs(['$==', '$capitalize', '$name', '$const_defined?', '$new', '$const_get', '$style', '$to_proc', '$on', '$<<', '$to_s', '$create_text!', '$end_with?', '$[]=', '$[]', '$add_class', '$extend!', '$remove_class', '$join', '$each', '$define_method', '$raise', '$arity', '$instance_exec', '$call', '$first', '$is_a?', '$shift', '$create_element!', '$===', '$inner_html=', '$private', '$tap', '$merge!', '$attributes', '$create_element', '$create_text']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope, $a;
      (function($base, $super) {
        function Builder(){};
        var self = Builder = $klass($base, $super, 'Builder', Builder);

        var def = Builder._proto, $scope = Builder._scope, $a, TMP_8, TMP_9, TMP_10, TMP_11;
        def.roots = def.current = def.document = def.namespace = nil;
        (function($base, $super) {
          function Element(){};
          var self = Element = $klass($base, $super, 'Element', Element);

          var def = Element._proto, $scope = Element._scope, TMP_1, TMP_2, TMP_3, TMP_4, TMP_5;
          def.element = def.builder = def.last = nil;
          $opal.defs(self, '$new', TMP_1 = function(builder, element) {var $zuper = $slice.call(arguments, 0);
            var $a, $b, self = this, $iter = TMP_1._p, $yield = $iter || nil, name = nil;
            TMP_1._p = null;
            if (($a = self['$==']((($b = $scope.Element) == null ? $opal.cm('Element') : $b))) === false || $a === nil) {
              return $opal.find_super_dispatcher(self, 'new', TMP_1, $iter, Element).apply(self, $zuper)};
            name = element.$name().$capitalize();
            if (($a = self['$const_defined?'](name)) !== false && $a !== nil) {
              return self.$const_get(name).$new(builder, element)
              } else {
              return $opal.find_super_dispatcher(self, 'new', TMP_1, $iter, Element).apply(self, $zuper)
            };
          });

          def.$initialize = function(builder, element) {
            var self = this;
            self.builder = builder;
            return self.element = element;
          };

          def.$style = TMP_2 = function(args) {
            var $a, $b, self = this, $iter = TMP_2._p, block = $iter || nil;
            args = $slice.call(arguments, 0);
            TMP_2._p = null;
            ($a = ($b = self.element).$style, $a._p = block.$to_proc(), $a).apply($b, [].concat(args));
            return self;
          };

          def.$on = TMP_3 = function(args) {
            var $a, $b, self = this, $iter = TMP_3._p, block = $iter || nil;
            args = $slice.call(arguments, 0);
            TMP_3._p = null;
            ($a = ($b = self.element).$on, $a._p = block.$to_proc(), $a).apply($b, [].concat(args));
            return self;
          };

          def.$text = function(text) {
            var self = this;
            self.element['$<<'](text.$to_s());
            return self;
          };

          def.$method_missing = TMP_4 = function(name, content) {
            var $a, $b, self = this, $iter = TMP_4._p, block = $iter || nil;
            if (content == null) {
              content = nil
            }
            TMP_4._p = null;
            if (content !== false && content !== nil) {
              self.element['$<<'](self.builder['$create_text!'](content))};
            if (($a = name['$end_with?']("!")) !== false && $a !== nil) {
              self.element['$[]=']("id", name['$[]']($range(0, -2, false)))
              } else {
              self.last = name;
              self.element.$add_class(name);
            };
            if (block !== false && block !== nil) {
              ($a = ($b = self.builder)['$extend!'], $a._p = block.$to_proc(), $a).call($b, self.element)};
            return self;
          };

          def['$[]'] = function(names) {
            var $a, self = this;
            names = $slice.call(arguments, 0);
            if (($a = self.last) === false || $a === nil) {
              return nil};
            self.element.$remove_class(self.last);
            self.element.$add_class([self.last].concat(names).$join("-"));
            return self;
          };

          def.$do = TMP_5 = function() {
            var $a, $b, self = this, $iter = TMP_5._p, block = $iter || nil;
            TMP_5._p = null;
            ($a = ($b = self.builder)['$extend!'], $a._p = block.$to_proc(), $a).call($b, self.element);
            return self;
          };

          (function($base, $super) {
            function Input(){};
            var self = Input = $klass($base, $super, 'Input', Input);

            var def = Input._proto, $scope = Input._scope, TMP_6, $a, $b;
            return ($a = ($b = $hash2(["type", "name", "value", "size", "place_holder", "read_only", "required"], {"type": "type", "name": "name", "value": "value", "size": "size", "place_holder": "placeholder", "read_only": "readonly", "required": "required"})).$each, $a._p = (TMP_6 = function(name, attribute) {var self = TMP_6._s || this, TMP_7, $a, $b;if (name == null) name = nil;if (attribute == null) attribute = nil;
              return ($a = ($b = self).$define_method, $a._p = (TMP_7 = function(value) {var self = TMP_7._s || this;
                if (self.element == null) self.element = nil;
if (value == null) value = nil;
                self.element['$[]='](attribute, value);
                return self;}, TMP_7._s = self, TMP_7), $a).call($b, name)}, TMP_6._s = self, TMP_6), $a).call($b)
          })(self, self);

          return (function($base, $super) {
            function A(){};
            var self = A = $klass($base, $super, 'A', A);

            var def = A._proto, $scope = A._scope;
            def.element = nil;
            def.$href = function(value) {
              var self = this;
              self.element['$[]=']("href", value);
              return self;
            };

            return (def.$target = function(value) {
              var self = this;
              self.element['$[]=']("target", value);
              return self;
            }, nil);
          })(self, self);
        })(self, (($a = $scope.BasicObject) == null ? $opal.cm('BasicObject') : $a));

        def.$initialize = TMP_8 = function(document, element) {
          var $a, $b, $c, self = this, $iter = TMP_8._p, block = $iter || nil;
          if (element == null) {
            element = nil
          }
          TMP_8._p = null;
          if (($a = block) === false || $a === nil) {
            (($a = $scope.Kernel) == null ? $opal.cm('Kernel') : $a).$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "no block given")};
          self.document = document;
          self.current = element;
          self.roots = (($a = ((($b = ((($c = $opal.Object._scope.Browser) == null ? $opal.cm('Browser') : $c))._scope).DOM == null ? $b.cm('DOM') : $b.DOM))._scope).NodeSet == null ? $a.cm('NodeSet') : $a.NodeSet).$new();
          if (block.$arity()['$=='](0)) {
            return ($a = ($b = self).$instance_exec, $a._p = block.$to_proc(), $a).call($b)
            } else {
            return block.$call(self)
          };
        };

        def['$root!'] = function() {
          var self = this;
          return self.roots.$first();
        };

        def['$roots!'] = function() {
          var self = this;
          return self.roots;
        };

        def['$element!'] = function() {
          var self = this;
          return self.current;
        };

        $opal.defn(self, '$el!', def['$element!']);

        def['$namespace!'] = TMP_9 = function(name) {
          var $a, $b, self = this, $iter = TMP_9._p, block = $iter || nil;
          TMP_9._p = null;
          self.namespace = name;
          return ($a = ($b = self)['$extend!'], $a._p = block.$to_proc(), $a).call($b);
        };

        def['$extend!'] = TMP_10 = function(element) {
          var $a, self = this, $iter = TMP_10._p, block = $iter || nil, old = nil;
          if (element == null) {
            element = nil
          }
          TMP_10._p = null;
          $a = [self.current, element], old = $a[0], self.current = $a[1];
          block.$call(self);
          self.current = old;
          return self;
        };

        def['$<<'] = function(what) {
          var $a, $b, self = this;
          if (($a = what['$is_a?']((($b = $scope.String) == null ? $opal.cm('String') : $b))) !== false && $a !== nil) {
            return self.current['$<<'](self['$create_text!'](what))
            } else {
            return self.current['$<<'](what)
          };
        };

        def.$method_missing = TMP_11 = function(name, args) {
          var $a, $b, self = this, $iter = TMP_11._p, block = $iter || nil, content = nil, attributes = nil, parent = nil, element = nil, result = nil;
          args = $slice.call(arguments, 1);
          TMP_11._p = null;
          if (($a = args.$first()['$is_a?']((($b = $scope.String) == null ? $opal.cm('String') : $b))) !== false && $a !== nil) {
            content = args.$shift()};
          attributes = ((($a = args.$shift()) !== false && $a !== nil) ? $a : $hash2([], {}));
          if (block !== false && block !== nil) {
            parent = self.current;
            element = self['$create_element!'](name, attributes);
            if (content !== false && content !== nil) {
              element['$<<'](self['$create_text!'](content))};
            self.current = element;
            result = block.$call(self);
            self.current = parent;
            if (($a = (($b = $scope.String) == null ? $opal.cm('String') : $b)['$==='](result)) !== false && $a !== nil) {
              element['$inner_html='](result)};
            (((($a = parent) !== false && $a !== nil) ? $a : self.roots))['$<<'](element);
            } else {
            element = self['$create_element!'](name, attributes);
            if (content !== false && content !== nil) {
              element['$<<'](self['$create_text!'](content))};
            (((($a = self.current) !== false && $a !== nil) ? $a : self.roots))['$<<'](element);
          };
          return (($a = $scope.Element) == null ? $opal.cm('Element') : $a).$new(self, element);
        };

        self.$private();

        def['$create_element!'] = function(name, attributes) {
          var TMP_12, $a, $b, self = this;
          return ($a = ($b = self.document.$create_element(name, $hash2(["namespace"], {"namespace": self.namespace}))).$tap, $a._p = (TMP_12 = function(el) {var self = TMP_12._s || this;if (el == null) el = nil;
            return el.$attributes()['$merge!'](attributes)}, TMP_12._s = self, TMP_12), $a).call($b);
        };

        return (def['$create_text!'] = function(content) {
          var self = this;
          return self.document.$create_text(content);
        }, nil);
      })(self, (($a = $scope.BasicObject) == null ? $opal.cm('BasicObject') : $a))
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars, $hash2 = $opal.hash2;
  $opal.add_stubs(['$include', '$===', '$==', '$type', '$new', '$DOM', '$alias_native', '$call', '$map', '$convert', '$private', '$Native', '$[]', '$[]=', '$to_n']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function MutationObserver(){};
        var self = MutationObserver = $klass($base, $super, 'MutationObserver', MutationObserver);

        var def = MutationObserver._proto, $scope = MutationObserver._scope, $a, $b, TMP_1;
        def['native'] = nil;
        self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

        (function($base, $super) {
          function Record(){};
          var self = Record = $klass($base, $super, 'Record', Record);

          var def = Record._proto, $scope = Record._scope, $a, $b;
          def['native'] = nil;
          self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

          def.$type = function() {
            var self = this, $case = nil;
            return (function() {$case = self['native'].type;if ("attributes"['$===']($case)) {return "attributes"}else if ("childList"['$===']($case)) {return "tree"}else if ("characterData"['$===']($case)) {return "cdata"}else { return nil }})();
          };

          def['$attributes?'] = function() {
            var self = this;
            return self.$type()['$==']("attributes");
          };

          def['$tree?'] = function() {
            var self = this;
            return self.$type()['$==']("tree");
          };

          def['$cdata?'] = function() {
            var self = this;
            return self.$type()['$==']("cdata");
          };

          def.$added = function() {
            var $a, $b, self = this, array = nil;
            array = (function() {if (($a = self['native'].addedNodes != null) !== false && $a !== nil) {
              return (($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Array == null ? $a.cm('Array') : $a.Array).$new(self['native'].addedNodes)
              } else {
              return []
            }; return nil; })();
            return (($a = $scope.NodeSet) == null ? $opal.cm('NodeSet') : $a).$new($gvars["document"], array);
          };

          def.$removed = function() {
            var $a, $b, self = this, array = nil;
            array = (function() {if (($a = self['native'].removedNodes != null) !== false && $a !== nil) {
              return (($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Array == null ? $a.cm('Array') : $a.Array).$new(self['native'].removedNodes)
              } else {
              return []
            }; return nil; })();
            return (($a = $scope.NodeSet) == null ? $opal.cm('NodeSet') : $a).$new($gvars["document"], array);
          };

          def.$target = function() {
            var self = this;
            return self.$DOM(self['native'].target);
          };

          self.$alias_native("old", "oldValue");

          return self.$alias_native("attribute", "attributeName");
        })(self, null);

        def.$initialize = TMP_1 = function() {
          var TMP_2, $a, $b, self = this, $iter = TMP_1._p, block = $iter || nil;
          TMP_1._p = null;
          
      var func = function(records) {
        return block.$call(($a = ($b = (records)).$map, $a._p = (TMP_2 = function(r) {var self = TMP_2._s || this, $a, $b, $c, $d;if (r == null) r = nil;
            return (($a = ((($b = ((($c = ((($d = $scope.Browser) == null ? $opal.cm('Browser') : $d))._scope).DOM == null ? $c.cm('DOM') : $c.DOM))._scope).MutationObserver == null ? $b.cm('MutationObserver') : $b.MutationObserver))._scope).Record == null ? $a.cm('Record') : $a.Record).$new(r)}, TMP_2._s = self, TMP_2), $a).call($b));
      }
    ;
          return $opal.find_super_dispatcher(self, 'initialize', TMP_1, null).apply(self, [new window.MutationObserver(func)]);
        };

        def.$observe = function(target, options) {
          var $a, self = this;
          if (options == null) {
            options = nil
          }
          if (($a = options) === false || $a === nil) {
            options = $hash2(["children", "tree", "attributes", "cdata"], {"children": true, "tree": true, "attributes": "old", "cdata": "old"})};
          self['native'].observe((($a = $scope.Native) == null ? $opal.cm('Native') : $a).$convert(target), self.$convert(options));
          return self;
        };

        def.$take = function() {
          var TMP_3, $a, $b, self = this;
          return ($a = ($b = (self['native'].takeRecords())).$map, $a._p = (TMP_3 = function(r) {var self = TMP_3._s || this, $a;if (r == null) r = nil;
            return (($a = $scope.Record) == null ? $opal.cm('Record') : $a).$new(r)}, TMP_3._s = self, TMP_3), $a).call($b);
        };

        def.$disconnect = function() {
          var self = this;
          return self['native'].disconnect();
        };

        self.$private();

        return (def.$convert = function(hash) {
          var $a, self = this, options = nil, attrs = nil, filter = nil, cdata = nil;
          options = self.$Native({});
          if (($a = hash['$[]']("children")) !== false && $a !== nil) {
            options['$[]=']("childList", true)};
          if (($a = hash['$[]']("tree")) !== false && $a !== nil) {
            options['$[]=']("subtree", true)};
          if (($a = attrs = hash['$[]']("attributes")) !== false && $a !== nil) {
            options['$[]=']("attributes", true);
            if (attrs['$==']("old")) {
              options['$[]=']("attributeOldValue", true)};};
          if (($a = filter = hash['$[]']("filter")) !== false && $a !== nil) {
            options['$[]=']("attributeFilter", filter)};
          if (($a = cdata = hash['$[]']("cdata")) !== false && $a !== nil) {
            options['$[]=']("characterData", true);
            if (cdata['$==']("old")) {
              options['$[]=']("characterDataOldValue", true)};};
          return options.$to_n();
        }, nil);
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$has?', '$raise']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope, $a;
      (function($base, $super) {
        function Document(){};
        var self = Document = $klass($base, $super, 'Document', Document);

        var def = Document._proto, $scope = Document._scope, $a, $b;
        def['native'] = nil;
        if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$has?'](document, "defaultView")) !== false && $a !== nil) {
          return nil
        } else if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$has?'](document, "parentWindow")) !== false && $a !== nil) {
          return (def.$window = function() {
            var self = this;
            return self['native'].parentWindow;
          }, nil)
          } else {
          return (def.$window = function() {
            var $a, self = this;
            return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a), "window from document is unsupported");
          }, nil)
        }
      })(self, (($a = $scope.Element) == null ? $opal.cm('Element') : $a))
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $hash2 = $opal.hash2;
  $opal.add_stubs(['$attr_reader', '$==', '$type']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope, $a;
      if (($a = (typeof(window.MutationObserver) !== "undefined")) === false || $a === nil) {
        (function($base, $super) {
          function MutationObserver(){};
          var self = MutationObserver = $klass($base, $super, 'MutationObserver', MutationObserver);

          var def = MutationObserver._proto, $scope = MutationObserver._scope, TMP_1;
          def.records = nil;
          (function($base, $super) {
            function Record(){};
            var self = Record = $klass($base, $super, 'Record', Record);

            var def = Record._proto, $scope = Record._scope;
            self.$attr_reader("type", "target", "old", "attribute");

            def.$initialize = function() {
              var self = this;
              return nil;
            };

            def['$attributes?'] = function() {
              var self = this;
              return self.$type()['$==']("attributes");
            };

            def['$tree?'] = function() {
              var self = this;
              return self.$type()['$==']("tree");
            };

            return (def['$cdata?'] = function() {
              var self = this;
              return self.$type()['$==']("cdata");
            }, nil);
          })(self, null);

          def.$initialize = TMP_1 = function() {
            var self = this, $iter = TMP_1._p, block = $iter || nil;
            TMP_1._p = null;
            self.block = block;
            return self.observed = [];
          };

          def.$observe = function(target, options) {
            var $a, self = this;
            if (options == null) {
              options = nil
            }
            if (($a = options) === false || $a === nil) {
              options = $hash2(["children", "tree", "attributes", "cdata"], {"children": true, "tree": true, "attributes": "old", "cdata": "old"})};
            return self;
          };

          def.$take = function() {
            var $a, self = this, result = nil;
            $a = [self.records, []], result = $a[0], self.records = $a[1];
            return result;
          };

          return (def.$disconnect = function() {
            var self = this;
            return nil;
          }, nil);
        })(self, null)}
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$respond_to?', '$sizzle?', '$raise']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Element(){};
        var self = Element = $klass($base, $super, 'Element', Element);

        var def = Element._proto, $scope = Element._scope, $a, $b;
        def['native'] = nil;
        if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$respond_to?']("Element", "matches")) !== false && $a !== nil) {
          return nil
        } else if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$respond_to?']("Element", "oMatchesSelector")) !== false && $a !== nil) {
          return (def['$matches?'] = function(selector) {
            var self = this;
            return self['native'].oMatchesSelector(selector);
          }, nil)
        } else if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$respond_to?']("Element", "msMatchesSelector")) !== false && $a !== nil) {
          return (def['$matches?'] = function(selector) {
            var self = this;
            return self['native'].msMatchesSelector(selector);
          }, nil)
        } else if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$respond_to?']("Element", "mozMatchesSelector")) !== false && $a !== nil) {
          return (def['$matches?'] = function(selector) {
            var self = this;
            return self['native'].mozMatchesSelector(selector);
          }, nil)
        } else if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$respond_to?']("Element", "webkitMatchesSelector")) !== false && $a !== nil) {
          return (def['$matches?'] = function(selector) {
            var self = this;
            return self['native'].webkitMatchesSelector(selector);
          }, nil)
        } else if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$sizzle?']()) !== false && $a !== nil) {
          return (def['$matches?'] = function(selector) {
            var self = this;
            return Sizzle.matchesSelector(self['native'], selector);
          }, nil)
          } else {
          return (def['$matches?'] = function() {
            var $a, self = this;
            return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a), "matches by selector unsupported");
          }, nil)
        }
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$respond_to?', '$sizzle?', '$new', '$document', '$raise']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Element(){};
        var self = Element = $klass($base, $super, 'Element', Element);

        var def = Element._proto, $scope = Element._scope, $a, $b;
        def['native'] = nil;
        if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$respond_to?']("Element", "querySelectorAll")) !== false && $a !== nil) {
          return nil
        } else if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$sizzle?']()) !== false && $a !== nil) {
          return (def.$css = function(path) {
            var $a, self = this;
            return (($a = $scope.NodeSet) == null ? $opal.cm('NodeSet') : $a).$new(self.$document(), Sizzle(path, self['native']));
          }, nil)
          } else {
          return (def.$css = function() {
            var $a, self = this;
            return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a), "fetching by selector unsupported");
          }, nil)
        }
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$has?', '$document', '$to_n', '$root', '$window', '$new']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Element(){};
        var self = Element = $klass($base, $super, 'Element', Element);

        var def = Element._proto, $scope = Element._scope;
        return (function($base, $super) {
          function Offset(){};
          var self = Offset = $klass($base, $super, 'Offset', Offset);

          var def = Offset._proto, $scope = Offset._scope, $a, $b;
          if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$has?'](document.body, "getBoundingClientRect")) !== false && $a !== nil) {
            return nil
            } else {
            return (def.$position = function() {
              var $a, $b, self = this, doc = nil, root = nil, win = nil;
              doc = self.$document();
              root = doc.$root().$to_n();
              win = doc.$window().$to_n();
              
        var y = (win.pageYOffset || root.scrollTop) - (root.clientTop || 0),
            x = (win.pageXOffset || root.scrollLeft) - (root.clientLeft || 0);
      ;
              return (($a = ((($b = $scope.Browser) == null ? $opal.cm('Browser') : $b))._scope).Position == null ? $a.cm('Position') : $a.Position).$new(x, y);
            }, nil)
          }
        })(self, null)
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$has?', '$new', '$raise']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Element(){};
        var self = Element = $klass($base, $super, 'Element', Element);

        var def = Element._proto, $scope = Element._scope, $a, $b;
        def['native'] = nil;
        if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$has?']("getComputedStyle")) !== false && $a !== nil) {
          return nil
        } else if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$has?'](document.documentElement, "currentStyle")) !== false && $a !== nil) {
          return (def['$style!'] = function() {
            var $a, $b, self = this;
            return (($a = ((($b = $scope.CSS) == null ? $opal.cm('CSS') : $b))._scope).Declaration == null ? $a.cm('Declaration') : $a.Declaration).$new(self['native'].currentStyle);
          }, nil)
          } else {
          return (def['$style!'] = function() {
            var $a, self = this;
            return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a), "computed style unsupported");
          }, nil)
        }
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice;
  $opal.add_stubs([]);
  ;
  ;
  ;
  ;
  ;
  return true;
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $gvars = $opal.gvars, $klass = $opal.klass;
  $opal.add_stubs(['$DOM', '$shift', '$roots!', '$new', '$to_proc', '$==', '$length', '$first', '$native?', '$===', '$try_convert', '$raise', '$include', '$target', '$document']);
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  (function($base) {
    var self = $module($base, 'Kernel');

    var def = self._proto, $scope = self._scope, TMP_1;
    def.$XML = function(what) {
      var self = this;
      
      var doc;

      if (window.DOMParser) {
        doc = new DOMParser().parseFromString(what, 'text/xml');
      }
      else {
        doc       = new ActiveXObject('Microsoft.XMLDOM');
        doc.async = 'false';
        doc.loadXML(what);
      }
    
      return self.$DOM(doc);
    };

    def.$DOM = TMP_1 = function(args) {
      var $a, $b, $c, $d, $e, self = this, $iter = TMP_1._p, block = $iter || nil, document = nil, element = nil, roots = nil, what = nil;
      args = $slice.call(arguments, 0);
      TMP_1._p = null;
      if (block !== false && block !== nil) {
        document = ((($a = args.$shift()) !== false && $a !== nil) ? $a : $gvars["document"]);
        element = args.$shift();
        roots = ($a = ($b = (($c = ((($d = ((($e = $scope.Browser) == null ? $opal.cm('Browser') : $e))._scope).DOM == null ? $d.cm('DOM') : $d.DOM))._scope).Builder == null ? $c.cm('Builder') : $c.Builder)).$new, $a._p = block.$to_proc(), $a).call($b, document, element)['$roots!']();
        if (roots.$length()['$=='](1)) {
          return roots.$first()
          } else {
          return roots
        };
        } else {
        what = args.$shift();
        document = ((($a = args.$shift()) !== false && $a !== nil) ? $a : $gvars["document"]);
        if (($a = self['$native?'](what)) !== false && $a !== nil) {
          return (($a = ((($c = ((($d = $scope.Browser) == null ? $opal.cm('Browser') : $d))._scope).DOM == null ? $c.cm('DOM') : $c.DOM))._scope).Node == null ? $a.cm('Node') : $a.Node).$new(what)
        } else if (($a = (($c = ((($d = ((($e = $scope.Browser) == null ? $opal.cm('Browser') : $e))._scope).DOM == null ? $d.cm('DOM') : $d.DOM))._scope).Node == null ? $c.cm('Node') : $c.Node)['$==='](what)) !== false && $a !== nil) {
          return what
        } else if (($a = (($c = $scope.String) == null ? $opal.cm('String') : $c)['$==='](what)) !== false && $a !== nil) {
          
          var doc = (($a = $scope.Native) == null ? $opal.cm('Native') : $a).$try_convert(document).createElement('div');
          doc.innerHTML = what;

          return self.$DOM(doc.childNodes.length == 1 ? doc.childNodes[0] : doc);
        ;
          } else {
          return self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "argument not DOM convertible")
        };
      };
    };
        ;$opal.donate(self, ["$XML", "$DOM"]);
  })(self);
  (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Window(){};
      var self = Window = $klass($base, $super, 'Window', Window);

      var def = Window._proto, $scope = Window._scope, $a, $b, $c, TMP_2;
      def['native'] = nil;
      self.$include((($a = ((($b = ((($c = $scope.DOM) == null ? $opal.cm('DOM') : $c))._scope).Event == null ? $b.cm('Event') : $b.Event))._scope).Target == null ? $a.cm('Target') : $a.Target));

      ($a = ($b = self).$target, $a._p = (TMP_2 = function(value) {var self = TMP_2._s || this, $a;if (value == null) value = nil;
        if (($a = value == window) !== false && $a !== nil) {
          return $gvars["window"]
          } else {
          return nil
        }}, TMP_2._s = self, TMP_2), $a).call($b);

      return (def.$document = function() {
        var self = this;
        return self.$DOM(self['native'].document);
      }, nil);
    })(self, null)
    
  })(self);
  return $gvars["document"] = $gvars["window"].$document();
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$attr_reader', '$==', '$convert', '$type', '$to_f', '$hash', '$each', '$define_method', '$new', '$===', '$+', '$compatible?', '$raise', '$-', '$*', '$/', '$to_i', '$private', '$include?', '$old_percent', '$match', '$[]', '$__send__', '$downcase']);
  (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'CSS');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Unit(){};
        var self = Unit = $klass($base, $super, 'Unit', Unit);

        var def = Unit._proto, $scope = Unit._scope, TMP_1, $a, $b;
        def.number = def.type = nil;
        $opal.cdecl($scope, 'COMPATIBLE', ["in", "pt", "mm", "cm", "px", "pc"]);

        self.$attr_reader("type");

        def.$initialize = function(number, type) {
          var self = this;
          self.number = number;
          return self.type = type;
        };

        def.$coerce = function(other) {
          var self = this;
          return [self, other];
        };

        def['$=='] = function(other) {
          var self = this;
          return self.number['$=='](self.$convert(other, self.type));
        };

        def['$==='] = function(other) {
          var $a, self = this;
          return (($a = self.type['$=='](other.$type())) ? self.number['$=='](other.$to_f()) : $a);
        };

        $opal.defn(self, '$eql?', def['$==']);

        def.$hash = function() {
          var self = this;
          return [self.number, self.type].$hash();
        };

        ($a = ($b = ["em", "ex", "ch", "rem", "vh", "vw", "vmin", "vmax", "px", "mm", "cm", "in", "pt", "pc"]).$each, $a._p = (TMP_1 = function(name) {var self = TMP_1._s || this, TMP_2, $a, $b;if (name == null) name = nil;
          return ($a = ($b = self).$define_method, $a._p = (TMP_2 = function() {var self = TMP_2._s || this, $a;
            return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self.$convert(self, name), name)}, TMP_2._s = self, TMP_2), $a).call($b, name)}, TMP_1._s = self, TMP_1), $a).call($b);

        def['$+'] = function(other) {
          var $a, $b, self = this;
          if (($a = (($b = $scope.Unit) == null ? $opal.cm('Unit') : $b)['$==='](other)) === false || $a === nil) {
            return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self.number['$+'](other), self.type)};
          if (self.type['$=='](other.$type())) {
            return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self.number['$+'](other.$to_f()), self.type)
          } else if (($a = ($b = self['$compatible?'](self), $b !== false && $b !== nil ?self['$compatible?'](other) : $b)) !== false && $a !== nil) {
            return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self.number['$+'](self.$convert(other, self.type)), self.type)
            } else {
            return self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "" + (other.$type()) + " isn't compatible with " + (self.type))
          };
        };

        def['$-'] = function(other) {
          var $a, $b, self = this;
          if (($a = (($b = $scope.Unit) == null ? $opal.cm('Unit') : $b)['$==='](other)) === false || $a === nil) {
            return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self.number['$-'](other), self.type)};
          if (self.type['$=='](other.$type())) {
            return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self.number['$-'](other.$to_f()), self.type)
          } else if (($a = ($b = self['$compatible?'](self), $b !== false && $b !== nil ?self['$compatible?'](other) : $b)) !== false && $a !== nil) {
            return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self.number['$-'](self.$convert(other, self.type)), self.type)
            } else {
            return self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "" + (other.$type()) + " isn't compatible with " + (self.type))
          };
        };

        def['$*'] = function(other) {
          var $a, $b, self = this;
          if (($a = (($b = $scope.Unit) == null ? $opal.cm('Unit') : $b)['$==='](other)) === false || $a === nil) {
            return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self.number['$*'](other), self.type)};
          if (self.type['$=='](other.$type())) {
            return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self.number['$*'](other.$to_f()), self.type)
          } else if (($a = ($b = self['$compatible?'](self), $b !== false && $b !== nil ?self['$compatible?'](other) : $b)) !== false && $a !== nil) {
            return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self.number['$*'](self.$convert(other, self.type)), self.type)
            } else {
            return self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "" + (other.$type()) + " isn't compatible with " + (self.type))
          };
        };

        def['$/'] = function(other) {
          var $a, $b, self = this;
          if (($a = (($b = $scope.Unit) == null ? $opal.cm('Unit') : $b)['$==='](other)) === false || $a === nil) {
            return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self.number['$/'](other), self.type)};
          if (self.type['$=='](other.$type())) {
            return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self.number['$/'](other.$to_f()), self.type)
          } else if (($a = ($b = self['$compatible?'](self), $b !== false && $b !== nil ?self['$compatible?'](other) : $b)) !== false && $a !== nil) {
            return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self.number['$/'](self.$convert(other, self.type)), self.type)
            } else {
            return self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "" + (other.$type()) + " isn't compatible with " + (self.type))
          };
        };

        def['$-@'] = function() {
          var $a, self = this;
          return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self.number['$*'](-1), self.type);
        };

        def['$+@'] = function() {
          var $a, self = this;
          return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self.number, self.type);
        };

        def.$to_i = function() {
          var self = this;
          return self.number.$to_i();
        };

        def.$to_f = function() {
          var self = this;
          return self.number.$to_f();
        };

        def.$to_u = function() {
          var self = this;
          return self;
        };

        def.$to_s = function() {
          var self = this;
          return "" + (self.number) + (self.type);
        };

        $opal.defn(self, '$to_str', def.$to_s);

        $opal.defn(self, '$inspect', def.$to_s);

        self.$private();

        def['$compatible?'] = function(unit) {
          var $a, self = this;
          return (($a = $scope.COMPATIBLE) == null ? $opal.cm('COMPATIBLE') : $a)['$include?'](unit.$type());
        };

        return (def.$convert = function(unit, type) {
          var self = this, value = nil, px = nil, $case = nil;
          value = unit.$to_f();
          if (unit.$type()['$=='](type)) {
            return value};
          px = (function() {$case = unit.$type();if ("in"['$===']($case)) {return value['$*'](96)}else if ("pt"['$===']($case)) {return value['$*'](4.0)['$/'](3.0)}else if ("pc"['$===']($case)) {return value['$/'](12)['$*'](4.0)['$/'](3.0)}else if ("mm"['$===']($case)) {return value['$*'](3.77953)}else if ("cm"['$===']($case)) {return value['$*'](10)['$*'](3.77953)}else if ("px"['$===']($case)) {return value}else { return nil }})();
          return (function() {$case = type;if ("in"['$===']($case)) {return px['$/'](96.0)}else if ("pt"['$===']($case)) {return px['$/'](4.0)['$/'](3.0)}else if ("pc"['$===']($case)) {return px['$*'](12)['$/'](4.0)['$/'](3.0)}else if ("mm"['$===']($case)) {return px['$/'](3.77953)}else if ("cm"['$===']($case)) {return px['$/'](10)['$/'](3.77953)}else if ("px"['$===']($case)) {return px}else { return nil }})();
        }, nil);
      })(self, null)
      
    })(self)
    
  })(self);
  (function($base, $super) {
    function Numeric(){};
    var self = Numeric = $klass($base, $super, 'Numeric', Numeric);

    var def = Numeric._proto, $scope = Numeric._scope, $a, $b, $c, TMP_3;
    $opal.cdecl($scope, 'Unit', (($a = ((($b = ((($c = $scope.Browser) == null ? $opal.cm('Browser') : $c))._scope).CSS == null ? $b.cm('CSS') : $b.CSS))._scope).Unit == null ? $a.cm('Unit') : $a.Unit));

    ($a = ($b = ["em", "ex", "ch", "rem", "vh", "vw", "vmin", "vmax", "px", "mm", "cm", "in", "pt", "pc"]).$each, $a._p = (TMP_3 = function(name) {var self = TMP_3._s || this, TMP_4, $a, $b;if (name == null) name = nil;
      return ($a = ($b = self).$define_method, $a._p = (TMP_4 = function() {var self = TMP_4._s || this, $a;
        return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self, name)}, TMP_4._s = self, TMP_4), $a).call($b, name)}, TMP_3._s = self, TMP_3), $a).call($b);

    $opal.defn(self, '$old_percent', def['$%']);

    def['$%'] = function(other) {
      var $a, self = this;
      if (other == null) {
        other = nil
      }
      if (other !== false && other !== nil) {
        return self.$old_percent(other)
        } else {
        return (($a = $scope.Unit) == null ? $opal.cm('Unit') : $a).$new(self, "%")
      };
    };

    return (def.$to_u = function() {
      var self = this;
      return self;
    }, nil);
  })(self, null);
  (function($base, $super) {
    function String(){};
    var self = String = $klass($base, $super, 'String', String);

    var def = String._proto, $scope = String._scope;
    return (def.$to_u = function() {
      var $a, self = this, matches = nil, value = nil, unit = nil;
      if (($a = matches = self.$match(/^([\d+.]+)(.+)?$/)) !== false && $a !== nil) {
        value = matches['$[]'](1).$to_f();
        if (($a = unit = matches['$[]'](2)) !== false && $a !== nil) {
          return value.$__send__(unit.$downcase())
          } else {
          return value
        };
        } else {
        return 0
      };
    }, nil)
  })(self, null);
  return (function($base, $super) {
    function NilClass(){};
    var self = NilClass = $klass($base, $super, 'NilClass', NilClass);

    var def = NilClass._proto, $scope = NilClass._scope;
    return (def.$to_u = function() {
      var self = this;
      return 0;
    }, nil)
  })(self, null);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $range = $opal.range, $hash2 = $opal.hash2;
  $opal.add_stubs(['$new', '$==', '$arity', '$instance_exec', '$to_proc', '$call', '$empty?', '$enum_for', '$each', '$===', '$first', '$>', '$length', '$raise', '$style', '$name', '$value', '$join', '$to_i', '$*', '$end_with?', '$[]', '$respond_to?', '$__send__', '$private', '$<<', '$last', '$pop', '$other', '$shift', '$horizontal?']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'CSS');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Definition(){};
        var self = Definition = $klass($base, $super, 'Definition', Definition);

        var def = Definition._proto, $scope = Definition._scope, $a, TMP_1, TMP_2, TMP_10;
        def.style = def.important = nil;
        $opal.cdecl($scope, 'Style', (($a = $scope.Struct) == null ? $opal.cm('Struct') : $a).$new("name", "value", "important?"));

        def.$initialize = TMP_1 = function() {
          var $a, $b, self = this, $iter = TMP_1._p, block = $iter || nil;
          TMP_1._p = null;
          self.style = [];
          if (block !== false && block !== nil) {
            if (block.$arity()['$=='](0)) {
              return ($a = ($b = self).$instance_exec, $a._p = block.$to_proc(), $a).call($b)
              } else {
              return block.$call(self)
            }
            } else {
            return nil
          };
        };

        def['$empty?'] = function() {
          var self = this;
          return self.style['$empty?']();
        };

        def.$each = TMP_2 = function() {
          var $a, $b, self = this, $iter = TMP_2._p, block = $iter || nil;
          TMP_2._p = null;
          if (($a = block) === false || $a === nil) {
            return self.$enum_for("each")};
          ($a = ($b = self.style).$each, $a._p = block.$to_proc(), $a).call($b);
          return self;
        };

        def.$gradient = function(args) {
          var $a, $b, self = this;
          args = $slice.call(arguments, 0);
          return ($a = (($b = $scope.Gradient) == null ? $opal.cm('Gradient') : $b)).$new.apply($a, [].concat(args));
        };

        def.$background = function(args) {
          var $a, $b, TMP_3, $c, TMP_4, self = this;
          args = $slice.call(arguments, 0);
          if (($a = (($b = $scope.Gradient) == null ? $opal.cm('Gradient') : $b)['$==='](args.$first())) !== false && $a !== nil) {
            if (args.$length()['$>'](1)) {
              self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a), "multiple gradients not implemented yet")};
            return ($a = ($b = args.$first()).$each, $a._p = (TMP_3 = function(s) {var self = TMP_3._s || this, $a;if (s == null) s = nil;
              return self.$style(((($a = s.$name()) !== false && $a !== nil) ? $a : "background-image"), s.$value())}, TMP_3._s = self, TMP_3), $a).call($b);
          } else if (($a = (($c = $scope.Hash) == null ? $opal.cm('Hash') : $c)['$==='](args.$first())) !== false && $a !== nil) {
            return ($a = ($c = args.$first()).$each, $a._p = (TMP_4 = function(sub, value) {var self = TMP_4._s || this;if (sub == null) sub = nil;if (value == null) value = nil;
              return self.$style("background-" + (sub), value)}, TMP_4._s = self, TMP_4), $a).call($c)
            } else {
            return self.$style("background", args)
          };
        };

        def.$border = function(args) {
          var $a, $b, TMP_5, self = this, options = nil;
          args = $slice.call(arguments, 0);
          if (($a = (($b = $scope.Hash) == null ? $opal.cm('Hash') : $b)['$==='](args.$first())) !== false && $a !== nil) {
            if (args.$length()['$=='](1)) {
              options = args.$first()};
            return ($a = ($b = options).$each, $a._p = (TMP_5 = function(name, value) {var self = TMP_5._s || this, $a, $b, TMP_6, $c, TMP_8, $case = nil;if (name == null) name = nil;if (value == null) value = nil;
              return (function() {$case = name;if ("radius"['$===']($case)) {if (($a = (($b = $scope.Hash) == null ? $opal.cm('Hash') : $b)['$==='](value)) !== false && $a !== nil) {
                return ($a = ($b = value).$each, $a._p = (TMP_6 = function(horizontal, value) {var self = TMP_6._s || this, TMP_7, $a, $b;if (horizontal == null) horizontal = nil;if (value == null) value = nil;
                  return ($a = ($b = value).$each, $a._p = (TMP_7 = function(vertical, value) {var self = TMP_7._s || this;if (vertical == null) vertical = nil;if (value == null) value = nil;
                    self.$style("-moz-border-radius-" + (horizontal) + (vertical), value);
                    self.$style("-webkit-border-" + (horizontal) + "-" + (vertical) + "-radius", value);
                    return self.$style("border-" + (horizontal) + "-" + (vertical) + "-radius", value);}, TMP_7._s = self, TMP_7), $a).call($b)}, TMP_6._s = self, TMP_6), $a).call($b)
                } else {
                self.$style("-moz-border-radius", value);
                self.$style("-webkit-border-radius", value);
                return self.$style("border-radius", value);
              }}else if ("color"['$===']($case)) {if (($a = (($c = $scope.Hash) == null ? $opal.cm('Hash') : $c)['$==='](value)) !== false && $a !== nil) {
                return ($a = ($c = value).$each, $a._p = (TMP_8 = function(name, value) {var self = TMP_8._s || this;if (name == null) name = nil;if (value == null) value = nil;
                  return self.$style("border-" + (name) + "-color", value)}, TMP_8._s = self, TMP_8), $a).call($c)
                } else {
                return self.$style("border-color", value)
              }}else {return self.$style("border-" + (name), value)}})()}, TMP_5._s = self, TMP_5), $a).call($b);
            } else {
            return self.$style("border", args)
          };
        };

        def.$box = function(options) {
          var $a, $b, TMP_9, self = this;
          if (($a = (($b = $scope.Hash) == null ? $opal.cm('Hash') : $b)['$==='](options)) !== false && $a !== nil) {
            return ($a = ($b = options).$each, $a._p = (TMP_9 = function(name, value) {var self = TMP_9._s || this, $a, $b, $case = nil;if (name == null) name = nil;if (value == null) value = nil;
              return (function() {$case = name;if ("shadow"['$===']($case)) {if (($a = (($b = $scope.Array) == null ? $opal.cm('Array') : $b)['$==='](value)) !== false && $a !== nil) {
                value = value.$join(", ")};
              self.$style("-moz-box-shadow", value);
              self.$style("-webkit-box-shadow", value);
              return self.$style("box-shadow", value);}else {return self.$style("box-" + (name), value)}})()}, TMP_9._s = self, TMP_9), $a).call($b)
            } else {
            return self.$style("box", options)
          };
        };

        def.$opacity = function(value) {
          var self = this;
          self.$style("opacity", value);
          self.$style("-moz-opacity", value);
          self.$style("-ms-filter", "\"progid:DXImageTransform.Microsoft.Alpha(Opacity=" + ((value['$*'](100)).$to_i()) + ")\"");
          return self.$style("filter", "alpha(opacity=" + ((value['$*'](100)).$to_i()) + ")");
        };

        def.$method_missing = TMP_10 = function(name, args) {
          var $a, $b, $c, TMP_11, self = this, $iter = TMP_10._p, block = $iter || nil, important = nil, argument = nil;
          args = $slice.call(arguments, 1);
          TMP_10._p = null;
          important = name['$end_with?']("!");
          if (important !== false && important !== nil) {
            name = name['$[]']($range(0, -2, false))};
          if (important !== false && important !== nil) {
            self.important = true};
          if (($a = (($b = important !== false && important !== nil) ? self['$respond_to?'](name) : $b)) !== false && $a !== nil) {
            ($a = ($b = self).$__send__, $a._p = block.$to_proc(), $a).apply($b, [name].concat(args));
            self.important = false;
            return nil;};
          if (args.$length()['$=='](1)) {
            argument = args.$first();
            if (($a = (($c = $scope.Hash) == null ? $opal.cm('Hash') : $c)['$==='](argument)) !== false && $a !== nil) {
              ($a = ($c = argument).$each, $a._p = (TMP_11 = function(sub, value) {var self = TMP_11._s || this;if (sub == null) sub = nil;if (value == null) value = nil;
                return self.$style("" + (name) + "-" + (sub), value)}, TMP_11._s = self, TMP_11), $a).call($c)
              } else {
              self.$style(name, argument)
            };
            } else {
            self.$style(name, args.$join(" "))
          };
          self.important = false;
          return self;
        };

        self.$private();

        def.$style = function(name, value, important) {
          var $a, $b, self = this;
          if (value == null) {
            value = nil
          }
          if (important == null) {
            important = self.important
          }
          if (($a = (($b = $scope.Array) == null ? $opal.cm('Array') : $b)['$==='](value)) !== false && $a !== nil) {
            value = value.$join(" ")};
          if (($a = (($b = $scope.Style) == null ? $opal.cm('Style') : $b)['$==='](name)) !== false && $a !== nil) {
            return self.style['$<<'](name)
            } else {
            return self.style['$<<']((($a = $scope.Style) == null ? $opal.cm('Style') : $a).$new(name, value, important))
          };
        };

        return (function($base, $super) {
          function Gradient(){};
          var self = Gradient = $klass($base, $super, 'Gradient', Gradient);

          var def = Gradient._proto, $scope = Gradient._scope, TMP_12;
          def.to = def.from = def.start = def.end = nil;
          def.$initialize = function(args) {
            var $a, $b, $c, self = this, options = nil;
            args = $slice.call(arguments, 0);
            options = (function() {if (($a = (($b = $scope.Hash) == null ? $opal.cm('Hash') : $b)['$==='](args.$last())) !== false && $a !== nil) {
              return args.$pop()
              } else {
              return $hash2([], {})
            }; return nil; })();
            self.to = options['$[]']("to");
            self.from = options['$[]']("from");
            if (($a = ($b = self.to, $b !== false && $b !== nil ?($c = self.from, ($c === nil || $c === false)) : $b)) !== false && $a !== nil) {
              self.from = self.$other(self.to)
            } else if (($a = ($b = self.from, $b !== false && $b !== nil ?($c = self.to, ($c === nil || $c === false)) : $b)) !== false && $a !== nil) {
              self.to = self.$other(self.from)};
            self.start = args.$shift();
            return self.end = args.$shift();
          };

          def.$each = TMP_12 = function() {
            var $a, self = this, $iter = TMP_12._p, block = $iter || nil;
            TMP_12._p = null;
            block.$call(self.$style("-moz-linear-gradient(" + (self.to) + ", " + (self.start) + " 0%, " + (self.end) + " 100%)"));
            if (($a = self['$horizontal?']()) !== false && $a !== nil) {
              block.$call(self.$style("-webkit-gradient(linear, " + (self.from) + " top, " + (self.to) + " top, color-stop(0%, " + (self.start) + "), color-stop(100%, " + (self.end) + "))"))
              } else {
              block.$call(self.$style("-webkit-gradient(linear, left " + (self.from) + ", left " + (self.to) + ", color-stop(0%, " + (self.start) + "), color-stop(100%, " + (self.end) + "))"))
            };
            block.$call(self.$style("-webkit-linear-gradient(" + (self.to) + ", " + (self.start) + " 0%, " + (self.end) + " 100%)"));
            block.$call(self.$style("-o-linear-gradient(" + (self.to) + ", " + (self.start) + " 0%, " + (self.end) + " 100%)"));
            block.$call(self.$style("-ms-linear-gradient(" + (self.to) + ", " + (self.start) + " 0%, " + (self.end) + " 100%)"));
            return block.$call(self.$style("linear-gradient(to " + (self.to) + ", " + (self.start) + " 0%, " + (self.end) + " 100%)"));
          };

          def['$horizontal?'] = function() {
            var $a, self = this;
            return ((($a = self.to['$==']("left")) !== false && $a !== nil) ? $a : self.to['$==']("right"));
          };

          def['$vertical?'] = function() {
            var $a, self = this;
            return ((($a = self.to['$==']("top")) !== false && $a !== nil) ? $a : self.to['$==']("bottom"));
          };

          self.$private();

          def.$other = function(side) {
            var self = this, $case = nil;
            return (function() {$case = side;if ("left"['$===']($case)) {return "right"}else if ("right"['$===']($case)) {return "left"}else if ("top"['$===']($case)) {return "bottom"}else if ("bottom"['$===']($case)) {return "top"}else { return nil }})();
          };

          return (def.$style = function(args) {
            var $a, $b, self = this;
            args = $slice.call(arguments, 0);
            if (args.$length()['$=='](1)) {
              return (($a = $scope.Style) == null ? $opal.cm('Style') : $a).$new(nil, args.$first())
              } else {
              return ($a = (($b = $scope.Style) == null ? $opal.cm('Style') : $b)).$new.apply($a, [].concat(args))
            };
          }, nil);
        })(self, null);
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var $a, self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass, $range = $opal.range;
  $opal.add_stubs(['$include', '$new', '$call', '$close', '$attr_accessor', '$length', '$include?', '$check_readable', '$==', '$===', '$>=', '$raise', '$>', '$+', '$-', '$seek', '$enum_for', '$eof?', '$ord', '$[]', '$check_writable', '$String', '$write', '$closed_write?', '$closed_read?']);
  return (function($base, $super) {
    function StringIO(){};
    var self = StringIO = $klass($base, $super, 'StringIO', StringIO);

    var def = StringIO._proto, $scope = StringIO._scope, $a, $b, TMP_1, TMP_2, TMP_3;
    def.position = def.string = def.closed = nil;
    self.$include((($a = ((($b = $scope.IO) == null ? $opal.cm('IO') : $b))._scope).Readable == null ? $a.cm('Readable') : $a.Readable));

    self.$include((($a = ((($b = $scope.IO) == null ? $opal.cm('IO') : $b))._scope).Writable == null ? $a.cm('Writable') : $a.Writable));

    $opal.defs(self, '$open', TMP_1 = function(string, mode) {
      var self = this, $iter = TMP_1._p, block = $iter || nil, io = nil, res = nil;
      if (string == null) {
        string = ""
      }
      if (mode == null) {
        mode = nil
      }
      TMP_1._p = null;
      io = self.$new(string, mode);
      res = block.$call(io);
      io.$close();
      return res;
    });

    self.$attr_accessor("string");

    def.$initialize = function(string, mode) {
      var $a, $b, $c, self = this;
      if (string == null) {
        string = ""
      }
      if (mode == null) {
        mode = "rw"
      }
      self.string = string;
      self.position = string.$length();
      if (($a = ($b = mode['$include?']("r"), $b !== false && $b !== nil ?($c = mode['$include?']("w"), ($c === nil || $c === false)) : $b)) !== false && $a !== nil) {
        return self.closed = "write"
      } else if (($a = ($b = mode['$include?']("w"), $b !== false && $b !== nil ?($c = mode['$include?']("r"), ($c === nil || $c === false)) : $b)) !== false && $a !== nil) {
        return self.closed = "read"
        } else {
        return nil
      };
    };

    def['$eof?'] = function() {
      var self = this;
      self.$check_readable();
      return self.position['$=='](self.string.$length());
    };

    $opal.defn(self, '$eof', def['$eof?']);

    def.$seek = function(pos, whence) {
      var $a, $b, self = this, $case = nil;
      if (whence == null) {
        whence = (($a = ((($b = $scope.IO) == null ? $opal.cm('IO') : $b))._scope).SEEK_SET == null ? $a.cm('SEEK_SET') : $a.SEEK_SET)
      }
      $case = whence;if ((($a = ((($b = $scope.IO) == null ? $opal.cm('IO') : $b))._scope).SEEK_SET == null ? $a.cm('SEEK_SET') : $a.SEEK_SET)['$===']($case)) {if (($a = pos['$>='](0)) === false || $a === nil) {
        self.$raise((($a = ((($b = $scope.Errno) == null ? $opal.cm('Errno') : $b))._scope).EINVAL == null ? $a.cm('EINVAL') : $a.EINVAL))};
      self.position = pos;}else if ((($a = ((($b = $scope.IO) == null ? $opal.cm('IO') : $b))._scope).SEEK_CUR == null ? $a.cm('SEEK_CUR') : $a.SEEK_CUR)['$===']($case)) {if (self.position['$+'](pos)['$>'](self.string.$length())) {
        self.position = self.string.$length()
        } else {
        self.position = self.position['$+'](pos)
      }}else if ((($a = ((($b = $scope.IO) == null ? $opal.cm('IO') : $b))._scope).SEEK_END == null ? $a.cm('SEEK_END') : $a.SEEK_END)['$===']($case)) {if (pos['$>'](self.string.$length())) {
        self.position = 0
        } else {
        self.position = self.position['$-'](pos)
      }};
      return 0;
    };

    def.$tell = function() {
      var self = this;
      return self.position;
    };

    $opal.defn(self, '$pos', def.$tell);

    $opal.defn(self, '$pos=', def.$seek);

    def.$rewind = function() {
      var self = this;
      return self.$seek(0);
    };

    def.$each_byte = TMP_2 = function() {
      var $a, $b, self = this, $iter = TMP_2._p, block = $iter || nil, i = nil;
      TMP_2._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("each_byte")};
      self.$check_readable();
      i = self.position;
      while (!(($b = self['$eof?']()) !== false && $b !== nil)) {
      block.$call(self.string['$[]'](i).$ord());
      i = i['$+'](1);};
      return self;
    };

    def.$each_char = TMP_3 = function() {
      var $a, $b, self = this, $iter = TMP_3._p, block = $iter || nil, i = nil;
      TMP_3._p = null;
      if (($a = block) === false || $a === nil) {
        return self.$enum_for("each_char")};
      self.$check_readable();
      i = self.position;
      while (!(($b = self['$eof?']()) !== false && $b !== nil)) {
      block.$call(self.string['$[]'](i));
      i = i['$+'](1);};
      return self;
    };

    def.$write = function(string) {
      var self = this, before = nil, after = nil;
      self.$check_writable();
      string = self.$String(string);
      if (self.string.$length()['$=='](self.position)) {
        self.string = self.string['$+'](string);
        return self.position = self.position['$+'](string.$length());
        } else {
        before = self.string['$[]']($range(0, self.position['$-'](1), false));
        after = self.string['$[]']($range(self.position['$+'](string.$length()), -1, false));
        self.string = before['$+'](string)['$+'](after);
        return self.position = self.position['$+'](string.$length());
      };
    };

    def.$read = function(length, outbuf) {
      var $a, self = this, string = nil, str = nil;
      if (length == null) {
        length = nil
      }
      if (outbuf == null) {
        outbuf = nil
      }
      self.$check_readable();
      if (($a = self['$eof?']()) !== false && $a !== nil) {
        return nil};
      string = (function() {if (length !== false && length !== nil) {
        str = self.string['$[]'](self.position, length);
        self.position = self.position['$+'](length);
        return str;
        } else {
        str = self.string['$[]']($range(self.position, -1, false));
        self.position = self.string.$length();
        return str;
      }; return nil; })();
      if (outbuf !== false && outbuf !== nil) {
        return outbuf.$write(string)
        } else {
        return string
      };
    };

    def.$close = function() {
      var self = this;
      return self.closed = "both";
    };

    def.$close_read = function() {
      var self = this;
      if (self.closed['$==']("write")) {
        return self.closed = "both"
        } else {
        return self.closed = "read"
      };
    };

    def.$close_write = function() {
      var self = this;
      if (self.closed['$==']("read")) {
        return self.closed = "both"
        } else {
        return self.closed = "write"
      };
    };

    def['$closed?'] = function() {
      var self = this;
      return self.closed['$==']("both");
    };

    def['$closed_read?'] = function() {
      var $a, self = this;
      return ((($a = self.closed['$==']("read")) !== false && $a !== nil) ? $a : self.closed['$==']("both"));
    };

    def['$closed_write?'] = function() {
      var $a, self = this;
      return ((($a = self.closed['$==']("write")) !== false && $a !== nil) ? $a : self.closed['$==']("both"));
    };

    def.$check_writable = function() {
      var $a, self = this;
      if (($a = self['$closed_write?']()) !== false && $a !== nil) {
        return self.$raise((($a = $scope.IOError) == null ? $opal.cm('IOError') : $a), "not opened for writing")
        } else {
        return nil
      };
    };

    return (def.$check_readable = function() {
      var $a, self = this;
      if (($a = self['$closed_read?']()) !== false && $a !== nil) {
        return self.$raise((($a = $scope.IOError) == null ? $opal.cm('IOError') : $a), "not opened for reading")
        } else {
        return nil
      };
    }, nil);
  })(self, (($a = $scope.IO) == null ? $opal.cm('IO') : $a))
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $range = $opal.range;
  $opal.add_stubs(['$new', '$each', '$start_with?', '$+', '$[]', '$==', '$arity', '$instance_exec', '$to_proc', '$call', '$any?', '$include?', '$raise', '$<<', '$selector', '$pop', '$__send__', '$definition', '$last', '$empty?', '$important?', '$name', '$value', '$reverse', '$string']);
  ;
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'CSS');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Builder(){};
        var self = Builder = $klass($base, $super, 'Builder', Builder);

        var def = Builder._proto, $scope = Builder._scope, $a, TMP_2, TMP_3, TMP_6;
        def.current = def.rules = nil;
        $opal.cdecl($scope, 'Rule', (($a = $scope.Struct) == null ? $opal.cm('Struct') : $a).$new("selector", "definition"));

        $opal.defs(self, '$selector', function(list) {
          var TMP_1, $a, $b, self = this, result = nil;
          result = "";
          ($a = ($b = list).$each, $a._p = (TMP_1 = function(part) {var self = TMP_1._s || this, $a;if (part == null) part = nil;
            if (($a = part['$start_with?']("&")) !== false && $a !== nil) {
              return result = result['$+'](part['$[]']($range(1, -1, false)))
              } else {
              return result = result['$+'](" "['$+'](part))
            }}, TMP_1._s = self, TMP_1), $a).call($b);
          if (result['$[]'](0)['$=='](" ")) {
            return result['$[]']($range(1, -1, false))
            } else {
            return result
          };
        });

        def.$initialize = TMP_2 = function() {
          var $a, $b, self = this, $iter = TMP_2._p, block = $iter || nil;
          TMP_2._p = null;
          self.selector = [];
          self.current = [];
          self.rules = [];
          if (block.$arity()['$=='](0)) {
            return ($a = ($b = self).$instance_exec, $a._p = block.$to_proc(), $a).call($b)
            } else {
            return block.$call(self)
          };
        };

        def.$rule = TMP_3 = function(names) {
          var $a, TMP_4, $b, $c, TMP_5, self = this, $iter = TMP_3._p, block = $iter || nil;
          names = $slice.call(arguments, 0);
          TMP_3._p = null;
          if (($a = ($b = ($c = names)['$any?'], $b._p = (TMP_4 = function(n) {var self = TMP_4._s || this;if (n == null) n = nil;
            return n['$include?'](",")}, TMP_4._s = self, TMP_4), $b).call($c)) !== false && $a !== nil) {
            self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "selectors cannot contain commas")};
          return ($a = ($b = names).$each, $a._p = (TMP_5 = function(name) {var self = TMP_5._s || this, $a;
            if (self.selector == null) self.selector = nil;
            if (self.current == null) self.current = nil;
            if (self.rules == null) self.rules = nil;
if (name == null) name = nil;
            self.selector['$<<'](name);
            self.current['$<<']((($a = $scope.Rule) == null ? $opal.cm('Rule') : $a).$new((($a = $scope.Builder) == null ? $opal.cm('Builder') : $a).$selector(self.selector), (($a = $scope.Definition) == null ? $opal.cm('Definition') : $a).$new()));
            block.$call(self);
            self.selector.$pop();
            return self.rules['$<<'](self.current.$pop());}, TMP_5._s = self, TMP_5), $a).call($b);
        };

        def.$method_missing = TMP_6 = function(name, args) {
          var $a, $b, self = this, $iter = TMP_6._p, block = $iter || nil;
          args = $slice.call(arguments, 1);
          TMP_6._p = null;
          return ($a = ($b = self.current.$last().$definition()).$__send__, $a._p = block.$to_proc(), $a).apply($b, [name].concat(args));
        };

        return (def.$to_s = function() {
          var $a, TMP_7, $b, self = this, io = nil;
          io = (($a = $scope.StringIO) == null ? $opal.cm('StringIO') : $a).$new();
          ($a = ($b = self.rules.$reverse()).$each, $a._p = (TMP_7 = function(rule) {var self = TMP_7._s || this, $a, TMP_8, $b;if (rule == null) rule = nil;
            if (($a = rule.$definition()['$empty?']()) !== false && $a !== nil) {
              return nil;};
            io['$<<']("" + (rule.$selector()) + " {\n");
            ($a = ($b = rule.$definition()).$each, $a._p = (TMP_8 = function(style) {var self = TMP_8._s || this, $a;if (style == null) style = nil;
              if (($a = style['$important?']()) !== false && $a !== nil) {
                return io['$<<']("\t" + (style.$name()) + ": " + (style.$value()) + " !important;\n")
                } else {
                return io['$<<']("\t" + (style.$name()) + ": " + (style.$value()) + ";\n")
              }}, TMP_8._s = self, TMP_8), $a).call($b);
            return io['$<<']("}\n\n");}, TMP_7._s = self, TMP_7), $a).call($b);
          return io.$string();
        }, nil);
      })(self, null)
      
    })(self)
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$include', '$new', '$each', '$[]=', '$important?', '$name', '$value', '$to_proc', '$to_s', '$enum_for', '$[]', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'CSS');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Declaration(){};
        var self = Declaration = $klass($base, $super, 'Declaration', Declaration);

        var def = Declaration._proto, $scope = Declaration._scope, $a, $b, TMP_2, TMP_4;
        def['native'] = nil;
        self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

        self.$include((($a = $scope.Enumerable) == null ? $opal.cm('Enumerable') : $a));

        def.$rule = function() {
          var $a, self = this;
          if (($a = (typeof(self['native'].parentRule) !== "undefined")) !== false && $a !== nil) {
            return (($a = $scope.Rule) == null ? $opal.cm('Rule') : $a).$new(self['native'].parentRule)
            } else {
            return nil
          };
        };

        def.$assign = function(data) {
          var TMP_1, $a, $b, self = this;
          ($a = ($b = data).$each, $a._p = (TMP_1 = function(name, value) {var self = TMP_1._s || this;if (name == null) name = nil;if (value == null) value = nil;
            return self['$[]='](name, value)}, TMP_1._s = self, TMP_1), $a).call($b);
          return self;
        };

        def.$replace = function(string) {
          var self = this;
          self['native'].cssText = string;
          return self;
        };

        def.$apply = TMP_2 = function() {
          var TMP_3, $a, $b, $c, $d, $e, self = this, $iter = TMP_2._p, block = $iter || nil;
          TMP_2._p = null;
          ($a = ($b = ($c = ($d = (($e = $scope.Definition) == null ? $opal.cm('Definition') : $e)).$new, $c._p = block.$to_proc(), $c).call($d)).$each, $a._p = (TMP_3 = function(style) {var self = TMP_3._s || this, $a;
            if (self['native'] == null) self['native'] = nil;
if (style == null) style = nil;
            if (($a = style['$important?']()) !== false && $a !== nil) {
              return self['native'].setProperty(style.$name(), style.$value(), "important");
              } else {
              return self['native'].setProperty(style.$name(), style.$value(), "");
            }}, TMP_3._s = self, TMP_3), $a).call($b);
          return self;
        };

        def.$delete = function(name) {
          var self = this;
          return self['native'].removeProperty(name);
        };

        def['$[]'] = function(name) {
          var self = this;
          
      var result = self['native'].getPropertyValue(name);

      if (result == null || result === "") {
        return nil;
      }

      return result;
    ;
        };

        def['$[]='] = function(name, value) {
          var self = this;
          return self['native'].setProperty(name, value.$to_s(), "");
        };

        def['$important?'] = function(name) {
          var self = this;
          return self['native'].getPropertyPriority(name) == "important";
        };

        def.$each = TMP_4 = function() {
          var $a, self = this, $iter = TMP_4._p, block = $iter || nil;
          TMP_4._p = null;
          if (block === nil) {
            return self.$enum_for("each")};
          
      for (var i = 0, length = self['native'].length; i < length; i++) {
        var name  = self['native'].item(i);

        ((($a = $opal.$yieldX(block, [name, self['$[]'](name)])) === $breaker) ? $breaker.$v : $a)
      }
    ;
          return self;
        };

        self.$alias_native("length");

        return self.$alias_native("to_s", "cssText");
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$include', '$is_a?', '$to_n', '$alias_native', '$new', '$DOM', '$===', '$join', '$map', '$insert', '$length', '$find', '$log', '$==', '$id', '$rules', '$__send__', '$to_proc']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'CSS');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function StyleSheet(){};
        var self = StyleSheet = $klass($base, $super, 'StyleSheet', StyleSheet);

        var def = StyleSheet._proto, $scope = StyleSheet._scope, $a, $b, TMP_1, TMP_5;
        def['native'] = nil;
        self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

        def.$initialize = TMP_1 = function(what) {
          var $a, $b, $c, self = this, $iter = TMP_1._p, $yield = $iter || nil;
          TMP_1._p = null;
          if (($a = what['$is_a?']((($b = ((($c = $scope.DOM) == null ? $opal.cm('DOM') : $c))._scope).Element == null ? $b.cm('Element') : $b.Element))) !== false && $a !== nil) {
            return $opal.find_super_dispatcher(self, 'initialize', TMP_1, null).apply(self, [what.$to_n().sheet])
            } else {
            return $opal.find_super_dispatcher(self, 'initialize', TMP_1, null).apply(self, [what])
          };
        };

        self.$alias_native("disabled?", "disabled");

        self.$alias_native("href");

        self.$alias_native("title");

        self.$alias_native("type");

        def.$media = function() {
          var $a, self = this;
          if (($a = self['native'].media != null) !== false && $a !== nil) {
            return (($a = $scope.Media) == null ? $opal.cm('Media') : $a).$new(self['native'].media)
            } else {
            return nil
          };
        };

        def.$owner = function() {
          var self = this;
          return self.$DOM(self['native'].ownerNode);
        };

        def.$parent = function() {
          var $a, self = this;
          if (($a = self['native'].parentStyleSheet != null) !== false && $a !== nil) {
            return (($a = $scope.Sheet) == null ? $opal.cm('Sheet') : $a).$new(self['native'].parentStyleSheet)
            } else {
            return nil
          };
        };

        def.$rules = function() {
          var TMP_2, $a, $b, $c, $d, self = this;
          return ($a = ($b = (($c = ((($d = $scope.Native) == null ? $opal.cm('Native') : $d))._scope).Array == null ? $c.cm('Array') : $c.Array)).$new, $a._p = (TMP_2 = function(e) {var self = TMP_2._s || this, $a;if (e == null) e = nil;
            return (($a = $scope.Rule) == null ? $opal.cm('Rule') : $a).$new(e)}, TMP_2._s = self, TMP_2), $a).call($b, self['native'].cssRules);
        };

        def.$delete = function(index) {
          var self = this;
          return self['native'].deleteRule(index);
        };

        def.$insert = function(index, rule) {
          var self = this;
          return self['native'].insertRule(rule, index);
        };

        def.$rule = function(selector, body) {
          var $a, $b, TMP_3, self = this;
          if (($a = (($b = $scope.String) == null ? $opal.cm('String') : $b)['$==='](selector)) === false || $a === nil) {
            selector = selector.$join(", ")};
          if (($a = (($b = $scope.String) == null ? $opal.cm('String') : $b)['$==='](body)) === false || $a === nil) {
            body = ($a = ($b = body).$map, $a._p = (TMP_3 = function(name, value) {var self = TMP_3._s || this;if (name == null) name = nil;if (value == null) value = nil;
              return "" + (name) + ": " + (value) + ";"}, TMP_3._s = self, TMP_3), $a).call($b).$join("\n")};
          return self.$insert(self.$length(), "" + (selector) + " { " + (body) + " }");
        };

        def['$[]'] = function(id) {
          var TMP_4, $a, $b, self = this;
          return ($a = ($b = self.$rules()).$find, $a._p = (TMP_4 = function(r) {var self = TMP_4._s || this;if (r == null) r = nil;
            self.$log(r);
            return r.$id()['$=='](id);}, TMP_4._s = self, TMP_4), $a).call($b);
        };

        def.$method_missing = TMP_5 = function(args) {
          var $a, $b, self = this, $iter = TMP_5._p, block = $iter || nil;
          args = $slice.call(arguments, 0);
          TMP_5._p = null;
          return ($a = ($b = self.$rules()).$__send__, $a._p = block.$to_proc(), $a).apply($b, [].concat(args));
        };

        return (function($base, $super) {
          function Media(){};
          var self = Media = $klass($base, $super, 'Media', Media);

          var def = Media._proto, $scope = Media._scope;
          def['native'] = nil;
          self.$alias_native("text", "mediaText");

          self.$alias_native("to_s", "mediaText");

          def.$push = function(medium) {
            var self = this;
            self['native'].appendMedium(medium);
            return self;
          };

          return (def.$delete = function(medium) {
            var self = this;
            return self['native'].deleteMedium(medium);
          }, nil);
        })(self, (($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Array == null ? $a.cm('Array') : $a.Array));
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$include', '$==', '$[]', '$new', '$raise', '$alias_native']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'CSS');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Rule(){};
        var self = Rule = $klass($base, $super, 'Rule', Rule);

        var def = Rule._proto, $scope = Rule._scope, $a, $b, TMP_1;
        def['native'] = nil;
        self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

        $opal.cdecl($scope, 'STYLE_RULE', 1);

        $opal.cdecl($scope, 'CHARSET_RULE', 2);

        $opal.cdecl($scope, 'IMPORT_RULE', 3);

        $opal.cdecl($scope, 'MEDIA_RULE', 4);

        $opal.cdecl($scope, 'FONT_FACE_RULE', 5);

        $opal.cdecl($scope, 'PAGE_RULE', 6);

        $opal.cdecl($scope, 'KEYFRAMES_RULE', 7);

        $opal.cdecl($scope, 'KEYFRAME_RULE', 8);

        $opal.cdecl($scope, 'NAMESPACE_RULE', 10);

        $opal.cdecl($scope, 'COUNTER_STYLE_RULE', 11);

        $opal.cdecl($scope, 'SUPPORTS_RULE', 12);

        $opal.cdecl($scope, 'DOCUMENT_RULE', 13);

        $opal.cdecl($scope, 'FONT_FEATURE_VALUES_RULE', 14);

        $opal.cdecl($scope, 'VIEWPORT_RULE', 15);

        $opal.cdecl($scope, 'REGION_STYLE_RULE', 16);

        $opal.defs(self, '$new', TMP_1 = function(rule) {
          var $a, $b, self = this, $iter = TMP_1._p, $yield = $iter || nil, klass = nil;
          if (self.classes == null) self.classes = nil;

          TMP_1._p = null;
          if (self['$==']((($a = $scope.Rule) == null ? $opal.cm('Rule') : $a))) {
            ((($a = self.classes) !== false && $a !== nil) ? $a : self.classes = [nil, (($b = $scope.Style) == null ? $opal.cm('Style') : $b)]);
            if (($a = klass = self.classes['$[]'](rule.type)) !== false && $a !== nil) {
              return klass.$new(rule)
              } else {
              return self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "cannot instantiate a non derived Rule object")
            };
            } else {
            return $opal.find_super_dispatcher(self, 'new', TMP_1, null, Rule).apply(self, [rule])
          };
        });

        self.$alias_native("text", "cssText");

        self.$alias_native("to_s", "cssText");

        def.$parent = function() {
          var $a, self = this;
          if (($a = self['native'].parentRule != null) !== false && $a !== nil) {
            return (($a = $scope.Rule) == null ? $opal.cm('Rule') : $a).$new(self['native'].parentRule)
            } else {
            return nil
          };
        };

        return (def.$style_sheet = function() {
          var $a, self = this;
          if (($a = self['native'].parentStyleSheet != null) !== false && $a !== nil) {
            return (($a = $scope.StyleSheet) == null ? $opal.cm('StyleSheet') : $a).$new(self['native'].parentStyleSheet)
            } else {
            return nil
          };
        }, nil);
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$alias_native', '$new', '$__send__', '$to_proc', '$declaration']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'CSS');

      var def = self._proto, $scope = self._scope;
      (function($base, $super) {
        function Rule(){};
        var self = Rule = $klass($base, $super, 'Rule', Rule);

        var def = Rule._proto, $scope = Rule._scope, $a;
        return (function($base, $super) {
          function Style(){};
          var self = Style = $klass($base, $super, 'Style', Style);

          var def = Style._proto, $scope = Style._scope, TMP_1;
          def['native'] = nil;
          self.$alias_native("selector", "selectorText");

          self.$alias_native("id", "selectorText");

          def.$declaration = function() {
            var $a, self = this;
            return (($a = $scope.Declaration) == null ? $opal.cm('Declaration') : $a).$new(self['native'].style);
          };

          return (def.$method_missing = TMP_1 = function(args) {
            var $a, $b, self = this, $iter = TMP_1._p, block = $iter || nil;
            args = $slice.call(arguments, 0);
            TMP_1._p = null;
            return ($a = ($b = self.$declaration()).$__send__, $a._p = block.$to_proc(), $a).apply($b, [].concat(args));
          }, nil);
        })(self, (($a = $scope.Rule) == null ? $opal.cm('Rule') : $a))
      })(self, null)
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $gvars = $opal.gvars;
  $opal.add_stubs(['$create_element', '$[]=', '$inner_text=', '$to_s', '$new', '$to_proc']);
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  return (function($base) {
    var self = $module($base, 'Kernel');

    var def = self._proto, $scope = self._scope, TMP_1;
    def.$CSS = TMP_1 = function(text) {
      var $a, $b, $c, $d, $e, self = this, $iter = TMP_1._p, block = $iter || nil, style = nil;
      if (text == null) {
        text = nil
      }
      TMP_1._p = null;
      style = $gvars["document"].$create_element("style");
      style['$[]=']("type", "text/css");
      if (block !== false && block !== nil) {
        style['$inner_text='](($a = ($b = (($c = ((($d = ((($e = $scope.Browser) == null ? $opal.cm('Browser') : $e))._scope).CSS == null ? $d.cm('CSS') : $d.CSS))._scope).Builder == null ? $c.cm('Builder') : $c.Builder)).$new, $a._p = block.$to_proc(), $a).call($b).$to_s())
        } else {
        style['$inner_text='](text)
      };
      return style;
    }
        ;$opal.donate(self, ["$CSS"]);
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice;
  $opal.add_stubs([]);
  ;
  ;
  ;
  ;
  return true;
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$DOM', '$[]=', '$style', '$==', '$[]', '$style!', '$show', '$hide']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'DOM');

      var def = self._proto, $scope = self._scope, $a;
      (function($base, $super) {
        function Document(){};
        var self = Document = $klass($base, $super, 'Document', Document);

        var def = Document._proto, $scope = Document._scope;
        def['native'] = nil;
        return (def.$active_element = function() {
          var self = this;
          return self.$DOM(self['native'].activeElement);
        }, nil)
      })(self, (($a = $scope.Element) == null ? $opal.cm('Element') : $a));

      (function($base, $super) {
        function Element(){};
        var self = Element = $klass($base, $super, 'Element', Element);

        var def = Element._proto, $scope = Element._scope;
        def['native'] = nil;
        def.$show = function(what) {
          var self = this;
          if (what == null) {
            what = "block"
          }
          return self.$style()['$[]=']("display", what);
        };

        def.$hide = function() {
          var self = this;
          return self.$style()['$[]=']("display", "none");
        };

        def.$toggle = function() {
          var self = this;
          if (self['$style!']()['$[]']("display")['$==']("none")) {
            return self.$show()
            } else {
            return self.$hide()
          };
        };

        def.$focus = function() {
          var self = this;
          return self['native'].focus();
        };

        def.$blur = function() {
          var self = this;
          return self['native'].blur();
        };

        return (def['$focused?'] = function() {
          var self = this;
          return self['native'].hasFocus;
        }, nil);
      })(self, null);
      
    })(self)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$include', '$raise', '$==', '$arity', '$instance_exec', '$to_proc', '$call', '$new', '$console']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Console(){};
      var self = Console = $klass($base, $super, 'Console', Console);

      var def = Console._proto, $scope = Console._scope, $a, $b, TMP_1, TMP_2, TMP_3;
      def['native'] = nil;
      self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

      def.$clear = function() {
        var self = this;
        self['native'].clear();
        return self;
      };

      def.$trace = function() {
        var self = this;
        self['native'].trace();
        return self;
      };

      def.$log = function(args) {
        var self = this;
        args = $slice.call(arguments, 0);
        self['native'].log.apply(self['native'], args);
        return self;
      };

      def.$info = function(args) {
        var self = this;
        args = $slice.call(arguments, 0);
        self['native'].info.apply(self['native'], args);
        return self;
      };

      def.$warn = function(args) {
        var self = this;
        args = $slice.call(arguments, 0);
        self['native'].warn.apply(self['native'], args);
        return self;
      };

      def.$error = function(args) {
        var self = this;
        args = $slice.call(arguments, 0);
        self['native'].error.apply(self['native'], args);
        return self;
      };

      def.$time = TMP_1 = function(label) {
        var $a, $b, self = this, $iter = TMP_1._p, block = $iter || nil;
        TMP_1._p = null;
        if (($a = block) === false || $a === nil) {
          self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "no block given")};
        self['native'].time(label);
        try {
        if (block.$arity()['$=='](0)) {
          ($a = ($b = self).$instance_exec, $a._p = block.$to_proc(), $a).call($b)
          } else {
          block.$call(self)
        }
        } finally {
        self['native'].timeEnd();
        };
        return self;
      };

      def.$group = TMP_2 = function(args) {
        var $a, $b, self = this, $iter = TMP_2._p, block = $iter || nil;
        args = $slice.call(arguments, 0);
        TMP_2._p = null;
        if (($a = block) === false || $a === nil) {
          self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "no block given")};
        self['native'].group.apply(self['native'], args);
        try {
        if (block.$arity()['$=='](0)) {
          ($a = ($b = self).$instance_exec, $a._p = block.$to_proc(), $a).call($b)
          } else {
          block.$call(self)
        }
        } finally {
        self['native'].groupEnd();
        };
        return self;
      };

      return (def['$group!'] = TMP_3 = function(args) {
        var $a, $b, self = this, $iter = TMP_3._p, block = $iter || nil;
        args = $slice.call(arguments, 0);
        TMP_3._p = null;
        if (block === nil) {
          return nil};
        self['native'].groupCollapsed.apply(self['native'], args);
        try {
        if (block.$arity()['$=='](0)) {
          ($a = ($b = self).$instance_exec, $a._p = block.$to_proc(), $a).call($b)
          } else {
          block.$call(self)
        }
        } finally {
        self['native'].groupEnd();
        };
        return self;
      }, nil);
    })(self, null);

    (function($base, $super) {
      function Window(){};
      var self = Window = $klass($base, $super, 'Window', Window);

      var def = Window._proto, $scope = Window._scope;
      def['native'] = nil;
      return (def.$console = function() {
        var $a, self = this;
        return (($a = $scope.Console) == null ? $opal.cm('Console') : $a).$new(self['native'].console);
      }, nil)
    })(self, null);

    $gvars["console"] = $gvars["window"].$console();
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars;
  $opal.add_stubs(['$include', '$alias_native', '$nil?', '$path', '$location', '$new']);
  ;
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function History(){};
      var self = History = $klass($base, $super, 'History', History);

      var def = History._proto, $scope = History._scope, $a, $b;
      def['native'] = nil;
      self.$include((($a = ((($b = $scope.Native) == null ? $opal.cm('Native') : $b))._scope).Base == null ? $a.cm('Base') : $a.Base));

      self.$alias_native("length");

      def.$back = function(number) {
        var self = this;
        if (number == null) {
          number = 1
        }
        self['native'].go(-number);
        return self;
      };

      def.$forward = function(number) {
        var self = this;
        if (number == null) {
          number = 1
        }
        self['native'].go(number);
        return self;
      };

      def.$push = function(url, data) {
        var $a, self = this;
        if (data == null) {
          data = nil
        }
        if (($a = data['$nil?']()) !== false && $a !== nil) {
          data = null};
        self['native'].pushState(data, null, url);
        return self;
      };

      def.$replace = function(url, data) {
        var $a, self = this;
        if (data == null) {
          data = nil
        }
        if (($a = data['$nil?']()) !== false && $a !== nil) {
          data = null};
        return self['native'].replaceState(data, null, url);
      };

      def.$current = function() {
        var self = this;
        return $gvars["window"].$location().$path();
      };

      return (def.$state = function() {
        var self = this;
        return self['native'].state;
      }, nil);
    })(self, null);

    (function($base, $super) {
      function Window(){};
      var self = Window = $klass($base, $super, 'Window', Window);

      var def = Window._proto, $scope = Window._scope;
      def['native'] = nil;
      return (def.$history = function() {
        var $a, self = this;
        if (($a = self['native'].history) !== false && $a !== nil) {
          return (($a = $scope.History) == null ? $opal.cm('History') : $a).$new(self['native'].history)
          } else {
          return nil
        };
      }, nil)
    })(self, null);
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars, $hash2 = $opal.hash2;
  $opal.add_stubs(['$attr_reader', '$location', '$history', '$fragment?', '$on', '$update', '$==', '$arity', '$instance_exec', '$to_proc', '$call', '$[]', '$[]=', '$off', '$empty?', '$fragment', '$sub', '$path', '$tap', '$<<', '$new', '$match', '$fragment=', '$push', '$private', '$find', '$escape', '$scan', '$gsub', '$each_with_index', '$+']);
  ;
  return (function($base) {
    var self = $module($base, 'Lissio');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Router(){};
      var self = Router = $klass($base, $super, 'Router', Router);

      var def = Router._proto, $scope = Router._scope, TMP_1, TMP_6;
      def.options = def.change = def.location = def.history = def.routes = nil;
      self.$attr_reader("routes", "options");

      def.$initialize = TMP_1 = function(options) {
        var $a, TMP_2, $b, TMP_3, $c, $d, self = this, $iter = TMP_1._p, block = $iter || nil;
        if (options == null) {
          options = $hash2([], {})
        }
        TMP_1._p = null;
        self.routes = [];
        self.options = options;
        self.location = $gvars["document"].$location();
        self.history = $gvars["window"].$history();
        self.change = (function() {if (($a = self['$fragment?']()) !== false && $a !== nil) {
          return ($a = ($b = $gvars["window"]).$on, $a._p = (TMP_2 = function() {var self = TMP_2._s || this;
            return self.$update()}, TMP_2._s = self, TMP_2), $a).call($b, "hash:change")
          } else {
          return ($a = ($c = $gvars["window"]).$on, $a._p = (TMP_3 = function() {var self = TMP_3._s || this;
            return self.$update()}, TMP_3._s = self, TMP_3), $a).call($c, "pop:state")
        }; return nil; })();
        if (block !== false && block !== nil) {
          if (block.$arity()['$=='](0)) {
            return ($a = ($d = self).$instance_exec, $a._p = block.$to_proc(), $a).call($d)
            } else {
            return block.$call(self)
          }
          } else {
          return nil
        };
      };

      def['$fragment?'] = function() {
        var $a, $b, self = this;
        return ((($a = ($b = self.options['$[]']("fragment")['$=='](false), ($b === nil || $b === false))) !== false && $a !== nil) ? $a : ($b = window.history.pushState, ($b === nil || $b === false)));
      };

      def['$html5!'] = function() {
        var $a, TMP_4, $b, self = this;
        if (($a = self['$fragment?']()) === false || $a === nil) {
          return nil};
        self.options['$[]=']("fragment", false);
        self.change.$off();
        return self.change = ($a = ($b = $gvars["window"]).$on, $a._p = (TMP_4 = function() {var self = TMP_4._s || this;
          return self.$update()}, TMP_4._s = self, TMP_4), $a).call($b, "pop:state");
      };

      def['$fragment!'] = function() {
        var $a, TMP_5, $b, self = this;
        if (($a = self['$fragment?']()) !== false && $a !== nil) {
          return nil};
        self.options['$[]=']("fragment", true);
        self.change.$off();
        return self.change = ($a = ($b = $gvars["window"]).$on, $a._p = (TMP_5 = function() {var self = TMP_5._s || this;
          return self.$update()}, TMP_5._s = self, TMP_5), $a).call($b, "hash:change");
      };

      def.$path = function() {
        var $a, self = this;
        if (($a = self['$fragment?']()) !== false && $a !== nil) {
          if (($a = self.location.$fragment()['$empty?']()) !== false && $a !== nil) {
            return "/"
            } else {
            return self.location.$fragment().$sub(/^#*/, "")
          }
          } else {
          return self.location.$path()
        };
      };

      def.$route = TMP_6 = function(path) {
        var TMP_7, $a, $b, $c, $d, $e, self = this, $iter = TMP_6._p, block = $iter || nil;
        TMP_6._p = null;
        return ($a = ($b = ($c = ($d = (($e = $scope.Route) == null ? $opal.cm('Route') : $e)).$new, $c._p = block.$to_proc(), $c).call($d, path)).$tap, $a._p = (TMP_7 = function(route) {var self = TMP_7._s || this;
          if (self.routes == null) self.routes = nil;
if (route == null) route = nil;
          return self.routes['$<<'](route)}, TMP_7._s = self, TMP_7), $a).call($b);
      };

      def.$update = function() {
        var self = this;
        return self.$match(self.$path());
      };

      def.$navigate = function(path) {
        var $a, self = this;
        if (($a = self['$fragment?']()) !== false && $a !== nil) {
          return self.location['$fragment=']("#" + (path))
          } else {
          self.history.$push(path);
          return self.$update();
        };
      };

      self.$private();

      def.$match = function(path) {
        var TMP_8, $a, $b, self = this;
        return ($a = ($b = self.routes).$find, $a._p = (TMP_8 = function(route) {var self = TMP_8._s || this;if (route == null) route = nil;
          return route.$match(path)}, TMP_8._s = self, TMP_8), $a).call($b);
      };

      return (function($base, $super) {
        function Route(){};
        var self = Route = $klass($base, $super, 'Route', Route);

        var def = Route._proto, $scope = Route._scope, TMP_9;
        def.regexp = def.names = def.block = nil;
        $opal.cdecl($scope, 'NAME', /:(\w+)/);

        $opal.cdecl($scope, 'SPLAT', /\\\*(\w+)/);

        self.$attr_reader("names");

        def.$initialize = TMP_9 = function(pattern) {
          var $a, TMP_10, $b, $c, TMP_11, $d, self = this, $iter = TMP_9._p, block = $iter || nil;
          TMP_9._p = null;
          self.names = [];
          self.block = block;
          pattern = (($a = $scope.Regexp) == null ? $opal.cm('Regexp') : $a).$escape(pattern);
          ($a = ($b = pattern).$scan, $a._p = (TMP_10 = function(name) {var self = TMP_10._s || this;
            if (self.names == null) self.names = nil;
if (name == null) name = nil;
            return self.names['$<<'](name)}, TMP_10._s = self, TMP_10), $a).call($b, (($c = $scope.NAME) == null ? $opal.cm('NAME') : $c));
          ($a = ($c = pattern).$scan, $a._p = (TMP_11 = function(name) {var self = TMP_11._s || this;
            if (self.names == null) self.names = nil;
if (name == null) name = nil;
            return self.names['$<<'](name)}, TMP_11._s = self, TMP_11), $a).call($c, (($d = $scope.SPLAT) == null ? $opal.cm('SPLAT') : $d));
          pattern = pattern.$gsub((($a = $scope.NAME) == null ? $opal.cm('NAME') : $a), "([^\\/]+)").$gsub((($a = $scope.SPLAT) == null ? $opal.cm('SPLAT') : $a), "(.+?)");
          return self.regexp = (($a = $scope.Regexp) == null ? $opal.cm('Regexp') : $a).$new("^" + (pattern) + "$");
        };

        return (def.$match = function(path) {
          var $a, TMP_12, $b, self = this, match = nil, params = nil;
          if (($a = match = self.regexp.$match(path)) !== false && $a !== nil) {
            params = $hash2([], {});
            ($a = ($b = self.names).$each_with_index, $a._p = (TMP_12 = function(name, index) {var self = TMP_12._s || this;if (name == null) name = nil;if (index == null) index = nil;
              return params['$[]='](name, match['$[]'](index['$+'](1)))}, TMP_12._s = self, TMP_12), $a).call($b);
            if (($a = self.block) !== false && $a !== nil) {
              self.block.$call(params)};
            return true;
            } else {
            return false
          };
        }, nil);
      })(self, null);
    })(self, null)
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $hash2 = $opal.hash2, $klass = $opal.klass;
  $opal.add_stubs(['$new', '$push', '$[]=', '$[]', '$create_id', '$json_create', '$attr_accessor', '$create_id=', '$===', '$parse', '$generate', '$from_object', '$to_n', '$to_json', '$responds_to?', '$to_io', '$write', '$to_s', '$strftime']);
  (function($base) {
    var self = $module($base, 'JSON');

    var def = self._proto, $scope = self._scope, $a;
    
    var $parse  = JSON.parse,
        $hasOwn = Opal.hasOwnProperty;

    function to_opal(value, options) {
      switch (typeof value) {
        case 'string':
          return value;

        case 'number':
          return value;

        case 'boolean':
          return !!value;

        case 'null':
          return nil;

        case 'object':
          if (!value) return nil;

          if (value._isArray) {
            var arr = (options.array_class).$new();

            for (var i = 0, ii = value.length; i < ii; i++) {
              (arr).$push(to_opal(value[i], options));
            }

            return arr;
          }
          else {
            var hash = (options.object_class).$new();

            for (var k in value) {
              if ($hasOwn.call(value, k)) {
                (hash)['$[]='](k, to_opal(value[k], options));
              }
            }

            var klass;
            if ((klass = (hash)['$[]']((($a = $scope.JSON) == null ? $opal.cm('JSON') : $a).$create_id())) != nil) {
              klass = Opal.cget(klass);
              return (klass).$json_create(hash);
            }
            else {
              return hash;
            }
          }
      }
    };
  

    (function(self) {
      var $scope = self._scope, def = self._proto;
      return self.$attr_accessor("create_id")
    })(self.$singleton_class());

    self['$create_id=']("json_class");

    $opal.defs(self, '$[]', function(value, options) {
      var $a, $b, self = this;
      if (options == null) {
        options = $hash2([], {})
      }
      if (($a = (($b = $scope.String) == null ? $opal.cm('String') : $b)['$==='](value)) !== false && $a !== nil) {
        return self.$parse(value, options)
        } else {
        return self.$generate(value, options)
      };
    });

    $opal.defs(self, '$parse', function(source, options) {
      var self = this;
      if (options == null) {
        options = $hash2([], {})
      }
      return self.$from_object($parse(source), options);
    });

    $opal.defs(self, '$parse!', function(source, options) {
      var self = this;
      if (options == null) {
        options = $hash2([], {})
      }
      return self.$parse(source, options);
    });

    $opal.defs(self, '$from_object', function(js_object, options) {
      var $a, $b, $c, $d, self = this;
      if (options == null) {
        options = $hash2([], {})
      }
      ($a = "object_class", $b = options, ((($c = $b['$[]']($a)) !== false && $c !== nil) ? $c : $b['$[]=']($a, (($d = $scope.Hash) == null ? $opal.cm('Hash') : $d))));
      ($a = "array_class", $b = options, ((($c = $b['$[]']($a)) !== false && $c !== nil) ? $c : $b['$[]=']($a, (($d = $scope.Array) == null ? $opal.cm('Array') : $d))));
      return to_opal(js_object, options.$to_n());
    });

    $opal.defs(self, '$generate', function(obj, options) {
      var self = this;
      if (options == null) {
        options = $hash2([], {})
      }
      return obj.$to_json(options);
    });

    $opal.defs(self, '$dump', function(obj, io, limit) {
      var $a, self = this, string = nil;
      if (io == null) {
        io = nil
      }
      if (limit == null) {
        limit = nil
      }
      string = self.$generate(obj);
      if (io !== false && io !== nil) {
        if (($a = io['$responds_to?']("to_io")) !== false && $a !== nil) {
          io = io.$to_io()};
        io.$write(string);
        return io;
        } else {
        return string
      };
    });
    
  })(self);
  (function($base, $super) {
    function Object(){};
    var self = Object = $klass($base, $super, 'Object', Object);

    var def = Object._proto, $scope = Object._scope;
    $opal.defn(self, '$to_json', function() {
      var self = this;
      return self.$to_s().$to_json();
    });

    return ($opal.defn(self, '$as_json', function() {
      var self = this;
      return nil;
    }), nil);
  })(self, null);
  (function($base, $super) {
    function Array(){};
    var self = Array = $klass($base, $super, 'Array', Array);

    var def = Array._proto, $scope = Array._scope;
    return (def.$to_json = function() {
      var self = this;
      
      var result = [];

      for (var i = 0, length = self.length; i < length; i++) {
        result.push((self[i]).$to_json());
      }

      return '[' + result.join(', ') + ']';
    
    }, nil)
  })(self, null);
  (function($base, $super) {
    function Boolean(){};
    var self = Boolean = $klass($base, $super, 'Boolean', Boolean);

    var def = Boolean._proto, $scope = Boolean._scope;
    def.$as_json = function() {
      var self = this;
      return self;
    };

    return (def.$to_json = function() {
      var self = this;
      return (self == true) ? 'true' : 'false';
    }, nil);
  })(self, null);
  (function($base, $super) {
    function Hash(){};
    var self = Hash = $klass($base, $super, 'Hash', Hash);

    var def = Hash._proto, $scope = Hash._scope;
    return (def.$to_json = function() {
      var self = this;
      
      var inspect = [], keys = self.keys, map = self.map;

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i];
        inspect.push((key).$to_s().$to_json() + ':' + (map[key]).$to_json());
      }

      return '{' + inspect.join(', ') + '}';
    ;
    }, nil)
  })(self, null);
  (function($base, $super) {
    function NilClass(){};
    var self = NilClass = $klass($base, $super, 'NilClass', NilClass);

    var def = NilClass._proto, $scope = NilClass._scope;
    def.$as_json = function() {
      var self = this;
      return self;
    };

    return (def.$to_json = function() {
      var self = this;
      return "null";
    }, nil);
  })(self, null);
  (function($base, $super) {
    function Numeric(){};
    var self = Numeric = $klass($base, $super, 'Numeric', Numeric);

    var def = Numeric._proto, $scope = Numeric._scope;
    def.$as_json = function() {
      var self = this;
      return self;
    };

    return (def.$to_json = function() {
      var self = this;
      return self.toString();
    }, nil);
  })(self, null);
  (function($base, $super) {
    function String(){};
    var self = String = $klass($base, $super, 'String', String);

    var def = String._proto, $scope = String._scope;
    def.$as_json = function() {
      var self = this;
      return self;
    };

    return $opal.defn(self, '$to_json', def.$inspect);
  })(self, null);
  return (function($base, $super) {
    function Time(){};
    var self = Time = $klass($base, $super, 'Time', Time);

    var def = Time._proto, $scope = Time._scope;
    return (def.$to_json = function() {
      var self = this;
      return self.$strftime("%FT%T%z").$to_json();
    }, nil)
  })(self, null);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module;
  $opal.add_stubs(['$each', '$respond_to?', '$def_instance_delegator', '$include?', '$start_with?', '$to_s', '$define_method', '$__send__', '$to_proc', '$instance_variable_get', '$def_single_delegator', '$define_singleton_method']);
  (function($base) {
    var self = $module($base, 'Forwardable');

    var def = self._proto, $scope = self._scope;
    def.$instance_delegate = function(hash) {
      var TMP_1, $a, $b, self = this;
      return ($a = ($b = hash).$each, $a._p = (TMP_1 = function(methods, accessor) {var self = TMP_1._s || this, $a, TMP_2, $b;if (methods == null) methods = nil;if (accessor == null) accessor = nil;
        if (($a = methods['$respond_to?']("each")) === false || $a === nil) {
          methods = [methods]};
        return ($a = ($b = methods).$each, $a._p = (TMP_2 = function(method) {var self = TMP_2._s || this;if (method == null) method = nil;
          return self.$def_instance_delegator(accessor, method)}, TMP_2._s = self, TMP_2), $a).call($b);}, TMP_1._s = self, TMP_1), $a).call($b);
    };

    def.$def_instance_delegators = function(accessor, methods) {
      var TMP_3, $a, $b, self = this;
      methods = $slice.call(arguments, 1);
      return ($a = ($b = methods).$each, $a._p = (TMP_3 = function(method) {var self = TMP_3._s || this, $a;if (method == null) method = nil;
        if (($a = ["__send__", "__id__"]['$include?'](method)) !== false && $a !== nil) {
          return nil;};
        return self.$def_instance_delegator(accessor, method);}, TMP_3._s = self, TMP_3), $a).call($b);
    };

    def.$def_instance_delegator = function(accessor, method, ali) {
      var $a, TMP_4, $b, TMP_5, $c, self = this;
      if (ali == null) {
        ali = method
      }
      if (($a = accessor.$to_s()['$start_with?']("@")) !== false && $a !== nil) {
        return ($a = ($b = self).$define_method, $a._p = (TMP_4 = function(args) {var self = TMP_4._s || this, block, $a, $b;args = $slice.call(arguments, 0);
          block = TMP_4._p || nil, TMP_4._p = null;
          return ($a = ($b = self.$instance_variable_get(accessor)).$__send__, $a._p = block.$to_proc(), $a).apply($b, [method].concat(args))}, TMP_4._s = self, TMP_4), $a).call($b, ali)
        } else {
        return ($a = ($c = self).$define_method, $a._p = (TMP_5 = function(args) {var self = TMP_5._s || this, block, $a, $b;args = $slice.call(arguments, 0);
          block = TMP_5._p || nil, TMP_5._p = null;
          return ($a = ($b = self.$__send__(accessor)).$__send__, $a._p = block.$to_proc(), $a).apply($b, [method].concat(args))}, TMP_5._s = self, TMP_5), $a).call($c, ali)
      };
    };

    $opal.defn(self, '$delegate', def.$instance_delegate);

    $opal.defn(self, '$def_delegators', def.$def_instance_delegators);

    $opal.defn(self, '$def_delegator', def.$def_instance_delegator);
        ;$opal.donate(self, ["$instance_delegate", "$def_instance_delegators", "$def_instance_delegator", "$delegate", "$def_delegators", "$def_delegator"]);
  })(self);
  return (function($base) {
    var self = $module($base, 'SingleForwardable');

    var def = self._proto, $scope = self._scope;
    def.$single_delegate = function(hash) {
      var TMP_6, $a, $b, self = this;
      return ($a = ($b = hash).$each, $a._p = (TMP_6 = function(methods, accessor) {var self = TMP_6._s || this, $a, TMP_7, $b;if (methods == null) methods = nil;if (accessor == null) accessor = nil;
        if (($a = methods['$respond_to?']("each")) === false || $a === nil) {
          methods = [methods]};
        return ($a = ($b = methods).$each, $a._p = (TMP_7 = function(method) {var self = TMP_7._s || this;if (method == null) method = nil;
          return self.$def_single_delegator(accessor, method)}, TMP_7._s = self, TMP_7), $a).call($b);}, TMP_6._s = self, TMP_6), $a).call($b);
    };

    def.$def_single_delegators = function(accessor, methods) {
      var TMP_8, $a, $b, self = this;
      methods = $slice.call(arguments, 1);
      return ($a = ($b = methods).$each, $a._p = (TMP_8 = function(method) {var self = TMP_8._s || this, $a;if (method == null) method = nil;
        if (($a = ["__send__", "__id__"]['$include?'](method)) !== false && $a !== nil) {
          return nil;};
        return self.$def_single_delegator(accessor, method);}, TMP_8._s = self, TMP_8), $a).call($b);
    };

    def.$def_single_delegator = function(accessor, method, ali) {
      var $a, TMP_9, $b, TMP_10, $c, self = this;
      if (ali == null) {
        ali = method
      }
      if (($a = accessor.$to_s()['$start_with?']("@")) !== false && $a !== nil) {
        return ($a = ($b = self).$define_singleton_method, $a._p = (TMP_9 = function(args) {var self = TMP_9._s || this, block, $a, $b;args = $slice.call(arguments, 0);
          block = TMP_9._p || nil, TMP_9._p = null;
          return ($a = ($b = self.$instance_variable_get(accessor)).$__send__, $a._p = block.$to_proc(), $a).apply($b, [method].concat(args))}, TMP_9._s = self, TMP_9), $a).call($b, ali)
        } else {
        return ($a = ($c = self).$define_singleton_method, $a._p = (TMP_10 = function(args) {var self = TMP_10._s || this, block, $a, $b;args = $slice.call(arguments, 0);
          block = TMP_10._p || nil, TMP_10._p = null;
          return ($a = ($b = self.$__send__(accessor)).$__send__, $a._p = block.$to_proc(), $a).apply($b, [method].concat(args))}, TMP_10._s = self, TMP_10), $a).call($c, ali)
      };
    };

    $opal.defn(self, '$delegate', def.$single_delegate);

    $opal.defn(self, '$def_delegators', def.$def_single_delegators);

    $opal.defn(self, '$def_delegator', def.$def_single_delegator);
        ;$opal.donate(self, ["$single_delegate", "$def_single_delegators", "$def_single_delegator", "$delegate", "$def_delegators", "$def_delegator"]);
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $hash2 = $opal.hash2;
  $opal.add_stubs(['$attr_reader', '$[]', '$===', '$lambda?', '$call', '$nil?', '$default', '$==', '$Array', '$to_s', '$to_sym', '$to_i', '$to_f', '$parse', '$new', '$instance_eval', '$merge', '$properties', '$superclass', '$uninstall', '$to_proc', '$install', '$adapter', '$[]=', '$define_method', '$instance_variable_get', '$<<', '$instance_variable_set', '$extend', '$def_delegators', '$each', '$empty?', '$find', '$primary?', '$map', '$to_h', '$create_id', '$name', '$class', '$to_json', '$as_json', '$join', '$inspect']);
  ;
  ;
  return (function($base) {
    var self = $module($base, 'Lissio');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Model(){};
      var self = Model = $klass($base, $super, 'Model', Model);

      var def = Model._proto, $scope = Model._scope, TMP_2, TMP_3, $a;
      def.changed = nil;
      (function($base, $super) {
        function Property(){};
        var self = Property = $klass($base, $super, 'Property', Property);

        var def = Property._proto, $scope = Property._scope;
        def.primary = def['default'] = def.as = nil;
        self.$attr_reader("name");

        def.$initialize = function(name, options) {
          var $a, self = this;
          self.name = name;
          self['default'] = options['$[]']("default");
          self.primary = ((($a = options['$[]']("primary")) !== false && $a !== nil) ? $a : false);
          return self.as = options['$[]']("as");
        };

        def['$primary?'] = function() {
          var self = this;
          return self.primary;
        };

        def.$default = function() {
          var $a, $b, $c, self = this;
          if (($a = ($b = (($c = $scope.Proc) == null ? $opal.cm('Proc') : $c)['$==='](self['default']), $b !== false && $b !== nil ?self['default']['$lambda?']() : $b)) !== false && $a !== nil) {
            return self['default'].$call()
            } else {
            return self['default']
          };
        };

        return (def.$new = function(data) {
          var $a, $b, $c, self = this;
          if (($a = data['$nil?']()) !== false && $a !== nil) {
            return self.$default()};
          if (($a = ((($b = ($c = self.as, ($c === nil || $c === false))) !== false && $b !== nil) ? $b : self.as['$==='](data))) !== false && $a !== nil) {
            return data};
          return (function() {if (self.as['$==']((($a = $scope.Boolean) == null ? $opal.cm('Boolean') : $a))) {return ($a = ($b = data, ($b === nil || $b === false)), ($a === nil || $a === false))}else if (self.as['$==']((($a = $scope.Array) == null ? $opal.cm('Array') : $a))) {return self.$Array(data)}else if (self.as['$==']((($a = $scope.String) == null ? $opal.cm('String') : $a))) {return data.$to_s()}else if (self.as['$==']((($a = $scope.Symbol) == null ? $opal.cm('Symbol') : $a))) {return data.$to_sym()}else if (self.as['$==']((($a = $scope.Integer) == null ? $opal.cm('Integer') : $a))) {return data.$to_i()}else if (self.as['$==']((($a = $scope.Float) == null ? $opal.cm('Float') : $a))) {return data.$to_f()}else if (self.as['$==']((($a = $scope.Time) == null ? $opal.cm('Time') : $a))) {return (($a = $scope.Time) == null ? $opal.cm('Time') : $a).$parse(data)}else {return ($a = self.as).$new.apply($a, [].concat(data))}})();
        }, nil);
      })(self, null);

      $opal.defs(self, '$inherited', function(klass) {
        var $a, TMP_1, $b, self = this;
        if (self['$==']((($a = $scope.Model) == null ? $opal.cm('Model') : $a))) {
          return nil};
        return ($a = ($b = klass).$instance_eval, $a._p = (TMP_1 = function() {var self = TMP_1._s || this;
          return ($opal.defs(self, '$properties', function() {
            var self = this;
            if (self.properties == null) self.properties = nil;

            return self.$superclass().$properties().$merge(self.properties);
          }), nil)}, TMP_1._s = self, TMP_1), $a).call($b);
      });

      $opal.defs(self, '$adapter', TMP_2 = function(klass, args) {
        var $a, $b, self = this, $iter = TMP_2._p, block = $iter || nil;
        if (self.adapter == null) self.adapter = nil;

        args = $slice.call(arguments, 1);
        if (klass == null) {
          klass = nil
        }
        TMP_2._p = null;
        if (klass !== false && klass !== nil) {
          if (($a = self.adapter) !== false && $a !== nil) {
            self.adapter.$uninstall()};
          self.adapter = ($a = ($b = klass).$new, $a._p = block.$to_proc(), $a).apply($b, [self].concat(args));
          return self.adapter.$install();
          } else {
          return self.adapter
        };
      });

      $opal.defs(self, '$for', TMP_3 = function(klass, args) {
        var TMP_4, $a, $b, $c, self = this, $iter = TMP_3._p, block = $iter || nil;
        args = $slice.call(arguments, 1);
        TMP_3._p = null;
        return ($a = ($b = (($c = $scope.Class) == null ? $opal.cm('Class') : $c)).$new, $a._p = (TMP_4 = function() {var self = TMP_4._s || this, $a, $b;
          return ($a = ($b = self).$adapter, $a._p = block.$to_proc(), $a).apply($b, [klass].concat(args))}, TMP_4._s = self, TMP_4), $a).call($b, self);
      });

      $opal.defs(self, '$properties', function() {
        var self = this;
        if (self.properties == null) self.properties = nil;

        return self.properties;
      });

      $opal.defs(self, '$property', function(name, options) {
        var $a, TMP_5, $b, TMP_6, $c, self = this;
        if (self.properties == null) self.properties = nil;

        if (options == null) {
          options = $hash2([], {})
        }
        (((($a = self.properties) !== false && $a !== nil) ? $a : self.properties = $hash2([], {})))['$[]='](name, (($a = $scope.Property) == null ? $opal.cm('Property') : $a).$new(name, options));
        ($a = ($b = self).$define_method, $a._p = (TMP_5 = function() {var self = TMP_5._s || this;
          return self.$instance_variable_get("@" + (name))}, TMP_5._s = self, TMP_5), $a).call($b, name);
        return ($a = ($c = self).$define_method, $a._p = (TMP_6 = function(value) {var self = TMP_6._s || this, $a, $b;
          if (self.changed == null) self.changed = nil;
if (value == null) value = nil;
          if (($a = ($b = self.$instance_variable_get("@" + (name))['$=='](value), ($b === nil || $b === false))) !== false && $a !== nil) {
            self.changed['$<<'](name);
            return self.$instance_variable_set("@" + (name), value);
            } else {
            return nil
          }}, TMP_6._s = self, TMP_6), $a).call($c, "" + (name) + "=");
      });

      self.$extend((($a = $scope.Forwardable) == null ? $opal.cm('Forwardable') : $a));

      self.$def_delegators("class", "adapter", "properties");

      self.$attr_reader("fetched_with", "changed");

      def.$initialize = function(data, fetched_with) {
        var TMP_7, $a, $b, self = this;
        fetched_with = $slice.call(arguments, 1);
        if (data == null) {
          data = nil
        }
        self.fetched_with = fetched_with;
        self.changed = [];
        if (data !== false && data !== nil) {
          return ($a = ($b = self.$properties()).$each, $a._p = (TMP_7 = function(name, property) {var self = TMP_7._s || this;if (name == null) name = nil;if (property == null) property = nil;
            return self.$instance_variable_set("@" + (name), property.$new(data['$[]'](name)))}, TMP_7._s = self, TMP_7), $a).call($b)
          } else {
          return nil
        };
      };

      def['$changed?'] = function() {
        var $a, self = this;
        return ($a = self.changed['$empty?'](), ($a === nil || $a === false));
      };

      def['$id!'] = function() {
        var $a, TMP_8, $b, $c, self = this, name = nil;
        $a = $opal.to_ary(($b = ($c = self.$properties()).$find, $b._p = (TMP_8 = function(_, property) {var self = TMP_8._s || this;if (_ == null) _ = nil;if (property == null) property = nil;
          return property['$primary?']()}, TMP_8._s = self, TMP_8), $b).call($c)), name = ($a[0] == null ? nil : $a[0]);
        return self.$instance_variable_get("@" + (((($a = name) !== false && $a !== nil) ? $a : "id")));
      };

      def.$to_h = function() {
        var $a, TMP_9, $b, self = this;
        return (($a = $scope.Hash) == null ? $opal.cm('Hash') : $a)['$[]'](($a = ($b = self.$properties()).$map, $a._p = (TMP_9 = function(name, _) {var self = TMP_9._s || this;if (name == null) name = nil;if (_ == null) _ = nil;
          return [name, self.$instance_variable_get("@" + (name))]}, TMP_9._s = self, TMP_9), $a).call($b));
      };

      def.$as_json = function() {
        var $a, self = this, hash = nil;
        hash = self.$to_h();
        hash['$[]=']((($a = $scope.JSON) == null ? $opal.cm('JSON') : $a).$create_id(), self.$class().$name());
        return hash;
      };

      def.$to_json = function() {
        var self = this;
        return self.$as_json().$to_json();
      };

      $opal.defs(self, '$json_create', function(data) {
        var self = this;
        return self.$new(data);
      });

      return (def.$inspect = function() {
        var TMP_10, $a, $b, self = this;
        return "#<" + (self.$class().$name()) + ": " + (($a = ($b = self.$properties()).$map, $a._p = (TMP_10 = function(name, _) {var self = TMP_10._s || this;if (name == null) name = nil;if (_ == null) _ = nil;
          return "" + (name) + "=" + (self.$instance_variable_get("@" + (name)).$inspect())}, TMP_10._s = self, TMP_10), $a).call($b).$join(" ")) + ">";
      }, nil);
    })(self, null)
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$uninstall', '$new', '$to_proc', '$install', '$extend', '$def_delegators', '$map', '$===', '$parse', '$class', '$call', '$model', '$include', '$enum_for', '$each', '$name', '$inspect']);
  ;
  return (function($base) {
    var self = $module($base, 'Lissio');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Collection(){};
      var self = Collection = $klass($base, $super, 'Collection', Collection);

      var def = Collection._proto, $scope = Collection._scope, TMP_1, TMP_2, $a, TMP_4;
      def.items = nil;
      $opal.defs(self, '$adapter', TMP_1 = function(klass, args) {
        var $a, $b, self = this, $iter = TMP_1._p, block = $iter || nil;
        if (self.adapter == null) self.adapter = nil;

        args = $slice.call(arguments, 1);
        if (klass == null) {
          klass = nil
        }
        TMP_1._p = null;
        if (klass !== false && klass !== nil) {
          if (($a = self.adapter) !== false && $a !== nil) {
            self.adapter.$uninstall()};
          self.adapter = ($a = ($b = klass).$new, $a._p = block.$to_proc(), $a).apply($b, [self].concat(args));
          return self.adapter.$install();
          } else {
          return self.adapter
        };
      });

      $opal.defs(self, '$model', function(klass) {
        var self = this;
        if (self.model == null) self.model = nil;

        if (klass == null) {
          klass = nil
        }
        if (klass !== false && klass !== nil) {
          return self.model = klass
          } else {
          return self.model
        };
      });

      $opal.defs(self, '$parse', TMP_2 = function() {
        var self = this, $iter = TMP_2._p, block = $iter || nil;
        if (self.parse == null) self.parse = nil;

        TMP_2._p = null;
        if (block !== false && block !== nil) {
          return self.parse = block
          } else {
          return self.parse
        };
      });

      self.$extend((($a = $scope.Forwardable) == null ? $opal.cm('Forwardable') : $a));

      self.$def_delegators("class", "adapter", "model");

      self.$def_delegators("@items", "empty?", "length", "[]", "to_a");

      def.$initialize = function(data, fetched_with) {
        var TMP_3, $a, $b, self = this;
        fetched_with = $slice.call(arguments, 1);
        if (data == null) {
          data = nil
        }
        self.fetched_with = fetched_with;
        if (data !== false && data !== nil) {
          return self.items = ($a = ($b = data).$map, $a._p = (TMP_3 = function(datum) {var self = TMP_3._s || this, $a, $b, block = nil;if (datum == null) datum = nil;
            if (($a = (($b = $scope.Model) == null ? $opal.cm('Model') : $b)['$==='](datum)) !== false && $a !== nil) {
              return datum;};
            if (($a = block = self.$class().$parse()) !== false && $a !== nil) {
              return block.$call(datum)
              } else {
              return self.$model().$new(datum)
            };}, TMP_3._s = self, TMP_3), $a).call($b)
          } else {
          return nil
        };
      };

      self.$include((($a = $scope.Enumerable) == null ? $opal.cm('Enumerable') : $a));

      def.$each = TMP_4 = function() {
        var $a, $b, self = this, $iter = TMP_4._p, block = $iter || nil;
        TMP_4._p = null;
        if (($a = block) === false || $a === nil) {
          return self.$enum_for("each")};
        ($a = ($b = self.items).$each, $a._p = block.$to_proc(), $a).call($b);
        return self;
      };

      return (def.$inspect = function() {
        var self = this;
        return "#<" + (self.$class().$name()) + ": " + (self.items.$inspect()) + ">";
      }, nil);
    })(self, null)
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$attr_reader', '$include?', '$ancestors', '$raise', '$==']);
  return (function($base) {
    var self = $module($base, 'Lissio');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Adapter(){};
      var self = Adapter = $klass($base, $super, 'Adapter', Adapter);

      var def = Adapter._proto, $scope = Adapter._scope;
      def.type = nil;
      self.$attr_reader("for");

      def.$initialize = function(value) {
        var $a, $b, self = this;
        if (($a = value.$ancestors()['$include?']((($b = $scope.Model) == null ? $opal.cm('Model') : $b))) !== false && $a !== nil) {
          self.type = "model"
        } else if (($a = value.$ancestors()['$include?']((($b = $scope.Collection) == null ? $opal.cm('Collection') : $b))) !== false && $a !== nil) {
          self.type = "collection"
          } else {
          self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "the passed value isn't a Model or a Collection")
        };
        return self['for'] = value;
      };

      def['$model?'] = function() {
        var self = this;
        return self.type['$==']("model");
      };

      def['$collection?'] = function() {
        var self = this;
        return self.type['$==']("collection");
      };

      def.$install = function() {
        var $a, self = this;
        return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a), "install has not been implemented");
      };

      return (def.$uninstall = function() {
        var $a, self = this;
        return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a), "uninstall has not been implemented");
      }, nil);
    })(self, null)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars, $hash2 = $opal.hash2;
  $opal.add_stubs(['$==', '$instance_eval', '$clone', '$new', '$[]=', '$<<', '$[]', '$events', '$delete', '$define_method', '$instance_exec', '$to_proc', '$render', '$arity', '$inner_dom', '$element', '$inner_html=', '$remove', '$CSS', '$append_to', '$head', '$attr_accessor', '$merge', '$tag', '$class', '$parent', '$at', '$create', '$raise', '$add_class', '$each', '$is_a?', '$on', '$method', '$trigger']);
  return (function($base) {
    var self = $module($base, 'Lissio');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Component(){};
      var self = Component = $klass($base, $super, 'Component', Component);

      var def = Component._proto, $scope = Component._scope, TMP_3, TMP_4, TMP_6, TMP_10, TMP_14;
      def.element = nil;
      $opal.defs(self, '$inherited', function(klass) {
        var $a, TMP_1, $b, self = this, element = nil, tag = nil, events = nil;
        if (self.element == null) self.element = nil;
        if (self.tag == null) self.tag = nil;
        if (self.events == null) self.events = nil;

        if (self['$==']((($a = $scope.Component) == null ? $opal.cm('Component') : $a))) {
          return nil};
        element = self.element;
        tag = self.tag;
        events = self.events;
        return ($a = ($b = klass).$instance_eval, $a._p = (TMP_1 = function() {var self = TMP_1._s || this;
          if (element !== false && element !== nil) {
            self.element = element};
          if (tag !== false && tag !== nil) {
            self.tag = tag};
          if (events !== false && events !== nil) {
            return self.events = events.$clone()
            } else {
            return nil
          };}, TMP_1._s = self, TMP_1), $a).call($b);
      });

      $opal.defs(self, '$element', function(name) {
        var self = this;
        if (self.element == null) self.element = nil;

        if (name == null) {
          name = nil
        }
        if (name !== false && name !== nil) {
          return self.element = name
          } else {
          return self.element
        };
      });

      $opal.defs(self, '$tag', function(options) {
        var self = this;
        if (self.tag == null) self.tag = nil;

        if (options == null) {
          options = nil
        }
        if (options !== false && options !== nil) {
          return self.tag = options
          } else {
          return self.tag
        };
      });

      $opal.defs(self, '$events', function() {
        var $a, TMP_2, $b, $c, $d, self = this;
        if (self.events == null) self.events = nil;

        return ((($a = self.events) !== false && $a !== nil) ? $a : self.events = ($b = ($c = (($d = $scope.Hash) == null ? $opal.cm('Hash') : $d)).$new, $b._p = (TMP_2 = function(h, k) {var self = TMP_2._s || this;if (h == null) h = nil;if (k == null) k = nil;
          return h['$[]='](k, [])}, TMP_2._s = self, TMP_2), $b).call($c));
      });

      $opal.defs(self, '$on', TMP_3 = function(name, selector, method) {
        var self = this, $iter = TMP_3._p, block = $iter || nil;
        if (selector == null) {
          selector = nil
        }
        if (method == null) {
          method = nil
        }
        TMP_3._p = null;
        if (block !== false && block !== nil) {
          self.$events()['$[]'](name)['$<<']([selector, block]);
          return [name, selector, block];
        } else if (method !== false && method !== nil) {
          self.$events()['$[]'](name)['$<<']([selector, method]);
          return [name, selector, method];
          } else {
          self.$events()['$[]'](name)['$<<']([nil, method]);
          return [name, nil, method];
        };
      });

      $opal.defs(self, '$off', function(id) {
        var $a, self = this, name = nil, selector = nil, block = nil;
        $a = $opal.to_ary(id), name = ($a[0] == null ? nil : $a[0]), selector = ($a[1] == null ? nil : $a[1]), block = ($a[2] == null ? nil : $a[2]);
        return self.$events()['$[]'](name).$delete([selector, block]);
      });

      $opal.defs(self, '$render', TMP_4 = function() {
        var TMP_5, $a, $b, self = this, $iter = TMP_4._p, block = $iter || nil;
        TMP_4._p = null;
        return ($a = ($b = self).$define_method, $a._p = (TMP_5 = function() {var self = TMP_5._s || this, $a, $b;
          ($a = ($b = self).$instance_exec, $a._p = block.$to_proc(), $a).call($b);
          return $opal.find_iter_super_dispatcher(self, 'render', (TMP_5._def || TMP_4), null).apply(self, $slice.call(arguments));}, TMP_5._s = self, TMP_5), $a).call($b, "render");
      });

      $opal.defs(self, '$html', TMP_6 = function(string) {
        var TMP_7, $a, $b, TMP_9, $c, self = this, $iter = TMP_6._p, block = $iter || nil;
        if (string == null) {
          string = nil
        }
        TMP_6._p = null;
        if (block !== false && block !== nil) {
          return ($a = ($b = self).$render, $a._p = (TMP_7 = function() {var self = TMP_7._s || this, TMP_8, $a, $b, $c;
            if (block.$arity()['$=='](1)) {
              return ($a = ($b = self.$element()).$inner_dom, $a._p = (TMP_8 = function(d) {var self = TMP_8._s || this, $a, $b;if (d == null) d = nil;
                return ($a = ($b = self).$instance_exec, $a._p = block.$to_proc(), $a).call($b, d)}, TMP_8._s = self, TMP_8), $a).call($b)
              } else {
              return ($a = ($c = self.$element()).$inner_dom, $a._p = block.$to_proc(), $a).call($c)
            }}, TMP_7._s = self, TMP_7), $a).call($b)
          } else {
          return ($a = ($c = self).$render, $a._p = (TMP_9 = function() {var self = TMP_9._s || this;
            return self.$element()['$inner_html='](string)}, TMP_9._s = self, TMP_9), $a).call($c)
        };
      });

      $opal.defs(self, '$css', TMP_10 = function(content) {
        var $a, $b, $c, self = this, $iter = TMP_10._p, block = $iter || nil;
        if (self.style == null) self.style = nil;

        if (content == null) {
          content = nil
        }
        TMP_10._p = null;
        if (($a = ((($b = content) !== false && $b !== nil) ? $b : block)) !== false && $a !== nil) {
          if (($a = self.style) !== false && $a !== nil) {
            self.style.$remove()};
          self.style = ($a = ($b = self).$CSS, $a._p = block.$to_proc(), $a).call($b, content);
          return self.style.$append_to($gvars["document"].$head());
          } else {
          return (($a = ((($c = $scope.CSS) == null ? $opal.cm('CSS') : $c))._scope).StyleSheet == null ? $a.cm('StyleSheet') : $a.StyleSheet).$new(self.style)
        };
      });

      self.$attr_accessor("parent");

      def.$initialize = function(parent) {
        var self = this;
        if (parent == null) {
          parent = nil
        }
        return self.parent = parent;
      };

      def.$tag = function() {
        var $a, self = this;
        return $hash2(["name"], {"name": "div"}).$merge(((($a = self.$class().$tag()) !== false && $a !== nil) ? $a : $hash2([], {})));
      };

      def.$element = function() {
        var $a, $b, TMP_11, $c, self = this, scope = nil, elem = nil;
        if (($a = self.element) !== false && $a !== nil) {
          return self.element};
        scope = (function() {if (($a = self.$parent()) !== false && $a !== nil) {
          return self.$parent().$element()
          } else {
          return $gvars["document"]
        }; return nil; })();
        elem = (function() {if (($a = elem = self.$class().$element()) !== false && $a !== nil) {
          return scope.$at(elem)
          } else {
          return (($a = ((($b = $scope.DOM) == null ? $opal.cm('DOM') : $b))._scope).Element == null ? $a.cm('Element') : $a.Element).$create(self.$tag()['$[]']("name"))
        }; return nil; })();
        if (($a = elem) === false || $a === nil) {
          self.$raise((($a = $scope.ArgumentError) == null ? $opal.cm('ArgumentError') : $a), "element not found")};
        if (($a = self.$tag()['$[]']("class")) !== false && $a !== nil) {
          ($a = elem).$add_class.apply($a, [].concat(self.$tag()['$[]']("class")))};
        if (($b = self.$tag()['$[]']("id")) !== false && $b !== nil) {
          elem['$[]=']("id", self.$tag()['$[]']("id"))};
        ($b = ($c = self.$class().$events()).$each, $b._p = (TMP_11 = function(name, blocks) {var self = TMP_11._s || this, TMP_12, $a, $b;if (name == null) name = nil;if (blocks == null) blocks = nil;
          return ($a = ($b = blocks).$each, $a._p = (TMP_12 = function(selector, block) {var self = TMP_12._s || this, $a, $b, TMP_13, $c;if (selector == null) selector = nil;if (block == null) block = nil;
            if (($a = block['$is_a?']((($b = $scope.Symbol) == null ? $opal.cm('Symbol') : $b))) !== false && $a !== nil) {
              return ($a = ($b = elem).$on, $a._p = self.$method(block).$to_proc(), $a).call($b, name, selector)
              } else {
              return ($a = ($c = elem).$on, $a._p = (TMP_13 = function(args) {var self = TMP_13._s || this, $a, $b;args = $slice.call(arguments, 0);
                return ($a = ($b = self).$instance_exec, $a._p = block.$to_proc(), $a).apply($b, [].concat(args))}, TMP_13._s = self, TMP_13), $a).call($c, name, selector)
            }}, TMP_12._s = self, TMP_12), $a).call($b)}, TMP_11._s = self, TMP_11), $b).call($c);
        return self.element = elem;
      };

      def.$on = TMP_14 = function(name, selector, method) {
        var $a, $b, TMP_15, $c, $d, $e, self = this, $iter = TMP_14._p, block = $iter || nil;
        if (selector == null) {
          selector = nil
        }
        if (method == null) {
          method = nil
        }
        TMP_14._p = null;
        ($a = ($b = self.$class()).$on, $a._p = block.$to_proc(), $a).call($b, name, selector, method);
        if (($a = self.element) !== false && $a !== nil) {
          if (block !== false && block !== nil) {
            ($a = ($c = self.element).$on, $a._p = (TMP_15 = function(args) {var self = TMP_15._s || this, $a, $b;args = $slice.call(arguments, 0);
              return ($a = ($b = self).$instance_exec, $a._p = block.$to_proc(), $a).apply($b, [].concat(args))}, TMP_15._s = self, TMP_15), $a).call($c, name, selector)
          } else if (method !== false && method !== nil) {
            ($a = ($d = self.element).$on, $a._p = self.$method(method).$to_proc(), $a).call($d, name, selector)
            } else {
            ($a = ($e = self.element).$on, $a._p = self.$method(method).$to_proc(), $a).call($e, name)
          }};
        return self;
      };

      def.$render = function() {
        var self = this;
        return self.element.$trigger("render", self);
      };

      def.$remove = function() {
        var $a, self = this;
        if (($a = self.element) !== false && $a !== nil) {
          return self.element.$remove()
          } else {
          return nil
        };
      };

      return $opal.defn(self, '$destroy', def.$remove);
    })(self, null)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module;
  $opal.add_stubs(['$raise', '$class', '$__init__', '$instance_eval', '$new', '$extend']);
  return (function($base) {
    var self = $module($base, 'Singleton');

    var def = self._proto, $scope = self._scope, $a;
    def.$clone = function() {
      var $a, self = this;
      return self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "can't clone instance of singleton " + (self.$class()));
    };

    def.$dup = function() {
      var $a, self = this;
      return self.$raise((($a = $scope.TypeError) == null ? $opal.cm('TypeError') : $a), "can't dup instance of singleton " + (self.$class()));
    };

    (function($base) {
      var self = $module($base, 'SingletonClassMethods');

      var def = self._proto, $scope = self._scope, TMP_1, TMP_2;
      def.$clone = TMP_1 = function() {var $zuper = $slice.call(arguments, 0);
        var $a, self = this, $iter = TMP_1._p, $yield = $iter || nil;
        TMP_1._p = null;
        return (($a = $scope.Singleton) == null ? $opal.cm('Singleton') : $a).$__init__($opal.find_super_dispatcher(self, 'clone', TMP_1, $iter).apply(self, $zuper));
      };

      def.$inherited = TMP_2 = function(sub_klass) {var $zuper = $slice.call(arguments, 0);
        var $a, self = this, $iter = TMP_2._p, $yield = $iter || nil;
        TMP_2._p = null;
        $opal.find_super_dispatcher(self, 'inherited', TMP_2, $iter).apply(self, $zuper);
        return (($a = $scope.Singleton) == null ? $opal.cm('Singleton') : $a).$__init__(sub_klass);
      };
            ;$opal.donate(self, ["$clone", "$inherited"]);
    })(self);

    (function(self) {
      var $scope = self._scope, def = self._proto;
      self._proto.$__init__ = function(klass) {
        var TMP_3, $a, $b, self = this;
        ($a = ($b = klass).$instance_eval, $a._p = (TMP_3 = function() {var self = TMP_3._s || this;
          return self.singleton__instance__ = nil}, TMP_3._s = self, TMP_3), $a).call($b);
        $opal.defs(klass, '$instance', function() {
          var $a, self = this;
          if (self.singleton__instance__ == null) self.singleton__instance__ = nil;

          if (($a = self.singleton__instance__) !== false && $a !== nil) {
            return self.singleton__instance__};
          return self.singleton__instance__ = self.$new();
        });
        return klass;
      };
      return (self._proto.$included = TMP_4 = function(klass) {var $zuper = $slice.call(arguments, 0);
        var $a, self = this, $iter = TMP_4._p, $yield = $iter || nil;
        TMP_4._p = null;
        $opal.find_super_dispatcher(self, 'included', TMP_4, $iter).apply(self, $zuper);
        klass.$extend((($a = $scope.SingletonClassMethods) == null ? $opal.cm('SingletonClassMethods') : $a));
        return (($a = $scope.Singleton) == null ? $opal.cm('Singleton') : $a).$__init__(klass);
      }, nil);
    })((($a = $scope.Singleton) == null ? $opal.cm('Singleton') : $a).$singleton_class());
        ;$opal.donate(self, ["$clone", "$dup"]);
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars, $range = $opal.range, $hash2 = $opal.hash2;
  $opal.add_stubs(['$include', '$on', '$start', '$start_with?', '$[]', '$define_singleton_method', '$__send__', '$instance', '$attr_reader', '$to_proc', '$expose', '$extend', '$def_delegators', '$new', '$render', '$update', '$element']);
  ;
  ;
  return (function($base) {
    var self = $module($base, 'Lissio');

    var def = self._proto, $scope = self._scope, $a;
    (function($base, $super) {
      function Application(){};
      var self = Application = $klass($base, $super, 'Application', Application);

      var def = Application._proto, $scope = Application._scope, TMP_1, $a;
      def.router = nil;
      $opal.defs(self, '$inherited', TMP_1 = function(klass) {var $zuper = $slice.call(arguments, 0);
        var $a, TMP_2, $b, self = this, $iter = TMP_1._p, $yield = $iter || nil;
        TMP_1._p = null;
        $opal.find_super_dispatcher(self, 'inherited', TMP_1, $iter, Application).apply(self, $zuper);
        klass.$include((($a = $scope.Singleton) == null ? $opal.cm('Singleton') : $a));
        return ($a = ($b = $gvars["document"]).$on, $a._p = (TMP_2 = function() {var self = TMP_2._s || this;
          return klass.$start()}, TMP_2._s = self, TMP_2), $a).call($b, "load");
      });

      $opal.defs(self, '$expose', function(what, options) {
        var $a, TMP_3, $b, TMP_4, $c, self = this, name = nil;
        if (options == null) {
          options = $hash2([], {})
        }
        if (($a = what['$start_with?']("@")) !== false && $a !== nil) {
          name = what['$[]']($range(1, -1, false));
          ($a = ($b = self).$define_singleton_method, $a._p = (TMP_3 = function() {var self = TMP_3._s || this;
            return self.$instance().$__send__(name)}, TMP_3._s = self, TMP_3), $a).call($b, name);
          return self.$attr_reader(name);
          } else {
          return ($a = ($c = self).$define_singleton_method, $a._p = (TMP_4 = function(args) {var self = TMP_4._s || this, block, $a, $b;args = $slice.call(arguments, 0);
            block = TMP_4._p || nil, TMP_4._p = null;
            return ($a = ($b = self.$instance()).$__send__, $a._p = block.$to_proc(), $a).apply($b, [what].concat(args))}, TMP_4._s = self, TMP_4), $a).call($c, what)
        };
      });

      self.$expose("start");

      self.$expose("navigate");

      self.$expose("@router");

      self.$extend((($a = $scope.Forwardable) == null ? $opal.cm('Forwardable') : $a));

      self.$def_delegators("@router", "navigate", "route");

      def.$initialize = function() {
        var $a, $b, self = this;
        return self.router = (($a = ((($b = $scope.Lissio) == null ? $opal.cm('Lissio') : $b))._scope).Router == null ? $a.cm('Router') : $a.Router).$new($hash2(["fragment"], {"fragment": false}));
      };

      def.$start = function() {
        var self = this;
        self.$render();
        return self.router.$update();
      };

      return self.$element("body");
    })(self, (($a = $scope.Component) == null ? $opal.cm('Component') : $a))
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module;
  $opal.add_stubs([]);
  ;
  (function($base) {
    var self = $module($base, 'Lissio');

    var def = self._proto, $scope = self._scope, $a, $b;
    $opal.cdecl($scope, 'DOM', (($a = ((($b = $scope.Browser) == null ? $opal.cm('Browser') : $b))._scope).DOM == null ? $a.cm('DOM') : $a.DOM));

    $opal.cdecl($scope, 'CSS', (($a = ((($b = $scope.Browser) == null ? $opal.cm('Browser') : $b))._scope).CSS == null ? $a.cm('CSS') : $a.CSS));
    
  })(self);
  ;
  ;
  ;
  ;
  ;
  return true;
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $gvars = $opal.gvars, $hash2 = $opal.hash2;
  $opal.add_stubs(['$delete', '$create_id', '$[]', '$map', '$parse', '$attr_reader', '$autosave!', '$respond_to?', '$init', '$is_a?', '$each', '$define_method', '$tap', '$autosave?', '$save', '$replace', '$encoded_name', '$dump', '$options', '$cookies', '$*', '$[]=', '$new', '$<<', '$to_json', '$name', '$class', '$seek', '$string', '$to_n']);
  ;
  ;
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope, $a;
    (function($base, $super) {
      function Storage(){};
      var self = Storage = $klass($base, $super, 'Storage', Storage);

      var def = Storage._proto, $scope = Storage._scope, TMP_2, TMP_3, TMP_4, $a, $b;
      def.name = def.autosave = def.window = def.element = nil;
      $opal.defs(self, '$json_create', function(data) {
        var $a, TMP_1, $b, self = this;
        data.$delete((($a = $scope.JSON) == null ? $opal.cm('JSON') : $a).$create_id());
        return (($a = $scope.Hash) == null ? $opal.cm('Hash') : $a)['$[]'](($a = ($b = data).$map, $a._p = (TMP_1 = function(key, value) {var self = TMP_1._s || this, $a;if (key == null) key = nil;if (value == null) value = nil;
          return [(($a = $scope.JSON) == null ? $opal.cm('JSON') : $a).$parse(key), value]}, TMP_1._s = self, TMP_1), $a).call($b));
      });

      self.$attr_reader("name");

      def.$initialize = TMP_2 = function(window, name) {
        var $a, self = this, $iter = TMP_2._p, $yield = $iter || nil;
        TMP_2._p = null;
        $opal.find_super_dispatcher(self, 'initialize', TMP_2, null).apply(self, []);
        self.window = window;
        self.name = name;
        self['$autosave!']();
        if (($a = self['$respond_to?']("init")) !== false && $a !== nil) {
          return self.$init()
          } else {
          return nil
        };
      };

      def.$encoded_name = function() {
        var self = this;
        return "$opal.storage." + (self.name);
      };

      def['$autosave?'] = function() {
        var self = this;
        return self.autosave;
      };

      def['$autosave!'] = function() {
        var self = this;
        return self.autosave = true;
      };

      def['$no_autosave!'] = function() {
        var self = this;
        return self.autosave = false;
      };

      def.$replace = TMP_3 = function(what) {var $zuper = $slice.call(arguments, 0);
        var $a, $b, self = this, $iter = TMP_3._p, $yield = $iter || nil;
        TMP_3._p = null;
        if (($a = what['$is_a?']((($b = $scope.String) == null ? $opal.cm('String') : $b))) !== false && $a !== nil) {
          return $opal.find_super_dispatcher(self, 'replace', TMP_3, null).apply(self, [(($a = $scope.JSON) == null ? $opal.cm('JSON') : $a).$parse(what)])
          } else {
          return $opal.find_super_dispatcher(self, 'replace', TMP_3, $iter).apply(self, $zuper)
        };
      };

      ($a = ($b = ["[]=", "delete", "clear"]).$each, $a._p = (TMP_4 = function(name) {var self = TMP_4._s || this, TMP_5, $a, $b;if (name == null) name = nil;
        return ($a = ($b = self).$define_method, $a._p = (TMP_5 = function(args) {var self = TMP_5._s || this, TMP_6, $a, $b;args = $slice.call(arguments, 0);
          return ($a = ($b = $opal.find_iter_super_dispatcher(self, null, (TMP_5._def || TMP_4._def || null), null).apply(self, [].concat(args))).$tap, $a._p = (TMP_6 = function() {var self = TMP_6._s || this, $a;
            if (($a = self['$autosave?']()) !== false && $a !== nil) {
              return self.$save()
              } else {
              return nil
            }}, TMP_6._s = self, TMP_6), $a).call($b)}, TMP_5._s = self, TMP_5), $a).call($b, name)}, TMP_4._s = self, TMP_4), $a).call($b);

      def.$save = function() {
        var self = this;
        return nil;
      };

      if (($a = window.localStorage) !== false && $a !== nil) {
        def.$init = function() {
          var self = this;
          return self.$replace(self.window.localStorage[self.$encoded_name()] || '{}');
        };

        def.$save = function() {
          var $a, self = this;
          return self.window.localStorage[self.$encoded_name()] = (($a = $scope.JSON) == null ? $opal.cm('JSON') : $a).$dump(self);
        };
      } else if (($a = window.globalStorage) !== false && $a !== nil) {
        def.$init = function() {
          var self = this;
          return self.$replace(self.window.globalStorage[self.window.location.hostname][self.$encoded_name()] || '{}');
        };

        def.$save = function() {
          var $a, self = this;
          return self.window.globalStorage[self.window.location.hostname][self.$encoded_name()] = (($a = $scope.JSON) == null ? $opal.cm('JSON') : $a).$dump(self);
        };
      } else if (($a = document.body.addBehavior) !== false && $a !== nil) {
        def.$init = function() {
          var self = this;
          
        self.element = self.window.document.createElement('link');
        self.element.addBehavior('#default#userData');

        self.window.document.getElementsByTagName('head')[0].appendChild(self.element);

        self.element.load(self.$encoded_name());
      ;
          return self.$replace(self.element.getAttribute(self.$encoded_name()) || '{}');
        };

        def.$save = function() {
          var $a, self = this;
          
        self.element.setAttribute(self.$encoded_name(), (($a = $scope.JSON) == null ? $opal.cm('JSON') : $a).$dump(self));
        self.element.save(self.$encoded_name());
      ;
        };
        } else {
        def.$init = function() {
          var self = this;
          $gvars["document"].$cookies().$options($hash2(["expires"], {"expires": (60)['$*'](60)['$*'](24)['$*'](365)}));
          return self.$replace($gvars["document"].$cookies()['$[]'](self.$encoded_name()));
        };

        def.$save = function() {
          var self = this;
          return $gvars["document"].$cookies()['$[]='](self.$encoded_name(), self);
        };
      };

      return (def.$to_json = function() {
        var $a, TMP_7, $b, $c, self = this, io = nil;
        io = (($a = $scope.StringIO) == null ? $opal.cm('StringIO') : $a).$new("{");
        io['$<<']((($a = $scope.JSON) == null ? $opal.cm('JSON') : $a).$create_id().$to_json())['$<<'](":")['$<<'](self.$class().$name().$to_json())['$<<'](",");
        ($a = ($b = self).$each, $a._p = (TMP_7 = function(key, value) {var self = TMP_7._s || this;if (key == null) key = nil;if (value == null) value = nil;
          return io['$<<'](key.$to_json().$to_json())['$<<'](":")['$<<'](value.$to_json())['$<<'](",")}, TMP_7._s = self, TMP_7), $a).call($b);
        io.$seek(-1, (($a = ((($c = $scope.IO) == null ? $opal.cm('IO') : $c))._scope).SEEK_CUR == null ? $a.cm('SEEK_CUR') : $a.SEEK_CUR));
        io['$<<']("}");
        return io.$string();
      }, nil);
    })(self, (($a = $scope.Hash) == null ? $opal.cm('Hash') : $a));

    (function($base, $super) {
      function SessionStorage(){};
      var self = SessionStorage = $klass($base, $super, 'SessionStorage', SessionStorage);

      var def = SessionStorage._proto, $scope = SessionStorage._scope;
      def.window = nil;
      def.$init = function() {
        var self = this;
        return self.$replace(self.window.sessionStorage[self.$encoded_name()] || '{}');
      };

      return (def.$save = function() {
        var $a, self = this;
        return self.window.sessionStorage[self.$encoded_name()] = (($a = $scope.JSON) == null ? $opal.cm('JSON') : $a).$dump(self);
      }, nil);
    })(self, (($a = $scope.Storage) == null ? $opal.cm('Storage') : $a));

    (function($base, $super) {
      function Window(){};
      var self = Window = $klass($base, $super, 'Window', Window);

      var def = Window._proto, $scope = Window._scope;
      def.$storage = function(name) {
        var $a, self = this;
        if (name == null) {
          name = "default"
        }
        return (($a = $scope.Storage) == null ? $opal.cm('Storage') : $a).$new(self.$to_n(), name);
      };

      return (def.$session_storage = function(name) {
        var $a, self = this;
        if (name == null) {
          name = "default"
        }
        return (($a = $scope.SessionStorage) == null ? $opal.cm('SessionStorage') : $a).$new(self.$to_n(), name);
      }, nil);
    })(self, null);
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $hash2 = $opal.hash2, $range = $opal.range, $gvars = $opal.gvars;
  $opal.add_stubs(['$has?', '$immediate?', '$call', '$to_proc', '$post_message?', '$rand', '$on', '$===', '$data', '$start_with?', '$delete', '$[]', '$length', '$to_s', '$[]=', '$send!', '$ready_state_change?', '$aborted?']);
  return (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base) {
      var self = $module($base, 'Compatibility');

      var def = self._proto, $scope = self._scope;
      $opal.defs(self, '$immediate?', function(prefix) {
        var self = this;
        if (prefix == null) {
          prefix = nil
        }
        if (prefix !== false && prefix !== nil) {
          return self['$has?']("" + (prefix) + "SetImmediate")
          } else {
          return self['$has?']("setImmediate")
        };
      });

      $opal.defs(self, '$post_message?', function() {
        var $a, $b, $c, self = this;
        if (($a = ($b = self['$has?']("postMessage"), $b !== false && $b !== nil ?($c = self['$has?']("importScripts"), ($c === nil || $c === false)) : $b)) === false || $a === nil) {
          return false};
        
      var ok  = true,
          old = window.onmessage;

      window.onmessage = function() { ok = false; };
      window.postMessage("", "*")
      window.onmessage = old;

      return ok;
    
      });

      $opal.defs(self, '$ready_state_change?', function() {
        var self = this;
        return "onreadystatechange" in window.document.createElement("script");
      });
      
    })(self);

    (function($base, $super) {
      function Immediate(){};
      var self = Immediate = $klass($base, $super, 'Immediate', Immediate);

      var def = Immediate._proto, $scope = Immediate._scope, $a, $b, TMP_1, $c;
      def.block = def['function'] = def['arguments'] = def.id = nil;
      if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$immediate?']()) !== false && $a !== nil) {
        def.$dispatch = function() {
          var $a, $b, self = this;
          return self.id = window.setImmediate(function() {
        ($a = ($b = self['function']).$call, $a._p = self.block.$to_proc(), $a).call($b, self['arguments']);
      });
        };

        return (def.$prevent = function() {
          var self = this;
          return window.clearImmediate(self.id);
        }, nil);
      } else if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$immediate?']("ms")) !== false && $a !== nil) {
        def.$dispatch = function() {
          var $a, $b, self = this;
          return self.id = window.msSetImmediate(function() {
        ($a = ($b = self['function']).$call, $a._p = self.block.$to_proc(), $a).call($b, self['arguments']);
      });
        };

        return (def.$prevent = function() {
          var self = this;
          return window.msClearImmediate(self.id);
        }, nil);
      } else if (($a = (($b = $scope.C) == null ? $opal.cm('C') : $b)['$post_message?']()) !== false && $a !== nil) {
        ($opal.cvars['@@tasks'] = $hash2([], {}));

        ($opal.cvars['@@prefix'] = "opal.browser.immediate." + (self.$rand(1000000)) + ".");

        ($a = ($b = $gvars["window"]).$on, $a._p = (TMP_1 = function(e) {var self = TMP_1._s || this, $a, $b, $c, task = nil;if (e == null) e = nil;
          if (($a = ($b = (($c = $scope.String) == null ? $opal.cm('String') : $c)['$==='](e.$data()), $b !== false && $b !== nil ?e.$data()['$start_with?']((($c = $opal.cvars['@@prefix']) == null ? nil : $c)) : $b)) !== false && $a !== nil) {
            if (($a = task = (($b = $opal.cvars['@@tasks']) == null ? nil : $b).$delete(e.$data()['$[]']($range((($b = $opal.cvars['@@prefix']) == null ? nil : $b).$length(), -1, false)))) !== false && $a !== nil) {
              return ($a = ($b = task['$[]'](0)).$call, $a._p = task['$[]'](2).$to_proc(), $a).apply($b, [].concat(task['$[]'](1)))
              } else {
              return nil
            }
            } else {
            return nil
          }}, TMP_1._s = self, TMP_1), $a).call($b, "message");

        def.$dispatch = function() {
          var $a, self = this;
          self.id = self.$rand(1000000).$to_s();
          (($a = $opal.cvars['@@tasks']) == null ? nil : $a)['$[]='](self.id, [self['function'], self['arguments'], self.block]);
          return $gvars["window"]['$send!']("" + ((($a = $opal.cvars['@@prefix']) == null ? nil : $a)) + (self.id));
        };

        return (def.$prevent = function() {
          var $a, self = this;
          return (($a = $opal.cvars['@@tasks']) == null ? nil : $a).$delete(self.id);
        }, nil);
      } else if (($a = (($c = $scope.C) == null ? $opal.cm('C') : $c)['$ready_state_change?']()) !== false && $a !== nil) {
        def.$dispatch = function() {
          var $a, $b, self = this;
          
        var script = document.createElement("script");

        script.onreadystatechange = function() {
          if (!self['$aborted?']()) {
            ($a = ($b = self['function']).$call, $a._p = self.block.$to_proc(), $a).call($b, self['arguments']);
          }

          script.onreadystatechange = null;
          script.parentNode.removeChild(script);
        };

        document.documentElement.appendChild(script);
      ;
        };

        return (def.$prevent = function() {
          var self = this;
          return nil;
        }, nil);
        } else {
        def.$dispatch = function() {
          var $a, $b, self = this;
          return self.id = window.setTimeout(function() {
        ($a = ($b = self['function']).$call, $a._p = self.block.$to_proc(), $a).apply($b, [].concat(self['arguments']));
      }, 0);
        };

        return (def.$prevent = function() {
          var self = this;
          return window.clearTimeout(self.id);
        }, nil);
      }
    })(self, null);
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass;
  $opal.add_stubs(['$method_defined?', '$raise', '$aborted?', '$prevent', '$tap', '$to_proc', '$new']);
  ;
  (function($base) {
    var self = $module($base, 'Browser');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Immediate(){};
      var self = Immediate = $klass($base, $super, 'Immediate', Immediate);

      var def = Immediate._proto, $scope = Immediate._scope, TMP_1, $a;
      def.aborted = nil;
      def.$initialize = TMP_1 = function(func, args) {
        var self = this, $iter = TMP_1._p, block = $iter || nil;
        TMP_1._p = null;
        self.aborted = false;
        self['function'] = func;
        self['arguments'] = args;
        return self.block = block;
      };

      if (($a = self['$method_defined?']("dispatch")) === false || $a === nil) {
        def.$dispatch = function() {
          var $a, self = this;
          return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
        }};

      if (($a = self['$method_defined?']("prevent")) === false || $a === nil) {
        def.$prevent = function() {
          var $a, self = this;
          return self.$raise((($a = $scope.NotImplementedError) == null ? $opal.cm('NotImplementedError') : $a));
        }};

      def.$abort = function() {
        var $a, self = this;
        if (($a = self['$aborted?']()) !== false && $a !== nil) {
          return nil};
        self.aborted = true;
        self.$prevent();
        return self;
      };

      return (def['$aborted?'] = function() {
        var self = this;
        return self.aborted;
      }, nil);
    })(self, null)
    
  })(self);
  return (function($base, $super) {
    function Proc(){};
    var self = Proc = $klass($base, $super, 'Proc', Proc);

    var def = Proc._proto, $scope = Proc._scope, TMP_2;
    return (def.$defer = TMP_2 = function(args) {
      var $a, $b, $c, $d, $e, $f, self = this, $iter = TMP_2._p, block = $iter || nil;
      args = $slice.call(arguments, 0);
      TMP_2._p = null;
      return ($a = ($b = ($c = ($d = (($e = ((($f = $scope.Browser) == null ? $opal.cm('Browser') : $f))._scope).Immediate == null ? $e.cm('Immediate') : $e.Immediate)).$new, $c._p = block.$to_proc(), $c).call($d, self, args)).$tap, $a._p = "dispatch".$to_proc(), $a).call($b);
    }, nil)
  })(self, null);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $hash2 = $opal.hash2, $gvars = $opal.gvars;
  $opal.add_stubs(['$collection?', '$[]', '$model', '$==', '$arity', '$instance_exec', '$to_proc', '$call', '$<<', '$[]=', '$+', '$model?', '$instance_eval', '$storage', '$name', '$class', '$defer', '$proc', '$id!', '$each', '$__send__', '$autoincrement!', '$adapter', '$autoincrement', '$delete', '$new', '$compact', '$map', '$===', '$length', '$first', '$filter', '$remove_method']);
  ;
  ;
  return (function($base) {
    var self = $module($base, 'Lissio');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Adapter(){};
      var self = Adapter = $klass($base, $super, 'Adapter', Adapter);

      var def = Adapter._proto, $scope = Adapter._scope, $a;
      return (function($base, $super) {
        function Storage(){};
        var self = Storage = $klass($base, $super, 'Storage', Storage);

        var def = Storage._proto, $scope = Storage._scope, TMP_1, TMP_2;
        def.model = def.filter = def.autoincrement = def['for'] = nil;
        def.$initialize = TMP_1 = function(value, options) {
          var $a, $b, self = this, $iter = TMP_1._p, block = $iter || nil;
          if (options == null) {
            options = $hash2([], {})
          }
          TMP_1._p = null;
          $opal.find_super_dispatcher(self, 'initialize', TMP_1, null).apply(self, [value]);
          self.autoincrement = [];
          if (($a = self['$collection?']()) !== false && $a !== nil) {
            self.model = ((($a = options['$[]']("model")) !== false && $a !== nil) ? $a : value.$model());
            if (($a = options['$[]']("filter")) !== false && $a !== nil) {
              self.filter = options['$[]']("filter")};};
          if (block !== false && block !== nil) {
            if (block.$arity()['$=='](0)) {
              return ($a = ($b = self).$instance_exec, $a._p = block.$to_proc(), $a).call($b)
              } else {
              return block.$call(self)
            }
            } else {
            return nil
          };
        };

        def.$model = function(name) {
          var self = this;
          if (name == null) {
            name = nil
          }
          if (name !== false && name !== nil) {
            return self.model = name
            } else {
            return self.model
          };
        };

        def.$filter = TMP_2 = function() {
          var self = this, $iter = TMP_2._p, block = $iter || nil;
          TMP_2._p = null;
          if (block !== false && block !== nil) {
            return self.filter = block
            } else {
            return self.filter
          };
        };

        def.$autoincrement = function(field) {
          var self = this;
          if (field == null) {
            field = nil
          }
          if (field !== false && field !== nil) {
            return self.autoincrement['$<<'](field)
            } else {
            return self.autoincrement
          };
        };

        def['$autoincrement!'] = function(field, storage) {
          var $a, $b, $c, self = this;
          ($a = ["__autoincrement__", field], $b = storage, ((($c = $b['$[]']($a)) !== false && $c !== nil) ? $c : $b['$[]=']($a, 0)));
          return ($a = ["__autoincrement__", field], $b = storage, $b['$[]=']($a, $b['$[]']($a)['$+'](1)));
        };

        def.$install = function() {
          var $a, TMP_3, $b, TMP_13, $c, self = this;
          if (($a = self['$model?']()) !== false && $a !== nil) {
            return ($a = ($b = self['for']).$instance_eval, $a._p = (TMP_3 = function() {var self = TMP_3._s || this, TMP_4, TMP_6, TMP_9, TMP_11;
              $opal.defs(self, '$storage', function() {
                var self = this;
                return $gvars["window"].$storage(self.$name());
              });
              $opal.defn(self, '$storage', function() {
                var self = this;
                return self.$class().$storage();
              });
              $opal.defs(self, '$fetch', TMP_4 = function(id) {
                var TMP_5, $a, $b, self = this, $iter = TMP_4._p, block = $iter || nil;
                TMP_4._p = null;
                return ($a = ($b = self).$proc, $a._p = (TMP_5 = function() {var self = TMP_5._s || this, $a;
                  return block.$call(((($a = self.$storage()['$[]'](id)) !== false && $a !== nil) ? $a : "error"))}, TMP_5._s = self, TMP_5), $a).call($b).$defer();
              });
              $opal.defn(self, '$create', TMP_6 = function() {
                var TMP_7, $a, $b, self = this, $iter = TMP_6._p, block = $iter || nil;
                TMP_6._p = null;
                return ($a = ($b = self).$proc, $a._p = (TMP_7 = function() {var self = TMP_7._s || this, $a, $b, TMP_8, key = nil;
                  key = self['$id!']();
                  if (($a = (($b = key !== false && key !== nil) ? self.$storage()['$[]'](key) : $b)) !== false && $a !== nil) {
                    if (block !== false && block !== nil) {
                      return block.$call("error")
                      } else {
                      return nil
                    }
                    } else {
                    ($a = ($b = self.$adapter().$autoincrement()).$each, $a._p = (TMP_8 = function(name) {var self = TMP_8._s || this, $a;if (name == null) name = nil;
                      if (($a = self.$__send__(name)) !== false && $a !== nil) {
                        return nil
                        } else {
                        return self.$__send__("" + (name) + "=", self.$adapter()['$autoincrement!'](name, self.$storage()))
                      }}, TMP_8._s = self, TMP_8), $a).call($b);
                    self.$storage()['$[]='](self['$id!'](), self);
                    if (block !== false && block !== nil) {
                      return block.$call("ok")
                      } else {
                      return nil
                    };
                  };}, TMP_7._s = self, TMP_7), $a).call($b).$defer();
              });
              $opal.defn(self, '$save', TMP_9 = function() {
                var TMP_10, $a, $b, self = this, $iter = TMP_9._p, block = $iter || nil;
                TMP_9._p = null;
                return ($a = ($b = self).$proc, $a._p = (TMP_10 = function() {var self = TMP_10._s || this, $a;
                  if (($a = self.$storage()['$[]'](self['$id!']())) !== false && $a !== nil) {
                    self.$storage()['$[]='](self['$id!'](), self);
                    if (block !== false && block !== nil) {
                      return block.$call("ok")
                      } else {
                      return nil
                    };
                  } else if (block !== false && block !== nil) {
                    return block.$call("error")
                    } else {
                    return nil
                  }}, TMP_10._s = self, TMP_10), $a).call($b).$defer();
              });
              return ($opal.defn(self, '$destroy', TMP_11 = function() {
                var TMP_12, $a, $b, self = this, $iter = TMP_11._p, block = $iter || nil;
                TMP_11._p = null;
                return ($a = ($b = self).$proc, $a._p = (TMP_12 = function() {var self = TMP_12._s || this, $a;
                  if (($a = self.$storage()['$[]'](self['$id!']())) !== false && $a !== nil) {
                    self.$storage().$delete(self['$id!']());
                    if (block !== false && block !== nil) {
                      return block.$call("ok")
                      } else {
                      return nil
                    };
                  } else if (block !== false && block !== nil) {
                    return block.$call("error")
                    } else {
                    return nil
                  }}, TMP_12._s = self, TMP_12), $a).call($b).$defer();
              }), nil);}, TMP_3._s = self, TMP_3), $a).call($b)
            } else {
            return ($a = ($c = self['for']).$instance_eval, $a._p = (TMP_13 = function() {var self = TMP_13._s || this, TMP_14;
              $opal.defs(self, '$storage', function() {
                var self = this;
                return $gvars["window"].$storage(self.$adapter().$model().$name());
              });
              $opal.defn(self, '$storage', function() {
                var self = this;
                return self.$class().$storage();
              });
              return ($opal.defs(self, '$fetch', TMP_14 = function(args) {
                var TMP_15, $a, $b, self = this, $iter = TMP_14._p, block = $iter || nil;
                args = $slice.call(arguments, 0);
                TMP_14._p = null;
                return ($a = ($b = self).$proc, $a._p = (TMP_15 = function() {var self = TMP_15._s || this, TMP_16, $a, $b;
                  return block.$call(self.$new(($a = ($b = self.$storage()).$map, $a._p = (TMP_16 = function(name, value) {var self = TMP_16._s || this, $a, $b, $c, $d;if (name == null) name = nil;if (value == null) value = nil;
                    if (($a = ($b = ($c = (($d = $scope.Array) == null ? $opal.cm('Array') : $d)['$==='](name), $c !== false && $c !== nil ?name.$length()['$=='](2) : $c), $b !== false && $b !== nil ?name.$first()['$==']("__autoincrement__") : $b)) !== false && $a !== nil) {
                      return nil;};
                    if (($a = ((($b = ($c = self.$adapter().$filter(), ($c === nil || $c === false))) !== false && $b !== nil) ? $b : ($c = self.$adapter().$filter()).$call.apply($c, [value].concat(args)))) !== false && $a !== nil) {
                      return value
                      } else {
                      return nil
                    };}, TMP_16._s = self, TMP_16), $a).call($b).$compact()))}, TMP_15._s = self, TMP_15), $a).call($b).$defer();
              }), nil);}, TMP_13._s = self, TMP_13), $a).call($c)
          };
        };

        return (def.$uninstall = function() {
          var $a, TMP_17, $b, TMP_18, $c, self = this;
          if (($a = self['$model?']()) !== false && $a !== nil) {
            return ($a = ($b = self['for']).$instance_eval, $a._p = (TMP_17 = function() {var self = TMP_17._s || this;
              (function(self) {
                var $scope = self._scope, def = self._proto;
                self.$remove_method("storage");
                return self.$remove_method("fetch");
              })(self.$singleton_class());
              self.$remove_method("storage");
              self.$remove_method("create");
              self.$remove_method("save");
              return self.$remove_method("destroy");}, TMP_17._s = self, TMP_17), $a).call($b)
            } else {
            return ($a = ($c = self['for']).$instance_eval, $a._p = (TMP_18 = function() {var self = TMP_18._s || this;
              (function(self) {
                var $scope = self._scope, def = self._proto;
                self.$remove_method("storage");
                return self.$remove_method("fetch");
              })(self.$singleton_class());
              return self.$remove_method("storage");}, TMP_18._s = self, TMP_18), $a).call($c)
          };
        }, nil);
      })(self, (($a = $scope.Adapter) == null ? $opal.cm('Adapter') : $a))
    })(self, null)
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var $a, $b, self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass, $hash2 = $opal.hash2;
  $opal.add_stubs(['$expose', '$fragment!', '$router', '$route', '$go', '$[]', '$new', '$on', '$render', '$update', '$html', '$header!', '$div', '$input!', '$page!', '$css', '$rule', '$width', '$%', '$height', '$background', '$color', '$font', '$px', '$text']);
  return (function($base, $super) {
    function Shekels(){};
    var self = Shekels = $klass($base, $super, 'Shekels', Shekels);

    var def = Shekels._proto, $scope = Shekels._scope, TMP_1, TMP_6, $a, $b, TMP_7, $c;
    def.router = nil;
    self.$expose("@page");

    self.$expose("refresh");

    def.$initialize = TMP_1 = function() {var $zuper = $slice.call(arguments, 0);
      var TMP_2, $a, $b, TMP_3, $c, TMP_4, $d, $e, TMP_5, self = this, $iter = TMP_1._p, $yield = $iter || nil;
      TMP_1._p = null;
      $opal.find_super_dispatcher(self, 'initialize', TMP_1, $iter).apply(self, $zuper);
      self.$router()['$fragment!']();
      ($a = ($b = self).$route, $a._p = (TMP_2 = function() {var self = TMP_2._s || this;
        if (self.page == null) self.page = nil;

        return self.page.$go("index")}, TMP_2._s = self, TMP_2), $a).call($b, "/");
      ($a = ($c = self).$route, $a._p = (TMP_3 = function(params) {var self = TMP_3._s || this;
        if (self.page == null) self.page = nil;
if (params == null) params = nil;
        return self.page.$go("person", params['$[]']("name"))}, TMP_3._s = self, TMP_3), $a).call($c, "/person/:name");
      ($a = ($d = self).$route, $a._p = (TMP_4 = function(params) {var self = TMP_4._s || this;
        if (self.page == null) self.page = nil;
if (params == null) params = nil;
        return self.page.$go("item", params['$[]']("name"))}, TMP_4._s = self, TMP_4), $a).call($d, "/item/:name");
      self.header = (($a = ((($e = $scope.Component) == null ? $opal.cm('Component') : $e))._scope).Header == null ? $a.cm('Header') : $a.Header).$new(self);
      self.input = (($a = ((($e = $scope.Component) == null ? $opal.cm('Component') : $e))._scope).Input == null ? $a.cm('Input') : $a.Input).$new(self);
      self.page = (($a = ((($e = $scope.Component) == null ? $opal.cm('Component') : $e))._scope).Page == null ? $a.cm('Page') : $a.Page).$new(self);
      return ($a = ($e = self).$on, $a._p = (TMP_5 = function() {var self = TMP_5._s || this;
        if (self.header == null) self.header = nil;
        if (self.input == null) self.input = nil;
        if (self.page == null) self.page = nil;

        self.header.$render();
        self.input.$render();
        return self.page.$render();}, TMP_5._s = self, TMP_5), $a).call($e, "render");
    };

    def.$refresh = function() {
      var self = this;
      return self.router.$update();
    };

    ($a = ($b = self).$html, $a._p = (TMP_6 = function() {var self = TMP_6._s || this;
      self.$div()['$header!']();
      self.$div()['$input!']();
      return self.$div()['$page!']();}, TMP_6._s = self, TMP_6), $a).call($b);

    return ($a = ($c = self).$css, $a._p = (TMP_7 = function() {var self = TMP_7._s || this, TMP_8, $a, $b, TMP_9, $c, TMP_10, $d, TMP_11, $e;
      ($a = ($b = self).$rule, $a._p = (TMP_8 = function() {var self = TMP_8._s || this;
        self.$width((100)['$%']());
        self.$height((100)['$%']());
        self.$background("#fff");
        self.$color("#222");
        self.$font($hash2(["family"], {"family": "Quicksand"}));
        self.$font($hash2(["size"], {"size": (22).$px()}));
        return self.$text($hash2(["align"], {"align": "center"}));}, TMP_8._s = self, TMP_8), $a).call($b, "body");
      ($a = ($c = self).$rule, $a._p = (TMP_9 = function() {var self = TMP_9._s || this;
        self.$font($hash2(["weight"], {"weight": "bold"}));
        self.$color("#222");
        return self.$text($hash2(["decoration"], {"decoration": "none"}));}, TMP_9._s = self, TMP_9), $a).call($c, "a");
      ($a = ($d = self).$rule, $a._p = (TMP_10 = function() {var self = TMP_10._s || this;
        return self.$color("#b94a48")}, TMP_10._s = self, TMP_10), $a).call($d, ".negative");
      return ($a = ($e = self).$rule, $a._p = (TMP_11 = function() {var self = TMP_11._s || this;
        return self.$color("#468847")}, TMP_11._s = self, TMP_11), $a).call($e, ".positive");}, TMP_7._s = self, TMP_7), $a).call($c);
  })(self, (($a = ((($b = $scope.Lissio) == null ? $opal.cm('Lissio') : $b))._scope).Application == null ? $a.cm('Application') : $a.Application))
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $hash2 = $opal.hash2;
  $opal.add_stubs(['$new', '$merge', '$attr_reader', '$==', '$[]', '$inner_html=', '$element', '$<<', '$tag', '$css', '$rule', '$border', '$px', '$padding', '$font', '$length', '$first', '$rand', '$class_names', '$define_singleton_method', '$+', '$instance_exec', '$to_proc', '$background', '$color', '$empty?', '$join', '$customize']);
  return (function($base) {
    var self = $module($base, 'Lissio');

    var def = self._proto, $scope = self._scope;
    (function($base, $super) {
      function Component(){};
      var self = Component = $klass($base, $super, 'Component', Component);

      var def = Component._proto, $scope = Component._scope, $a;
      return (function($base, $super) {
        function Alert(){};
        var self = Alert = $klass($base, $super, 'Alert', Alert);

        var def = Alert._proto, $scope = Alert._scope, TMP_1, $a, $b, TMP_4;
        def.options = def.message = nil;
        $opal.defs(self, '$new!', function(message, options) {
          var self = this;
          if (options == null) {
            options = $hash2([], {})
          }
          return self.$new(message, options.$merge($hash2(["escape"], {"escape": false})));
        });

        self.$attr_reader("message", "options");

        def.$initialize = function(message, options) {
          var self = this;
          if (options == null) {
            options = $hash2([], {})
          }
          self.message = message;
          return self.options = options;
        };

        def.$render = function() {
          var self = this;
          if (self.options['$[]']("escape")['$=='](false)) {
            return self.$element()['$inner_html='](self.message)
            } else {
            return self.$element()['$<<'](self.message)
          };
        };

        self.$tag($hash2(["class"], {"class": "alert"}));

        ($a = ($b = self).$css, $a._p = (TMP_1 = function() {var self = TMP_1._s || this, TMP_2, $a, $b;
          return ($a = ($b = self).$rule, $a._p = (TMP_2 = function() {var self = TMP_2._s || this, TMP_3, $a, $b;
            self.$border((1).$px(), "solid", "transparent");
            self.$padding((15).$px());
            return ($a = ($b = self).$rule, $a._p = (TMP_3 = function() {var self = TMP_3._s || this;
              return self.$font($hash2(["weight"], {"weight": "bold"}))}, TMP_3._s = self, TMP_3), $a).call($b, "a");}, TMP_2._s = self, TMP_2), $a).call($b, ".alert")}, TMP_1._s = self, TMP_1), $a).call($b);

        $opal.defs(self, '$customize', TMP_4 = function(args) {
          var $a, TMP_5, $b, $c, self = this, $iter = TMP_4._p, block = $iter || nil, options = nil, name = nil, inherited = nil;
          args = $slice.call(arguments, 0);
          TMP_4._p = null;
          if (args.$length()['$=='](1)) {
            options = args.$first()
            } else {
            $a = $opal.to_ary(args), name = ($a[0] == null ? nil : $a[0]), options = ($a[1] == null ? nil : $a[1])
          };
          ((($a = name) !== false && $a !== nil) ? $a : name = "alert-custom-" + (self.$rand(10000)));
          ((($a = options) !== false && $a !== nil) ? $a : options = $hash2([], {}));
          if (self['$==']((($a = $scope.Alert) == null ? $opal.cm('Alert') : $a))) {
            inherited = []
            } else {
            inherited = self.$class_names()
          };
          return ($a = ($b = (($c = $scope.Class) == null ? $opal.cm('Class') : $c)).$new, $a._p = (TMP_5 = function() {var self = TMP_5._s || this, TMP_6, $a, $b, TMP_7, $c;
            ($a = ($b = self).$define_singleton_method, $a._p = (TMP_6 = function() {var self = TMP_6._s || this;
              return inherited['$+']([name])}, TMP_6._s = self, TMP_6), $a).call($b, "class_names");
            self.$tag($hash2(["class"], {"class": ["alert", name].concat(inherited)}));
            return ($a = ($c = self).$css, $a._p = (TMP_7 = function() {var self = TMP_7._s || this, TMP_8, $a, $b, $c;
              return ($a = ($b = self).$rule, $a._p = (TMP_8 = function() {var self = TMP_8._s || this, $a, $b, $c, value = nil;
                if (block !== false && block !== nil) {
                  ($a = ($b = self).$instance_exec, $a._p = block.$to_proc(), $a).call($b)};
                if (($a = value = ((($c = options['$[]']("background")) !== false && $c !== nil) ? $c : options['$[]']("bg"))) !== false && $a !== nil) {
                  self.$background($hash2(["color"], {"color": value}))};
                if (($a = value = ((($c = options['$[]']("foreground")) !== false && $c !== nil) ? $c : options['$[]']("fg"))) !== false && $a !== nil) {
                  self.$color(value)};
                if (($a = value = options['$[]']("border")) !== false && $a !== nil) {
                  self.$border($hash2(["color"], {"color": value}))};
                if (($a = value = options['$[]']("padding")) !== false && $a !== nil) {
                  return self.$padding(value)
                  } else {
                  return nil
                };}, TMP_8._s = self, TMP_8), $a).call($b, ".alert" + ((function() {if (($c = inherited['$empty?']()) !== false && $c !== nil) {
                return nil
                } else {
                return "." + (inherited.$join("."))
              }; return nil; })()) + "." + (name))}, TMP_7._s = self, TMP_7), $a).call($c);}, TMP_5._s = self, TMP_5), $a).call($b, self);
        });

        $opal.cdecl($scope, 'Info', self.$customize("info", $hash2(["background", "foreground", "border"], {"background": "#d9edf7", "foreground": "#3a87ad", "border": "#bce8f1"})));

        $opal.cdecl($scope, 'Success', self.$customize("success", $hash2(["message", "background", "foreground", "border"], {"message": "The operation was successful.", "background": "#dff0d8", "foreground": "#468847", "border": "#d6e9c6"})));

        $opal.cdecl($scope, 'Warning', self.$customize("warning", $hash2(["message", "background", "foreground", "border"], {"message": "Something might have gone wrong.", "background": "#fcf8e3", "foreground": "#c09853", "border": "#fbeed5"})));

        return $opal.cdecl($scope, 'Danger', self.$customize("danger", $hash2(["message", "background", "foreground", "border"], {"message": "An unexpected error has occurred.", "background": "#f2dede", "foreground": "#b94a48", "border": "#eed3d7"})));
      })(self, (($a = $scope.Component) == null ? $opal.cm('Component') : $a))
    })(self, null)
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $hash2 = $opal.hash2;
  $opal.add_stubs(['$customize']);
  ;
  return (function($base) {
    var self = $module($base, 'Component');

    var def = self._proto, $scope = self._scope, $a, $b, $c, $d;
    $opal.cdecl($scope, 'Info', (($a = ((($b = ((($c = $scope.Lissio) == null ? $opal.cm('Lissio') : $c))._scope).Component == null ? $b.cm('Component') : $b.Component))._scope).Alert == null ? $a.cm('Alert') : $a.Alert));

    $opal.cdecl($scope, 'Danger', (($a = ((($b = ((($c = ((($d = $scope.Lissio) == null ? $opal.cm('Lissio') : $d))._scope).Component == null ? $c.cm('Component') : $c.Component))._scope).Alert == null ? $b.cm('Alert') : $b.Alert))._scope).Danger == null ? $a.cm('Danger') : $a.Danger).$customize($hash2(["background", "border"], {"background": "transparent", "border": "transparent"})));
    
  })(self);
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $hash2 = $opal.hash2;
  $opal.add_stubs(['$on', '$navigate', '$element', '$html', '$title', '$div', '$subtitle', '$css', '$rule', '$cursor', '$margin', '$px', '$font']);
  return (function($base) {
    var self = $module($base, 'Component');

    var def = self._proto, $scope = self._scope, $a, $b;
    (function($base, $super) {
      function Header(){};
      var self = Header = $klass($base, $super, 'Header', Header);

      var def = Header._proto, $scope = Header._scope, TMP_1, $a, $b, TMP_2, $c, TMP_3, $d;
      ($a = ($b = self).$on, $a._p = (TMP_1 = function() {var self = TMP_1._s || this, $a;
        return (($a = $scope.Shekels) == null ? $opal.cm('Shekels') : $a).$navigate("/")}, TMP_1._s = self, TMP_1), $a).call($b, "click", ".title, .subtitle");

      self.$element("#header");

      ($a = ($c = self).$html, $a._p = (TMP_2 = function() {var self = TMP_2._s || this;
        self.$div().$title("MUH SHEKELS");
        return self.$div().$subtitle("השקלים שלי");}, TMP_2._s = self, TMP_2), $a).call($c);

      return ($a = ($d = self).$css, $a._p = (TMP_3 = function() {var self = TMP_3._s || this, TMP_4, $a, $b;
        return ($a = ($b = self).$rule, $a._p = (TMP_4 = function() {var self = TMP_4._s || this, TMP_5, $a, $b, TMP_6, $c;
          self.$cursor("default");
          self.$margin($hash2(["top", "bottom"], {"top": (20).$px(), "bottom": (20).$px()}));
          ($a = ($b = self).$rule, $a._p = (TMP_5 = function() {var self = TMP_5._s || this;
            return self.$font($hash2(["size"], {"size": (60).$px()}))}, TMP_5._s = self, TMP_5), $a).call($b, ".title");
          return ($a = ($c = self).$rule, $a._p = (TMP_6 = function() {var self = TMP_6._s || this;
            return self.$font($hash2(["size"], {"size": (24).$px()}))}, TMP_6._s = self, TMP_6), $a).call($c, ".subtitle");}, TMP_4._s = self, TMP_4), $a).call($b, "#header")}, TMP_3._s = self, TMP_3), $a).call($d);
    })(self, (($a = ((($b = $scope.Lissio) == null ? $opal.cm('Lissio') : $b))._scope).Component == null ? $a.cm('Component') : $a.Component))
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $hash2 = $opal.hash2;
  $opal.add_stubs(['$on', '$==', '$key', '$empty?', '$value', '$target', '$split', '$downcase', '$first', '$===', '$to_f', '$shift', '$to_a', '$slice_before', '$join', '$drop', '$flatten', '$create', '$refresh', '$new', '$fetch', '$recipient', '$navigate', '$render', '$page', '$clear', '$element', '$html', '$shekel', '$div', '$place_holder', '$input', '$sample', '$css', '$rule', '$display', '$border', '$px', '$padding', '$background', '$color', '$width', '$ch']);
  return (function($base) {
    var self = $module($base, 'Component');

    var def = self._proto, $scope = self._scope, $a, $b;
    (function($base, $super) {
      function Input(){};
      var self = Input = $klass($base, $super, 'Input', Input);

      var def = Input._proto, $scope = Input._scope, TMP_1, $a, $b, TMP_8, $c, TMP_9, $d;
      ($a = ($b = self).$on, $a._p = (TMP_1 = function(e) {var self = TMP_1._s || this, $a, $b, $c, TMP_2, TMP_3, $d, TMP_5, $e, TMP_7, $f, words = nil, first = nil, $case = nil, amount = nil, name = nil, rest = nil;if (e == null) e = nil;
        if (($a = (($b = e.$key()['$==']("Enter")) ? ($c = e.$target().$value()['$empty?'](), ($c === nil || $c === false)) : $b)) === false || $a === nil) {
          return nil;};
        words = e.$target().$value().$split(/\s+/);
        first = words.$first().$downcase();
        $case = first;if (/^\d+(\.\d+)?$/['$===']($case)) {amount = words.$shift().$to_f();
        first = words.$shift();
        $a = $opal.to_ary(words.$slice_before("for").$to_a()), name = ($a[0] == null ? nil : $a[0]), rest = $slice.call($a, 1);
        name = name.$join(" ");
        rest = rest.$flatten().$drop(1).$join(" ");
        $case = first;if ("for"['$===']($case)) {($a = ($b = (($c = $scope.Payment) == null ? $opal.cm('Payment') : $c).$new($hash2(["for", "amount", "sign"], {"for": words.$join(" "), "amount": amount, "sign": "-"}))).$create, $a._p = (TMP_2 = function() {var self = TMP_2._s || this, $a;
          return (($a = $scope.Shekels) == null ? $opal.cm('Shekels') : $a).$refresh()}, TMP_2._s = self, TMP_2), $a).call($b)}else if ("to"['$===']($case)) {($a = ($c = (($d = $scope.Person) == null ? $opal.cm('Person') : $d).$new($hash2(["name"], {"name": name}))).$create, $a._p = (TMP_3 = function() {var self = TMP_3._s || this, TMP_4, $a, $b, $c;
          return ($a = ($b = (($c = $scope.Payment) == null ? $opal.cm('Payment') : $c).$new($hash2(["recipient", "for", "amount", "sign"], {"recipient": (($c = $scope.Person) == null ? $opal.cm('Person') : $c).$new($hash2(["name"], {"name": name})), "for": ((function() {if (($c = rest['$empty?']()) !== false && $c !== nil) {
            return nil
            } else {
            return rest
          }; return nil; })()), "amount": amount, "sign": "-"}))).$create, $a._p = (TMP_4 = function() {var self = TMP_4._s || this, $a;
            return (($a = $scope.Shekels) == null ? $opal.cm('Shekels') : $a).$refresh()}, TMP_4._s = self, TMP_4), $a).call($b)}, TMP_3._s = self, TMP_3), $a).call($c)}else if ("from"['$===']($case)) {($a = ($d = (($e = $scope.Person) == null ? $opal.cm('Person') : $e).$new($hash2(["name"], {"name": name}))).$create, $a._p = (TMP_5 = function() {var self = TMP_5._s || this, TMP_6, $a, $b, $c;
          return ($a = ($b = (($c = $scope.Payment) == null ? $opal.cm('Payment') : $c).$new($hash2(["recipient", "for", "amount", "sign"], {"recipient": (($c = $scope.Person) == null ? $opal.cm('Person') : $c).$new($hash2(["name"], {"name": name})), "for": ((function() {if (($c = rest['$empty?']()) !== false && $c !== nil) {
            return nil
            } else {
            return rest
          }; return nil; })()), "amount": amount, "sign": "+"}))).$create, $a._p = (TMP_6 = function() {var self = TMP_6._s || this, $a;
            return (($a = $scope.Shekels) == null ? $opal.cm('Shekels') : $a).$refresh()}, TMP_6._s = self, TMP_6), $a).call($b)}, TMP_5._s = self, TMP_5), $a).call($d)};}else if ("for"['$===']($case)) {nil}else if ("to"['$===']($case)) {nil}else if ("from"['$===']($case)) {nil}else {name = words.$join(" ");
        ($a = ($e = (($f = $scope.Payments) == null ? $opal.cm('Payments') : $f)).$fetch, $a._p = (TMP_7 = function(p) {var self = TMP_7._s || this, $a, $b, $c;if (p == null) p = nil;
          if (($a = ($b = (($c = $scope.Payments) == null ? $opal.cm('Payments') : $c)['$==='](p), $b !== false && $b !== nil ?($c = p['$empty?'](), ($c === nil || $c === false)) : $b)) !== false && $a !== nil) {
            p = p.$first();
            if (($a = (($b = $scope.Person) == null ? $opal.cm('Person') : $b)['$==='](p.$recipient())) !== false && $a !== nil) {
              return (($a = $scope.Shekels) == null ? $opal.cm('Shekels') : $a).$navigate("/person/" + (words.$join(" ")))
              } else {
              return (($a = $scope.Shekels) == null ? $opal.cm('Shekels') : $a).$navigate("/item/" + (words.$join(" ")))
            };
            } else {
            return (($a = $scope.Shekels) == null ? $opal.cm('Shekels') : $a).$page().$render((($a = $scope.Danger) == null ? $opal.cm('Danger') : $a).$new("Unknown recipient."))
          }}, TMP_7._s = self, TMP_7), $a).call($e, $hash2(["name"], {"name": name}));};
        return e.$target().$clear();}, TMP_1._s = self, TMP_1), $a).call($b, "keydown", "input");

      self.$element("#input");

      ($a = ($c = self).$html, $a._p = (TMP_8 = function() {var self = TMP_8._s || this;
        self.$div().$shekel("₪");
        return self.$input().$place_holder(["2.30 from John", "13.37 to Richard", "42 for groceries"].$sample());}, TMP_8._s = self, TMP_8), $a).call($c);

      return ($a = ($d = self).$css, $a._p = (TMP_9 = function() {var self = TMP_9._s || this, TMP_10, $a, $b;
        return ($a = ($b = self).$rule, $a._p = (TMP_10 = function() {var self = TMP_10._s || this, TMP_11, $a, $b, TMP_12, $c;
          ($a = ($b = self).$rule, $a._p = (TMP_11 = function() {var self = TMP_11._s || this;
            self.$display("inline-block");
            self.$border((1).$px(), "solid", "#555");
            self.$border($hash2(["right"], {"right": "none"}));
            return self.$padding($hash2(["left", "right", "top", "bottom"], {"left": (4).$px(), "right": (4).$px(), "top": (3).$px(), "bottom": (3).$px()}));}, TMP_11._s = self, TMP_11), $a).call($b, ".shekel");
          return ($a = ($c = self).$rule, $a._p = (TMP_12 = function() {var self = TMP_12._s || this;
            self.$display("inline-block");
            self.$background("#fff");
            self.$color("#222");
            self.$border((1).$px(), "solid", "#555");
            self.$border($hash2(["left"], {"left": "none"}));
            self.$padding((3).$px());
            return self.$width((32).$ch());}, TMP_12._s = self, TMP_12), $a).call($c, "input");}, TMP_10._s = self, TMP_10), $a).call($b, "#input")}, TMP_9._s = self, TMP_9), $a).call($d);
    })(self, (($a = ((($b = $scope.Lissio) == null ? $opal.cm('Lissio') : $b))._scope).Component == null ? $a.cm('Component') : $a.Component))
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $hash2 = $opal.hash2;
  $opal.add_stubs(['$===', '$fetch', '$render', '$new', '$empty?', '$reduce', '$map', '$amount', '$==', '$sign', '$-@', '$<', '$new!', '$compact!', '$clear', '$element', '$each', '$<<', '$css', '$rule', '$width', '$%', '$margin', '$px']);
  return (function($base) {
    var self = $module($base, 'Component');

    var def = self._proto, $scope = self._scope, $a, $b;
    (function($base, $super) {
      function Page(){};
      var self = Page = $klass($base, $super, 'Page', Page);

      var def = Page._proto, $scope = Page._scope, TMP_5, $a, $b;
      def.content = nil;
      def.$go = function(page, data) {
        var TMP_1, $a, $b, $c, TMP_2, $d, self = this, $case = nil;
        if (data == null) {
          data = nil
        }
        return (function() {$case = page;if ("index"['$===']($case)) {return ($a = ($b = (($c = $scope.Payments) == null ? $opal.cm('Payments') : $c)).$fetch, $a._p = (TMP_1 = function(payments) {var self = TMP_1._s || this, $a, $b, $c;if (payments == null) payments = nil;
          if (($a = ($b = (($c = $scope.Payments) == null ? $opal.cm('Payments') : $c)['$==='](payments), ($b === nil || $b === false))) !== false && $a !== nil) {
            return self.$render((($a = $scope.Danger) == null ? $opal.cm('Danger') : $a).$new("Failed to load payments."))
          } else if (($a = payments['$empty?']()) !== false && $a !== nil) {
            return self.$render((($a = $scope.Info) == null ? $opal.cm('Info') : $a).$new("No payments."))
            } else {
            return self.$render((($a = $scope.PaymentList) == null ? $opal.cm('PaymentList') : $a).$new(self, payments))
          }}, TMP_1._s = self, TMP_1), $a).call($b)}else if ("person"['$===']($case)) {return ($a = ($c = (($d = $scope.Payments) == null ? $opal.cm('Payments') : $d)).$fetch, $a._p = (TMP_2 = function(payments) {var self = TMP_2._s || this, $a, $b, $c, TMP_3, shekels = nil;if (payments == null) payments = nil;
          if (($a = ($b = (($c = $scope.Payments) == null ? $opal.cm('Payments') : $c)['$==='](payments), ($b === nil || $b === false))) !== false && $a !== nil) {
            return self.$render((($a = $scope.Danger) == null ? $opal.cm('Danger') : $a).$new("Failed to load payments."))
            } else {
            shekels = ($a = ($b = payments).$map, $a._p = (TMP_3 = function(p) {var self = TMP_3._s || this, amount = nil;if (p == null) p = nil;
              amount = p.$amount();
              if (p.$sign()['$==']("-")) {
                amount = amount['$-@']()};
              return amount;}, TMP_3._s = self, TMP_3), $a).call($b).$reduce(0, "+");
            if (shekels['$=='](0)) {
              return self.$render((($a = $scope.Info) == null ? $opal.cm('Info') : $a).$new("Yours and " + (data) + "'s shekels are at peace."))
            } else if (shekels['$<'](0)) {
              return self.$render((($a = $scope.Info) == null ? $opal.cm('Info') : $a)['$new!']("You owe ₪ <span class='negative'>" + (shekels['$-@']()) + "</span> to " + (data) + "."))
              } else {
              return self.$render((($a = $scope.Info) == null ? $opal.cm('Info') : $a)['$new!']("" + (data) + " owes you ₪ <span class='positive'>" + (shekels) + "</span>."))
            };
          }}, TMP_2._s = self, TMP_2), $a).call($c, $hash2(["name"], {"name": data}))}else if ("item"['$===']($case)) {return self.$render((($a = $scope.Info) == null ? $opal.cm('Info') : $a).$new("No payments."))}else { return nil }})();
      };

      def.$render = function(content) {
        var $a, TMP_4, $b, self = this;
        content = $slice.call(arguments, 0);
        if (($a = content['$empty?']()) !== false && $a !== nil) {
          content = [].concat(self.content)};
        content['$compact!']();
        self.$element().$clear();
        return ($a = ($b = content).$each, $a._p = (TMP_4 = function(c) {var self = TMP_4._s || this, $a, $b;if (c == null) c = nil;
          if (($a = (($b = $scope.String) == null ? $opal.cm('String') : $b)['$==='](c)) !== false && $a !== nil) {
            return self.$element()['$<<'](c)
            } else {
            return self.$element()['$<<']((c.$render(), c.$element()))
          }}, TMP_4._s = self, TMP_4), $a).call($b);
      };

      self.$element("#page");

      return ($a = ($b = self).$css, $a._p = (TMP_5 = function() {var self = TMP_5._s || this, TMP_6, $a, $b;
        return ($a = ($b = self).$rule, $a._p = (TMP_6 = function() {var self = TMP_6._s || this;
          self.$width((100)['$%']());
          return self.$margin((20).$px(), "auto");}, TMP_6._s = self, TMP_6), $a).call($b, "#page")}, TMP_5._s = self, TMP_5), $a).call($b);
    })(self, (($a = ((($b = $scope.Lissio) == null ? $opal.cm('Lissio') : $b))._scope).Component == null ? $a.cm('Component') : $a.Component))
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $module = $opal.module, $klass = $opal.klass, $hash2 = $opal.hash2;
  $opal.add_stubs(['$attr_accessor', '$destroy', '$parent', '$next_element', '$previous_element', '$==', '$class_name', '$remove', '$length', '$children', '$refresh', '$tag', '$html', '$each', '$-', '$at', '$*', '$wday', '$strftime', '$+', '$week', '$start', '$span', '$separator', '$end', '$div', '$recipient', '$sign', '$on', '$target', '$text', '$remover', '$negative', '$to_s', '$amount', '$stop!', '$navigate', '$[]', '$href', '$a', '$name', '$for', '$positive', '$reverse', '$sort_by', '$to_proc', '$css', '$rule', '$width', '$%', '$line', '$em', '$border', '$px', '$font', '$ch', '$margin', '$padding', '$cursor']);
  return (function($base) {
    var self = $module($base, 'Component');

    var def = self._proto, $scope = self._scope, $a, $b;
    (function($base, $super) {
      function PaymentList(){};
      var self = PaymentList = $klass($base, $super, 'PaymentList', PaymentList);

      var def = PaymentList._proto, $scope = PaymentList._scope, TMP_1, TMP_2, $a, $b, TMP_12, $c;
      self.$attr_accessor("payments");

      def.$initialize = TMP_1 = function(parent, payments) {
        var self = this, $iter = TMP_1._p, $yield = $iter || nil;
        if (payments == null) {
          payments = []
        }
        TMP_1._p = null;
        $opal.find_super_dispatcher(self, 'initialize', TMP_1, null).apply(self, [parent]);
        return self.payments = payments;
      };

      def.$remove = function(payment, target) {
        var $a, $b, $c, $d, self = this, parent = nil, succ = nil, prev = nil, list = nil;
        payment.$destroy();
        parent = target.$parent();
        succ = parent.$next_element();
        prev = parent.$previous_element();
        list = parent.$parent();
        if (($a = (($b = prev.$class_name()['$==']("week")) ? (((($c = ($d = succ, ($d === nil || $d === false))) !== false && $c !== nil) ? $c : succ.$class_name()['$==']("week"))) : $b)) !== false && $a !== nil) {
          prev.$remove();
          if (succ !== false && succ !== nil) {
            succ.$remove()};};
        parent.$remove();
        if (list.$children().$length()['$=='](0)) {
          return (($a = $scope.Shekels) == null ? $opal.cm('Shekels') : $a).$refresh()
          } else {
          return nil
        };
      };

      self.$tag($hash2(["name", "class"], {"name": "div", "class": "payment-list"}));

      ($a = ($b = self).$html, $a._p = (TMP_2 = function(d) {var self = TMP_2._s || this, TMP_3, $a, $b, $c, $d, previous = nil;
        if (self.payments == null) self.payments = nil;
if (d == null) d = nil;
        previous = nil;
        return ($a = ($b = ($c = ($d = self.payments).$sort_by, $c._p = "at".$to_proc(), $c).call($d).$reverse()).$each, $a._p = (TMP_3 = function(payment) {var self = TMP_3._s || this, $a, $b, TMP_4, TMP_5, $c, TMP_6, $d, current = nil, first = nil, last = nil;if (payment == null) payment = nil;
          if (previous !== false && previous !== nil) {
            previous = previous.$at()['$-'](((previous.$at().$wday()['$-'](1))['$*'](24)['$*'](60)['$*'](60)));
            current = payment.$at()['$-'](((payment.$at().$wday()['$-'](1))['$*'](24)['$*'](60)['$*'](60)));
            if (($a = ($b = previous.$strftime("%F")['$=='](current.$strftime("%F")), ($b === nil || $b === false))) !== false && $a !== nil) {
              first = current;
              last = first['$+'](((6)['$*'](24)['$*'](60)['$*'](60)));
              ($a = ($b = d.$div()).$week, $a._p = (TMP_4 = function() {var self = TMP_4._s || this;
                d.$span().$start(first.$strftime("%F"));
                d.$span().$separator("..");
                return d.$span().$end(last.$strftime("%F"));}, TMP_4._s = self, TMP_4), $a).call($b);};
            } else {
            first = payment.$at()['$-'](((payment.$at().$wday()['$-'](1))['$*'](24)['$*'](60)['$*'](60)));
            last = first['$+'](((6)['$*'](24)['$*'](60)['$*'](60)));
            ($a = ($c = d.$div()).$week, $a._p = (TMP_5 = function() {var self = TMP_5._s || this;
              d.$span().$start(first.$strftime("%F"));
              d.$span().$separator("..");
              return d.$span().$end(last.$strftime("%F"));}, TMP_5._s = self, TMP_5), $a).call($c);
          };
          previous = payment;
          return ($a = ($d = d).$div, $a._p = (TMP_6 = function() {var self = TMP_6._s || this, $a, TMP_7, $b, TMP_8, $c, TMP_9, $d, TMP_10, $e, TMP_11, $f;
            if (($a = payment.$recipient()) !== false && $a !== nil) {
              if (payment.$sign()['$==']("-")) {
                d.$span("You owe");
                ($a = ($b = d.$span().$remover().$text(" ₪ ")).$on, $a._p = (TMP_7 = function(e) {var self = TMP_7._s || this;if (e == null) e = nil;
                  return self.$remove(payment, e.$target())}, TMP_7._s = self, TMP_7), $a).call($b, "click");
                d.$span().$negative(payment.$amount().$to_s());
                d.$span(" to ");
                ($a = ($c = d.$a().$href("/person/" + (payment.$recipient().$name())).$text(payment.$recipient().$name())).$on, $a._p = (TMP_8 = function(e) {var self = TMP_8._s || this, $a;if (e == null) e = nil;
                  e['$stop!']();
                  return (($a = $scope.Shekels) == null ? $opal.cm('Shekels') : $a).$navigate(e.$target()['$[]']("href"));}, TMP_8._s = self, TMP_8), $a).call($c, "click");
                if (($a = payment.$for()) !== false && $a !== nil) {
                  d.$span(" for ");
                  d.$span(payment.$for());};
                d.$span(" on ");
                return d.$span(payment.$at().$strftime("%A"));
                } else {
                ($a = ($d = d.$a().$href("/person/" + (payment.$recipient().$name())).$text(payment.$recipient().$name())).$on, $a._p = (TMP_9 = function(e) {var self = TMP_9._s || this, $a;if (e == null) e = nil;
                  e['$stop!']();
                  return (($a = $scope.Shekels) == null ? $opal.cm('Shekels') : $a).$navigate(e.$target()['$[]']("href"));}, TMP_9._s = self, TMP_9), $a).call($d, "click");
                d.$span(" owes you");
                ($a = ($e = d.$span().$remover().$text(" ₪ ")).$on, $a._p = (TMP_10 = function(e) {var self = TMP_10._s || this;if (e == null) e = nil;
                  return self.$remove(payment, e.$target())}, TMP_10._s = self, TMP_10), $a).call($e, "click");
                d.$span().$positive(payment.$amount().$to_s());
                if (($a = payment.$for()) !== false && $a !== nil) {
                  d.$span(" for ");
                  d.$span(payment.$for());};
                d.$span(" on ");
                return d.$span(payment.$at().$strftime("%A"));
              }
              } else {
              d.$span("You spent");
              ($a = ($f = d.$span().$remover().$text(" ₪ ")).$on, $a._p = (TMP_11 = function(e) {var self = TMP_11._s || this;if (e == null) e = nil;
                return self.$remove(payment, e.$target())}, TMP_11._s = self, TMP_11), $a).call($f, "click");
              d.$span().$negative(payment.$amount().$to_s());
              if (($a = payment.$for()) !== false && $a !== nil) {
                d.$span(" for ");
                d.$span(payment.$for());};
              d.$span(" on ");
              return d.$span(payment.$at().$strftime("%A"));
            }}, TMP_6._s = self, TMP_6), $a).call($d);}, TMP_3._s = self, TMP_3), $a).call($b);}, TMP_2._s = self, TMP_2), $a).call($b);

      return ($a = ($c = self).$css, $a._p = (TMP_12 = function() {var self = TMP_12._s || this, TMP_13, $a, $b;
        return ($a = ($b = self).$rule, $a._p = (TMP_13 = function() {var self = TMP_13._s || this, TMP_14, $a, $b;
          self.$width((100)['$%']());
          return ($a = ($b = self).$rule, $a._p = (TMP_14 = function() {var self = TMP_14._s || this, TMP_15, $a, $b, TMP_17, $c;
            self.$line($hash2(["height"], {"height": (1.5).$em()}));
            ($a = ($b = self).$rule, $a._p = (TMP_15 = function() {var self = TMP_15._s || this, TMP_16, $a, $b;
              self.$border($hash2(["bottom"], {"bottom": [(1).$px(), "solid", "#555"]}));
              self.$font($hash2(["weight"], {"weight": "bold"}));
              self.$width((18).$ch());
              self.$margin((10).$px(), "auto");
              return ($a = ($b = self).$rule, $a._p = (TMP_16 = function() {var self = TMP_16._s || this;
                self.$font($hash2(["weight"], {"weight": "normal"}));
                return self.$padding($hash2(["left", "right"], {"left": (10).$px(), "right": (10).$px()}));}, TMP_16._s = self, TMP_16), $a).call($b, ".separator");}, TMP_15._s = self, TMP_15), $a).call($b, "&.week");
            return ($a = ($c = self).$rule, $a._p = (TMP_17 = function() {var self = TMP_17._s || this;
              return self.$cursor("crosshair")}, TMP_17._s = self, TMP_17), $a).call($c, ".remover");}, TMP_14._s = self, TMP_14), $a).call($b, "div");}, TMP_13._s = self, TMP_13), $a).call($b, ".payment-list")}, TMP_12._s = self, TMP_12), $a).call($c);
    })(self, (($a = ((($b = $scope.Lissio) == null ? $opal.cm('Lissio') : $b))._scope).Component == null ? $a.cm('Component') : $a.Component))
    
  })(self)
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice;
  $opal.add_stubs([]);
  ;
  ;
  ;
  ;
  return true;
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var $a, $b, self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass, $hash2 = $opal.hash2;
  $opal.add_stubs(['$adapter', '$property', '$fetch', '$to_proc', '$name']);
  return (function($base, $super) {
    function Person(){};
    var self = Person = $klass($base, $super, 'Person', Person);

    var def = Person._proto, $scope = Person._scope, $a, $b, $c, TMP_1, TMP_2;
    self.$adapter((($a = ((($b = ((($c = $scope.Lissio) == null ? $opal.cm('Lissio') : $c))._scope).Adapter == null ? $b.cm('Adapter') : $b.Adapter))._scope).Storage == null ? $a.cm('Storage') : $a.Storage));

    self.$property("name", $hash2(["primary"], {"primary": true}));

    def.$debts = TMP_1 = function() {
      var $a, $b, $c, self = this, $iter = TMP_1._p, block = $iter || nil;
      TMP_1._p = null;
      return ($a = ($b = (($c = $scope.Payments) == null ? $opal.cm('Payments') : $c)).$fetch, $a._p = block.$to_proc(), $a).call($b, $hash2(["name", "sign"], {"name": self.$name(), "sign": "-"}));
    };

    return (def.$credits = TMP_2 = function() {
      var $a, $b, $c, self = this, $iter = TMP_2._p, block = $iter || nil;
      TMP_2._p = null;
      return ($a = ($b = (($c = $scope.Payments) == null ? $opal.cm('Payments') : $c)).$fetch, $a._p = block.$to_proc(), $a).call($b, $hash2(["name", "sign"], {"name": self.$name(), "sign": "+"}));
    }, nil);
  })(self, (($a = ((($b = $scope.Lissio) == null ? $opal.cm('Lissio') : $b))._scope).Model == null ? $a.cm('Model') : $a.Model))
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var $a, $b, self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass, $hash2 = $opal.hash2;
  $opal.add_stubs(['$adapter', '$property']);
  return (function($base, $super) {
    function Item(){};
    var self = Item = $klass($base, $super, 'Item', Item);

    var def = Item._proto, $scope = Item._scope, $a, $b, $c;
    self.$adapter((($a = ((($b = ((($c = $scope.Lissio) == null ? $opal.cm('Lissio') : $c))._scope).Adapter == null ? $b.cm('Adapter') : $b.Adapter))._scope).Storage == null ? $a.cm('Storage') : $a.Storage));

    return self.$property("name", $hash2(["primary"], {"primary": true}));
  })(self, (($a = ((($b = $scope.Lissio) == null ? $opal.cm('Lissio') : $b))._scope).Model == null ? $a.cm('Model') : $a.Model))
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var $a, $b, self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass, $hash2 = $opal.hash2;
  $opal.add_stubs(['$adapter', '$autoincrement', '$property', '$lambda', '$now']);
  return (function($base, $super) {
    function Payment(){};
    var self = Payment = $klass($base, $super, 'Payment', Payment);

    var def = Payment._proto, $scope = Payment._scope, TMP_1, $a, $b, $c, $d, $e, TMP_2;
    ($a = ($b = self).$adapter, $a._p = (TMP_1 = function() {var self = TMP_1._s || this;
      return self.$autoincrement("id")}, TMP_1._s = self, TMP_1), $a).call($b, (($c = ((($d = ((($e = $scope.Lissio) == null ? $opal.cm('Lissio') : $e))._scope).Adapter == null ? $d.cm('Adapter') : $d.Adapter))._scope).Storage == null ? $c.cm('Storage') : $c.Storage));

    self.$property("id", $hash2(["as", "primary"], {"as": (($a = $scope.Integer) == null ? $opal.cm('Integer') : $a), "primary": true}));

    self.$property("recipient", $hash2(["as"], {"as": (($a = $scope.Person) == null ? $opal.cm('Person') : $a)}));

    self.$property("for", $hash2(["as"], {"as": (($a = $scope.String) == null ? $opal.cm('String') : $a)}));

    self.$property("at", $hash2(["as", "default"], {"as": (($a = $scope.Time) == null ? $opal.cm('Time') : $a), "default": ($a = ($c = self).$lambda, $a._p = (TMP_2 = function() {var self = TMP_2._s || this, $a;
      return (($a = $scope.Time) == null ? $opal.cm('Time') : $a).$now()}, TMP_2._s = self, TMP_2), $a).call($c)}));

    self.$property("amount", $hash2(["as"], {"as": (($a = $scope.Float) == null ? $opal.cm('Float') : $a)}));

    self.$property("sign", $hash2(["as"], {"as": (($a = $scope.Symbol) == null ? $opal.cm('Symbol') : $a)}));

    self.$property("satisfied", $hash2(["as", "default"], {"as": (($a = $scope.Boolean) == null ? $opal.cm('Boolean') : $a), "default": false}));

    return $opal.defn(self, '$satisfied?', def.$satisfied);
  })(self, (($a = ((($b = $scope.Lissio) == null ? $opal.cm('Lissio') : $b))._scope).Model == null ? $a.cm('Model') : $a.Model))
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice;
  $opal.add_stubs([]);
  ;
  ;
  return true;
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var $a, $b, self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice, $klass = $opal.klass;
  $opal.add_stubs(['$model', '$adapter', '$filter', '$[]', '$recipient', '$==', '$name', '$sign']);
  return (function($base, $super) {
    function Payments(){};
    var self = Payments = $klass($base, $super, 'Payments', Payments);

    var def = Payments._proto, $scope = Payments._scope, $a, TMP_1, $b, $c, $d, $e;
    self.$model((($a = $scope.Payment) == null ? $opal.cm('Payment') : $a));

    return ($a = ($b = self).$adapter, $a._p = (TMP_1 = function() {var self = TMP_1._s || this, TMP_2, $a, $b;
      return ($a = ($b = self).$filter, $a._p = (TMP_2 = function(value, desc) {var self = TMP_2._s || this, $a, $b, $c, $d;if (value == null) value = nil;if (desc == null) desc = nil;
        if (desc !== false && desc !== nil) {
          if (($a = ((($b = ($c = desc['$[]']("name"), $c !== false && $c !== nil ?($d = value.$recipient(), ($d === nil || $d === false)) : $c)) !== false && $b !== nil) ? $b : ($c = value.$recipient().$name()['$=='](desc['$[]']("name")), ($c === nil || $c === false)))) !== false && $a !== nil) {
            return false;};
          if (($a = ($b = desc['$[]']("sign"), $b !== false && $b !== nil ?($c = value.$sign()['$=='](desc['$[]']("sign")), ($c === nil || $c === false)) : $b)) !== false && $a !== nil) {
            return false;};};
        return true;}, TMP_2._s = self, TMP_2), $a).call($b)}, TMP_1._s = self, TMP_1), $a).call($b, (($c = ((($d = ((($e = $scope.Lissio) == null ? $opal.cm('Lissio') : $e))._scope).Adapter == null ? $d.cm('Adapter') : $d.Adapter))._scope).Storage == null ? $c.cm('Storage') : $c.Storage));
  })(self, (($a = ((($b = $scope.Lissio) == null ? $opal.cm('Lissio') : $b))._scope).Collection == null ? $a.cm('Collection') : $a.Collection))
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice;
  $opal.add_stubs([]);
  return true
})(Opal);
/* Generated by Opal 0.4.4 */
(function($opal) {
  var self = $opal.top, $scope = $opal, nil = $opal.nil, $breaker = $opal.breaker, $slice = $opal.slice;
  $opal.add_stubs([]);
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  ;
  return true;
})(Opal);
