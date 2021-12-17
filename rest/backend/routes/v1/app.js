const express = require("express");

const dbHandler = require("../../database/dbHandler");

const { result } = require("../../structure");

const router = express.Router();

router.get("/users", async (req, res) =>{
    res.status(200).json(result(200, "All users", await dbHandler.getAllUsers()));
})

router.post("/create", async (req, res) =>{
    if(!req.body.name || !req.body.password) return res.status(400).json(result(400, 'Bad request'));

    res.status(200).json(result(200, "Sucessfully created user!", await dbHandler.createUser(req.body.name, req.body.password)));
})

router.delete("/user/delete", async (req, res) =>{
    if(!req.body.id) return res.status(400).json(result(400, 'Bad request'));

    res.status(200).json(result(200, "Sucessfully deleted user!", await dbHandler.deleteUser(req.body.id)));
})

router.get("/user/:id/profile", async (req, res) =>{
    if(!req.params.id) return res.status(400).json(result(400, 'Bad request'));

    res.status(200).json(result(200, "User information for user with id " + req.params.id, await dbHandler.getUser(req.params.id)));
})

router.get("/event/:id/stats", async (req, res) =>{

})

router.post("/event/create", async (req, res) =>{
    if(!req.body.name || !req.body.date) return res.status(400).json(result(400, 'Bad request'));

    res.status(200).json(result(200, "Sucessfully created event!", await dbHandler.createEvent(req.body.name, req.body.date)));
})

router.delete("/event/delete", (req, res) =>{
    
})

router.patch("/event/update", async (req, res) =>{
    if(!req.body) return res.status(400).json(result(400, 'Bad request'));

    let sql = [];
    let values = [];
    for(const [key, value] of Object.entries(req.body)){
        if(key != "id"){
            sql.push(`${key} = ?`);
            values.push(value);
        }
    }


    await dbHandler.updateEvent(sql, values, req.body.id).then((callback) =>{
        res.status(200).json(result(200, "Sucessfully updated event!", callback))
    })
})



module.exports = router;