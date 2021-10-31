# Discord-Bot

This is a discord bot for playing music from youtube
It uses `discord.js` library for interacting with the discord server and `yt-search` and `ytdl-core` libraries to search and fetch songs

Invite using : https://discord.com/api/oauth2/authorize?client_id=832396420454547465&permissions=274914757904&scope=bot

Commands start with `!`

`!help`:
```
    !play <song>(--artist <name>) | --url <url>: Play a song. With no arguments, resume or play next song in queue
    
    !cue <song>(--artist <name>) | --url <url>: Add a song to queue
    
    !playlist <url> : Add playlist. Personal playlists may not be accepted
    
    !resume : Resume song
    
    !pause : Pause song
    
    !stop : Stop music
    
    !join <voice channel> : Join channel. If no channel entered, join user's current voice channel
    
    !leave : Leave voice channel
    
    !live <url> : Play livestream. Should be in voice channel before
    
    !skip : Skip song and play next one
```
