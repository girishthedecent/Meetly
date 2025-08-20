import express from "express"

import { createServer } from "node:http"


import { Server } from "socket.io";



import mongoose from "mongoose"

import cors from "cors";

import connectToSocket from "./controllers/socketManager.js";

import userRoutes from "./routes/users.js"



const app = express();

const server=createServer(app);


const io=connectToSocket(server);


app.set("port",(process.env.PORT||3000))


app.use(cors({
  origin: "https://meetly-mgtt.onrender.com" 
}));
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb",extended:true}));


app.use("/api/v1/users",userRoutes);


// const server = createServer((req, res) => {
//   res.writeHead(200, { "Content-Type": "text/plain" });
//   res.end("Hello from Node server\n");
// });






const start = async () => {
    app.set("mongo_user")
    const connectionDb=await mongoose.connect("mongodb+srv://girishthedecnt:7jdtwL2wXtiJHg0v@cluster0.qa8wbbq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    console.log(`connected to db ${connectionDb.connection.host}`);

    server.listen(app.get("port"), () => {
        console.log("Server running at http://localhost:3000/");
    });
}
start();
