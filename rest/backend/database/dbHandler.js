const { getConnection, isConnected } = require("./connector");

const bcrypt = require("bcrypt");


const getAllUsers = async () =>{
    return new Promise((resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");

        getConnection().query("SELECT * FROM users", (err, result, fields) =>{
            if(err) reject(err);
            return resolve(result);
        })
    })
}

const getUser = async (id) =>{
    return new Promise((resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");

        getConnection().query("SELECT * FROM users WHERE id = " + id, (err, result, fields) =>{
            if(err) reject(err);

            if(result == undefined || result.length == 0) return resolve(null);

            return resolve([{id: result[0].id, name: result[0].name, role: result[0].role}]);
        })
    })
}

const getUserByName = async (name) =>{
    return new Promise((resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");

        getConnection().query("SELECT * FROM users WHERE name = ?", [name], (err, result, fields) =>{
            if(err) reject(err);

            if(result == undefined || result.length == 0) return resolve(null);

            return resolve(result[0]);
        })
    })
}

const createUser = async (name, password, role) =>{
    return new Promise((resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");

        bcrypt.hash(password, 10, (err, hash) =>{
            if(err) return reject(err);

            getConnection().query(`INSERT INTO users (name, password, role) VALUES (?,?,?);`, [name, hash, role], (err, result, fields) =>{
                if(err) reject(err);
                return resolve({
                    name: name
                });
            })
        })
    })
}

const deleteUser = async (id) =>{
    return new Promise((resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");

        getConnection().query(`DELETE FROM users WHERE id = ?`, [id], (err, result, fields) =>{
            if(err) reject(err);

            getConnection().query("DELETE FROM event_participants WHERE userid = ?", [id], (err1, result1, fields1) =>{
                if(err1) reject(err1);

                return resolve({
                    id: id
                });
            })
        })
    })
}

const createEvent = async (name, date) => {
    return new Promise((resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");

        getConnection().query(`INSERT INTO events (name, date) VALUES (?,?);` , [name, date], (err, result, fields) =>{
            if(err) reject(err);
            return resolve({
                name,
                date
            });
        })
    })
}

const attendsEvent = async (userid, eventid) => {
    return new Promise((resolve, reject) =>{
        if(!isConnected()) return reject("Not connected!");

        getConnection().query("SELECT userid FROM event_participants WHERE userid = ? AND eventid = ?", [userid, eventid], (err, result, fields) =>{
            if(err) reject(err);

            return resolve(result.length != 0);
        })
    })
}

const attendEvent = async (userid, eventid) => {
    return new Promise(async (resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");

        if(await attendsEvent(userid, eventid)) return reject("User already attends the event");

        getConnection().query(`INSERT INTO event_participants (userid, eventid) VALUES (?,?);` , [userid, eventid], (err, result, fields) =>{
            if(err) reject(err);
            return resolve({
                userid,
                eventid
            });
        })
    })
}

const leaveEvent = async (userid, eventid) => {
    return new Promise(async (resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");

        if(await attendsEvent(userid, eventid) == false) return reject("User does not attend the event.");

        getConnection().query(`DELETE FROM event_participants WHERE userid = ? AND eventid = ?` , [userid, eventid], (err, result, fields) =>{
            if(err) reject(err);
            return resolve({
                userid,
                eventid
            });
        })
    })
}

const getEvent = (name = "", id = 0) =>{
    return new Promise((reject, resolve) =>{
        if(id == 0){
            getConnection().query("SELECT FROM events WHERE name = ?", [name], (err, result, fields) =>{
                if(err) return reject(err);

                if(result == undefined || result.length == 0) return resolve(null);

                return resolve(result);
            })
        }else{
            getConnection().query("SELECT FROM events WHERE id = ?", [id], (err, result, fields) =>{
                if(err) return reject(err);

                if(result == undefined || result.length == 0) return resolve(null);

                return resolve(result);
            })
        }
    })
}

const executeSQL = async (sql, values) => {
    return new Promise((resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");
        getConnection().query(sql , values, (err, result, fields) =>{
            if(err) reject(err);
            return resolve();
        })
    })
}


module.exports = {
    getUser, getAllUsers, createUser, deleteUser, createEvent, executeSQL, getUserByName, attendEvent, leaveEvent, getEvent
}