let ADDR_OPENSHFIT = "ws://posync-position-sync.7e14.starter-us-west-2.openshiftapps.com/:8080/";
let ADDR_LOCAL = "ws://localhost:8080/";
let SOCKET = null;
let WSCONNEVENT = new EventTarget();
let WSCONN = async(addr = ADDR_OPENSHFIT) =>
{
    let uuid = uuidv4();
    let userid = "user_" + uuid;

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    SOCKET = new WebSocket(addr);

    // wait for connection
    while(SOCKET.readyState != 1)
    {
        console.log("pending connection to chat socket..");
        await new Promise((r) => setTimeout(r, 100));
    }
    console.log("connected to chat server.");

    // start listening chat
    SOCKET.send(JSON.stringify({
        userid: userid
    }));

    // message income
    let addChatLine = (line) => {
        let lineElem = document.createElement("div");
        lineElem.textContent = line;
        chat_history.appendChild(lineElem);
        chat_history.scrollTo(0, chat_history.scrollHeight);
    };

    let onMessage = (data) =>
    {
        let income = JSON.parse(data);
        switch(income["mode"])
        {
            case "chat":
                addChatLine(income["sender"] + ": " + income["content"]);
                WSCONNEVENT.dispatchEvent(new CustomEvent("newchat", { detail: income }));
                break;

            case "pos":
                WSCONNEVENT.dispatchEvent(new CustomEvent("pos", { detail: income }));
                break;

            default:
                console.log(income, mode);
                break;
        }
    }
    SOCKET.onmessage = (e) => onMessage(e.data);
    addChatLine("-- Welcome to chat! --");

    // send message
    document.addEventListener("keydown", (e)=>
    {
        if (e.keyCode != 13) { return; }
        message_input.focus();
        if (message_input.value == "")
        {
            return;
        }

        let line = message_input.value;
        SOCKET.send(JSON.stringify({
            userid: userid,
            username: username.value,
            msg: line,
        }));
        message_input.value = "";

        WSCONNEVENT.dispatchEvent(new CustomEvent("send", { detail: line }));

        return;
    });
}
