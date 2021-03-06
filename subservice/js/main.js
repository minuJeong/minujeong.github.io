
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

    for (let hookcount of document.getElementsByClassName("hooks_collected"))
    {
        hookcount.innerText = "죽빵 서버에 로그인 중.."
    }

    let req_oauth2 = new XMLHttpRequest()
    req_oauth2.addEventListener("load", on_load_oauth2)
    req_oauth2.open("GET", "https://id.twitch.tv/oauth2/userinfo");
    req_oauth2.setRequestHeader("Authorization", "Bearer " + access_token)
    req_oauth2.send()
}

function on_load_oauth2(event)
{
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

        get_zupang_db_info(userinfo.display_name, userinfo.username)
    })
    req_kraken.open("GET", kraken_url)
    put_kraken_header(req_kraken)
    req_kraken.send()

    let greeting = `안녕하세요. ${userinfo.display_name}님!`
    document.getElementById("login_welcome").innerText = greeting
}

function get_zupang_db_info(display_name, username)
{
    console.log("logging in to zupang db..")

    unity_instance.SendMessage("Game", "FeedUserName", username)

    const name_text = `${display_name} (${username})`
    document.getElementById("name_display").innerText = name_text
    document.getElementById("name_display_link").href = `https://www.twitch.tv/${username}`

    let req = new XMLHttpRequest()
    req.onreadystatechange = (e) => {
        switch(req.readyState)
        {
            // open
            case 1:
                console.log("opened db lambda connection..")
                break;

            // headers received
            case 2:
                console.log("header received")
                break;

            // loading
            case 3:
                console.log("loading db login response..")
                break;

            // done
            case 4:
                console.log("zupang db logged in.")


                let userinfo = null
                try
                {
                    userinfo = JSON.parse(req.responseText)
                }
                catch
                {
                    console.log("zupang server response:", req.responseText)
                    console.log("can't parse response")
                    return
                }

                const hooks_text = `갈고리 수: ${userinfo._hooks}`
                for (let hookcount of document.getElementsByClassName("hooks_collected"))
                {
                    hookcount.innerText = hooks_text
                }

                document.getElementById("user_stats_atk").innerText = `공격력: \t${userinfo._atk}`
                document.getElementById("user_stats_def").innerText = `방어력: \t${userinfo._def}`
                document.getElementById("user_stats_mag").innerText = `마법력: \t${userinfo._mag}`
                document.getElementById("user_stats_reg").innerText = `저항력: \t${userinfo._reg}`
                document.getElementById("user_stats_maxhp").innerText = `최대 체력: \t${userinfo._maxhp}`
                document.getElementById("user_stats_maxmp").innerText = `최대 마력: \t${userinfo._maxmp}`

                const hpbar_ratio = userinfo._hp / userinfo._maxhp
                const mpbar_ratio = userinfo._mp / userinfo._maxmp
                document.getElementById("user_hp_bar").style.width = `${hpbar_ratio * 100.0}%`
                document.getElementById("user_mp_bar").style.width = `${mpbar_ratio * 100.0}%`

                const purse_text = [
                    `금화: ${userinfo._gold}`,
                    "   ",
                    `은화: ${userinfo._silver}`,
                    "   ",
                    `동화: ${userinfo._copper}`,
                ].join(" ")
                for (let purse of document.getElementsByClassName("purse"))
                {
                    purse.innerText = purse_text
                }
                break;

            default:
                console.log(`unhandled readystate: ${req.readyState}`)
        }
    }

    req.open("POST", ZUPANG_LAMBDA_URL)
    req.setRequestHeader('Content-type', 'application/json; charset=utf-8');

    payload = {
        "protocol": "login", "username": username
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

// TODO: call this after unity instance loaded
function unityIsReady()
{}

let login_hash = window.location.hash || null
if (login_hash)
{
    document.getElementById("loginbutton").style.display = 'none'
    document.getElementById("login_welcome").style.display = 'inline-block'
    document.getElementById("login_welcome").innerText = '트위치 로그인 중..'
}

// feed username to pangvatar
if (unity_instance == null)
{
    console.log("unity instance is null")
}

// main()
