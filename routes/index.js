express = require('express')
let router = express.Router()
const multipart = require('connect-multiparty');
const User = require('../models/User')
const mongodb = require('mongodb');
const userModel = require('../models/UserModel')
let forceAuth = require('./auth').ensureAuthenticated
fs = require('fs')

//connect-multiparty will help to access uploaded files on the req.files object
const multipartMiddleware = multipart({ maxFieldsSize: (20 * 1024 * 1024), uploadDir: process.env.PHOTO_UPLOAD_DIR});
router.use(multipartMiddleware);





router.get('/',forceAuth,(req, res) => {
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
            user_photos: req.user.user_photos ? req.user.user_photos.reverse() : [],
            photo_likes: req.user.photo_likes,
            current_user: req.user
        }
    }else{
        render_data = {
            base_url: `https://${process.env.SERVER}/`,
            username: data.first_name,
            toast_msg: req.flash(),
            image_permissions: ['like','share'],
            user_image: data.image,
            image: req.user.image,
            app_name: process.env.APP_NAME,
            user_photos: data.user_photos ? data.user_photos.reverse() : [],
            photo_likes: data.photo_likes,
            current_user: req.user
        }
    }

    res.render('gallery', render_data)
}

//@desc     Friends
//@route    GET /friends
router.get('/friends',forceAuth, async (req, res) => {
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
router.get('/gallery/:user_id?',forceAuth, async (req, res) => {
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
        }catch {
            req.flash('msg',"Invalid Gallery User")
            res.redirect('/gallery')
        }
    }

})

router.get('/acceptInvite',forceAuth,async (req,res) => {
    
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

router.post('/friends/unfriend/:user_id',forceAuth,async (req,res) => {
    if(await userModel.isFriend(req.user._id,req.params.user_id)){
        let removeFriend = await userModel.removeFriend(req.user._id,req.params.user_id)
        res.send(removeFriend)
    }else{
        res.send({success:false,msg:"You are not friends with that user"})
    }
})

router.post('/gallery/inviteFriend',forceAuth,async (req,res) => {
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

router.post('/gallery/like',forceAuth, async (req, res) => {
    let image_id = mongodb.ObjectID(req.body.image_id);
    let image_user = await User.findOne().where('user_photos._id',image_id).lean().exec()
    let like_status = await User.findOne({photo_likes: {$elemMatch: {user:req.user._id.toString(),photo:image_id.toString(),}}})
    if(!like_status){
        let add_like = await User.findByIdAndUpdate(mongodb.ObjectID(image_user._id),{ $push: {photo_likes: {user: req.user._id.toString(),photo: image_id.toString()}} },{ //options
            returnNewDocument: true,
            new: true,
            strict: false
          });
        if(add_like){
            res.send({success:true,liked:true})
        }else{
            res.send({success:false})
        }
    }else{
        let remove_like = await User.findByIdAndUpdate(image_user._id,{ $pull: {photo_likes: {user: req.user._id.toString(),photo: image_id.toString()}} },{ //options
            returnNewDocument: true,
            new: true,
            strict: false
          });

        if(remove_like){
            res.send({success:true,unliked:true})
        }else{
            res.send({success:false})
        }
    }
    
    

})


router.post('/gallery/delete',forceAuth,async (req,res) => {
    let path = req.body.path;
    let id = req.body.image_id;
    let result = await User.findByIdAndUpdate(req.user._id, {$pull: {user_photos: {_id: mongodb.ObjectID(id)}}},{ //options
        returnNewDocument: true,
        new: true,
        strict: false
      });
    if(result){
        res.send({success: true});
        res.user = result;

        let delete_likes = await User.findByIdAndUpdate(req.user._id,{ $pull: {photo_likes: {photo: id.toString()}} },{ //options
            returnNewDocument: true,
            new: true,
            strict: false
          });

        try{
            result = await fs.promises.unlink(path);
        }catch(err){
            console.log(err);
        }
    }else{
        res.send({success:false});
    }
    
})

router.post('/gallery/upload',forceAuth, async (req, res) => {
    let files = Array.isArray(req.files.photo_file) ? req.files.photo_file : [req.files.photo_file]
    
    if(files && req.user){
        //Add UUID to each file object
        files.forEach((element,index) => {
            files[index] ={_id:new mongodb.ObjectID, ...element};
        });
        if(!req.user.user_photos){
            await User.findByIdAndUpdate(req.user._id, {$set: {user_photos: files}},{ //options
                returnNewDocument: true,
                new: true,
                strict: false
              });
        }else{
            await User.findByIdAndUpdate(req.user._id, {$push: {user_photos: files}},{ //options
                returnNewDocument: true,
                new: true,
                strict: false
              });
        }

    }
    req.flash('msg','Image(s) uploaded successfully!');
    res.redirect('/gallery')
})

router.get('*', function(req, res){
    res.status(404).render('404',{
        layout: ''});
  });

module.exports = router