let changeColor = document.getElementById("changeColor");

changeColor.addEventListener("click", async () => {

    let myProgressBar = document.querySelector(".progress");
    let button = document.querySelector("#changeColor");
    button.style.display = 'none'
    myProgressBar.style.display = 'block'

    let [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    let valueProgress = 10
    updateProgressBar(myProgressBar, valueProgress);

    //todo читай про асинхронность крч
    messageAlert(tab.url).then(response => {
        let dict = response

        for (const [key, value] of Object.entries(dict)) {
            let playerHTML = `<div class="player">
            <div class="header">
                <div>
                    <img src="${value.avatar}"
                         height="40" width="40" class="ava">
                </div>
                <div class="nickname">${value.nickname}</div>
            </div>

            <div class="separator"></div>

            <div>Последние две недели:</div>
            <div class="separator"></div>
            <div style="margin-left: auto;margin-right: auto;">${value.data.items.length}</div>
        </div>`

            if (key < 5) {
                $("#roster1").append(playerHTML);
            } else {
                $("#roster2").append(playerHTML);
            }

            valueProgress += 9
            updateProgressBar(myProgressBar, valueProgress);
        }
    })
});


async function messageAlert(tab_url) {
    let current_url_list = tab_url.split('/')
    let match_id = current_url_list[current_url_list.length - 1]
    console.log('текущий match_id: ' + match_id)
    let api_key = '3f9da440-ccfd-4083-9688-81ead5a79af7'
    let root = 'https://open.faceit.com/data/v4/matches/'
    let url = root + match_id

    const headers = {
        'Authorization': 'Bearer ' + api_key
    };

    let fetch_query = await fetch(url, {
        headers: headers,
    })

    let fetch_query_json = await fetch_query.json()

    let valueProgress = 0
    let myProgressBar = document.querySelector(".progress");
    myProgressBar.style.display = 'block'

    let now = new Date();
    // уходим на две недели назад
    now.setDate(now.getDate() - 14);
    let unixNow = Math.floor((+now) / 1000);
    let dict_players = {}

    let list_players = []
    for (let i = 0; i < Object.keys(fetch_query_json['teams']).length; i++) {
        let team = Object.keys(fetch_query_json['teams'])[i]
        for (let j = 0; j < Object.keys(fetch_query_json['teams'][team]['roster']).length; j++) {
            let player = fetch_query_json['teams'][team]['roster'][j]
            let url_player = `https://open.faceit.com/data/v4/players/${player['player_id']}/history?game=csgo&limit=100&from=${unixNow}`
            const dict_player = {
                'url': url_player,
                'nickname': player['nickname'],
                'avatar': player['avatar'],
            };
            list_players.push(dict_player)
        }
    }

    await Promise.all(list_players.map(getPlayerData)).then(playerDataArray => {
        console.log(playerDataArray);
        dict_players = playerDataArray
    });
    return dict_players
}


function getPlayerData(dict_player) {
    let api_key = '3f9da440-ccfd-4083-9688-81ead5a79af7'

    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + api_key);

    return fetch(dict_player.url, {
        headers,
    })
        .then(response => response.json())
        .then(data => ({
            nickname: dict_player.nickname,
            avatar: dict_player.avatar,
            data,
        }));
}

function updateProgressBar(progressBar, value) {
    value = Math.round(value);
    progressBar.querySelector(".progress__fill").style.width = `${value}%`;
    progressBar.querySelector(".progress__text").textContent = `${value}%`;
}