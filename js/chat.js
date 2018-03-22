let CHAT = async() =>
{
    let uuid = uuidv4();
    let userid = "user_" + uuid;
    let socket = null;

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // connect to server
    // socket = new WebSocket("ws://localhost:8081/");
    socket = new WebSocket("ws://10.196.14.219:8081/");

    // wait for connection
    while(socket.readyState != 1)
    {
        await new Promise((r) => setTimeout(r, 100));
    }

    // start listening chat
    socket.send(JSON.stringify({
        userid: userid
    }));
    username.focus();

    // message income
    socket.onmessage = (event) =>
    {
        let line = document.createElement("div");
        line.textContent = event.data;
        chat_history.appendChild(line);
        chat_history.scrollTo(0, chat_history.scrollHeight);
    }

    // send message
    document.addEventListener("keydown", (e)=>
    {
        if(e.keyCode != 13) { return; }

        socket.send(JSON.stringify({
            userid: userid,
            username: username.value,
            msg: message_input.value,
        }));

        message_input.value = "";

        return false;
    });
}
CHAT().then(() => console.log("chat connection initialized"));
