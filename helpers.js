const parseArgs = args =>{
    const output = [];

    for(let i=0; i < args.length; i++){
        output.push(args[i])
        if(args[i][0] == '"'){
            let j = i + 1;
            while(j < args.length && args[j][args[j].length - 1] != '"'){
                output[output.length - 1] += " " + args[j];
                j++;
            };
            output[output.length - 1] += " " + args[j];
            i = j;
            output[output.length - 1] = output[output.length - 1].replace(/"/g, '');
        };
    }
    

    return output;
}


const streamMusic = async (msg, stream) =>{
    try{
        const channel = msg.guild.me.voice.channel;
        const connection = await channel.join();
        connection.play(stream);
        return connection;
    }catch(err){
        throw err;
    }
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

function joinChannelByName(msg, channelName){
    channel = getVoiceChannels(msg)[channelName.toUpperCase()];

    if (channel == undefined) {
        msg.reply(`${channelName} doesn't exist`)
        return;
    };
    channel.join()
        .then(connection => {
            msg.reply(`Joined ${channelName}`);
        })
        .catch(err => {
            console.log(err);
            msg.reply(`Couldn't join ${channelName}`)
        });
}


const joinChannel = (msg, channelName, secondaryChannel) => {
    if (!channelName || channelName == "") {
        msg.guild.members.fetch(msg.author)
            .then(member => {
                const channel = member.voice.channel;
                if (!channel) {
                    msg.reply("You are not connected to any of the voice channels")

                    if(secondaryChannel){
                        joinChannelByName(msg, secondaryChannel)
                    }else{
                        throw new Error("Cannot join voice channel")
                    }

                }
                channel.join()
                    .then(connection => {
                        msg.reply(`Joined ${connection.channel.name}`);
                    })
                    .catch(err => {
                        console.log(err);
                        msg.reply(`Couldn't join voice channel`)
                    });

            })
            .catch(err => {
                console.log(err)
                throw new Error("Cannot join voice channel")
            });

    } else {
        joinChannelByName(msg, channelName)   
    }
}

module.exports = {
    parseArgs,
    joinChannel,
    streamMusic
}