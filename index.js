if (!process.env.DEBUG) {
  process.env.DEBUG = "nqm-*";
}

var express = require("express");
var input = require("nqm-process-utils").input;
var output = require("nqm-process-utils").output;
var security = require("nqm-process-utils").security;

// Retrieve the input data sent to us from the host.
input.read(function(err, inputArgs) {
  if (err) {
    // Report errors back to the host.
    output.error("failure reading input: %s", err.message);
    // Exit with non-zero code to indicate failure. 
    process.exit(1);
  }

  //
  // Validate the input.
  //
  // This databot expects input data using the following schema:
  //
  // {
  //   title: "<title here>",
  //   message: "<message here>",
  //   answer: "<answer here>"
  // }
  //
  if (!inputArgs.data.title || !inputArgs.data.message || !inputArgs.data.answer) {
    output.error("invalid args");
    process.exit(1);
  }

  // Create and initialise an express server.
  var app = express();
  app.set("view engine", "pug");
  app.use(express.static('public'));

  // Make sure all requests originate from the host.
  app.use(security.authoriseRequest(inputArgs.instanceAuthKey));

  // Example view rendering.
  app.get("/home", function(req,res) {
    // Respond with the title and message passed as input to this databot
    res.render("home", {title: inputArgs.data.title || "server process", message: inputArgs.data.message || "hello"});
  });

  // Example json response.
  app.get("/json", function(req,res) {
    res.json({
      answer: inputArgs.data.answer || 123,
      message: "testing JSON response type"
    });
  });

  app.get("/exit", function(req, res) {
    res.json({ok: "goodbye!"});
    
    setTimeout(function() {
      output.debug("exited at user request");
      process.exit(0);
    }, 1000);
  });

  // Use the port supplied to us by the process host.
  app.listen(inputArgs.instancePort, function() {
      output.debug("listening on %d", inputArgs.instancePort);
      output.progress(0);
    })
    .on("error", function(err) {
      output.error("unable to start server on port %d [%s]", inputArgs.instancePort, err.message);
      process.exit(-1);
    })
    .on("connection", security.authoriseConnection);
});

