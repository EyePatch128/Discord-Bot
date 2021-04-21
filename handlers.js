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
        }else if(args.length == 0){
            msg.guild.members.fetch(msg.author)
                .then(member=>{
                    const channel = member.voice.channel;
                    if(!channel){
                        msg.reply("You are not connected to any of the voice channels")
                        handleError(msg)
                        return;
                    }
                    channel.join()
                        .then(connection=>{
                            msg.reply(`Joined ${connection.channel.name}`);
                        })
                        .catch(err=>{
                            console.log(err);
                            msg.reply(`Couldn't join voice channel`)
                        });

                })
                .catch(err=>{
                    console.log(err)
                    handleError(msg);
                });
    
        }else{
            const channels = msg.guild.channels.cache.array();
            const vchannels = {};
            for(let i =0; i < channels.length; i++){
                if(channels[i].type == "voice"){
                    vchannels[channels[i].name.toUpperCase()] = channels[i];
                }
            }            
            
            channelName = args[0];
            channel = vchannels[channelName.toUpperCase()];

            if(channel == undefined){
                msg.reply(`${channelName} doesn't exist`)
                return;
            };
            channel.join()
                .then(connection=>{
                    msg.reply(`Joined ${channelName}`);
                })
                .catch(err=>{
                    console.log(err);
                    msg.reply(`Couldn't join ${channelName}`)
                });
        }
    }catch(err){
        throw err;
    }
    


}

const handleLeave = msg=>{
    const channel = msg.guild.me.voice.channel;
    msg.guild.me.voice.channel.leave();
    msg.reply(`Left ${channel.name}`)
}


module.exports = {
    handleHelp,
    handleError,
    handleJoin,
    handleLeave
}