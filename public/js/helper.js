//Set active nav item
let nav_items = Array.from(document.getElementsByTagName('li'));
let current_path = window.location.pathname;
nav_items.forEach(element => {
     if(element.children[0].getAttribute('href') == current_path){
         element.classList.add('active')
     }
    
});

function toastWarning(msg,timeout){
    iziToast.warning({
        message: msg,
        timeout: timeout
    });
}

function likePhoto(element,icon){
    const ajax = new XMLHttpRequest()
    ajax.open('POST','/gallery/like');
    ajax.responseType = 'json';
    ajax.setRequestHeader("Content-type", "application/json");
    ajax.send(JSON.stringify({image_id:element.getAttribute('image_id')}));
    let icon_element = icon;
    ajax.onreadystatechange = function () {
        if(ajax.readyState === ajax.DONE){
            let result = ajax.response;
            element.setAttribute('style','display:block !important');
            icon_element.style.display = "none";
            var like_count = document.getElementById(`like_count_${element.getAttribute('image_id')}`);
            like_count.innerHTML = result.liked ? (parseInt(like_count.innerHTML) + 1).toString() : (parseInt(like_count.innerHTML) - 1).toString()
        }
    }
}

window.addEventListener('load',function () {

   Array.from(document.getElementsByClassName('fa-heart')).forEach( (element,index) => {
    document.getElementsByClassName('fa-heart-o')[index].onclick = function(){ likePhoto(element,this)};
   }); 

   Array.from(document.getElementsByClassName('fa-heart-o')).forEach( (element,index) => {
    document.getElementsByClassName('fa-heart')[index].onclick = function(){ likePhoto(element,this)};
   }); 
    
    setTimeout(() =>{
        document.getElementsByClassName('overlay')[0].remove();
        document.getElementsByClassName('spanner')[0].classList.remove('show');
        document.getElementsByClassName('loader')[0].classList.remove('show');
    },200)
    
})

if(document.getElementById('zoomRange')){
    document.getElementById('zoomRange').oninput = () => {
        let zoom_level = document.getElementById('zoomRange').value;
        document.getElementById('zoom_level').innerHTML =zoom_level;
        document.getElementsByClassName('photos')[0].style.transform = `scale(${zoom_level/100})`;
        // document.body.style.zoom = `${zoom_level}%`;
    }
}


//Remove Friend request to server
if(document.getElementsByClassName('remove_friend')){
Array.from(document.getElementsByClassName('remove_friend')).forEach(element => {
            element.onclick = function () {
            let username = this.getAttribute('username')
            let user_id = this.getAttribute('user_id')
            let yes = confirm(`Are you sure you want to remove ${username} as a friend?`);
            if(yes){
                const ajax = new XMLHttpRequest()
                ajax.open('POST',`/friends/unfriend/${user_id}`);
                ajax.responseType = 'json';
                ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                ajax.send();
                ajax.onreadystatechange = function () {
                    if(ajax.readyState === ajax.DONE){
                        let result = ajax.response;
                        if(result.success){
                            let friends_count = document.getElementsByClassName('friends')[0].childElementCount;
                            toastInfo(`${username} was successfully unfriended!`,2000);
                            document.getElementById(user_id).remove();
                            if(friends_count == 1)
                            setTimeout(() => {
                                window.location.reload()
                            }, 1000);
                            
                        }else{
                            toastInfo(`${result.msg}`,2000);
                        }
                    }
                    
                }
            }
        }
})
}

//Invite friend request to server
document.getElementById('invite_friends').onclick = () => {
    const inviteEmail = prompt("Enter email address of the invite recipient:");
    if(inviteEmail){
        let yes = confirm(`Are you sure you want to invite ${inviteEmail} to view your gallery?`);
        if(yes){
            const ajax = new XMLHttpRequest()
                ajax.open('POST','/gallery/inviteFriend');
                ajax.responseType = 'json';
                ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                ajax.send(`inviteEmail=${inviteEmail}`);
                ajax.onreadystatechange = function () {
                    if(ajax.readyState === ajax.DONE){
                        let result = ajax.response;
                        if(result.message == 'success'){
                            toastInfo(`Invitation Successfully sent to ${inviteEmail}!`,2000);
                        }else{
                            toastInfo(`Error sending invitation: ${result.error}`,2000);
                        }
                    }
                    
                }
        }

    }
    
}   

//Double click like photo
document.querySelectorAll('.photo_card').forEach(function(photo_card){
        photo_card.ondblclick = function(){ 
            Array.from(document.getElementsByClassName('fa-heart')).filter(function(e){
                return e.getAttribute('image_id') == photo_card.id;
            }).forEach( (element,index) => {
                let heart_element = Array.from(document.getElementsByClassName('fa-heart-o')).filter(function(e){
                    return e.getAttribute('image_id') == photo_card.id;
                })[0];
                console.log(heart_element.style.display);
                if(heart_element.style.display != 'block' && heart_element.style.display != '' ){
                    likePhoto(heart_element,element)
                }
               }); 
               Array.from(document.getElementsByClassName('fa-heart-o')).filter(function(e){
                return e.getAttribute('image_id') == photo_card.id;
            }).forEach( (element,index) => {
                let heart_element = Array.from(document.getElementsByClassName('fa-heart')).filter(function(e){
                    return e.getAttribute('image_id') == photo_card.id;
                })[0];
                console.log(heart_element.style.display);
                if(heart_element.style.display != 'block'){
                    likePhoto(heart_element,element)
                }
                
               }); 
        }

})

// Upload image files
if(document.getElementById('photo_file')){
        document.getElementById('photo_file').onchange = () => {        
            document.getElementsByClassName('spanner')[0].classList.add('show');
            document.getElementsByClassName('loader')[0].classList.add('show');
            var files = document.getElementById('photo_file').files;
            if(files.length > 0){
                // document.getElementById('file_name').innerHTML = files[0].name
                document.getElementById('file_upload_form').submit();
            }else{
                toastWarning('No file selected!',2000);
            }
    }
}

//Delete image request to server
Array.from(document.getElementsByClassName('delete_icon')).forEach( function(icon){
    icon.onclick = async () => {
        var yes = confirm("Are you sure you want to delete this photo?")
        if(yes){
            let data = {image_id: icon.getAttribute('image_id'),path: icon.getAttribute('path')}
            let response = await fetch('/gallery/delete',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify(data)})
            let json_resp = await response.json();
            if(json_resp.success){
                if(Array.from(document.getElementsByClassName('user_photo')).length == 1){
                    location.reload();
                }else{
                    document.getElementById(icon.getAttribute('image_id')).remove();
                    icon.remove();
                    toastInfo("Image removed successfully!",2000);
                }
            }
        }
    }
})
// Izitoast config
function toastInfo(msg,timeout){
    iziToast.show({
        id: null, 
        class: '',
        title: '',
        titleColor: '',
        titleSize: '',
        titleLineHeight: '',
        message: msg,
        messageColor: 'black',
        messageSize: '',
        messageLineHeight: '',
        backgroundColor: '',
        theme: 'light', // dark
        color: 'white', // blue, red, green, yellow
        icon: '',
        iconText: '',
        iconColor: '',
        iconUrl: null,
        image: '',
        imageWidth: 50,
        maxWidth: null,
        zindex: null,
        layout: 1,
        balloon: false,
        close: true,
        closeOnEscape: false,
        closeOnClick: false,
        displayMode: 0, // once, replace
        position: 'topCenter', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
        target: '',
        targetFirst: true,
        timeout: timeout,
        rtl: false,
        animateInside: true,
        drag: true,
        pauseOnHover: true,
        resetOnHover: false,
        progressBar: true,
        progressBarColor: 'black',
        progressBarEasing: 'linear',
        overlay: false,
        overlayClose: false,
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        transitionIn: 'fadeInUp',
        transitionOut: 'fadeOut',
        transitionInMobile: 'fadeInUp',
        transitionOutMobile: 'fadeOutDown',
        buttons: {},
        inputs: {},
        onOpening: function () {},
        onOpened: function () {},
        onClosing: function () {},
        onClosed: function () {}
    });
}