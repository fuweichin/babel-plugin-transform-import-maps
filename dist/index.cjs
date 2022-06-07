'use strict';

// This file is auto-generated by Rollup

var importMaps = require('import-maps');
var schemaUtils = require('schema-utils');
var path = require('path');
var fs = require('fs');
var fsPromises = require('fs/promises');
var url = require('url');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var fsPromises__default = /*#__PURE__*/_interopDefaultLegacy(fsPromises);

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
/* eslint-disable quotes */

const __dirname$1 = path__default["default"].dirname(url.fileURLToPath((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.cjs', document.baseURI).href))));
const optionsSchema = JSON.parse(fs__default["default"].readFileSync(path__default["default"].resolve(__dirname$1, '../src/options.schema.json'), {encoding: 'utf-8'}));

let isRelativeSpecifier = (str) => {
  return str.startsWith('./') || str.startsWith('../') || str.startsWith('/');
};

function transformImportMapsPlugin({types}, options) {
  schemaUtils.validate(optionsSchema, options, {
    name: 'babel-plugin-transform-import-maps',
    baseDataPath: 'options'
  });
  let {srcObject, srcText, srcPath, baseDir, transformingReport, exclude} = options;

  let rawImportMaps = null;
  if (typeof srcObject === 'object') {
    rawImportMaps = JSON.stringify(srcObject);
  } else if (typeof srcText === 'string') {
    rawImportMaps = srcText;
  } else if (typeof srcPath === 'string') {
    rawImportMaps = fs__default["default"].readFileSync(srcPath, {encoding: 'utf-8'});
  } else {
    throw new Error('One of srcObject, srcText or srcPath should be specified in options');
  }
  const fakeBaseURI = 'ftp://fakedomain';
  let parsedImportMaps = importMaps.parseFromString(rawImportMaps, fakeBaseURI);
  baseDir = baseDir ? path__default["default"].resolve(baseDir) : process.cwd();
  let report;
  let reportFileHandle;
  let lastPathName;
  if (transformingReport) {
    report = {};
    if (transformingReport !== '-') {
      let reportFile = path__default["default"].resolve(transformingReport);
      fs__default["default"].mkdirSync(path__default["default"].dirname(reportFile), {recursive: true});
      fs__default["default"].writeFileSync(reportFile, Buffer.alloc(0));
      fsPromises__default["default"].open(reportFile, 'a').then((fd) => {
        reportFileHandle = fd;
      });
    }
  }
  let isExcluded;
  if (typeof exclude === 'string') {
    let extensions = exclude.split(/, */).filter((ext) => ext.length > 0);
    isExcluded = (source) => {
      if (source.startsWith('data:'))
        return false;
      let filename = path__default["default"].basename(source);
      let extname = path__default["default"].extname(filename);
      return extensions.has(extname) || extensions.has(filename);
    };
  } else if (typeof exclude === 'function') {
    isExcluded = exclude;
  } else if (exclude instanceof RegExp) {
    isExcluded = (source) => exclude.test(source);
  }

  let file2pathnameCache = {};
  let getScriptPath = (scriptFile) => {
    let scriptPath = file2pathnameCache[scriptFile];
    if (!scriptPath) {
      file2pathnameCache[scriptFile] = scriptPath = path__default["default"].relative(baseDir, scriptFile).replace(/\\/g, () => '/');
    }
    return scriptPath;
  };

  let file2urlCache = {};
  let getFakeURL = (scriptFile) => {
    let scriptURL = file2urlCache[scriptFile];
    if (!scriptURL) {
      file2urlCache[scriptFile] = scriptURL = new URL(getScriptPath(scriptFile), fakeBaseURI);
    }
    return scriptURL;
  };
  /**
   * resolve bare / url module specifier, and manipulate babylon AST
   * @param {Babel.Node} sourceNode - module specifier 'StringLiteral' node 
   * @param {string} importer - file path of current module
   * @param {Babel.NodePath|ArrayLike<Babel.Node>} pathOrArgs - path for import/export statement, args for dynamic import
   */
  function transformImportSpecifier(sourceNode, importer, pathOrArgs) {
    if (!importer) {
      return;
    }
    let source = sourceNode.value;
    if (isRelativeSpecifier(source)) {
      return;
    }
    if (exclude && isExcluded(source)) {
      return;
    }
    let scriptURL = getFakeURL(importer);
    let parsedUrl = importMaps.resolve(source, parsedImportMaps, scriptURL);
    let newSource;
    if (parsedUrl.origin === fakeBaseURI) { // e.g. "/path/to/module.js"
      newSource = parsedUrl.href.slice(fakeBaseURI.length);
    } else if (parsedUrl.protocol === 'ftp:' && parsedUrl.host !== 'fakedomain') { // e.g. "//example.com/path/to/module.js"
      newSource = parsedUrl.href.slice('ftp:'.length);
    } else { // e.g. "https://example.com/path/to/module.js"
      newSource = parsedUrl.href;
    }
    if (newSource === source) {
      return;
    }
    if (report) {
      let pathname = '/' + getScriptPath(importer);
      let map = report[pathname];
      if (!map) {
        map = report[pathname] = {};
      }
      map[source] = newSource;
      lastPathName = pathname;
    }
    let raw = sourceNode.extra?.raw;
    if (raw) {
      let newRaw = raw.charAt(0) === '\'' ? quote(newSource) : doubleQuote(newSource);
      if (Array.isArray(pathOrArgs)) {
        Object.assign(pathOrArgs[0], {
          type: 'StringLiteral',
          start: undefined,
          end: undefined,
          loc: undefined,
          extra: {
            rawValue: newSource,
            raw: newRaw,
            parenthesized: true,
            parenStart: 0
          },
          value: newSource,
          leadingComments: undefined,
          innerComments: undefined,
          trailingComments: undefined
        });
      } else {
        pathOrArgs.replaceWithSourceString(newRaw);
      }
    } else {
      let newSourceNode = types.stringLiteral(newSource);
      if (Array.isArray(pathOrArgs)) {
        pathOrArgs[0] = newSourceNode;
      } else {
        pathOrArgs.replaceWith(newSourceNode);
      }
    }
  }

  return {
    name: 'transform-import-maps',
    post() {
      if (lastPathName) {
        let map = report[lastPathName];
        if (transformingReport === '-') {
          console.log(JSON.stringify({[lastPathName]: map}, null, 2));
        } else {
          let buffer = Buffer.from(JSON.stringify({[lastPathName]: map}, null, 2) + '\n', 'utf8');
          reportFileHandle.appendFile(buffer);
        }
        lastPathName = undefined;
      }
    },
    visitor: {
      ImportDeclaration(p, state) {
        let sourceNodePath = p.get('source');
        if (!sourceNodePath.node) {
          return;
        }
        transformImportSpecifier(sourceNodePath.node, state.filename, sourceNodePath);
      },
      ExportDeclaration(p, state) {
        let sourceNodePath = p.get('source');
        if (!sourceNodePath.node) {
          return;
        }
        transformImportSpecifier(sourceNodePath.node, state.filename, sourceNodePath);
      },
      Import(p, state) {
        let args = p.parentPath.node.arguments;
        let sourceNode = args[0];
        if (sourceNode.type !== 'StringLiteral') {
          return;
        }
        transformImportSpecifier(sourceNode, state.filename, args);
      },
    }
  };
}

module.exports = transformImportMapsPlugin;