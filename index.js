(function() {
  if (!process.env.DEBUG) {
    process.env.DEBUG = "nqm-*";
  }

  var express = require("express");
  var input = require("nqm-databot-utils").input;
  var security = require("nqm-databot-utils").security;

  function databot(input, output, context) {
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
    if (!input.title || !input.message || !input.answer) {
      output.error("invalid args");
      process.exit(1);
    }

    // Create and initialise an express server.
    var app = express();
    app.set("view engine", "pug");
    app.use(express.static("public"));

    // Make sure all requests originate from the host.
    app.use(security.authoriseRequest(context.instanceAuthKey));

    // Example view rendering.
    app.get("/home", function(req,res) {
      // Respond with the title and message passed as input to this databot
      res.render("home", {title: input.title || "server process", message: input.message || "hello"});
    });

    // Example json response.
    app.get("/json", function(req,res) {
      res.json({
        answer: input.answer || 123,
        message: "testing JSON response type"
      });
    });

    // Instruct the databot to stop.
    app.get("/exit", function(req, res) {
      res.json({ok: "goodbye!"});
      
      setTimeout(function() {
        output.debug("exited at user request");
        process.exit(0);
      }, 1000);
    });

    // Use the port supplied to us by the process host.
    app.listen(context.instancePort, function() {
      output.debug("listening on %d", context.instancePort);
      output.progress(0);
    })
    .on("error", function(err) {
      output.error("unable to start server on port %d [%s]", context.instancePort, err.message);
      process.exit(-1);
    })
    .on("connection", security.authoriseConnection);
  }

  // Retrieve the input data sent to us from the host, and pipe it to the databot function.
  input.pipe(databot);
}());