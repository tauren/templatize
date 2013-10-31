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
  // Options to use with the HTML Minifier, only used if htmlminEnable is true
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
  },
  // Set htmlminEnable to true to always minify html
  htmlminEnable: true,
  // Set htmlminMultiLines to true to minify files with more than one line
  htmlminMultiLines: false
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

// Name to use for model objects
var modelName = 'm';
// Current depth level
var depth = 0;
// Current model name
var name = modelName+depth;

// Wraps templatized output into a function
var prefix = 'function('+name+'){return \'';
var suffix = '\';}';
// Method to use for mapping multiple iterations into an 
// array of strings
var mapMethod = '_.map';

// Match any type of linebreak
var reLinebreaks = /\n|\r|\r\n|\n\r/g;
// Match handlebars-like tags
var reContent = /\{{\s*([#|\/]each|>?)\s*(.*?)\s*\}}/g;
// Match ../ notation capturing whatever follows
var reDots = /^(\.\.\/)*(.*)/g;
// Match ../ notation
var reAnyDots = /\.\.\//g;

function updateName(incr) {
  depth += incr;
  depth = depth > 0 ? depth : 0;
  name = modelName+depth;
  return name;
}

function dotsReplacer(match, dots, value, position, full) {
  // Determine which model object to use based on 
  // how many times ../ was used
  var curDepth = depth - (match.match(reAnyDots) || []).length;
  // Construct modelName for selected depth
  return (modelName + (curDepth > 0 ? curDepth : 0))+
    (value==='this' ? '' : '.'+value);
}

function contentReplacer(match, type, value, position, full) {
  value = value.trim();

  switch(type) {
    case '#each':
      value = '\'+'+mapMethod+'('+value.replace(reDots,dotsReplacer)+
        ', function('+updateName(1)+') { return \'';
      break;
    case '/each':
      value = '\';}).join(\'\')+\'';
      name = updateName(-1);
      break;
    case '>':
      // TODO: Add support for partials
      // Simply pass through to default for now, ignore type
    default:
      value = '\'+'+value.replace(reDots,dotsReplacer)+'+\'';
      break;
  };

  return value;
}

module.exports = function(source, options) {

  // Make sure options uses default values or overriden values
  options = extend({}, opts, options);

  // Reset iteration values
  depth = 0;
  name = modelName;

  // Trim whitespace from source
  source = source.trim();

  // Minify if htmlminEnable is truthy or if htmlminMultiLines is
  // true and the source contains more than one line
  if (options.htmlminEnable || (options.htmlminMultiLines 
      && source.split(reLinebreaks).length > 1)) {
    // Use html-minifier to cleans and minify the HTML source
    // Note that using this will create well-formed HTML, adding closing tags
    // that are missing and removing extraneous closing tags. This might not
    // be desirable if the source is an HTML fragment
    source = minify(source, options.htmlmin);
  }

  // Replace all single quotes with escaped single quotes
  // This assumes the source doesn't use single quotes to wrap html attributes
  source = source.replace(/'/g,'\\\'')
    // Replace all linebreaks with an escaped line break
    .replace(reLinebreaks,'\\n');

  // Return a string representation of templatized HTML
  // Wraps output with prefix/suffix (default: wrap with a function)
  return prefix + source.replace(reContent, contentReplacer) + suffix;
};
