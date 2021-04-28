const {playSong, joinChannel, searchMusic} = require("./helpers")


const handleHelp = msg =>{
    msg.reply("Help")
}

const handleError = msg =>{
    msg.reply("Please refer to Help via `!help`")
}

const handleJoin = async (msg, args, emitter) =>{
    let newState = {};

    try{
        if(args.length > 1){
            handleError();
            return;
        }
        
        newState = await joinChannel(msg, args[0]);
        
        emitter.emit("update", newState)

    }catch(err){
        console.log(err);
        handleError(msg);
    }
}

const handleLeave = (msg, state, emitter)=>{
    try{
        state.channel.leave();
        msg.reply(`Leaving ${state.channel.name}`);

        let newState = {
            dispatcher: null,
            channel: null,
            currentSong: null
        };

        emitter.emit("update", newState);

    }catch(err){
        console.log(err);
        msg.reply("Precious is currently not in a voice channel")
    };
}

const handleUseSearchPlatform = (msg, args) =>{
    if(args.length == 0 || args.length > 1){
        handleError(msg);
        return;
    }

    const platform = args[0].toUpperCase();

    if(platform == "YOUTUBE" || platform == "SPOTIFY"){
        msg.reply(`Setting music platform to ${platform}`);
        return platform;
    }
}

const handlePlay = async (msg, state, args, emitter)=>{
  
    try{
        let newState = {};

        let connection = await state.dispatcher;

        if(args.length == 0){
            emitter.emit("play", null);
            return;
        };

        if(!connection || connection.status != 0){
            msg.reply("Precious is currently not in a voice channel")
            newState = await joinChannel(msg, "", "Général");
            connection = await newState.dispatcher;
            emitter.emit("update", newState)
        };
        
        const song = await searchMusic(args);

        emitter.emit("play", song, msg)

    }catch(err){
        console.log(err)
        msg.reply("Cannot play song");
        handleError(msg);
    }

}


const handleStop = async (msg, emitter)=>{
    
    try{
        emitter.emit("stop");
    }catch(err){
        console.log(err);
    }
}

const handlePause = async (msg, emitter)=>{
    try{
        emitter.emit("pause");

        msg.channel.send("Paused");
    }catch(err){
        console.log(err);
    }
}

const handleResume = async (msg, emitter)=>{
    try{        
        emitter.emit("resume");
        
    }catch(err){
        console.log(err)
    }
}

const handleCue = async (msg, state, args, emitter)=>{
    if(args.length == 0){
        handleError(msg);
        return;
    };

    try{

        const song = await searchMusic(args);

        let newState = {
            queue: [...state.queue, song]
        };

        emitter.emit("update", newState);

        msg.reply("Song added to queue");
        
    }catch(err){
        console.log(err);
        msg.reply("Cannot cue up the song")
    };
}

const handleClearCue = (msg, emitter)=>{
    msg.reply("Clearing queue");

    let newState = {
        queue: []
    }

    emitter.emit("update", newState);
}

const handleSkip = (msg, emitter)=>{
    msg.reply("Skipping");
    emitter.emit("end");
}

module.exports = {
    handleHelp,
    handleError,
    handleJoin,
    handleLeave,
    handleUseSearchPlatform,
    handlePlay,
    handleStop,
    handlePause,
    handleResume,
    handleCue,
    handleClearCue,
    handleSkip
}