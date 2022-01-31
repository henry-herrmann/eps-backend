const express = require("express");
const bcrypt = require("bcrypt");

const dbHandler = require("../../database/dbHandler");

const { result } = require("../../structure");

const router = express.Router();

router.post("/login", async (req, res) =>{
    if(!req.body.name || !req.body.password) return res.status(404).json(result(404, "Please provide a username and a password."))

    if(req.session.user){
        return res.status(200).json(result(200, "Logged in."));
    }

    const user = await dbHandler.getUserByName(req.body.name);
    if(user == null){
        return res.status(404).json(result(204, 'User does not exist.'));
    }


    const valid = await bcrypt.compare(req.body.password, user.password).catch((err) => {
        return res.status(500).json(result(500, "Internal Server Error"));
    })

    if(valid){
        req.session.user = { id: user.id, name: user.name, role: user.role }

        return res.status(200).json(result(200, "Successfully logged in.", [{sessionId: req.sessionID, userId: req.session.user.id}]));
    }else{
        return res.status(401).json(result(401, "Incorrect password."));
    }
})

router.get("/users", async (req, res) => {
    if(!req.session.user){
        return res.status(401).json(result(401, "Unauthorized"));
    }

    if(req.session.user < 2){
        return res.status(403).json(result(403, "Forbidden"));
    }

    res.status(200).json(result(200, "All users", await dbHandler.getAllUsers()));
})

router.post("/user/create", async (req, res) =>{
    if(!req.body.name || !req.body.password || !req.body.role) return res.status(400).json(result(400, 'Bad request'));

    if(!req.session.user){
        return res.status(401).json(result(401, "Unauthorized"));
    }

    if(req.session < 3){
        return res.status(403).json(result(403, "Forbidden"));
    }

    if(await dbHandler.getUserByName(req.body.name) != null){
        return res.status(204).json(result(204, 'User already exists'));
    }
    const created = await dbHandler.createUser(req.body.name, req.body.password, req.body.role).catch(err => console.log(err));
    res.status(200).json(result(200, "Sucessfully created user!", created));
})

router.delete("/user/:id/delete", async (req, res) =>{
    if(!req.params.id) return res.status(400).json(result(400, 'Bad request'));

    if(!req.session.user || !req.session.role){
        return res.status(401).json(result(401, "Unauthorized"));
    }

    if(req.session.role != 3){
        return res.status(403).json(result(403, "Forbidden"));
    }

    if(await dbHandler.getUser(req.params.id) == null){
        return res.status(204).json(result(204, 'User does not exist'));
    }

    res.status(200).json(result(200, "Sucessfully deleted user!", await dbHandler.deleteUser(req.params.id)));
})

router.get("/user/:id/profile", async (req, res) =>{
    if(!req.params.id) return res.status(400).json(result(400, 'Bad request'));

    if(!req.session.user){
        return res.status(204).json(result(204, "Unauthorized."));
    }

    res.status(200).json(result(200, "User information for user with id " + req.params.id, await dbHandler.getUser(req.params.id)));
})

router.get("/user/profile", async (req, res) =>{
    if(!req.session.user){
        return res.status(204).json(result(204, "Unauthorized."));
    }

    res.status(200).json(result(200, "User information for yourself", await dbHandler.getUser(req.session.user.id)));
})

router.get("/events/all", async (req, res) =>{

    if(!req.session.user){
        return res.status(401).json(result(401, "Unauthorized."));
    }

    const events = await dbHandler.getEvents(req.session.user.id).catch(err =>{
        return res.status(500).json(result(500, "Internal Server Error."));
    })

    return res.status(200).json(result(200, "All events:", events));
})

router.get("/events/today", async (req, res) =>{

    if(!req.session.user){
        return res.status(401).json(result(401, "Unauthorized."));
    }

    const events = await dbHandler.getEvents(req.session.user.id, "today").catch(err =>{
        return res.status(500).json(result(500, "Internal Server Error."));
    })

    return res.status(200).json(result(200, "Events for today events:", events));
})

router.get("/stats", async (req, res) =>{

    if(!req.session.user){
        return res.status(401).json(result(401, "Unauthorized."));
    }

    const eventsToday = await dbHandler.getEvents(req.session.user.id, "today").catch(err =>{
        return res.status(500).json(result(500, "Internal Server Error."));
    })

    const eventsAll = await dbHandler.getEvents(req.session.user.id).catch(err =>{
        return res.status(500).json(result(500, "Internal Server Error."));
    })

    const startdate = new Date("March 28, 2022 10:00:00");
    const enddate = new Date("April 1, 2022 09:45:00");

    return res.status(200).json(result(200, "Success", [{startDate: startdate.getTime(), endDate: enddate.getTime(), eventsToday: eventsToday, eventsAll: eventsAll}]));
})

router.post("/event/create", async (req, res) =>{
    if(!req.body.name || !req.body.date) return res.status(400).json(result(400, 'Bad request'));

    if(!req.session.user || !req.session.role){
        return res.status(401).json(result(401, "Unauthorized"));
    }

    if(req.session.role < 2){
        return res.status(403).json(result(403, "Forbidden"));
    }

    if(await dbHandler.getEvent(req.body.name) != null){
        return res.status(204).json(result(204, "Event already exists."));
    }

    const created = await dbHandler.createEvent(req.body.name, req.body.date, req.params.description ? req.params.description : "").catch((err) =>{
        return res.status(500).json(result(500, "Internal Server Error"));
    })

    if(req.session.user.role >= 2){
        const event = await dbHandler.getEvent(req.body.name);
        await dbHandler.addTeacherToEvent(req.session.user.id, event.id);

        return res.status(200).json(result(200, "Sucessfully created event!", event));
    }

    return res.status(200).json(result(200, "Sucessfully created event!", created));

})

router.delete("/event/delete", async (req, res) =>{
    if(!req.body.id) return res.status(400).json(result(400, "Bad request"));

    if(!req.session.user){
        return res.status(401).json(result(401, "Unauthorized!"));
    }

    if(!req.session.user.role < 2){
        return res.status(403).json(result(403, "Forbidden."));
    }

    const event = await dbHandler.getEvent("", parseInt(req.body.id));
    if(event == null){
        return res.status(400).json(result(400, "Event does not exist."));
    }

    dbHandler.deleteEvent(req.body.id).then(() =>{
        return res.status(200).json(result(200, "Success!", event));
    }).catch((err) =>{
        return res.status(500).json(result(500, "Internal Server Error"));
    })
})

router.patch("/event/:id/update", async (req, res) =>{
    if(!req.params.id || !req.body.name || !req.body.desc || !req.body.date || !req.body.type) return res.status(400).json(result(400, "Bad request."));

    if(!req.session.user || !req.session.role){
        return res.status(401).json(result(401, "Unauthorized"));
    }

    if(req.session.role < 2){
        return res.status(403).json(result(403, "Forbidden"));
    }

    const event = await dbHandler.getEvent("", parseInt(req.params.id));
    if(event == null){
        return res.status(400).json(result(400, "Event does not exist."));
    }

    const date = new Date(req.body.date);

    const timestamp = `${date.getFullYear()}-${date.getMonth()+1}-${date.getUTCDay()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

    await dbHandler.executeSQL("UPDATE events SET name = ?, desc = ?, date = ?, type = ? WHERE id = ?", [req.body.name, req.body.desc, timestamp, req.body.type, req.params.id]).then(() =>{
        return res.status(200).json(result(200, "Sucessfully updated the event!"));
    }).catch(err =>{
        return res.status(500).json(result(500, "Internal Server Error"));
    })
})

router.patch("/event/:id/update/name/:name", async (req, res) =>{
    if(!req.params.id || !req.params.id) return res.status(400).json(result(400, 'Bad request'));

    if(!req.session.user || !req.session.role){
        return res.status(401).json(result(401, "Unauthorized"));
    }

    if(req.session.role < 2){
        return res.status(403).json(result(403, "Forbidden"));
    }

    await dbHandler.executeSQL("UPDATE events SET name = ? WHERE id = ?", [req.params.name, req.params.id]).then(() =>{
        res.status(200).json(result(200, `The name for the event with the id ${req.params.id} was updated to: ${req.params.name}`));
    }).catch(err =>{
        res.status(500).json(result(500, "Internal Server Error. Please provide a name and id parameter."));
    })
})

router.patch("/event/:id/update/date/:date", async (req, res) =>{
    if(!req.params.id || !req.params.date) return res.status(400).json(result(400, "Bad request."));

    if(!req.session.user || !req.session.role){
        return res.status(401).json(result(401, "Unauthorized"));
    }

    if(req.session.role < 2){
        return res.status(403).json(result(403, "Forbidden"));
    }

    await dbHandler.executeSQL("UPDATE events SET date = ? WHERE id = ?", [req.params.date, req.params.id]).then(() =>{
        res.status(200).json(result(200, `The date of the event with the id ${req.params.id} was updated to: ${req.params.date}`))
    }).catch(err =>{
        res.status(500).json(result(500, "Internal Server Error. Make sure to provide the id and date parameter."))
    })
})

router.post("/event/join/:eventid", async (req, res) =>{
    if(!req.params.eventid) return res.status(400).json(result(400, 'Bad request'));

    if(!req.session.user){
        return res.status(401).json(result(401, "Unauthorized"));
    }

    if(req.session.user.role > 2){
        await dbHandler.addTeacherToEvent(req.session.user.id, req.params.eventid).then((callback) =>{
            res.status(200).json(result(200, `The teacher with the id ${req.session.user.id} now attends the event with the id ${req.params.eventid}`));
        }).catch(err =>{
            console.log(err)
            res.status(500).json(result(500, "The teacher already attends that event."));
        })
        return;
    }

    await dbHandler.attendEvent(req.session.user.id, req.params.eventid).then((callback) =>{
        res.status(200).json(result(200, `The user with the id ${req.session.user.id} now attends the event with the id ${req.params.eventid}`));
    }).catch(err =>{
        res.status(500).json(result(500, "The user already attends that event."));
    })
})


router.post("/event/join/:eventid/:userid", async (req, res) =>{
    if(!req.params.eventid || !req.params.userid) return res.status(400).json(result(400, 'Bad request'));

    if(!req.session.user){
        return res.status(401).json(result(401, "Unauthorized"));
    }

    if(req.session.user.role < 2){
        return res.status(403).json(result(403, "Forbidden"));
    }

    const user = await dbHandler.getUser(req.params.userid);

    if(user == null) return res.status(400).json(result(400, "No user found."));

    if(user[0].role > 2){
        await dbHandler.addTeacherToEvent(user[0].id, req.params.eventid).then((callback) =>{
            res.status(200).json(result(200, `The teacher with the id ${req.params.userid} now attends the event with the id ${req.params.eventid}`));
        }).catch((err) =>{
            res.status(500).json(result(500, "The teacher already attends that event."));
        })
        return;
    }

    await dbHandler.attendEvent(req.params.userid, req.params.eventid).then((callback) =>{
        res.status(200).json(result(200, `The user with the id ${req.params.userid} now attends the event with the id ${req.params.eventid}`));
    }).catch(err =>{
        res.status(500).json(result(500, "The user already attends that event."));
    })
})

router.delete("/event/leave/:eventid/:userid", async (req, res) =>{
    if(!req.params.eventid || !req.params.userid) return res.status(400).json(result(400, 'Bad request'));

    if(!req.session.user){
        return res.status(401).json(result(401, "Unauthorized"));
    }

    if(req.session.user.role < 2){
        return res.status(403).json(result(403, "Forbidden"));
    }

    const user = await dbHandler.getUser(req.params.userid)


    if(user == null) return res.status(400).json(result(400, "No user found."));

    if(user[0].role > 2){
        await dbHandler.removeTeacherFromEvent(user[0].id, req.params.eventid).then((callback) =>{
            res.status(200).json(result(200, `The teacher with the id ${req.session.user.id} was removed from the event with the id ${req.params.eventid}`));
        }).catch(err =>{
            res.status(500).json(result(500, "The teacher does not attend that event."));
        })
        return;
    }

    await dbHandler.leaveEvent(req.params.userid, req.params.eventid).then((callback) =>{
        res.status(200).json(result(200, `The user with the id ${req.params.userid} left the event with the id ${req.params.eventid}`));
    }).catch(err =>{
        res.status(500).json(result(500, "The user does not attend that event."));
    })
})

router.delete("/event/leave/:eventid", async (req, res) =>{
    if(!req.params.eventid) return res.status(400).json(result(400, 'Bad request'));

    if(!req.session.user){
        return res.status(401).json(result(401, "Unauthorized"));
    }

    if(req.session.user.role > 2){
        await dbHandler.removeTeacherFromEvent(req.session.user.id, req.params.eventid).then((callback) =>{
            res.status(200).json(result(200, `The teacher with the id ${req.session.user.id} was removed from the event with the id ${req.params.eventid}`));
        }).catch(err =>{
            res.status(500).json(result(500, "The teacher does not attend that event."));
        })
        return;
    }

    await dbHandler.leaveEvent(req.session.user.id, req.params.eventid).then((callback) =>{
        res.status(200).json(result(200, `The user with the id ${req.session.user.id} left the event with the id ${req.params.eventid}`));
    }).catch(err =>{
        res.status(500).json(result(500, "The user does not attend that event."));
    })
})

router.get("/event/:eventid/users", async (req, res) =>{
    if(!req.params.eventid) return res.status(400).json(result(400, 'Bad request'));

    const attendees = await dbHandler.getEventParticipants(req.params.eventid).catch(err =>{
        res.status(500).json(result(500, "Internal Server Error", err));
    }) 

    res.status(200).json(result(200, "Event participants:", attendees));
})

router.get("/event/:eventid/teachers", async (req, res) =>{
    if(!req.params.eventid) return res.status(400).json(result(400, 'Bad request'));

    const teachers = await dbHandler.getEventTeachers(req.params.eventid).catch(err =>{
        res.status(500).json(result(500, "Internal Server Error", err));
    }) 

    res.status(200).json(result(200, "Event teachers:", teachers));
})

router.get("/event/:eventid/data", async (req, res) =>{
    if(!req.params.eventid) return res.status(400).json(result(400, 'Bad request'));

    const event = await dbHandler.getEvent("", req.params.eventid).catch(err =>{
        return res.status(500).json(result(500, "Internal Server Error"));
    })

    res.status(200).json(result(200, "Event data: ", event[0]));
})



module.exports = router;