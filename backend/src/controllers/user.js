import { User } from "../models/user.js"
import httpStatus from "http-status";
import bcrypt, { hash } from "bcrypt"
import crypto from "crypto";
import { Meeting } from "../models/meeting.js";



const login=async (req,res)=>{
    const {username,password}=req.body;

    if(!username || !password){
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Enter  credentials" })
    }

    try{
        const user = await User.findOne({ username });
        if(!user){
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" })
        }
        let check=await bcrypt.compare(password,user.password);
        if(check){
            let token=crypto.randomBytes(20).toString("hex")
            user.token=token;
            await user.save();
            return res.status(httpStatus.OK).json({ token:user.token }) 
        }
        else{
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid password" })
        }

    }
    catch(e){
         return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid password" })
    }
}





const register = async (req, res) => {

    const { name, username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: "User already Exists" })

        }
        else {
            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({
                name: name,
                username: username,
                password: hashedPassword
            })
            await newUser.save();
            return res.status(201).json({ message: "User registered" })



        }
    }
    catch (e) {

    }

}

const getUserHistory=async (req,res)=>{
    const {token}=req.query;
    try{
        const user=await User.findOne({token:token});
        const meetings=await Meeting.find({user_id:user.username});
        res.json(meetings);

    }
    catch(e){
        res.json({message:`Something went wrong ${e}`})


    }
}


const addToHistory=async (req,res)=>{
    const {token,meeting_code}=req.body;
    try{
        const user=await User.findOne({token:token});
        const newMeeting=new Meeting({
            user_id:user.username,
            meetingCode:meeting_code
        })
        await newMeeting.save();
        res.status(httpStatus.CREATED).json({message:"Meeting added to history"});
    }
    catch(e){
        res.json({message:`Something went wrong ${e}`})
    }
}


export {login, register,getUserHistory,addToHistory}