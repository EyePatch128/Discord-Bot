const validUrl = require('valid-url');
const yts = require('yt-search');


const {playSong, joinChannel, searchMusic, fetchPlaylist} = require("./helpers")


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
        emitter.emit("leave");

    }catch(err){
        console.log(err);
        msg.reply("Precious is currently not in a voice channel")
    };
}


const handlePlay = async (msg, state, args, emitter)=>{
    try{
        let newState = {};

        let connection = await state.dispatcher;

        if(!connection || connection.status != 0){
            msg.channel.send("Precious is currently not in a voice channel")
            newState = await joinChannel(msg, "", "Général");
            connection = await newState.dispatcher;
            emitter.emit("update", newState)
        };

        if(args.length == 0){
            emitter.emit("play", null);
            return;
        };
        
        const song = await searchMusic(args);

        if(song)
            emitter.emit("play", song, msg);

    }catch(err){
        console.log(err)
        msg.channel.send("Cannot play song");
        handleError(msg);
    }

}


const handleStop = async (msg, emitter)=>{
    emitter.emit("stop");
}

const handlePause = async (msg, emitter)=>{
    emitter.emit("pause");
}

const handleResume = async (msg, emitter)=>{
    emitter.emit("resume");
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
    msg.channel.send("Clearing queue");

    let newState = {
        queue: []
    }

    emitter.emit("update", newState);
}

const handleSkip = (msg, emitter)=>{
    msg.reply("Skipping");
    emitter.emit("end");
}

const handlePlaylist = async (msg, args, emitter)=>{
    if(args.length == 0)
        return

    // Clear queue
    let newState = {
        queue: []
    }

    emitter.emit("update", newState);
    
    let url = ""
    for(let arg of args){
        if(arg != ""){
            url = arg
            break;
        }
    }

    emitter.emit("loading");

    const playlist = await fetchPlaylist(url);
    if(playlist){
        let list = playlist.videos.map(async elem=>{
            const video = await yts({videoId: elem.videoId});

            const entry = {
                url: video.url,
                title: video.title,
                artist: video.author.name,
                thumbnail: video.thumbnail
            };

            // songs.push(entry);
            return entry;
        });

        msg.channel.send("Adding playlist")

        let songs = [];
        for(let elem of list){
            songs.push(await elem);
        };

        let newState = {
            playlist: {
                title: playlist.title,
                url: playlist.url,
                size: playlist.size,
                thumbnail: playlist.image,
                songs: songs
            },
            queue: songs,
            currentSong: null,
        }
    
        emitter.emit("update", newState);

        msg.channel.send(`Playlist \`${playlist.title}\` added`);

    }else{
        msg.channel.send(`${url} is not a valid URL`);
    }

}

module.exports = {
    handleHelp,
    handleError,
    handleJoin,
    handleLeave,
    handlePlay,
    handleStop,
    handlePause,
    handleResume,
    handleCue,
    handleClearCue,
    handleSkip,
    handlePlaylist
}