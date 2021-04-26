require('dotenv').config()
const Discord = require("discord.js");





const {handleHelp, handleError, handleJoin, handleLeave, handleUseSearchPlatform, handlePlay, handleStop, handleResume, handlePause} = require("./handlers")
const {parseArgs} = require("./helpers")

const client = new Discord.Client();
let dispatcher;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});


client.on("message", msg=>{
    let PLATFORM = "YOUTUBE";

    if(msg.content[0] == "!"){
        const input = msg.content.split(" ");
        const command = input[0].substring(1).toUpperCase();
        const args = parseArgs(input.slice(1, input.length))


        switch(command){
            case "HELP":
                handleHelp(msg);
                break;
            case "JOIN":
                handleJoin(msg, args);
                break;
            case "LEAVE":
                handleLeave(msg);
                break;
            case "USE":
                PLATFORM = handleUseSearchPlatform(msg, args)
                break;
            case "PLAY":
                dispatcher = handlePlay(msg, args);
                break;
            case "STOP":
                handleStop(msg, dispatcher);
                break;
            case "PAUSE":
                handlePause(msg, dispatcher)
                break;
            case "RESUME":
                handleResume(msg, dispatcher)
                break;
            default:
                handleError(msg);

        }
    }
})

client.login(process.env.TOKEN)