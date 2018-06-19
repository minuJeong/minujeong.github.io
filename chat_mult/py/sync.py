
"""
simplest python position syncronize server demo.
because of asyncio, requires python version >3.4
developed on python 3.6

author: minu jeong
"""

import json
import asyncio
import websockets


users = {}
class User(object):
    user_id = None
    username = None
    client = None
    pos = {"x": 0, "y": 0, "z": 0}
    rot = {"x": 0, "y": 0, "z": 0}

def playingusers_msg():
    return {
        "mode": "playingusers",
        "users": [{"name": user.username, "id": user.user_id, "pos": user.pos} for user in users.values()]
    }

def newcomer_msg(sender):
    return {
        "mode": "newuser",
        "id": sender.user_id,
        "name": sender.username,
        "pos": sender.pos
    }

def chat_msg(sender, content):
    return {
        "mode": "chat",
        "sender": sender.username,
        "content": content
    }

def sync_msg(sender):
    return {
        "mode": "sync",
        "id": sender.user_id,
        "pos": sender.pos,
        "rot": sender.rot
    }

def exit_msg(sender):
    return {
        "mode": "exit",
        "id": sender.user_id,
    }


async def broadcast(model, exclude=None):
    removed_client_ids = []
    try:
        for client, user in users.items():
            if not user.client.open:
                removed_client_ids.append(client)
                continue

            if exclude and user in exclude:
                continue

            await user.client.send(json.dumps(model))
    except RecursionError:
        print("skipped broadcast because recursion error.")

    for client in removed_client_ids:
        await broadcast(exit_msg(users[client]))
        users.pop(client)

async def serve(client, path):
    print("server running")
    while True:
        req = None
        try:
            req = await client.recv()
        except websockets.exceptions.ConnectionClosed:
            if client in users.keys():
                await broadcast(exit_msg(users.pop(client, None)))
            break

        parsed = json.loads(req)
        if "userid" not in parsed:
            continue

        user_id = parsed["userid"]
        user = None
        if client not in users:
            user = User()
            user.user_id = user_id
            if "username" in parsed:
                user.username = parsed["username"]
            user.client = client

            await client.send(json.dumps(playingusers_msg()))
            await broadcast(newcomer_msg(user), exclude=[user])
            users[client] = user
        else:
            user = users[client]
            if "username" in parsed:
                user.username = parsed["username"]

        if "pos" in parsed and "rot" in parsed:
            user.pos = parsed["pos"]
            user.rot = parsed["rot"]
            await broadcast(sync_msg(user))

        if "msg" in parsed:
            message = parsed["msg"]
            await broadcast(chat_msg(user, message))

loop = asyncio.get_event_loop()
loop.run_until_complete(
    websockets.serve(serve, '0.0.0.0', 8080)
)
loop.run_forever()
