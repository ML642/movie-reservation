const userService = require('../services/userService');

const loginController= async (email:string,password:string)=>{
    try{
        
        let normalizedEmail :String = (email || '').trim()
        
        const user = await userService.findByEmail(normalizedEmail);

        bcrypt.compare(password,user.password)



    }
    catch{

    }
}








module.exports = {loginController}