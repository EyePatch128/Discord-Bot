require('dotenv').config()
const Discord = require("discord.js");



const {handleHelp, handleError, handleJoin, handleLeave} = require("./handlers")

const client = new Discord.Client();


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});


client.on("message", msg=>{
    if(msg.content[0] == "!"){
        const args = msg.content.split(" ");
        const command = args[0].substring(1).toUpperCase();

        switch(command){
            case "HELP":
                handleHelp(msg);
                break;
            case "JOIN":
                handleJoin(msg, args.slice(1, args.length));
                break;
            case "LEAVE":
                handleLeave(msg);
                break;
            default:
                handleError(msg);

        }
    }
})

client.login(process.env.TOKEN)