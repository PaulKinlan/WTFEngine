/*
 * WTF Engine
 * https://github.com/soulwire/WTFEngine
 *
 * Copyright 2011, Justin Windle
 * http://blog.soulwire.co.uk/
 * Code Licensed under the MIT licence.
 * https://github.com/soulwire/WTFEngine/blob/master/MIT-LICENSE.txt
 *
 * Concept based on WTFSIMFD
 * http://whatthefuckshouldimakefordinner.com/
 * by Zach Golden
 * http://www.zachgolden.com/
 *
 */

// variables

var dom = {};
var regex = /./;
var vowel = /\b(a)\b(\s+)?(((<[^>]+>)\s?)+)?(\s+)?([aeiou]|hou)/gim;

// init

function initialise() {

	dom.generate.click(function(){
	
		update();
		return false;
	});
	
	regex = generateRegExp();
	update();
}

// update

function update() {

	dom.output.html(generateIdea());
	dom.output.hide();
	dom.output.fadeIn(500);
	
	setGenerateLabel();
}

// build regex from corpus

function generateRegExp() {

	var str = '';
	var arr = [];
	var tmp = "@(types)";
	
	for(type in corpus) {
		arr.push(type);
	}
	
	var exp = tmp.replace("types", arr.join('|'));
	
	return new RegExp(exp, "ig");
}

// generate idea

function generateIdea() {
	
	var type;
	var match;
	var index;
	var intro;
	var output;
	
	var template = templates[(Math.random() * templates.length) | 0];
	
	var data = {};
	
	for(var prop in corpus) {
		data[prop] = corpus[prop].concat();
	}
	
	var result = regex.exec(template);
	
	while(result) {
	
		type = result[1];
		match = result[0];
		
		index = (Math.random() * data[type].length) | 0;
		template = template.replace(match, data[type].splice(index, 1)[0]);
		
		regex.lastIndex = 0;
		result = regex.exec(template);
	}
	
	var intro = phrases[(Math.random() * phrases.length) | 0];
	
	output = "<dl>";
	output += "<dt>" + intro + "</dt>";
	output += "<dd>" + template + "</dd>";
	output += "</dl>";
	
	return correctGrammar(output);
}

// correct grammar

function correctGrammar(input) {

	// change 'a' to 'an' when before a vowel (I know this is not not always true!)
	input = input.replace(vowel, "$1n$2$3$6$7");

	return input;
}

// set label

function setGenerateLabel() {

	var label = labels[(Math.random() * labels.length) | 0];
	dom.generate.text(label);
	
}

function stringToArrayBuffer(text) {
  var ab = new ArrayBuffer(text.length);
  var data = new Uint8Array(ab);
  for(var i=0; i < text.length; i++) {
    data[i] = text.charCodeAt(i);
  }
  return ab;
}

function arrayBufferToString(ab) {
  return String.fromCharCode.apply(null, new Uint8Array(ab));
}

var socket;
function pollData() {
  var callback = function(info) {
    if(info.resultCode > 0) {
      var data = generateIdea();
      chrome.socket.sendTo(socket.socketId, stringToArrayBuffer(data), info.address, info.port, function() {});
    }
  };
  chrome.socket.recvFrom(socket.socketId, callback);
}

var readResponse = function(socketId, callback) {
  var intervalId = setInterval(function() {
    chrome.socket.read(socketId, function(data) {
      if(data.resultCode > 0) {
        callback(arrayBufferToString(data.data));
        clearInterval(intervalId);   
      };
    });
  }, 1000);
};

function requestGenerate(callback) { 
  callback = callback || function() {};
  chrome.socket.create('udp', function(socketInfo) {
    var id = socketInfo.socketId;
    chrome.socket.connect(id, "127.0.0.1", 8899, function() { 
      chrome.socket.write(id, stringToArrayBuffer("test"), function(d) {
        if(d.bytesWritten > 0) {
          readResponse(id, callback);
        }
      });
    });
  });
}

function initNetwork() {
  chrome.socket.create('udp', function(socketInfo) {
    console.log("Socket Info", socketInfo);
    socket = socketInfo;
    chrome.socket.bind(socketInfo.socketId, '127.0.0.1', 8899, function(bindInfo) {
      console.log("Bind Info");
      console.log(bindInfo)
      setInterval(pollData, 1000);
    });    
  });
}

// ready

$(document).ready(function(){

	dom.output = $("#output");
	dom.generate = $("#generate");
	
	if(corpus) {
		initialise();
	} else {
		//console.log("corpus not found");
	}

  $("#shareThis").click(function() {
    var intentObj = {
      "action": "http://webintents.org/share",
      "type": "text/plain",
      "data": "I want to work on a " + ""  + ""
    };
    var intent = new WebKitIntent(intentObj); 
    window.navigator.webkitStartActivity(intent); 
  });

  initNetwork();
});
