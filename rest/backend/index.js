require("dotenv").config();
const express = require("express");

const fs = require("fs");
const path = require('path');
var rfs = require('rotating-file-stream')
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const session = require("express-session");

const config = require("./config.json");
const connector = require("./database/connector");

var MySQLStore = require("express-mysql-session")(session);

let logStream = rfs.createStream('access.log', {
    interval: "1d",
    path: path.join(__dirname, '/logs/')
})


const app = express();


const init = async () =>{
    try{await fs.promises.access(__dirname + "/logs");} catch(error) {await fs.promises.mkdir(__dirname + "/logs");}

    app.use(morgan('combined', { stream: logStream }));

    console.log("[INFO] EPS-Backend Rest API is starting...\n");
    console.log("[INFO] EPS-Backend by Henry Herrmann & Jermie Bents");
    console.log(`[INFO] Date: ${new Date()}`);
    console.log(`[INFO] Node version: ${process.version}`);

    connector.connect().then(() =>{
        var sessionStore = new MySQLStore({}, connector.getConnection());

        app.use(session({
            key: process.env.SESSION_KEY,
            secret: process.env.SESSION_SECRET,
            store: sessionStore,
            resave: false,
            saveUninitialized: false
        }))

        app.use(cookieParser());
        
        app.use(express.urlencoded({extended: true}));
        app.use(express.json());
        
        app.use("/v1", require("./routes/v1/app.js"));
        app.use("/", require("./routes/status.js"));
    }).catch(err => console.log(err));
}

init().then(() =>{
    app.listen(config.port, () =>{
        console.log(`[INFO] EPS-Backend Rest API started. Listening on port: ${config.port}`)
    })
})

