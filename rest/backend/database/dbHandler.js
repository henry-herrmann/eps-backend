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

            if(result == undefined || result.length == 0) return resolve([{id: "", name: "", role: ""}]);

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

const createEvent = async (name, date, desc) => {
    return new Promise((resolve, reject) =>{
        if(!isConnected()) return reject("The API is not connected to the database.");

        getConnection().query(`INSERT INTO events (name, date, desc) VALUES (?,?,?);` , [name, date, desc], (err, result, fields) =>{
            if(err) reject(err);
            return resolve({
                name,
                date
            });
        })
    })
}

const deleteEvent = async (id) => {
    return new Promise((resolve, reject) =>{
        if(id == undefined || id == null) return reject("Id cannot be null.");

        getConnection().query("DELETE FROM events WHERE id = ?", [id], (err, result, fields) =>{
            if(err) return reject(err);

            getConnection().query("DELETE FROM event_participants WHERE eventid = ?", [id], (err1, result1, fields1) =>{
                if(err1) return reject(err1);

                getConnection().query("DELETE FROM event_teachers WHERE eventid = ?", [id], (err2, result2, fields1) =>{
                    if(err2) return reject(err2);
    
                    return resolve();
                })
            })
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
    return new Promise((resolve, reject) =>{
        if(id == 0){
            getConnection().query("SELECT * FROM events WHERE name = ?", [name], (err, result, fields) =>{
                if(err) return reject(err);

                if(result == undefined || result.length == 0) return resolve([]);

                return resolve(result);
            })
        }else{
            getConnection().query("SELECT * FROM events WHERE id = ?", [id], (err, result, fields) =>{
                if(err) return reject(err);

                if(result == undefined || result.length == 0) return resolve([]);


                return resolve(result);
            })
        }
    })
}

const participatesInEvent = (userid, eventid, role) => {
    return new Promise((resolve, reject) =>{
        if(role > 1){
            getConnection().query("SELECT * FROM event_teachers WHERE userid = ? AND eventid = ?", [userid, eventid], (err, result, fields) =>{
                if(err) return reject(err);

                if(result == undefined || result.length == 0) return resolve(false);

                return resolve(true);
            })
        }else{
            getConnection().query("SELECT * FROM event_participants WHERE userid = ? AND eventid = ?", [userid, eventid], (err, result, fields) =>{
                if(err) return reject(err);

                if(result == undefined || result.length == 0) return resolve(false);

                return resolve(true);
            })
        }
    })
}

const getEvents = (userid, role, date = "") => {
    return new Promise((resolve, reject) => {
        if(date == ""){
            getConnection().query("SELECT * FROM events ORDER BY date", async (err, result, fields) =>{
                if(err) return reject(err);

                if(result == undefined || result.length == 0) return resolve([]);

                const events = [];

                for(const event of result){
                    if(await participatesInEvent(userid, event.id, role)){
                        events.push({result: {id: event.id, name: event.name, desc: event.desc, date: new Date(event.date).getTime(), type: event.type}, member: true});
                    }else{
                        if(role < 2 && event.type == "Pflicht"){
                            events.push({result: {id: event.id, name: event.name, desc: event.desc, date: new Date(event.date).getTime(), type: event.type}, member: true});
                        }else{
                            events.push({result: {id: event.id, name: event.name, desc: event.desc, date: new Date(event.date).getTime(), type: event.type}, member: false});
                        }
                    }
                }

                return resolve(events);
            })
        }else{
            if(date == "today"){
                getConnection().query("SELECT * FROM events WHERE date >= timestamp(CURRENT_DATE()) AND date < timestamp(DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY)) ORDER BY date", async (err, result, fields) =>{
                    if(err) return reject(err);
    
                    if(result == undefined || result.length == 0) return resolve([]);
    
                    const events = [];

                    for(const event of result){
                        if(await participatesInEvent(userid, event.id, role)){
                            events.push({result: {id: event.id, name: event.name, desc: event.desc, date: new Date(event.date).getTime(), type: event.type}, member: true});
                        }else{
                            if(role < 2 && event.type == "Pflicht"){
                                events.push({result: {id: event.id, name: event.name, desc: event.desc, date: new Date(event.date).getTime(), type: event.type}, member: true});
                            }else{
                                events.push({result: {id: event.id, name: event.name, desc: event.desc, date: new Date(event.date).getTime(), type: event.type}, member: false});
                            }
                        }
                    }
    
                    return resolve(events);
                })
            }else{
                getConnection().query("SELECT * FROM events WHERE date >= timestamp(?) AND date < timestamp(DATE_ADD(?, INTERVAL 1 DAY)) ORDER BY date", [date, date], async (err, result, fields) =>{
                    if(err) return reject(err);
    
                    if(result == undefined || result.length == 0) return resolve([]);
    
                    const events = [];

                    for(const event of result){
                        if(await participatesInEvent(userid, event.id, role)){
                            events.push({result: {id: event.id, name: event.name, desc: event.desc, date: new Date(event.date).getTime(), type: event.type}, member: true});
                        }else{
                            if(role > 2 && event.type == "Pflicht"){
                                events.push({result: {id: event.id, name: event.name, desc: event.desc, date: new Date(event.date).getTime(), type: event.type}, member: true});
                            }else{
                                events.push({result: {id: event.id, name: event.name, desc: event.desc, date: new Date(event.date).getTime(), type: event.type}, member: false});
                            }
                        }
                    }
    
                    return resolve(events);
                })  
            }
        }
    })
}

const getEventParticipants = async (id) =>{
    return new Promise((resolve, reject) =>{
        if(id == undefined || id == null) return reject("Id cannot be undefined/null");

        getConnection().query("SELECT * FROM event_participants WHERE eventid = ?", [id], (err, result, fields) =>{
            if(err) return reject(err);

            if(result == undefined || result.length == 0) return resolve([]);

            return resolve(result);
        })
    })
}

const getEventTeachers = async (id) =>{
    return new Promise((resolve, reject) =>{
        if(id == undefined || id == null) return reject("Id cannot be undefined/null");

        getConnection().query("SELECT * FROM event_teachers WHERE eventid = ?", [id], (err, result, fields) =>{
            if(err) return reject(err);

            if(result == undefined || result.length == 0) return resolve([]);

            return resolve(result);
        })
    })
}

const teacherAttendsEvent = async (userid, eventid) =>{
    return new Promise((resolve, reject) =>{
        getConnection().query("SELECT * FROM event_teachers WHERE userid = ? AND eventid = ?", [userid, eventid], (err, result, fields) =>{
            if(err) return reject(err);

            return resolve(result.length != 0);
        })
    })
}

const addTeacherToEvent = async (userid, eventid) =>{
    return new Promise(async (resolve, reject) =>{
        if(userid == undefined || userid == null || eventid == undefined || eventid == null) return reject("Id cannot be undefined/null.");

        if(await teacherAttendsEvent(userid, eventid)) return reject();


        getConnection().query("INSERT INTO event_teachers (userid, eventid) VALUES (?, ?)", [userid, eventid], (err, result, fields) =>{
            if(err) return reject(err);

            return resolve();
        })
    })
}

const removeTeacherFromEvent = async (userid, eventid) =>{
    return new Promise(async (resolve, reject) =>{
        if(userid == undefined || userid == null || eventid == undefined || eventid == null) return reject("Id cannot be undefined/null.");

        if(await teacherAttendsEvent(userid, eventid) == false) return reject();

        getConnection().query("DELETE FROM event_teachers WHERE userid = ? AND eventid = ?", [userid, eventid], (err, result, fields) =>{
            if(err) return reject(err);

            return resolve();
        })
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
    getUser, getAllUsers, createUser, deleteUser, createEvent, executeSQL, getUserByName, attendEvent, leaveEvent, getEvent, deleteEvent, addTeacherToEvent, getEventParticipants, getEventTeachers, removeTeacherFromEvent, teacherAttendsEvent, getEvents
}