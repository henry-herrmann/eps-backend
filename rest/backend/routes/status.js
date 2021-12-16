const express = require("express");

const { result } = require("../structure");
const package = require("../../package.json");
const router = express.Router();

router.get("/", (req, res) =>{
    return res.status(200).json(result(200, `${package.name} running on version ${package.version}`, {
        name: package.name,
        version: package.version,
        author: package.author
    }))
})


module.exports = router;