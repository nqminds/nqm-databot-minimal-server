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
    //   logo: "<logo here>",
    //   colour: "<colour here>"
    // }
    //
    if (!input.title || !input.message || !input.logo) {
      output.error("invalid args");
      process.exit(1);
    }

    input.colour = input.colour || "light-blue";

    // Create and initialise an express server.
    var app = express();
    app.set("view engine", "pug");
    app.use(express.static("public"));

    // Make sure all requests originate from the host.
    app.use(security.authoriseRequest(context.instanceAuthKey));

    // Example view rendering.
    app.get("/", function(req,res) {
      // Respond with the title and message passed as input to this databot
      res.render("home", input);
    });

    // Example view rendering.
    app.get("/about", function(req,res) {
      // Respond with the title and message passed as input to this databot
      res.render("about", input);
    });

    // Example json response.
    app.get("/json", function(req,res) {
      res.json({
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

  // var output = require("nqm-databot-utils").output;
  // databot({title:"hello", logo: "my app", message:"world"}, output, { instancePort: 3111});

  // Retrieve the input data sent to us from the host, and pipe it to the databot function.
  input.pipe(databot);
}());