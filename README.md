# babel-plugin-transform-import-maps

transform bare / url module specifiers in the [import statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import), [export statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export) and [dynamic import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#dynamic_imports) with importmap. see also [rollup-plugin-import-maps](https://github.com/fuweichin/rollup-plugin-import-maps)

**Contents:**

<!--ts-->
   * [Install](#install)
   * [Usage](#usage)
      * [Basic Usage](#basic-usage)
      * [Plugin Options](#plugin-options)
   * [Related Efforts](#related-efforts)
   * [Maintainers](#maintainers)
   * [License](#license)
<!--te-->



## Install

```sh
npm install --save-dev babel-plugin-transform-import-maps
```



## Usage

### Basic Usage

edit babel.config.json

```json
{
  "presets": [
    ["@babel/preset-env", {
      "modules": false
    }]
  ],
  "plugins": [
    ["babel-plugin-transform-import-maps", {
      "srcPath": "./index.importmap",
      "transformingReport": "-" 
    }]
  ]
}
```



### Plugin Options

+ `srcPath`:string optional

  file path to importmap

+ `srcText`:string optional

  plain text of importmap

+ `srcObject`:Object optional

  parsed object of importmap

  **Note:** One of `srcObject`, `srcText`, `srcPath` should be specified, if multiple of them specified, then precedence order is: srcObject, srcText, srcPath.

+ `baseDir`: string default `process.cwd()`

  baseDir to calculate scope paths in order to match scopes defined in importmap

+ `transformingReport`:string default `undefined`

  set a file path to save transforming report as a Concatenated JSON file, will output to Console if value set to `"-"`

+ `exclude`:string|RegExp|Function default `undefined`

  skip bare/url specifiers from resolving / transforming according to importmap.

  e.g. `/\.(json|wasm|css)$/`, `(source, importer)=> /\.(json|wasm|css)$/.test(source)`, `.css,.wasm,.json`



## Related Efforts

+ [import-maps](#) - Reference implementation playground for import maps proposal



## Maintainers

[@fuweichin](https://github.com/fuweichin)




## License

[MIT](./LICENSE)

Other licenses of dependencies

+ import-maps: [W3C Software and Document License](http://www.w3.org/Consortium/Legal/2015/copyright-software-and-document) and [W3C CLA](https://www.w3.org/community/about/agreements/cla/)

