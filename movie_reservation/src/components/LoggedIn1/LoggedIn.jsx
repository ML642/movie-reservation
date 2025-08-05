import { motion } from "framer-motion"  ; 
import { useState , useEffect } from "react" ; 
import classes from "./LoggedIn.css"

const LoggedIn = (props) =>
    {


    return (
    <div className={classes.LoggedIn}>
          <div className = {classes.userName}> 
            <h1>  { props.username }  </h1>
            

          </div>


    </div>
    )

    } 


export default LoggedIn     