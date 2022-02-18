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

const initPage = () => {
    displayStories();
};

// invoke init page to display stories:
initPage();

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

    fetch("http://localhost:5000/api/following/", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
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
    const deleteUrl = `http://localhost:5000/api/following/${followingID}`
    fetch(deleteUrl, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
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


const getSuggestions = () => {
    fetch("http://localhost:5000/api/suggestions/", {
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

getSuggestions();