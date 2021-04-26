const yts = require( 'yt-search' )
const ytdl = require('ytdl-core');
const {streamMusic, joinChannel} = require("./helpers")


const handleHelp = msg =>{
    msg.reply("Help")
}

const handleError = msg =>{
    msg.reply("Please refer to Help via `!help`")
}

const handleJoin = (msg, args) =>{
    try{
        if(args.length > 1){
            handleError();
            return;
        }
        joinChannel(msg, args[0]);
    }catch(err){
        console.log(err)
        handleError(msg)
    }
}

const handleLeave = msg=>{
    const channel = msg.guild.me.voice.channel;
    msg.guild.me.voice.channel.leave();
    msg.reply(`Leaving ${channel.name}`)
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

const handlePlay = async (msg, args)=>{
    if(args.length == 0){
        handleError(msg);
        return;
    };

    

    if(msg.guild.me.voice.channel == null){
        msg.reply("Bot is currently not in a voice channel")
        try{
            joinChannel(msg, "", "Général")
        }catch(err){
            handleError(msg)
        }
    };

    let query = "";
    let artist = "";
    let url = ""

    for(let i=0; i < args.length; i++){
        if(args[i] == "--url"){
            url = args[i+1] || "";
        };

        if(args[i] == "--artist"){
            artist = args[i+1] || "";
        };
        if(args[i-1] != "--artist" && args[i] != "--artist"){
            query += args[i]
        }
    }

    if(url == ""){
        const result = await yts(query);
        let song = result.all[0];
        if(artist.length > 0){
            for(let i=0; i < result.all.length; i++){
                if(artist.toUpperCase() == result.all[i].author.name.toUpperCase()){
                    song = result.all[i];
                    break;
                }
            };
        };
        url = song.url;
        msg.reply(`Playing ${song.title}`);
    }

    return streamMusic(msg, ytdl(url, {quality: "highestaudio"}));
}


const handleStop = async (msg, dispatcher)=>{
    try{
        const connection = await dispatcher;
        connection.disconnect();
        
        msg.reply("Stopped playing song");
    }catch(err){
        msg.reply("No song is currently played")
    }
}

const handlePause = async (msg, dispatcher)=>{
    try{
        const connection = await dispatcher
        connection.dispatcher.pause();
        msg.reply("Paused\n`!resume` to resume music")
    }catch(err){
        msg.reply("No song is currently played")
    }
}

const handleResume = async (msg, dispatcher)=>{
    try{
        const connection = await dispatcher;
        connection.dispatcher.resume()
        msg.reply("Resuming")
    }catch(err){
        msg.reply("No song is currently played")
    }
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
    handleResume
}