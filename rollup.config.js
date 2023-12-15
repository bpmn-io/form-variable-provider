/* eslint-env node */
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');

const pkg = require('./package.json');
const nonbundledDependencies = [
  ...Object.keys({
    ...pkg.dependencies,
    ...pkg.peerDependencies
  }),
  'bpmn-js/lib/util/ModelUtil'
];

module.exports = {
  input: 'lib/index.js',
  output: [
    {
      file: pkg.main,
      format: 'cjs'
    },
    {
      file: pkg.module,
      format: 'esm'
    }
  ],
  plugins: [
    commonjs(),
    json()
  ],
  external: nonbundledDependencies
};
