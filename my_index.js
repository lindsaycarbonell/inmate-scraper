var csv = require("csv");
var fs = require("fs");
var url = require("url");

var $ = require("cheerio");
var async = require("async");
var request = require("request");

const BASE = "http://www2.durhamcountync.gov/sheriff/ips/";
const INDEX = BASE + "default.aspx";
const VALUES = [1,30,0];



var extractForm = function(body) {
  var $body = $(body);
  var inputs = $body.find("#form1 input");
  var state = {};
  inputs.each(function() {
    state[this.attribs.id] = this.attribs.value.trim();
  });
	// console.log(state);
	return state;
};

var extractLinks = function(body) {
	var $body = $(body);
	var links = $body.find('.rsnavy-bold a[href^="http://vinelink.com/"]').toArray();
  // console.log(links);
	return links.map(l => url.parse(BASE + l.attribs.href, true));
};

// var extractData = function(id, body){
//   console.log(id);
// 	var $body = $(body);
// 	var data = { inmate: { id },  }
// 	//NEED SELECTOR HERE FOR WHAT I NEED
// });

async.waterfall([  //ask for the initial page
  next => request(INDEX, next),

  //get the first page and its nonce values
  function(response, body, next){
    var state = extractForm(body);
    next(null, [body], state);
    // console.log(body);

  },

  function(pages, state, next){

    async.timesSeries(3, function(n, c){
      var form = {};
      for (var k in state){
        form[k] = state[k];
      }
      form.__EVENTTARGET = "table[align='center'] [border='0'] [width='98%']";
      form.__EVENTARGUMENT = '' + VALUES[n];
      console.log(form);

      var req = request.post(INDEX, { form },
      function(err, response, body){
        if (err) return c(err);

        state = extractForm(body);
        //console.log(state);
        pages.push(body);
        // console.log(body);
        c();
      });
      }, err => next(err, pages));
  },

  //process the HTML
  // function(pages, next){
  //   console.log("Requesting inmate details...");
  //   var links = [];
  //   var inmates = [];
  //
  //
  // },










], function(err){
  console.log(err || "All done!");
});
