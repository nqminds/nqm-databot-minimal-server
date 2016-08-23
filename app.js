if (!process.env.DEBUG) {
  process.env.DEBUG = "nqm-*";
}

var log = require("debug")("nqm-process-minimal-server:index");

var express = require("express");
var output = require("nqm-process-utils").output;
var security = require("nqm-process-utils").security;
var commandLine = require("nqm-process-utils").commandLine;

var app = express();
app.set("view engine", "pug");
app.use(express.static('public'));

app.get("/home", security.ensureAuthenticated, function(req,res) {
  res.render("home", {title: "server process", message: "hello"});
});

app.get("/json", security.ensureAuthenticated, function(req,res) {
  res.json({
    testing: 123,
    message: "testing JSON response type"
  });
});

app.listen(commandLine.port, function() {
    log("listening on %d", commandLine.port);
    output.write(output.PROGRESS, 0);
  })
  .on("error", function(err) {
    log("failure listening on port %d [%s]", commandLine.port, err.message);
    process.exit(-1);
  })
  .on("connection", security.authoriseConnection);

