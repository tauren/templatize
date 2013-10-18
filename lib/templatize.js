/*
 * templatize
 * https://github.com/tauren/templatize
 *
 * Copyright (c) 2013 Tauren Mills
 * Licensed under the MIT license.
 */

'use strict';

var minify = require('html-minifier').minify;

// Default options
var opts = {
  // Locates handlebars-like tags: {{ foo.bar }}
  regex: /\{{\s?(.*?)\s?\}}/g,
  // Wraps templatized output into a function
  prefix: "function(model){return '",
  suffix: "';}",
  // Update the model value if the name of model is changed in prefix
  model: "model",
  // Options to use with the HTML Minifier
  htmlmin: {
    removeComments: true,
    removeCommentsFromCDATA: true,
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: false,
    removeRedundantAttributes: false,
    useShortDoctype: true,
    removeEmptyAttributes: false,
    removeOptionalTags: false    
  }
};

// Extend an object with one more more other objects (like _.extend)
function extend(obj) {
  Array.prototype.slice.call(arguments, 1).forEach(function(source) {
    if (source) {
      for (var prop in source) {
        if (source[prop].constructor === Object) {
          if (!obj[prop] || obj[prop].constructor === Object) {
            obj[prop] = obj[prop] || {};
            extend(obj[prop], source[prop]);
          } else {
            obj[prop] = source[prop];
          }
        } else {
          obj[prop] = source[prop];
        }
      }
    }
  });
  return obj;
}

module.exports = function(source, options) {

  // Make sure options uses default values or overriden values
  options = extend({}, opts, options);

  // Cleans and minify the HTML source
  source = minify(source, options.htmlmin)
    // Replace all single quotes with escaped single quotes
    .replace(/'/g,'\\\'')
    // Replace all linebreaks with an escaped line break
    .replace(/\n|\r|\r\n|\n\r/g,'\\n');

  // Return a string representation of templatized HTML
  // Wraps output with prefix/suffix (default: wrap with a function)
  return options.prefix + 
    source.replace(options.regex, '\'+'+options.model+'.$1+\'') + 
    options.suffix;
};
