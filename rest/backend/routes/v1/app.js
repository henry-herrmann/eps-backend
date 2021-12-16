const express = require("express");

const dbHandler = require("../../database/dbHandler");

const { result } = require("../../structure");

const router = express.Router();

router.get("/users", async (req, res) =>{
    res.status(200).json(result(200, "All users", await dbHandler.getAllUsers()));
})

router.post("/admin/create", async (req, res) =>{
    if(!req.body.name || !req.body.password) return res.status(400).json(result(400, 'Bad request'));

    res.status(200).json(result(200, "Sucessfully created user!", await dbHandler.createUser(req.body.name, req.body.password)));
})

router.delete("/admin/delete", async (req, res) =>{
    if(!req.body.id) return res.status(400).json(result(400, 'Bad request'));

    res.status(200).json(result(200, "Sucessfully deleted user!", await dbHandler.deleteUser(req.body.id)));
})

router.get("/user/:id", async (req, res) =>{
    if(!req.params.id) return res.status(400).json(result(400, 'Bad request'));

    res.status(200).json(result(200, "User information for user with id " + req.params.id, await dbHandler.getUser(req.params.id)));
})

module.exports = router;