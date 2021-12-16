const express = require("express");

const fs = require("fs");
const path = require('path');
const cors = require("cors");
var rfs = require('rotating-file-stream')
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const config = require("./config.json");
const connector = require("./database/connector");

let logStream = rfs.createStream('access.log', {
    interval: "1d",
    path: path.join(__dirname, '/logs/')
})

const app = express();

app.use(cors());

app.use(cookieParser());

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use("/v1", require("./routes/v1/app.js"));
app.use("/", require("./routes/status.js"));


const init = async () =>{
    try{await fs.promises.access(__dirname + "/logs");} catch(error) {await fs.promises.mkdir(__dirname + "/logs");}

    app.use(morgan('combined', { stream: logStream }));

    console.log("[INFO] EPS-Backend Rest API is starting...\n");
    console.log("[INFO] EPS-Backend by Henry Herrmann & Jermie Bents");
    console.log(`[INFO] Date: ${new Date()}`);
    console.log(`[INFO] Node version: ${process.version}`);
}

init().then(() =>{
    connector.connect().then(() =>{
        
        app.listen(config.port, () =>{
            console.log(`[INFO] EPS-Backend Rest API started. Listening on port: ${config.port}`)
        })
    }).catch(err => console.log(err));
})

