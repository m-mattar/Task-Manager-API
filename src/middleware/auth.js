const jwt = require('jsonwebtoken')
const User = require('../models/user')

//without middleware:   new request -> run route handler
//with middleware:      new request -> de something ->  run route handler (on next())

// middlewares are useful when we want to put the server under maintenance or disable some functionalities



const auth = async(req, res, next) => {
    try{
        const token =  req.header('Authorization').replace('Bearer ', '')
        //decoded payload
        //need to have the same secret used when generating tokens
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // find user with a correct id that has the authentication token still stored
        // if user has logged out, token must be invalid
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token})

        if(!user){
            throw new Error()
        }
        
        // used when logging out of a specific session
        // that way the user will not be logged out of all his sessions
        req.token = token 

        //adding user to the instance to the request
        //that way we will not have to fectch him from the DB again (saving resources)
        req.user = user
        next()

    } catch(e){
        res.status(401).send('error: Please authenticate.')

    }
}


module.exports = auth