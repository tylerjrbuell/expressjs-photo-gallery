express = require('express')
let router = express.Router()
const multipart = require('connect-multiparty');
User = require('../models/User')
const userModel = require('../models/UserModel')
fs = require('fs')

//connect-multiparty will help to access uploaded files on the req.files object
const multipartMiddleware = multipart({ maxFieldsSize: (20 * 1024 * 1024), uploadDir: process.env.PHOTO_UPLOAD_DIR});
router.use(multipartMiddleware);


function ensureAuthenticated(req,res,next){
    if(req.user){
        return next();
    }
    if(req.originalUrl == '/'){
        res.redirect('/auth/login')
    }else{
        res.redirect(`/auth/login?returnTo=${req.originalUrl}`);
    }
    
}


router.get('/',ensureAuthenticated,(req, res) => {
    res.redirect('/gallery')  
})

router.get('/logout', function (req, res) {
    req.session.destroy(function (e) {
        req.logout();
        res.redirect('/');
    });
});


function renderGallery(req,res,data=undefined){
    let render_data = {}
    if(!data){
         render_data = {
            base_url: `https://${process.env.SERVER}/`,
            username: req.user.first_name,
            toast_msg: req.flash(),
            image_permissions: ['delete','upload'],
            image: req.user.image,
            app_name: process.env.APP_NAME,
            user_photos: req.user.user_photos.reverse()
        }
    }else{
        render_data = {
            base_url: `https://${process.env.SERVER}/`,
            username: data.first_name,
            toast_msg: req.flash(),
            image_permissions: [],
            user_image: data.image,
            image: req.user.image,
            app_name: process.env.APP_NAME,
            user_photos: data.user_photos.reverse()
        }
    }

    res.render('gallery', render_data)
}

//@desc     Friends
//@route    GET /friends
router.get('/friends',ensureAuthenticated, async (req, res) => {
    let user_friends =  await User.find().where('_id').in(req.user.friends_list).lean().exec()
    res.render('friends',{
        base_url: `https://${process.env.SERVER}/`,
        username: req.user.first_name,
        toast_msg: req.flash(),
        image: req.user.image,
        app_name: process.env.APP_NAME,
        friends: user_friends
    })

})

//@desc     Gallery
//@route    GET /gallery
router.get('/gallery/:user_id?',ensureAuthenticated, async (req, res) => {
    if(!req.params.user_id){
            if(!req.session.greeted){
                req.flash('msg',`Welcome ${req.user.display_name}!`);
                req.session.greeted = true
            }
            renderGallery(req,res)
    }else{
        try{
            let user = await userModel.findUser(req.params.user_id)
            if(!user){
                throw('Invalid User')
            }
            if(await userModel.isFriend(req.user._id,user._id)){
                renderGallery(req,res,user)     
            }else{
                req.flash('msg',"You are not authorized to view that user's gallery.")
                res.redirect('/gallery')
            }
        }catch{
            req.flash('msg',"Invalid Gallery User")
            res.redirect('/gallery')
        }
    }

})

router.get('/acceptInvite',ensureAuthenticated,async (req,res) => {
    
    try{
        if(req.user._id == req.query.user_id){
            req.flash('msg','Cannot accept your own invitation')
            res.redirect('/gallery')
        }else{
            let isFriend = await userModel.isFriend(req.user._id,req.query.user_id) 
            let invitedUser = await userModel.findUser(req.query.user_id)
            if(!isFriend){
                //Add requesting user to invited users friends
                await User.findByIdAndUpdate(req.user._id, {$push: {friends_list: req.query.user_id}});
                req.flash('msg',`${invitedUser.display_name} is now your friend, you can now see their photo gallery 📷`)
                res.redirect('/friends')
            }else{
                req.flash('msg',`You are already friends with ${invitedUser.display_name} 👍`)
                res.redirect('/friends')
            }

        }
        
    }catch(error){
        req.flash('msg',error.message)
        res.redirect('/gallery')
    }
    
    
})

router.post('/friends/unfriend/:user_id',ensureAuthenticated,async (req,res) => {
    if(await userModel.isFriend(req.user._id,req.params.user_id)){
        let result = await userModel.removeFriend(req.user._id,req.params.user_id)
        res.send(result)
    }else{
        res.send({success:false,msg:"You are not friends with that user"})
    }
})

router.post('/gallery/inviteFriend',ensureAuthenticated,async (req,res) => {
    const sendEmail = require('../config/mailer');
    let body = `You have been invited to view ${req.user.display_name}'s Photo Gallery!\n
    Follow the link to accept the invitation: ${req.protocol}://${process.env.SERVER}/acceptInvite?user_id=${req.user._id}`;
    try{
        let result = await sendEmail(req.body.inviteEmail,'Photo Gallery Invitation',body);
        res.send(result);
    }catch(error){
        let result = {message:'failure',error:error.message}
        res.send(result);
    }
    
    
})


router.post('/gallery/delete',ensureAuthenticated,async (req,res) => {
    let path = req.body.path
    let result = await User.findByIdAndUpdate(req.user._id, {$pull: {user_photos: {path: path}}},{ //options
        returnNewDocument: true,
        new: true,
        strict: false,
        rawResult: true
      });
    if(result.lastErrorObject.updatedExisting){
        res.send({success: true});
        res.user = result.value;
        result = await fs.promises.unlink(path);
    }else{
        res.send({success:false});
    }
    
})

router.post('/gallery/upload',ensureAuthenticated, async (req, res) => {
    let file = req.files.photo_file    
    if(file && req.user){
        if(!req.user.user_photos){
            req.user = await User.findByIdAndUpdate(req.user._id, {$set: {user_photos: [file]}},{ //options
                returnNewDocument: true,
                new: true,
                strict: false
              });
        }else{
            req.user = await User.findByIdAndUpdate(req.user._id, {$push: {user_photos: file}},{ //options
                returnNewDocument: true,
                new: true,
                strict: false
              });
        }

    }
    req.flash('msg','Image(s) uploaded successfully!');
    res.redirect('/gallery')
})

module.exports = router