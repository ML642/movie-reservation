const userService = require('../services/userService');

const login = async (email:string, password:string) => {
  const user = (await userService.findUserByEmail(email)) || (await userService.findUserByUsername(email));
  if (!user) throw new Error('Invalid credentials');

  let ans:boolean = bcrypt.compare(user.password,password)

  if(!ans) throw new Error('invalid credentials')
   

  
  return user;
};

module.exports = { login };
