require('dotenv').config()
const Discord = require("discord.js");
const events = require("events");
const { emit } = require('process');




const {handleHelp, handleError, handleJoin, handleLeave, handlePlay, handleStop, handleResume, handlePause, handleCue, handleClearCue, handleSkip, handlePlaylist, handleLive} = require("./handlers")
const {parseArgs, updateState, playSong, playLive} = require("./helpers");

const client = new Discord.Client();
const {MessageEmbed} = Discord;

let state = {
    dispatcher: null,
    channel: null,
    queue: [],
    currentSong: null,
    stream: null,
    playlist: null,
    loading: false,
}

// Message only valid for event emitter
let MESSAGE = null;

// Event to update state
const emitter = new events.EventEmitter();
emitter.on("update", newState=>{
    if(newState){
        state = updateState(state, newState);
    };
    state.loading = false;
});

emitter.on("leave", ()=>{
    let newState = {
        dispatcher: null,
        channel: null,
        currentSong: null,
        playlist: null,
        queue: [],
        stream: null
    };
    if(state.channel)
        state.channel.leave();

    emitter.emit("update", newState);
})

emitter.on("play", async song => {
    const connection = await state.dispatcher;

    if(song == null){               // Play queue or resume (if no current song, nothing happens)
        if(state.currentSong != null)
            emitter.emit("resume")
        else
            if(state.queue.length > 0)
                emitter.emit("end");

        return;
    };

    playSong(song, connection, emitter);

    let newState = {
        currentSong: song
    }

    emitter.emit("update", newState);

    if(state.playlist){
        emitter.emit("embedPlaylist", state.playlist);
    };

    emitter.emit("embedSong", song);
})

emitter.on("end", stop=>{
    emitter.emit("update", {stream: null});


    const nextSong = state.queue[0];
    if(nextSong){
        emitter.emit("play", nextSong);
        state.queue.shift();
    };
});

emitter.on("pause", async ()=>{
    if(state.currentSong == null || state.stream == null)
        return;
    const connection = await state.dispatcher
    connection.dispatcher.pause(true);
})

emitter.on("resume", async ()=>{
    if(state.currentSong == null || state.stream == null){
        emitter.emit("end");
        return;
    }
    
    const connection = await state.dispatcher;

    if(connection.dispatcher.paused)
        connection.dispatcher.resume();
});

emitter.on("stream", stream =>{
    let newState = {
        stream,
    }
    emitter.emit("update", newState);
})

emitter.on("stop", ()=>{
    if(state.currentSong != null){
        setTimeout(()=>{
            emitter.emit("pause")
            state.stream.destroy();
            emitter.emit("update", {currentSong: null, stream: null})
        }, 1000);
    }
})


emitter.on("embedSong", song =>{
    const embed = new MessageEmbed()
        .setColor("#a7ff83")
        .setTitle(song.title)
        .setURL(song.url)
        .setDescription("\u200B")
        .setAuthor(MESSAGE.author.username, MESSAGE.author.avatarURL())
        .setThumbnail(song.thumbnail);
    
    MESSAGE.channel.send(embed);
})

emitter.on("embedPlaylist", async playlist=>{
    let list = "";
    for(let elem of playlist.songs){
        let test = list + `- ${elem.title}\n`;
        if(test.length > 2000)
            break;
        list += `- ${elem.title}\n`;
    };
    list += '\n';

    const embed = new MessageEmbed()
        .setColor("#ff304f")
        .setTitle(playlist.title)
        .setURL(playlist.url)
        .setDescription("\u200B" + list)
        .setAuthor(MESSAGE.author.username, MESSAGE.author.avatarURL())
        .setThumbnail(playlist.thumbnail);

    MESSAGE.channel.send(embed);
});

emitter.on("loading", ()=>{
    state.loading = true;
});

emitter.on("live", async live=>{
    const connection = await state.dispatcher;
    if(!connection){
        MESSAGE.channel.send("Precious should join a voice channel before streaming");
        return;
    }
    emitter.emit("embedLive", live);
    playLive(live, connection, emitter);
    emitter.emit("update", {currentSong: live, queue: [], playlist: null});

    
})

emitter.on("embedLive", live=>{
    const embed = new MessageEmbed()
        .setColor("#ace7ef")
        .setTitle(live.title)
        .setURL(live.url)
        .setDescription("\u200B")
        .setAuthor(MESSAGE.author.username, MESSAGE.author.avatarURL())
        .setThumbnail(live.thumbnail);
    
    MESSAGE.channel.send(embed);
})

// CLIENT DISCORD THINGS

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});


client.on("message", async msg=>{
    if(msg.author == client.user)
        return;

    if(state.loading){
        msg.reply("Wait a moment...");
        return;
    }

    MESSAGE = msg;
    if(msg.content[0] == "!"){
        const input = msg.content.split(" ");
        const command = input[0].substring(1).toUpperCase();
        const args = parseArgs(input.slice(1, input.length))

        switch(command){
            case "HELP":
                handleHelp(msg);
                break;
            case "JOIN":
                await handleJoin(msg, args, emitter);
                break;
            case "LEAVE":
                handleLeave(msg, state, emitter);
                break;
            case "PLAY":
                await handlePlay(msg, state, args, emitter);
                break;
            case "STOP":
                await handleStop(msg, emitter);
                break;
            case "PAUSE":
                handlePause(msg, emitter)
                break;
            case "RESUME":
                handleResume(msg, emitter)
                break;
            case "CUE":
                await handleCue(msg, state, args, emitter);
                break;
            case "CLEAR-CUE":
                handleClearCue(msg, emitter);
                break;
            case "SKIP":
                handleSkip(msg, emitter);
                break;
            case "PLAYLIST":
                await handlePlaylist(msg, args, emitter);
                break;
            case "LIVE":
                await handleLive(msg, args, emitter);
                break;
            default:
                handleError(msg);

        }
    }
})

client.login(process.env.TOKEN)