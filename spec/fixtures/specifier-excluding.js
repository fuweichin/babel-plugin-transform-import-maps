export default {
  inputFile: 'spec/fixtures/specifier-excluding/in.js',
  importmapFile: 'spec/fixtures/specifier-excluding/in.importmap',
  expectedOutputFile: 'spec/fixtures/specifier-excluding/out.js',
  pluginOptions: {
    exclude: /\.(json|wasm|css)$/,
  },
};
