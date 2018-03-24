let SOCKET = new WebSocket("ws://posync-position-sync.7e14.starter-us-west-2.openshiftapps.com/:8080/");
let CHATEVENT = new EventTarget();
let CHAT = async() =>
{
    let uuid = uuidv4();
    let userid = "user_" + uuid;

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

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
    let message = (line) =>
    {
        let lineElem = document.createElement("div");
        lineElem.textContent = line;
        chat_history.appendChild(lineElem);
        chat_history.scrollTo(0, chat_history.scrollHeight);

        CHATEVENT.dispatchEvent(new CustomEvent("newmessage", { detail: line }));
    }
    SOCKET.onmessage = (e) => message(e.data);
    message("-- Welcome to chat! --");

    // send message
    document.addEventListener("keydown", (e)=>
    {
        if (e.keyCode != 13) { return; }
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

        CHATEVENT.dispatchEvent(new CustomEvent("send", { detail: line }));

        return;
    });
}
