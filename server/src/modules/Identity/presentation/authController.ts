const jwt = require("jwt");
import type { Request, Response, NextFunction } from "express";

const loginController = require("../application/Controller")

const login = async (req:Request,res:Response,next:NextFunction) =>{
    try {
        const {email,password} = req.body;

        const result = await loginController.login(email,password);

        return res.status(200).json(result)
    }
    catch(error){
       next(error)
    }
}

module.exports = {
    login,
}
