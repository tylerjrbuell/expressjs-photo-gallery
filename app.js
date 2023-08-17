const dotenv = require("dotenv");
const path = require("path");
let express = require("express");
const session = require("express-session");
let passport = require("passport");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const handlebars = require('handlebars')
const exphbs = require("express-handlebars");
const flash = require("connect-flash");
const toastr = require("express-toastr");
const https = require('https')
let fs = require('fs')

// SSL cert
// const key = fs.readFileSync("./security/test-app.127.0.0.1.nip.io-key.pem", "utf-8");
// const cert = fs.readFileSync("./security/test-app.127.0.0.1.nip.io.pem", "utf-8");


//Load Config
dotenv.config({
  path: "./config/.env"
});

//Handle vercel url
process.env.SERVER = process.env.SERVER ? process.env.SERVER :  process.env.VERCEL_BRANCH_URL

//load passport to auth
const passport_config = require("./config/passport");
passport_config(passport);

//call connect_DB function from db.js
const connectDB = require("./config/db.js");
connectDB();

const expressToastr = require("express-toastr");

//ENV Vars
const PORT = process.env.PORT || 3000;
const SERVER = process.env.SERVER || "localhost";
//initialize app
const app = express();



//Sessions configuration
app.use(cookieParser("sessionSecret"));
app.use(
  session({
    cookie: {
      maxAge: 60000 * 60
    },
    secret: "sessionSecret",
    resave: false,
    saveUninitialized: true,
  })
);

//body parser  middleware for posts
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);


//load flash messages
app.use(flash());

//load toastr
app.use(toastr());

app.use(function (req, res, next) {
  res.locals.toasts = req.toastr.render();
  next();
});

//Load  morgan middleware for logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//Register Handlebars
var hbs = exphbs.create({
  // Specify helpers which are only registered on this instance.
  helpers: {
    setVar: function(varName, varValue, options) {
      options.data.root[varName] = varValue;
    }
  }
});


app.engine(".hbs", exphbs({
  // Specify helpers which are only registered on this instance.
  helpers: {
    convert: function (date) {
      if (!date) {
          return;
      }
      return JSON.stringify(date);
    },
    setVar: function(varName, varValue, options) {
      options.data.root[varName] = varValue;
    },
    ifIn: function(elem, list, options) {
      if(list.indexOf(elem) > -1) {
        return options.fn(this);
      }
      return options.inverse(this);
    },
    jsonify: function(varValue) {
      return JSON.stringify(varValue);
    },
  },
  defaultLayout: "main",
  extname: ".hbs",
  // handlebars: allowInsecurePrototypeAccess(handlebars)
}));
app.set("view engine", ".hbs");
app.set('views',path.join(__dirname, 'views'));

//load passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Static Folder
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads/photos',express.static(process.env.PHOTO_UPLOAD_DIR));

app.listen(PORT, () => {
  console.log("Server started on port: " + PORT);
});


// https.createServer({ key, cert }, app).listen(PORT,SERVER,() => {
//     console.log("Server started on: https://" + SERVER + ":" + PORT);
//   });

//auth Level Route
app.use("/auth", require("./routes/auth").router);

//Top Level Route
app.use("/", require("./routes/index"));