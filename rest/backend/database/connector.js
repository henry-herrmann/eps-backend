const mysql = require("mysql");

let con;

const getDB = () =>{ return con; }

const isConnected = () =>{ return con != undefined; }

const connect = async () =>{
    return new Promise((resolve, reject) =>{
        if(isConnected()) reject("Already connected!");

        con = mysql.createPool({
            host: "202.61.201.124",
            user: "eps",
            password: "(-6tzTFlIN0EP6x2",
            database: "eps"
        })

        console.log("[INFO] Connected to database!")
        return resolve();
    })
}

const disconnect = () => {
    if(!isConnected()) return;

    con.end();
}

module.exports = {
    con: getDB,
    isConnected: isConnected,
    connect: connect,
    disconnect: disconnect
}