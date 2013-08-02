// Copyright 2013 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Bridge to MathJax functions from the ChromeVox content script.
 *
 * @author sorge@google.com (Volker Sorge)
 */

if (typeof(goog) != 'undefined' && goog.provide) {
  goog.provide('cvox.MathJax');
}

if (typeof(goog) != 'undefined' && goog.require) {
  goog.require('cvox.Api');
  goog.require('cvox.MathJaxExternalUtil');
}

(function() {
  /**
   * The channel between the page and content script.
   * @type {MessageChannel}
   */
  var channel_ = new MessageChannel();


  /**
   * @constructor
   */
  cvox.MathJax = function() {
  };


  /**
   * Initializes message channel in Chromevox.
   */
  cvox.MathJax.initMessage = function() {
    channel_.port1.onmessage = function(evt) {
      cvox.MathJax.execMessage(evt.data);
    };
    window.postMessage('cvox.MathJaxPortSetup', [channel_.port2], '*');
  };


  /**
   * Post a message to Chromevox.
   * @param {string} cmd The command to be executed in Chromevox.
   * @param {string} callbackId A string representing the callback id.
   * @param {Object.<string, *>} args Dictionary of arguments.
   */
  cvox.MathJax.postMessage = function(cmd, callbackId, args) {
    channel_.port1.postMessage({'cmd': cmd, 'id': callbackId, 'args': args});
  };


  /**
   * Executes a command for an incoming message.
   * @param {{cmd: string, id: string, args: string}} msg A
   *     serializable message.
   */
  cvox.MathJax.execMessage = function(msg) {
    var args = msg.args;
    switch (msg.cmd) {
      case 'Active':
        cvox.MathJax.isActive(msg.id);
      break;
      case 'AllJax':
        cvox.MathJax.getAllJax(msg.id);
      break;
      case 'AsciiMathToMml':
        cvox.MathJax.asciiMathToMml(msg.id, args.alt, args.id);
      break;
      case 'InjectScripts':
        cvox.MathJax.injectScripts();
      break;
      case 'RegSig':
        cvox.MathJax.registerSignal(msg.id, args.sig);
      break;
      case 'TexToMml':
        cvox.MathJax.texToMml(msg.id, args.alt, args.id);
      break;
    }
  };


  /**
   * Compute the MathML representation for all currently available MathJax
   * nodes.
   * @param {string} callbackId A string representing the callback id.
   */
  cvox.MathJax.getAllJax = function(callbackId) {
    cvox.MathJaxExternalUtil.getAllJax(
        cvox.MathJax.getMathmlCallback_(callbackId));
  };


  /**
   * Registers a callback for a particular Mathjax signal.
   * @param {string} callbackId A string representing the callback id.
   * @param {string} signal The Mathjax signal on which to fire the callback.
   */
  cvox.MathJax.registerSignal = function(callbackId, signal) {
    cvox.MathJaxExternalUtil.registerSignal(
        cvox.MathJax.getMathmlCallback_(callbackId), signal);
  };


  /**
   * Constructs a callback that posts a string with the MathML representation of
   * a MathJax element to ChromeVox.
   * @param {string} callbackId A string representing the callback id.
   * @return {function(Node, string)} A function taking a Mathml node and an id
   * string.
   * @private
   */
  cvox.MathJax.getMathmlCallback_ = function(callbackId) {
    return function(mml, id) {
      cvox.MathJax.postMessage('NodeMml', callbackId,
                               {'mathml': mml, 'elementId': id});
    };
  };


  /**
   * Inject a minimalistic MathJax script into a page for LaTeX translation.
   */
  cvox.MathJax.injectScripts = function() {
    cvox.MathJaxExternalUtil.injectConfigScript();
    cvox.MathJaxExternalUtil.injectLoadScript();
  };


  /**
   * Translates a LaTeX expressions into a MathML element.
   * @param {string} callbackId A string representing the callback id.
   * @param {string} tex The LaTeX expression.
   * @param {string} cvoxId A string representing the cvox id for the node.
   */
  cvox.MathJax.texToMml = function(callbackId, tex, cvoxId) {
    cvox.MathJaxExternalUtil.texToMml(
        tex, true,
        function(mml) {
          cvox.MathJax.getMathmlCallback_(callbackId)(mml, cvoxId);
        });
  };


  /**
   * Translates an AsciiMath expression into a MathML element.
   * @param {string} callbackId A string representing the callback id.
   * @param {string} asciiMath The AsciiMath expression.
   * @param {string} cvoxId A string representing the cvox id for the node.
   */
  cvox.MathJax.asciiMathToMml = function(callbackId, asciiMath, cvoxId) {
    cvox.MathJaxExternalUtil.asciiMathToMml(
        asciiMath, true,
        function(mml) {
          cvox.MathJax.getMathmlCallback_(callbackId)(mml, cvoxId);
        });
  };


  /**
   * Check if MathJax is injected in the page.
   * @param {string} callbackId A string representing the callback id.
   */
  cvox.MathJax.isActive = function(callbackId) {
    cvox.MathJax.postMessage(
        'Active', callbackId,
        {'status': cvox.MathJaxExternalUtil.isActive()});
  };


  // Initializing the bridge.
  cvox.MathJax.initMessage();

})();
