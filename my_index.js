var csv = require("csv");
var fs = require("fs");
var url = require("url");

var $ = require("cheerio");
var async = require("async");
var request = require("request");

const BASE = "http://www2.durhamcountync.gov/sheriff/ips/";
const INDEX = BASE + "default.aspx";
//don't need PAGE_MAX



var extractForm = function(body) {
  var $body = $(body);
  var inputs = $body.find("#form1 input");
  var releasedPd = {}; //options: Last 30 Days, Last 24 Hours, Incarcerated
  inputs.each(function() {
    releasedPd[this.attribs.id] = this.attribs.value.trim();
  });
	console.log(releasedPd);
	return releasedPd;
};

// var extractLinks = function(body) {
// 	var $body = $(body);
// 	var links = $body.find('').toArray();
// 	return links.map(l => url.parse(BASE + l.attribs.href, true));
// };

var extractData = function(id, body){
	var $body = $(body);
	var data =
	//NEED SELECTOR HERE FOR WHAT I NEED
});
