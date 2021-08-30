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

window.addEventListener('load',function () {
    
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


if(document.getElementById('photo_file')){
        document.getElementById('photo_file').onchange = () => {        

        var files = document.getElementById('photo_file').files;
        if(files.length > 0){
            // document.getElementById('file_name').innerHTML = files[0].name
            document.getElementById('file_upload_form').submit();
        }else{
            toastWarning('No file selected!',2000);
        }
    }
}

Array.from(document.getElementsByClassName('delete_icon')).forEach(function(icon){
    icon.onclick = () => {
        var yes = confirm("Are you sure you want to delete this photo?")
        if(yes){
            const ajax = new XMLHttpRequest()
            ajax.open('POST','/gallery/delete');
            ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            console.log(icon)
            ajax.send(`path=${icon.getAttribute('path')}`);
            ajax.onreadystatechange = function () {
                if(ajax.readyState === ajax.DONE){
                    if(Array.from(document.getElementsByClassName('user_photo')).length == 1){
                        location.reload();
                    }else{
                        document.getElementById(icon.getAttribute('photo_id')).remove();
                        icon.remove();
                        toastInfo("Image removed successfully!",2000);
                    }
                }
                
            }
        }
    }
})

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