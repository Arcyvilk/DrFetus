import Discord from "discord.js";
import Markov from 'markov-strings';
import { uniq } from 'lodash';
import { chooseRandom } from '../../rng';
import { removeKeyword, createEmbed } from '../../helpers';
import { insertData, insertMany, deleteOne } from '../../db';
import { log } from '../../../log';
import { cache } from '../../../cache';

// INITIALIZATION
let markovInit;
const initMarkov = async dataArrays => {
    const stateSize = 1;
    const data = [].concat(...dataArrays);
    markovInit = new Markov(data, { stateSize })
    markovInit.buildCorpus();
}

export const meme = (msg:Discord.Message) => msg.channel.send(`_" ${chooseRandom(cache["memes"]).meme} "_`);
export const memelist = (msg:Discord.Message) => {
    let content = '';
    cache["memes"].map((meme, index) => {
        let helper = content + `**${parseInt(index)+1}**. ${meme.meme}\n`;
        if (helper.length >= 2000) {
            msg.channel.send(content);
            content = '';
        }
        content += `**${parseInt(index)+1}**. ${meme.meme}\n`
        if (index === cache["memes"].length - 1)
            msg.channel.send(content);
    })
}
export const addmeme = (msg:Discord.Message) => insertData('fetus', 'memes', 'meme', removeKeyword(msg), err =>
    err
        ? msg.react('❌')
        : msg.react('✅'));
export const deletememe = (msg:Discord.Message) => {
    let memeIndex:any = removeKeyword(msg);
    let memeToDelete = '';

    try {
        memeIndex = parseInt(memeIndex);
        memeIndex -= 1;
        if (!cache["memes"][memeIndex]) {
            msg.react('❌');
            log.WARN(`Cannot delete meme of index ${memeIndex}.`)
        }
        else {
            memeToDelete = cache["memes"][memeIndex].meme;
            deleteOne('fetus', 'memes', { meme: memeToDelete }, err => 
                err
                    ? msg.react('❌')
                    : msg.react('✅'));
        }
    }
    catch (err) {
        msg.react('❌');
        log.WARN(err);
    }
}
export const fetchvitas = (msg:Discord.Message) => {
    const channelId = '572793751202955264'
    const vitasId = '361185720477679616';
    const msgs:string[] = [];
    const fetchNumber = 130;

    // @ts-ignore:next-line
    const channel = cache.bot.channels.find(channel => channel.id === channelId)
    
    if (!channel)
        return msg.channel.send('Invalid channel.');
    
    const fetchMoar = (index, lastMsgId) => {
        console.log(lastMsgId);
        channel.fetchMessages({ limit: 100, before: lastMsgId })
            .then(messages => {
                messages.map(msg => {
                    if (msg.content != '' && msg.author.id === vitasId && !msg.content.startsWith('http'))
                        msgs.push(msg.content.endsWith('.') || msg.content.endsWith('?') || msg.content.endsWith('!') ? msg.content : `${msg.content}.`)
                    })
                if (index <= fetchNumber) {
                    setTimeout(() => fetchMoar(index + 1, messages.lastKey()), 1000);
                }
                else
                    finish()
                })
            .catch(err => console.log(err));
    }
    
    const finish = () => {
        const normalizedMsgs = uniq(msgs)
        normalizedMsgs.map(msg => insertData('fetus', 'vitas', 'vitas', msg, err =>
            err
                ? console.log(err)
                : null
        ))
        msg.channel.send('Done!');
        msg.channel.stopTyping();
    }
    msg.channel.startTyping();
    fetchMoar(0, null);
}
export const vitas = async (msg:Discord.Message) => {
    const sentences = 5;
    const options = {
        maxTries: 50,
        maxLength: 300,
        minWords: 2,
        prng: Math.random,
        filter: result => result.string.endsWith('.')
    }
    const normalizedMsgs:string[] = cache["vitas"].map(vitas => vitas.vitas);
    let content = '';

    msg.channel.startTyping();
    initMarkov(normalizedMsgs);
    for (let i = 0; i < sentences; i++) 
        content += await markovInit.generate(options).string + ' ';
    const embed = createEmbed(`Vitas says`, [{ title: '\_\_\_', content }])
    msg.channel.send(embed)
    msg.channel.stopTyping();
}