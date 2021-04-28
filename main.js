require('dotenv').config()
const Discord = require("discord.js");
const events = require("events");
const { emit } = require('process');




const {handleHelp, handleError, handleJoin, handleLeave, handlePlay, handleStop, handleResume, handlePause, handleCue, handleClearCue, handleSkip} = require("./handlers")
const {parseArgs, updateState, playSong} = require("./helpers");

const client = new Discord.Client();

let state = {
    dispatcher: null,
    channel: null,
    queue: [],
    currentSong: null,
    stream: null,
}

// Message only valid for event emitter
let MESSAGE = null;

// Event to update state
const emitter = new events.EventEmitter();
emitter.on("update", newState=>{
    if(newState){
        state = updateState(state, newState);
    }
});

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

    MESSAGE.channel.send(`Playing ${song.title? song.title : song.url}`);

    let newState = {
        currentSong: song
    }

    emitter.emit("update", newState);

})

emitter.on("end", ()=>{
    emitter.emit("update", {stream: null});

    const nextSong = state.queue[0];
    if(nextSong){
        emitter.emit("play", nextSong);
        state.queue.shift();
    };
});

emitter.on("pause", async ()=>{
    if(state.currentSong == null)
        return;
    const connection = await state.dispatcher
    connection.dispatcher.pause(true);
})

emitter.on("resume", async ()=>{
    if(state.currentSong == null)
        return;
    
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
        state.stream.emit("close");
        MESSAGE.channel.send(`Stopped playing ${state.currentSong.title? state.currentSong.title : state.currentSong.url}`);
    }
})


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});


client.on("message", async msg=>{
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
                await handleClearCue(msg, emitter);
                break;
            case "SKIP":
                handleSkip(msg, emitter);
                break;
            default:
                handleError(msg);

        }
    }
})

client.login(process.env.TOKEN)