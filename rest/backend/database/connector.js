const mysql = require("mysql");

let con;

const getConnection = () =>{ return con; }

const isConnected = () =>{ return con != undefined; }

const connect = async () =>{
    return new Promise((resolve, reject) =>{
        if(isConnected()) reject("Already connected!");

        con = mysql.createPool({
            host: process.env.HOST,
            user: process.env.USERNAME,
            password: process.env.PSWD,
            database: process.env.DATABASE
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
    getConnection: getConnection,
    isConnected: isConnected,
    connect: connect,
    disconnect: disconnect
}