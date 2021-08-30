express = require('express')
passport = require('passport')
router = express.Router()
let User = require('../models/User')

//@desc     Login/Landing page
//@route    GET /auth/login
router.get('/login', (req, res) => {
    if(req.query.returnTo){
        req.session.returnTo = req.query.returnTo;
    }    
    if(req.user){
        if(req.session.returnTo){
            let returnTo = req.session.returnTo
            delete req.session.returnTo
            res.redirect(returnTo)
        }else{
            res.redirect('/')
        }
        
    }else{
        res.render('login', {
            layout: 'login',
            message: req.flash(),
            app_name: process.env.APP_NAME
        })
    }
    
})


//@desc     Login/Landing page
//@route    GET /auth/google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}))


//@desc     Login/Landing page
//@route    GET /auth/google
router.get('/google/callback', passport.authenticate('google', {
    successRedirect: '/auth/login',
    failureRedirect: '/auth/login'
}))




router.post('/login', (req, res) => {
    var email = req.body.Email
    var password = req.body.Password

    User.findOne({
        email: email
    }, function (err, result) {
        if (err) throw err
        let user = result
        if (user) {
            if (user.last_name == password) {
                res.redirect('/gallery')
            } else {
                req.flash('failure', 'Incorrect Credentials')
                res.render('login', {
                    layout: 'login',
                    message: req.flash()
                })
            }
        } else {
            req.flash('failure', "Whoops...that user doesn't exist")
            res.render('login', {
                layout: 'login',
                message: req.flash()
            })
        }

    })

})

module.exports = router