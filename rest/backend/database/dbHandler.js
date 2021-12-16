const {con, isConnected } = require("./connector");

const getAllUsers = async () =>{
    return new Promise((resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");

        con().query("SELECT * FROM users", (err, result, fields) =>{
            if(err) reject(err);
            return resolve(result);
        })
    })
}

const getUser = async (id) =>{
    return new Promise((resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");

        con().query("SELECT * FROM users WHERE id = " + id, (err, result, fields) =>{
            if(err) reject(err);
            return resolve(result);
        })
    })
}

const createUser = async (name, password) =>{
    return new Promise((resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");

        con().query(`INSERT INTO users (name, password, role) VALUES (?,?,?);`, [name, password, 1], (err, result, fields) =>{
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

        con().query(`DELETE FROM users WHERE id = ?`, [id], (err, result, fields) =>{
            if(err) reject(err);
            return resolve({
                id: id
            });
        })
    })
}
module.exports = {
    getUser, getAllUsers, createUser, deleteUser
}