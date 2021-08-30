User = require('../models/User')


const findUser = async (id) => {
    let user = await User.findById(id).lean().exec()
    return user
}

const isFriend = async (current_user_id,check_user_id) => {
    let current_user = await findUser(current_user_id)
    return current_user.friends_list.includes(check_user_id.toString())
}

const removeFriend =  async (current_user_id,remove_id) => {
    let result = await User.findByIdAndUpdate(current_user_id,{$pull: {friends_list: remove_id}},{ //options
        returnNewDocument: true,
        new: true,
        strict: false,
        rawResult: true
      })
    if(result.lastErrorObject.updatedExisting){
        return {success: true}
    }else{
        return {success: false}
    }

}

module.exports = {findUser,isFriend,removeFriend}