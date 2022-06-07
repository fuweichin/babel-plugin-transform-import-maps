
/* eslint-disable quotes */
// eslint-disable-next-line no-misleading-character-class, no-control-regex
let rx_escapable = /[\\'\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
let meta = {
  "\b": "\\b",
  "\t": "\\t",
  "\n": "\\n",
  "\f": "\\f",
  "\r": "\\r",
  "'": "\\'",
  "\\": "\\\\"
};
/**
 * quote string with single quotes
 * see also https://github.com/douglascrockford/JSON-js/blob/master/json2.js#L215
 * @param {string} string
 * @returns {string}
 */
function quote(string) {
  let q = "'";
  if (!rx_escapable.test(string))
    return q + string + q;
  return q + string.replace(rx_escapable, function (a) {
    let c = meta[a];
    return c ? c : "\\u" + ("000" + a.charCodeAt(0).toString(16)).slice(-4);
  }) + q;
}

function doubleQuote(string) {
  return JSON.stringify(string);
}

export {quote as singleQuote, doubleQuote};
/* eslint-disable quotes */
