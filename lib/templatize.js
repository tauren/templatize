'use strict';

var minify = require('html-minifier').minify;
var _ = require('lodash');

// Regular expression to find all replacement variables in template 
var regex = /\{{(.*?)\}}/g;

// Available module formats to wrap compiled function
// Currently supporting plain function, commonjs and AMD. Defaults to function.  
var formats = {
  func: {
    regex: regex,
    prefix: "function(model){return '",
    suffix: "';}",
    model: "model"
  },
  commonjs: {
    regex: regex,
    prefix: "module.exports=function(model){return '",
    suffix: "';};",
    model: "model"
  },
  amd: {
    regex: regex,
    prefix: "define(function(){return function(model){return '",
    suffix: "';};});",
    model: "model"
  }
  // TODO: Add support for namespaced function on global object
  // namespace: {
  //   regex: regex,
  //   prefix: "!function(root) { return '",
  //   suffix: "';}(this);",
  //   model: "model"
  // }
};

// Default options for html-minifier
var htmlminOpts = {
  removeComments: true,
  removeCommentsFromCDATA: true,
  collapseWhitespace: true,   // required
  collapseBooleanAttributes: true,
  removeAttributeQuotes: false,
  removeRedundantAttributes: false,
  useShortDoctype: true,
  removeEmptyAttributes: false,
  removeOptionalTags: false
};

module.exports = function(source, options) {
  // Make sure options is an object
  options = options || {};
  // Populate options with default values, overridden by specified format and provided options 
  options = _.extend({}, formats.func, options.format ? formats[options.format] : {}, options);
  // Populate htmlmin options with default values, overriddern by provided options
  options.htmlmin = _.extend({}, htmlminOpts, options.htmlmin);

  // Minify the source
  source = minify(source, options.htmlmin);

  // Return a string representation of javascript module for this templatized HTML source 
  return options.prefix + source.replace(options.regex, '\'+'+options.model+'.$1+\'') + options.suffix;
};
