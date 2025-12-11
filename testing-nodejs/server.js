const express= require("express");
const getRoute = require("./routes/get-route");
const app = express();


app.use(getRoute);
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});