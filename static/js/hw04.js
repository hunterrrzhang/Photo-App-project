let textboxId;
let targetId;
let requestBody;
let method;
let pre;
let url;
    
const sendRequest = ev => {
    console.log(ev);
    textboxId = ev.currentTarget.dataset.textbox;
    targetId = ev.currentTarget.dataset.target;
    requestBody = ev.currentTarget.dataset.request_body;
    method = ev.currentTarget.dataset.method;
    pre = document.getElementById(targetId);
    url = document.getElementById(textboxId).value;
    console.log(textboxId, targetId, method);
    console.log(url);
    if (method === 'get') {
        sendGetRequest(pre, url)
    } else if (['post', 'patch'].includes(method.toLowerCase())) {
        let elem = document.getElementById(requestBody);
        try {
            const val =  elem.innerHTML.replace(/(<([^>]+)>)/gi, "");
            let body = JSON.parse(val);
            sendPostPatchRequest(pre, url, method, body);
        } catch {
            alert('Invalid JSON: ' + val);
        }
    } else if (method === 'delete') {
        sendDeleteRequest(pre, url);
    } else {
        pre.innerHTML = 'Unrecognized method.';
    }
};

const displayStatusCode = response => {
    let elem = document.getElementById(textboxId + '-status-code');
    elem.classList.remove('active');
    elem.innerHTML = `${response.status} ${response.statusText}`;
    hljs.highlightElement(elem);
    setTimeout(() => {elem.classList.add('active')} , 0);
};

const displayResponse = (data, elem) => {
    console.log(data);
    // elem.classList.remove('active');
    elem.innerHTML = JSON.stringify(data, null, 3);
    hljs.highlightElement(elem);
    setTimeout(() => {elem.classList.add('active')} , 1);
};

const sendGetRequest = (elem, url) => {
    elem.classList.remove('active');
    fetch(url)
        .then(response => {
            displayStatusCode(response);
            return response.json()
        })
        .then(data => displayResponse(data, elem));
};

const sendPostPatchRequest = (elem, url, method, body) => {
    elem.classList.remove('active');
    fetch(url, {
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCookie('csrf_access_token')
            },
            body: JSON.stringify(body),
        })
        .then(response => {
            displayStatusCode(response);
            return response.json()
        })
        .then(data => displayResponse(data, elem));
};

const sendDeleteRequest = (elem, url) => {
    elem.classList.remove('active');
    fetch(url, { 
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': getCookie('csrf_access_token')
            }
        })
        .then(response => {
            displayStatusCode(response);
            return response.json()
        })
        .then(data => displayResponse(data, elem));
};

const getCookie = key => {
    let name = key + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
};

const story2Html = story => {
    return `
        <div>
            <img src="${ story.user.thumb_url }" class="pic" alt="profile pic for ${ story.user.username }" />
            <p>${ story.user.username }</p>
        </div>
    `;
};

// fetch data from your API endpoint:
const displayStories = () => {
    fetch('/api/stories')
        .then(response => response.json())
        .then(stories => {
            const html = stories.map(story2Html).join('\n');
            document.querySelector('.stories').innerHTML = html;
        })
};

// Modal
const displayModalComments = comments => {
    console.log(comments)
    let output = ``;
    for(let i in comments){
        console.log(comments[i])
        commentHtml = `<div class="comment-item-modal">
                            <img class="profile-pic" src="${comments[i].user.thumb_url}" alt="profile image">
                            <div class="comment-info-modal">
                                <h4>${comments[i].user.username}</h4>
                                <p>${comments[i].text}<p>
                            </div>
                            <i class="far fa-heart"></i>
                    </div>`
        output = output + commentHtml
    }
    console.log(output)
    return output
}

const destroyModal = e => {
    console.log("destroy Modal")
    document.querySelector("#modal-container").innerHTML = ""
}

const displayModal = e => {
    const postID = e.currentTarget.dataset.postId;
    fetch(`/api/posts/${postID}`, {
        method: "GET"
    })
    .then(response => response.json())
    .then(post => {
        console.log(post);
        const html = `<div class="modal-bg">
                        <button id="closeModalButton" onclick="destroyModal(event)">Close</button>
                        <div class="modal">
                            <div class="left-panel">
                                <img src="${post.image_url}"></img>
                            </div>
                            <div class="right-panel">
                                <div class="comment-account-info">
                                    <img class="profile-pic" src="${post.user.thumb_url}" alt="profile image">
                                    <h2>${post.user.username}</h2>
                                </div>
                                <div class="comments">
                                    ${displayModalComments(post.comments)}
                                </div>
                            </div>
                        </div>
                    </div>`
        document.querySelector("#modal-container").innerHTML = html
        document.getElementById("closeModalButton").focus()
    });
}

// posts
const displayComments = (comments, postID) => {
    let output = ``;
    if(comments.length > 1){
        output += `<button data-post-id="${postID}" onclick="displayModal(event)">View all ${comments.length} comments</button>`
    }

    if(comments && comments.length > 0){
            lastComment = `<div class="comment-list">
                                <div class="comment-item">
                                        <h4>${comments[comments.length-1].user.username}</h4>
                                        <p>${comments[comments.length-1].text}<p>
                                </div>
                            </div>`
            output = output + lastComment
    }
    return output
}

const post2Html = post => {
    // ${post.current_user_like_id ? `data-like-id=${getLikeId(post)}` : ''}

    return `
        <div class="post-item" id="post-item-${post.id}">
            <div class="post-header">
                <h2>${post.user.username}</h2>
                <i class="fas fa-ellipsis-h"></i>
            </div>
            <img class="post-photo" src=${post.image_url} alt="post image">
            <!-- comments -->
            <div class="comment-section">
                <div class='comment-section-header'>
                        <!--
                         actions -->
                        <div class="comment-section-1">
                            <button onclick="likeUnlike(event)" data-like-id=${post.current_user_like_id ? post.current_user_like_id : '-1'} data-post-id=${post.id} data-status=${post.current_user_like_id ? 'like' : 'unlike'} aria-label="follow" aria-checked=${post.current_user_like_id ? "true" : "false"}>
                                <i class="fa${post.current_user_like_id ? 's' : 'r'} fa-heart"></i>
                            </button>
                            <i class="far fa-comment"></i>
                            <i class="far fa-paper-plane"></i>
                        </div>
                        <button onclick="bookmarkUnbookmark(event)" data-bookmark-id=${post.current_user_bookmark_id ? post.current_user_bookmark_id : '-1'} data-post-id=${post.id} data-status=${post.current_user_bookmark_id ? 'bookmark' : 'unbookmark'} aria-label="bookmark" aria-checked=${post.current_user_like_id ? "true" : "false"}>
                            <i class="fa${post.current_user_bookmark_id ? 's' : 'r'} fa-bookmark"></i>
                        </button>
                </div>
                <div class="comment-section-content">
                        <h4>${post.likes.length} like${post.likes.length !==1 ? 's' : ''}</h4>
                        <!-- caption -->
                        <div class="caption">
                                <h4>${post.user.username}</h4>
                                <p>${post.caption}<p>
                                <button>more</button>
                        </div>
                        ${displayComments(post.comments, post.id)}
                        <h4 class="days">${post.display_time}</h4>
                </div>
            </div>
            <div class="post-footer">
                <form>
                <div class="comment-input">
                        <i class="far fa-smile"></i>
                        <textarea name="myarea" placeholder="Add a comment..." rows=1 cols="45" label="comment input"></textarea>
                        <input id="bb" type="button" data-post-id=${post.id} onclick="commentPost(event, this.form)" value="Post"></input>
                </div>
                </form>
            </div>
        </div>
    `
};

// fetch data from your API endpoint:
const displayPosts = () => {
    fetch("/api/posts/?limit=15", {
        method: "GET"
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        const html = data.map(post2Html).join('\n');
        document.querySelector('#posts').innerHTML = html;
    });
};

const updatePost = (postId) => {
    fetch(`/api/posts/${postId}`, {
        method: "GET",
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        document.querySelector(`#post-item-${postId}`).innerHTML = post2Html(data);
    });
};

// Suggestions panel

const toggleFollow = (e) => {
    const elem = e.currentTarget;
    if (elem.innerHTML==='follow'){
        followUser(elem.dataset.userId, elem)
    }
    else{
        unfollowUser(elem.dataset.followingId, elem)
    }
    // e.currentTarget
}
const followUser = (userID, elem) => {
    const postData = {
        "user_id": userID
    }

    fetch("/api/following/", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCookie('csrf_access_token')
        },
        body: JSON.stringify(postData)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        elem.innerHTML = 'unfollow';
        elem.classList.add('unfollow');
        elem.classList.remove('follow');
        elem.setAttribute('aria-checked', "true")
        elem.setAttribute('data-following-id', data.id)
    });
}

const unfollowUser = (followingID, elem) => {
    const deleteUrl = `/api/following/${followingID}`
    fetch(deleteUrl, {
        method: "DELETE",
        headers: {
            'X-CSRF-TOKEN': getCookie('csrf_access_token')
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        elem.innerHTML = 'follow';
        elem.setAttribute('aria-checked', "false")
        elem.classList.add('follow');
        elem.classList.remove('unfollow');
    });
}

const user2HTML = user => {
    return `<div class="suggested-item">
            <img src="${user.thumb_url}" alt="suggestion image">
            <div class="suggested-info">
                <h4>${user.username}</h4>
                <p>suggested for you</p>
            </div>
            <button class="follow" 
                    data-user-id="${user.id}" 
                    aria-label="follow"
                    aria-checked="false"
                    onClick="toggleFollow(event);">follow</button>
    </div>`
}


const displaySuggestions = () => {
    fetch("/api/suggestions/", {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const helper = data.map(user2HTML).join('\n');
            // console.log(helper)
            document.querySelector(".suggestion-content").innerHTML = helper;
        });
}

const displayProfile = () => {
    fetch("/api/profile/", {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const html = `<img class="profile-pic" src="${data.thumb_url}" alt="profile image">
                            <h2>${data.username}</h2>`

            document.querySelector(".account-info").innerHTML = html;
        });
}

const likeUnlike = (e) => {
    const elem = e.currentTarget;
    if (elem.dataset.status==='unlike'){
        likePost(elem.dataset.postId, elem)
    }
    else{
        // console.log(elem.dataset)
        unlikePost(elem.dataset.postId, elem)
    }

}

// Like and Unlike event handlers
const likePost = (postID, elem) => {
    console.log(postID);
    const postData = {};
    fetch(`/api/posts/${postID}/likes/`, {
            method: "POST",
            headers: {
                'X-CSRF-TOKEN': getCookie('csrf_access_token')
            },
            body: JSON.stringify(postData)
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            updatePost(data.post_id);
            elem.setAttribute('aria-checked', "true")
            // elem.setAttribute('data-like-id', data.id);
        });
}

const unlikePost = (postID, elem) => {
    fetch(`/api/posts/${postID}/likes/${elem.dataset.likeId}`, {
        method: "DELETE",
        headers: {
            'X-CSRF-TOKEN': getCookie('csrf_access_token')
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        updatePost(postID);
        elem.setAttribute('aria-checked', "false")
    });
}

// Bookmark and Unbookmark event handlers

const bookmarkUnbookmark = (e) => {
    const elem = e.currentTarget;
    if (elem.dataset.status==="unbookmark"){
        bookmarkPost(elem.dataset.postId, elem)
    }
    else{
        // console.log(elem.dataset)
        unbookmarkPost(elem.dataset.postId, elem)
    }

}

const bookmarkPost = (postID, elem) => {
    const postData = {
        "post_id": postID
    };
    fetch(`/api/bookmarks/`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCookie('csrf_access_token')
            },
            body: JSON.stringify(postData)
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            updatePost(postID);
            elem.setAttribute('data-status', "bookmark")
            // elem.setAttribute('data-like-id', data.id);
        });
}

const unbookmarkPost = (postID, elem) => {
    fetch(`/api/bookmarks/${elem.dataset.bookmarkId}`, {
        method: "DELETE",
        headers: {
            'X-CSRF-TOKEN': getCookie('csrf_access_token')
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        updatePost(postID);
        elem.setAttribute('data-status', "unbookmark")
    });
}

const getUserId = () =>{
    fetch("/api/profile/", {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        return data.id
    });
}

// Post comment button event handler
const commentPost = (e, form) => {
    let postID = e.currentTarget.dataset.postId;
    const postData = {
        "post_id": postID,
        "text": form.myarea.value
    };
    
    fetch("/api/comments", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCookie('csrf_access_token')
            },
            body: JSON.stringify(postData)
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            updatePost(postID);
        });
}

const initPage = () => {
    displayStories();
    displayPosts();
    displayProfile();
    displaySuggestions();
};

// invoke init page to display stories:
initPage();
