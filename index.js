// Built-in modules
var csv = require("csv");
var fs = require("fs");
var url = require("url");

// Loaded from NPM
var $ = require("cheerio"); // jQuery-like DOM library
var async = require("async"); // Easier concurrency utils
var request = require("request"); // Make HTTP requests simply

// Useful constants
const BASE = "http://hosting.portseattle.org/contractsweb/";
const INDEX = BASE + "ConSummaryPage.aspx";
const PAGE_MAX = 38;

// Gets the ASP nonce values from the hidden form on the page
var extractForm = function(body) {
  var $body = $(body);
  var inputs = $body.find("#form1 input");
  var state = {};
  inputs.each(function() {
    state[this.attribs.id] = this.attribs.value.trim();
  });
  return state;
};

// Gets contract links from an index page
var extractLinks = function(body) {
  var $body = $(body);
  // Find all actual links, not the pagination at the bottom of the table
  var links = $body.find(`#oGridView a[href^="Con"]`).toArray();
  return links.map(l => url.parse(BASE + l.attribs.href, true));
};

// Gets actual contract data from a details page
var extractData = function(id, body) {
  var $body = $(body);
  var data = { contract: { id }, amendments: [] };
  // Contract details are a table at the top, [key][value]
  var contractRows = $body.find("#DetailsView1 tr");
  contractRows.each(function() {
    var cells = $(this).find("td").toArray();
    data.contract[$(cells[0]).text()] = $(cells[1]).text().trim();
  });
  // Amendment rows are a second table at the bottom of the page, 0+ amendments per contract
  var amendmentRows = $body.find("#GridView tr");
  amendmentRows.each(function() {
    var cells = $(this).find("td").toArray();
    if (!cells.length) return;
    var [mod, date, description, type, budgetChange, dateChange] = cells.map(c => $(c).text().trim());
    if (!date) return;
    data.amendments.push({ id, mod, date, description, type, budgetChange, dateChange });
  });
  return data;
}

// async.waterfall() lets us pass values from one function to the next
// As a result, we use almost no global values, it's purely functional state
// Meanwhile, the indentation is relatively constant, program flow is more readable
async.waterfall([
  // ask for the initial page
  next => request(INDEX, next),

  // get the first page and its nonce values
  function(response, body, next) {
    var state = extractForm(body);
    next(null, [body], state);
  },

  // ask for individual index page HTML
  function(pages, state, next) {
    console.log("Requesting index pages");

    // because each request requires the state variables from the previous listing,
    // we'll get the index pages one at a time
    async.timesSeries(PAGE_MAX - 1, function(n, c) {
      var form = {};
      for (var k in state) {
        form[k] = state[k];
      }
      form.__EVENTTARGET = "oGridView";
      form.__EVENTARGUMENT = `Page$${n + 2}`; // start at page 2, work our way up
      var req = request.post(INDEX, { form }, function(err, response, body) {
        if (err) return c(err);
        // update the nonce for the next item
        state = extractForm(body);
        pages.push(body);
        c();
      });
    }, err => next(err, pages));
  },

  //process the HTML
  function(pages, next) {
    console.log("Requesting contract details");
    var links = [];
    var contracts = [];

    pages.forEach(p => links.push(...extractLinks(p)));
    //get these 10 at a time, to prevent rate-limiting from kicking in
    async.eachLimit(links, 10, function(a, c) {
      var id = a.query.id;
      request(a.href, function(err, response, body) {
        var data = extractData(id, body);
        contracts.push(data);
        c(err);
      });
    }, err => next(err, contracts));
  },

  //output CSV
  function(contracts, next) {
    console.log(`Writing ${contracts.length} contracts to CSV`);

    // CSV writer is piped into a file stream
    var contractFile = fs.createWriteStream("contracts.csv");
    var contractWriter = csv.stringify({ header: true });
    contractWriter.pipe(contractFile);

    var amendmentFile = fs.createWriteStream("amendments.csv");
    var amendmentWriter = csv.stringify({ header: true });
    amendmentWriter.pipe(amendmentFile);

    // Write the data into the CSV stream
    // flow: data -> writer -> file
    contracts.forEach(function(data) {
      contractWriter.write(data.contract);
      if (data.amendments) {
        data.amendments.forEach(a => amendmentWriter.write(a));
      }
    });

    // Close the CSV writers, they'll inform the file streams in turn
    contractWriter.end();
    amendmentWriter.end();

    //once both files have been closed, finish the script
    async.parallel([
      c => contractFile.on("close", c),
      c => amendmentFile.on("close", c)
    ], next);
  }

], function(err) {
  console.log(err || "All done!");
})
