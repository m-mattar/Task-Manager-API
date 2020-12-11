const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const {sendWelcomeEmail, sendCancellationEmail} = require('../emails/account')
const router = new express.Router()

// Create User
router.post('/users', async (req, res) => { 
    const user = new User(req.body)
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken() // Have Signup send back auth token
        res.status(201).send({ user, token })
    } catch(e) {
        res.status(400).send(e)
    }
})


// Login
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch(e) {
        res.status(400).send()
    }
})

//logout
router.post('/users/logout', auth, async(req, res) => {
    try{
        //remove the token used for logging in from the user's tokens array using filter
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch(e){
        res.status(500).send()
    }
})

//allows a user to logout from all sessions
router.post('/users/logoutAll', auth, async(req, res) => {
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()    
    } catch(e){
        res.status(500).send()
    }

})


// Read Users
// pass middleware function as a second argument, so that it happens before the call to the async function
router.get('/users/me', auth, async (req, res) => { 
    res.send(req.user)
})

// Update User 
router.patch('/users/me', auth, async (req, res) => { 
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }
    try {
        updates.forEach( (update) => req.user[update] = req.body[update]) //dynamic
        await req.user.save()

        res.send(req.user)
    } catch(e) {
        res.status(400).send(e)
    }
})

// Delete User
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancellationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch(e) {
        res.status(500).send()
    }
})

//upload or change a user's profile picture
const upload = multer({
    limits:{
        fileSize: 1000000//Bytes ie 1MB
    },
    fileFilter(req, file, cb){  //cb is the callback function
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true) //accept upload
    }
})

//use upload as middleware
//key in the body of the request needs to match up with the value provided to single
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) =>{
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer //accessible only if we don't have the 'dest' field in multer
    
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

//Delete a user's profile picture
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

//get a user's avatar
router.get('/users/:id/avatar', async (req, res) => {
    try{
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar){
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)

    } catch(e) {
        res.status(404).send()
    }
})

module.exports = router