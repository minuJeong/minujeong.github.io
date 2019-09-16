
const ZUPANG_LAMBDA_URL = "https://itgddii8f9.execute-api.us-east-2.amazonaws.com/release/login"
const CLIENT_ID = "ig9mcp3lsizqtypzce3v3ryv66lz93"
const KRAKEN_URL = "https://api.twitch.tv/kraken"

class UserInfo
{
    userid = null
    username = null
    display_name = null
}

function put_kraken_header(request, access_token)
{
    request.setRequestHeader("Accept", "application/vnd.twitchtv.v5+json")
    request.setRequestHeader("Authorization", `OAuth ${access_token}`)
}

function build_kraken_url_userid(userid)
{
    return `${KRAKEN_URL}/users/${userid}?client_id=${CLIENT_ID}`
}

function parse_params(str)
{
    let pieces = str.split("&")
    let data = {}
    let i, parts

    // process each query pair
    for (i = 0; i < pieces.length; i++) {
        parts = pieces[i].split("=");
        if (parts.length < 2) {
            parts.push("")
        }
        data[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1])
    }
    return data;
}

function get_twitch_userinfo(access_token)
{
    console.log("fetching twitch user info..")

    let req_oauth2 = new XMLHttpRequest()
    req_oauth2.addEventListener("load", on_load_oauth2)
    req_oauth2.open("GET", "https://id.twitch.tv/oauth2/userinfo");
    req_oauth2.setRequestHeader("Authorization", "Bearer " + access_token)
    req_oauth2.send()
}

function on_load_oauth2(event)
{
    console.log(event.currentTarget)

    let res_oauth2 = JSON.parse(event.currentTarget.responseText)
    let userinfo = new UserInfo()
    userinfo.userid = res_oauth2.sub
    userinfo.display_name = res_oauth2.preferred_username

    console.log("fetching kraken info..")

    let req_kraken = new XMLHttpRequest()
    let kraken_url = build_kraken_url_userid(userinfo.userid)

    req_kraken.addEventListener('load', (e)=>{
        let res_kraken = JSON.parse(req_kraken.responseText)

        userinfo.bio = res_kraken.bio
        userinfo.created_at = res_kraken.created_at
        userinfo.updated_at = res_kraken.updated_at
        userinfo.logo = res_kraken.logo
        userinfo.username = res_kraken.name

        get_zupang_db_info(userinfo.username)
    })
    req_kraken.open("GET", kraken_url)
    put_kraken_header(req_kraken)
    req_kraken.send()

    let greeting = `안녕하세요. ${userinfo.display_name}님!`
    document.getElementById("login_welcome").innerText = greeting

    let displayname = `${userinfo.display_name}님`
    document.getElementById("preferred_name_display").innerText = displayname
}

function get_zupang_db_info(id)
{
    console.log("logging in to zupang db..")

    let req = new XMLHttpRequest()
    req.onreadystatechange = (e) => {
        // Work In Progress..

        console.log("A", e)
        console.log("B", req.responseText)

        console.log("zupang db logged in")
    }
    req.open("POST", ZUPANG_LAMBDA_URL)
    req.setRequestHeader('Content-type', 'application/json; charset=utf-8');

    payload = {
        "protocol": "login", "id": id
    }
    req.send(JSON.stringify(payload))
}

function main()
{
    let login_hash = window.location.hash || null
    if (!login_hash)
    {
        return
    }

    document.getElementById("loginbutton").style.display = 'none'
    document.getElementById("login_welcome").style.display = 'inline-block'

    let login_data = parse_params(login_hash.replace("#", ""))
    let access_token = login_data.access_token
    let scopes = login_data.scope.split("+")

    if (!access_token || !scopes)
    {
        console.log("failed to fetch Twitch access token")
        return
    }

    get_twitch_userinfo(access_token)
}

main()
