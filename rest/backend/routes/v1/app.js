const express = require("express");
const bcrypt = require("bcrypt");

const dbHandler = require("../../database/dbHandler");

const { result } = require("../../structure");

const router = express.Router();

router.post("/login", async (req, res) =>{
    if(!req.body.name || !req.body.password) return res.status(400).json(result(400, "Please provide a username and a password."))

    if(req.session.user){
        return res.status(200).json(result(200, "Logged in."));
    }

    const user = await dbHandler.getUserByName(req.body.name);
    if(user == null){
        return res.status(204).json(result(204, 'User does not exist.'));
    }

    const valid = await bcrypt.compare(req.body.password, user.password).catch((err) => {
        return res.status(500).json(result(500, "Internal Server Error"));
    })

    if(valid){
        req.session.user = { id: user.id, name: user.name, role: user.role }
        return res.status(200).json(result(200, "Successfully logged in."));
    }else{
        return res.status(401).json(result(401, "Incorrect password."));
    }
})

router.get("/users", async (req, res) =>{
    if(!req.session.user){
        return res.status(401).json(result(401, "Unauthorized"));
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

    res.status(200).json(result(200, "User information for user with id " + req.params.id, await dbHandler.getUser(req.params.id)));
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

    res.status(200).json(result(200, "Sucessfully created event!", await dbHandler.createEvent(req.body.name, req.body.date)));
})

router.delete("/event/delete", (req, res) =>{
    
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

    await dbHandler.leaveEvent(req.session.user.id, req.params.eventid).then((callback) =>{
        res.status(200).json(result(200, `The user with the id ${req.session.user.id} left the event with the id ${req.params.eventid}`));
    }).catch(err =>{
        res.status(500).json(result(500, "The user does not attend that event."));
    })
})


module.exports = router;