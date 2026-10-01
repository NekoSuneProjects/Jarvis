import { z } from "zod";
import { config } from "../config.js";
import { DiscordIntegration } from "../integrations/discord.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createDiscordPlugin():JarvisPlugin{
  const discord=new DiscordIntegration(config.discordBotToken);
  return {
    id:"discord",
    name:"Discord",
    version:"0.1.0",
    description:"Discord bot read/send tools.",
    tools:[
      {name:"discord.me",description:"Read the configured bot account.",capability:"communication.read",async execute(){return discord.me();}},
      {name:"discord.guilds",description:"List Discord guilds visible to the bot.",capability:"communication.read",async execute(){return discord.guilds();}},
      {
        name:"discord.channels",description:"List guild channels.",capability:"communication.read",
        async execute(input){const v=z.object({guildId:z.string()}).parse(input);return discord.channels(v.guildId);}
      },
      {
        name:"discord.messages",description:"Read recent channel messages.",capability:"communication.read",
        async execute(input){const v=z.object({channelId:z.string(),limit:z.number().int().min(1).max(100).default(25)}).parse(input);return discord.messages(v.channelId,v.limit);}
      },
      {
        name:"discord.search",description:"Search messages in a Discord guild.",capability:"communication.read",
        async execute(input){const v=z.object({guildId:z.string().min(1),query:z.string().min(1),limit:z.number().int().min(1).max(25).default(25)}).parse(input);return discord.searchGuild(v.guildId,v.query,v.limit);}
      },
      {
        name:"discord.reply",description:"Reply to a Discord message.",capability:"communication.send",
        async execute(input){const v=z.object({channelId:z.string().min(1),messageId:z.string().min(1),content:z.string().min(1).max(2000)}).parse(input);return discord.reply(v.channelId,v.messageId,v.content);}
      },
      {
        name:"discord.dm.read",description:"Read recent DMs with a Discord user.",capability:"communication.read",
        async execute(input){const v=z.object({userId:z.string().min(1),limit:z.number().int().min(1).max(100).default(25)}).parse(input);return discord.readDm(v.userId,v.limit);}
      },
      {
        name:"discord.dm.send",description:"Send a Discord DM.",capability:"communication.send",
        async execute(input){const v=z.object({userId:z.string().min(1),content:z.string().min(1).max(2000)}).parse(input);return discord.sendDm(v.userId,v.content);}
      },
      {
        name:"discord.mentions",description:"Read messages mentioning a user in a Discord guild.",capability:"communication.read",
        async execute(input){const v=z.object({guildId:z.string().min(1),userId:z.string().min(1),limit:z.number().int().min(1).max(25).default(25)}).parse(input);return discord.searchMentions(v.guildId,v.userId,v.limit);}
      },
      {
        name:"discord.send",description:"Send a Discord channel message.",capability:"communication.send",
        async execute(input){const v=z.object({channelId:z.string(),content:z.string().min(1).max(2000)}).parse(input);return discord.send(v.channelId,v.content);}
      }
    ]
  };
}
