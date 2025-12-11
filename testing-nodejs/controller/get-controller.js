function getController(req,res){
    console.log("got here ");
    res.send("Hello World");
}

module.exports = getController;