const yts = require( 'yt-search' )
const ytdl = require('ytdl-core');



const updateState = (state, newState)=>{
    let obj = {...state};
    try{
        for(let key of Object.keys(newState)){
            obj[key] = newState[key];
        };
    }catch(err){
        console.log(err)
    }
    return obj;
}


const parseArgs = args =>{
    const output = [];
    for(let i=0; i < args.length; i++){
        output.push(args[i])
        if(args[i][0] == '"'){
            if(args[i][args[i].length - 1] != '"'){
                let j = i + 1;
                while(j < args.length && args[j][args[j].length - 1] != '"'){
                    output[output.length - 1] += " " + args[j];
                    j++;
                };
                output[output.length - 1] += " " + args[j];
                i = j;
            }
            output[output.length - 1] = output[output.length - 1].replace(/"/g, '');
        };
    }

    return output;
}

const searchMusic = async args => {
    let query = "";
    let artist = "";
    let url = "";


    for(let i=0; i < args.length; i++){
        if(args[i] == "--url"){
            url = args[i+1] || "";
            break;
        };

        if(args[i] == "--artist"){
            artist = args[i+1] || "";
        };

        if(args[i-1] != "--artist" && args[i] != "--artist"){
            query += args[i]
        };

    };
    
    // If user didn't use url
    if(url == ""){
        const result = await yts(query);
        const song = result.all[0];
        if(artist.length > 0){
            for(let i=0; i < result.all.length; i++){
                if(artist.toUpperCase() == result.all[i].author.name.toUpperCase()){
                    song = result.all[i];
                    break;
                }
            };
        };
        url = song.url;
    };

    if(!ytdl.validateURL(url)){
        return null;
    };

    const videoID = ytdl.getURLVideoID(url);
    const song = await yts({videoId: videoID});
    
    return {
        url: song.url,
        title: song.title,
        artist: song.author.name,
        thumbnail: song.thumbnail,
    };
}

const streamMusic =  (stream, connection) =>{
    try{
        connection.play(stream);
    }catch(err){
        throw err;
    }
}

const playSong = (song, connection, emitter)=>{
    const options = {filter: "audioonly", quality: "highestaudio"}
    const stream = ytdl(song.url, options);
    streamMusic(stream, connection)

    emitter.emit("stream", stream);

    stream.on("end", ()=>{
        emitter.emit("end");
    });
}

function getVoiceChannels(msg){
    const channels = msg.guild.channels.cache.array();
    const vchannels = {};
    for (let i = 0; i < channels.length; i++) {
        if (channels[i].type == "voice") {
            vchannels[channels[i].name.toUpperCase()] = channels[i];
        }
    }
    return vchannels;
}

const getChannelByName = (msg, channelName)=>{
    const channel = getVoiceChannels(msg)[channelName.toUpperCase()];

    return channel;
}


const joinChannel = async (msg, channelName, secondaryChannel) => {
    let newState = {
        dispatcher: null,
        channel: null
    }

    try {
        if (!channelName || channelName == "") {

            const member = await msg.guild.members.fetch(msg.author);
            newState.channel = member.voice.channel;

            // Member is not in vchannel
            if (!newState.channel) {
                msg.channel.send("You are not connected to any of the voice channels")

                if (secondaryChannel) {
                    newState.channel = getChannelByName(msg, secondaryChannel);
                };
            };

        } else {
            newState.channel = getChannelByName(msg, channelName)
        };

        newState.dispatcher = await newState.channel.join();
        msg.channel.send(`Joined ${newState.channel.name}`);

    } catch (err) {
        console.log(err)
        msg.channel.send("Cannot join voice channel")
    }

    return newState;
}

const getPlaylistID = (url)=>{
    let id = null
    if(url){
        let parts = url.split("&");
        parts.forEach(elem=>{
            elem = elem.split("=");
            if(elem[0] == "list")
                id = elem[1]
        })
    }
    return id;
}

const fetchPlaylist = async (url)=>{
    try{
        const playlistID = getPlaylistID(url);
        const list = await yts({listId: playlistID});
        return list;
    }catch(err){
        return null;
    }
}

const fetchLive = async (url)=>{
    try{
        const liveID = ytdl.getURLVideoID(url);
        const live = await yts({videoId: liveID});

        return {
            title: live.title,
            url: live.url,
            artist: live.author.name,
            thumbnail: live.thumbnail
        };
    }catch(err){
        return null;
    }
}

const playLive = async (live, connection, emitter)=>{
    try{
        // const options = {filter: "audioonly", quality: "lowestaudio"}
        // let stream = ytdl(live.url, options);
        // connection.play(stream);
        let songInfo = await ytdl.getInfo(live.url);
        let options = { highWaterMark: 1<<12 };
        let hlsFormats = ytdl.filterFormats(songInfo.formats, (format) => format.isHLS);
        let topFormatLabel = hlsFormats[0].qualityLabel;
        let rawQuality = parseInt(topFormatLabel.slice(0, topFormatLabel.length - 1));
        if (rawQuality > 720) {
            options.filter = (format) => format.isHLS && format.qualityLabel === '720p';
          } else {
            options.filter = (format) => format.isHLS;
        }

        let stream = ytdl.downloadFromInfo(songInfo, options);
        connection.play(stream);

        emitter.emit("stream", stream);

        stream.on("end", ()=>{
            emitter.emit("end");
        });
        
    }catch(err){
        console.log(err);
    }
}

module.exports = {
    parseArgs,
    updateState,
    joinChannel,
    streamMusic,
    searchMusic,
    playSong,
    fetchPlaylist,
    fetchLive,
    playLive,
}