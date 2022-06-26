import {resolve, parseFromString} from 'import-maps';
import {validate} from 'schema-utils';
import {singleQuote, doubleQuote} from './quote.js';

import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const optionsSchema = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/options.schema.json'), {encoding: 'utf-8'}));

export default function transformImportMapsPlugin({types}, options) {
  validate(optionsSchema, options, {
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
    rawImportMaps = fs.readFileSync(srcPath, {encoding: 'utf-8'});
  } else {
    throw new Error('One of srcObject, srcText or srcPath should be specified in options');
  }
  const fakeBaseURI = 'ftp://fakedomain';
  let parsedImportMaps = parseFromString(rawImportMaps, fakeBaseURI);
  baseDir = baseDir ? path.resolve(baseDir) : process.cwd();
  let report;
  let reportFileHandle;
  let lastPathName;
  if (transformingReport) {
    report = {};
    if (transformingReport !== '-') {
      let reportFile = path.resolve(transformingReport);
      fs.mkdirSync(path.dirname(reportFile), {recursive: true});
      fs.writeFileSync(reportFile, Buffer.alloc(0));
      fsPromises.open(reportFile, 'a').then((fd) => {
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
      let filename = path.basename(source);
      let extname = path.extname(filename);
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
      file2pathnameCache[scriptFile] = scriptPath = path.relative(baseDir, scriptFile).replace(/\\/g, () => '/');
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
    if (source.startsWith('./' || source.startsWith('../'))) {
      return;
    }
    if (exclude && isExcluded(source)) {
      return;
    }
    let scriptURL = getFakeURL(importer);
    let parsedUrl = resolve(source, parsedImportMaps, scriptURL);
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
      let newRaw = raw.charAt(0) === '\'' ? singleQuote(newSource) : doubleQuote(newSource);
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
