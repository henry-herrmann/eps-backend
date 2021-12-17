const { getConnection, isConnected } = require("./connector");

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
            return resolve(result);
        })
    })
}

const createUser = async (name, password) =>{
    return new Promise((resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");

        getConnection().query(`INSERT INTO users (name, password, role) VALUES (?,?,?);`, [name, password, 1], (err, result, fields) =>{
            if(err) reject(err);
            return resolve({
                name: name
            });
        })
    })
}

const deleteUser = async (id) =>{
    return new Promise((resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");

        getConnection().query(`DELETE FROM users WHERE id = ?`, [id], (err, result, fields) =>{
            if(err) reject(err);
            return resolve({
                id: id
            });
        })
    })
}

const createEvent = async (name, date) => {
    return new Promise((resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");

        getConnection().query(`INSERT INTO events (name, date) VALUES (?,?);` , [name, date, id], (err, result, fields) =>{
            if(err) reject(err);
            return resolve({
                name,
                date
            });
        })
    })
}

const updateEvent = async (sql, values, id) => {
    return new Promise((resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");
        getConnection().query(`UPDATE events SET ${sql} WHERE id = ?` , values.concat([id]), (err, result, fields) =>{
            if(err) reject(err);
            return resolve({
                values
            });
        })
    })
}


module.exports = {
    getUser, getAllUsers, createUser, deleteUser, createEvent, updateEvent
}