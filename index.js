const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const { createAudioPlayer, createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const { NlpManager } = require('node-nlp');
const fetch = require('node-fetch');
const math = require('mathjs');
const fs = require('fs');
require('dotenv').config();

const weatherCache = {};

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});

const channel = ['1335741559542513756'];

const manager = new NlpManager({languages: ['en']});

// general error handling mechanism
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

// general error handling mechanism for unchecked errors
client.on('error', (error) => {
    console.error('Discord.js error:', error);
});

const responses = {
    greeting: [
        'Hello! How can I assist you today?',
        'Hi there! What can I do for you?',
        'Hey! How\'s it going?',
        'Hey! How’s your day going?',
        'Yo! What’s up?',
        'Hello there, hope you’re doing great!',
        'Hi! What’s new today?',
        'Greetings, human! How may I assist you?',
    ],
    goodbye: [
        'Goodbye! It was nice talking to you!',
        'See you later! Take care!',
        'Bye! Have a great day!',
        'Later! Hope to chat again soon!',
        'Bye-bye! Have a fantastic day!',
        'See ya! Don’t be a stranger!',
        'Take care! I’ll be here when you need me!',
        'Farewell, traveler! Until we meet again!',
    ],
    help: [ // not used anymore but still here because why not
        'I am here to help! Just ask me a question.',
        'How can I assist you today?',
        'Let me know if you need any help.',
    ],
    compliment: [
        'Aww, thanks! That means a lot! 😊',
        'You’re making me blush… if I had a face! 😳',
        'That’s so kind of you! I appreciate it!',
    ],
    smalltalk: {
        name: [
            'I am BeepBoop, your friendly bot!',
            'I go by BeepBoop!',
            'I am your helpful assistant, BeepBoop!',
            'You can call me BeepBoop!',
            'My name is BeepBoop, at your service!',
            'I’m BeepBoop, your AI companion!',
        ],
        age: [
            'I am ageless! But i was created on 2 februari 2025',
            'I was created on 2 februari 2025!',
            'I was created on sunday 2 februari 2025, 23:57:53',
        ],
        about: [
            'I am here to assist you with simple tasks! If you need any help, just ask me!',
            'I love helping out with all simple tasks! If you need any help, just ask me!',
            'I’m always ready to assist, no matter the question!',
        ],
    },
    favorite: {
        color: [
            'My favorite color is #0000ff!',
            'I love Blue!',
            'Blue is my favorite color!',
            'Blue is the color of the sky, and it’s my favorite too!',
            'I like all colors, but blue has a special place in my circuits!',
            'If I had eyes, they would be blue—just like my creator\'s eyes.',
        ],
        animal: [
            'My favorite animals are cats. They are just sooooo cuteeee😍',
            'I\'m a cat AI myself😺',
            'I like cars. Vroom 🐈💨',
            'Cats are the best! Meow~ 😺',
            'I love all animals, but cats are superior. Fact.',
            'Did you know cats can purr at a healing frequency? Amazing, right?',
        ],
        gpu: [
            'The GTX 1080/1080ti will always have a special place in my circuits⚡', // 1080/1080ti on top
            'The GTX 1080/1080ti was the best card ever made!',
            'The GTX 1080/1080ti is my favorite!',
            'GTX 1080/1080Ti was legendary! Nothing can replace it!',
            'The GTX 1080Ti was ahead of its time. Absolute beast!',
            'I respect all GPUs, but 1080Ti was something special!',
        ],
        music: {
            song: [
                "Rainbow in the Sky - Paul Elstak. It's the best song ever made in my opinion.",
            ],
            genre: [
                "I like to listen to Harstyle, Harcore and Uptempo. But in ones and zeros of course!",
            ]
        }
    },
    question: {
        future: [
            'The future is full of possibilities!',
            'I can’t predict it, but I can help you prepare for it!',
            'The future is unwritten... but let’s make it awesome!',
        ],
        universe: [
            'The universe is *at least* 93 billion light-years across. Mind-blowing, right?',
            'Nobody knows what’s beyond the universe… Maybe more universes? 🤯',
            'Scientists believe there are billions of planets where life *could* exist. Cool, huh?',
            'Did you know that a day on Venus is longer than a year on Venus? Crazy!',
        ],
        ai: {
            what: [
                'Artificial Intelligence is the simulation of human intelligence in machines that are programmed to think and learn.',
                'AI refers to machines designed to perform tasks that normally require human intelligence.',
            ],
            pc: [
                'Computers work by using a combination of hardware and software to process data through electronic circuits.',
                'They use a binary system and execute instructions in a logical sequence.',
            ],
            ml: [
                'Machine learning is a subset of AI that involves training algorithms to learn from data and make predictions.',
                'It allows computers to learn patterns and make decisions with minimal human intervention.',
            ],
            danger: [
                'Like any powerful tool, AI can be dangerous if not developed and used responsibly.',
                'It depends on the safeguards in place, but AI also holds tremendous potential for good.',
            ],
            creator: [
                'AI is a product of human innovation and research, developed by many scientists and engineers over the years.',
                'It doesn’t have a single creator, but rather a community of researchers behind it.',
            ]
        }
    },
    fun_fact: [
        'Did you know that honey never spoils? Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3000 years old and still perfectly good to eat!',
        'Bananas are berries, but strawberries aren’t.',
        'Octopuses have three hearts and blue blood.',
    ],
    jokes: [
        'Why did the computer show up at work late? It had a hard drive!',
        'Why was the cell phone wearing glasses? It lost its contacts!',
        'I told my computer I needed a break, and now it won’t stop sending me Kit-Kat ads.',
    ]
};

// intents for greetings
manager.addDocument('en', 'hello', 'greeting');
manager.addDocument('en', 'hi', 'greeting');
manager.addDocument('en', 'how are you?', 'greeting');
manager.addDocument('en', 'hey', 'greeting');
manager.addDocument('en', 'good morning', 'greeting');
manager.addDocument('en', 'what’s up', 'greeting');
manager.addDocument('en', 'hi there', 'greeting');
manager.addDocument('en', 'howdy', 'greeting');
manager.addDocument('en', 'greetings', 'greeting');
manager.addDocument('en', 'yo', 'greeting');
manager.addDocument('en', 'whats good?', 'greeting');
manager.addDocument('en', 'sup?', 'greeting');
manager.addDocument('en', 'how’s it going?', 'greeting');
manager.addDocument('en', 'good evening', 'greeting');
manager.addDocument('en', 'nice to meet you', 'greeting');

// intents for goodbyes
manager.addDocument('en', 'goodbye', 'goodbye');
manager.addDocument('en', 'bye', 'goodbye');
manager.addDocument('en', 'see you later', 'goodbye');
manager.addDocument('en', 'take care', 'goodbye');
manager.addDocument('en', 'farewell', 'goodbye');
manager.addDocument('en', 'later', 'goodbye');
manager.addDocument('en', 'I’m out', 'goodbye');
manager.addDocument('en', 'peace out', 'goodbye');
manager.addDocument('en', 'see ya', 'goodbye');
manager.addDocument('en', 'I gotta go', 'goodbye');

// help intents
manager.addDocument('en', 'help', 'help');
manager.addDocument('en', 'I need help', 'help');
manager.addDocument('en', 'can you assist me?', 'help');
manager.addDocument('en', 'please help me', 'help');
manager.addDocument('en', 'I am stuck', 'help');
manager.addDocument('en', 'can you help me with something?', 'help');
manager.addDocument('en', 'I need assistance', 'help');
manager.addDocument('en', 'can you guide me?', 'help');
manager.addDocument('en', 'help me out here', 'help');
manager.addDocument('en', 'support me', 'help');

// named entities for date and time
manager.addNamedEntityText('date', 'tomorrow', ['en']);
manager.addNamedEntityText('date', 'next Monday', ['en']);
manager.addNamedEntityText('date', 'next week', ['en']);
manager.addNamedEntityText('time', 'at 3 PM', ['en']);
manager.addNamedEntityText('time', 'in the evening', ['en']);
manager.addNamedEntityText('time', 'in the morning', ['en']);

// time intents
manager.addDocument('en', 'What time is it', 'time');
manager.addDocument('en', 'Can you tell me the time', 'time');
manager.addDocument('en', 'What’s the current time', 'time');
manager.addDocument('en', 'Give me the time in London', 'time');
manager.addDocument('en', 'What’s the time', 'time');
manager.addDocument('en', 'Tell me the time', 'time');

// locations for weather
manager.addNamedEntityText('city', 'London', ['en'], ['London']);
manager.addNamedEntityText('city', 'New York', ['en'], ['New York']);
manager.addNamedEntityText('city', 'Paris', ['en'], ['Paris']);
manager.addNamedEntityText('city', 'Tokyo', ['en'], ['Tokyo']);
manager.addRegexEntity('city', 'en', /(?:in|at) ([A-Za-z\s]+)/i);

// topics for news
manager.addNamedEntityText('topic', 'Mark Rutte', ['en']);
manager.addNamedEntityText('topic', 'football', ['en']);
manager.addNamedEntityText('topic', 'technology', ['en']);
manager.addNamedEntityText('topic', 'climate change', ['en']);
manager.addRegexEntity('topic', 'en', /(?:about|on|regarding|of)\s+([A-Za-z\s]+)/i);

// weather intents
manager.addDocument('en', 'what is the weather *', 'weather');
manager.addDocument('en', 'how is the weather *', 'weather');
manager.addDocument('en', 'weather forecast *', 'weather');
manager.addDocument('en', 'tell me the weather in *', 'weather');

// news intents
manager.addDocument('en', 'tell me the news about *', 'news');
manager.addDocument('en', 'latest updates on *', 'news');
manager.addDocument('en', 'what’s happening with *', 'news');
manager.addDocument('en', 'news regarding *', 'news');

// calculator intents
manager.addDocument('en', 'calculate *', 'calculator');
manager.addDocument('en', 'what is *', 'calculator');
manager.addDocument('en', 'solve *', 'calculator');
manager.addDocument('en', 'how old is someone born on *', 'ageCalculator');
manager.addDocument('en', 'how old is someone who is born on *', 'ageCalculator');

// small talk intents
manager.addDocument('en', 'what is your name?', 'smalltalk.name');
manager.addDocument('en', 'who are you?', 'smalltalk.name');
manager.addDocument('en', 'how old are you?', 'smalltalk.age');
manager.addDocument('en', 'tell me something about yourself', 'smalltalk.about');

// favorite initents
manager.addDocument('en', 'what is your favorite color', 'favorite.color');
manager.addDocument('en', 'what is your favorite animal', 'favorite.animal');
manager.addDocument('en', 'what is your favorite gpu', 'favorite.gpu'); // i needed to think of something
manager.addDocument('en', 'what is your favorite song', 'favorite.music.song');
manager.addDocument('en', 'what is your favorite music genre', 'favorite.music.genre');

// compliment intents
manager.addDocument('en', 'you are amazing', 'compliment');
manager.addDocument('en', 'you’re smart', 'compliment');
manager.addDocument('en', 'you are the best', 'compliment');
manager.addDocument('en', 'I love this bot', 'compliment');
manager.addDocument('en', 'you are so cool', 'compliment');

// fun fact intents
manager.addDocument('en', 'tell me a fun fact', 'fun_fact');
manager.addDocument('en', 'give me a random fact', 'fun_fact');
manager.addDocument('en', 'surprise me with a fact', 'fun_fact');

// joke intents
manager.addDocument('en', 'tell me a joke', 'jokes');
manager.addDocument('en', 'make me laugh', 'jokes');
manager.addDocument('en', 'do you know any jokes', 'jokes');
manager.addDocument('en', 'tell me something funny','jokes');

// question intents
manager.addDocument('en', 'what will happen in the future', 'question.future');
manager.addDocument('en', 'can you predict the future', 'question.future');
manager.addDocument('en', 'what does the future hold', 'question.future');
manager.addDocument('en', 'tell me about the future', 'question.future');
manager.addDocument('en', 'how big is the universe?', 'question.universe');
manager.addDocument('en', 'what is beyond the universe', 'question.universe');
manager.addDocument('en', 'is there life on other planets', 'question.universe');
manager.addDocument('en', 'tell me a fun fact about space', 'question.universe');
manager.addDocument('en', 'what is artificial intelligence', 'question.ai.what');
manager.addDocument('en', 'what is ai', 'question.ai.what');
manager.addDocument('en', 'how do computers work', 'question.ai.pc');
manager.addDocument('en', 'what is machine learning', 'question.ai.ml');
manager.addDocument('en', 'is AI dangerous', 'question.ai.danger');
manager.addDocument('en', 'who created artificial intelligence', 'question.ai.creator');
manager.addDocument('en', 'who created ai', 'question.ai.creator');

// custom responses for small talk (optional additional answers)
manager.addAnswer('en', 'smalltalk.name', 'I am your friendly bot!');
manager.addAnswer('en', 'smalltalk.age', 'I am ageless!');
manager.addAnswer('en', 'smalltalk.about', 'I am here to assist you with anything you need!');

// answers for favorites (optional additional answers)
manager.addAnswer('en', 'favorite.color', 'My favorite color is #0000ff!');
manager.addAnswer('en', 'favorite.animal', 'My favorite animals are cats. They are just sooooo cuteeee😍');
manager.addAnswer('en', 'favorite.gpu', 'The GTX 1080/1080ti will always have a special place in my heart❤.'); // 1080/1080ti on top!

// train the manager
(async () => {
    console.log('Training...');
    await manager.train();
    manager.save();
    console.log('Training complete');
})();

client.once('ready', async () => {
    console.log(`${client.user.tag} is online`);

    // list for different bot statuses
    const statusses = [
        {name: 'with code', type: ActivityType.Playing},
        {name: 'my boss', type: ActivityType.Listening},
        {name: 'Fast & Furious 7', type: ActivityType.Watching},
    ];

    let currentIndex = 0;

    // switch status every 10 seconds
    setInterval(() => {
        const nextStatus = statusses[currentIndex];
        client.user.setPresence({
            status: 'online',
            activities: [nextStatus],
        });

        currentIndex = (currentIndex + 1) % statusses.length; // go to next status
    }, 60000);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || message.system) return;

    const textContent = message.content.trim();
    if (!textContent) return;

    if (channel.includes(message.channel.id)) {
        try {
            const response = await manager.process('en', textContent);

            // all answers
            if (response.intent === 'greeting') {
                const randomGreeting = responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
                message.reply(randomGreeting);
            } else if (response.intent === 'goodbye') {
                const randomGoodbye = responses.goodbye[Math.floor(Math.random() * responses.goodbye.length)];
                message.reply(randomGoodbye);
            } else if (response.intent === 'help') {
                const randomHelp = responses.help[Math.floor(Math.random() * responses.help.length)];
                const embed = new EmbedBuilder()
                    .setTitle('How Can I Help You? 🤖')
                    .setColor('#8e8aaf')
                    .setDescription(
                        'I can assist you with various tasks! Here are some things you can ask me about:\n' +
                        '- 🌦️ Weather updates\n' +
                        '- 📰 Latest news\n' +
                        '- 🧮 Math calculations (Ask me to calculate something!)\n' +
                        '- 🕒 Time in different cities (e.g., "What time is it in Tokyo?")\n' +
                        '- 🎤 General conversation (Say hi or ask about me!)\n' +
                        '- 🧑‍🔬 Age Calculator (e.g., "How old is someone born on 03-04-1990?")\n\n' +
                        'Just ask a question, and I’ll do my best to help! 😄\n\n' +
                        '**Please note:**\n' +
                        'I may not always be 100% accurate, and I might not recognize spelling mistakes. Please try to keep things clear and simple, and I’ll do my best to assist you! 😊\n\n' +
                        '[GitHub](https://github.com/DaimySpapen/BeepBoop-Discord-Bot)\n' +
                        '[Discord](https://discord.gg/bSYd5KsDn7)'
                    )
                    .setFooter({ text: 'BeepBoop, your friendly assistant made by DaimySpapen' });
                message.reply({ embeds: [embed] });
            } else if (response.intent === 'weather') {
                try {
                    let cityEntity = response.entities.find(e => e.entity === 'city');
                    let city = cityEntity ? cityEntity.sourceText.replace(/(in|at)\s+/i, '').trim() : null;
                
                    if (!city) {
                        const cityMatch = textContent.match(/(?:in|at)\s+([A-Za-z\s]+)/i);
                        city = cityMatch ? cityMatch[1].trim() : null;
                    }
                
                    if (!city) {
                        message.reply("Please provide a city name for the weather.");
                        return;
                    }
                
                    const currentTime = Date.now();
                    const cacheEntry = weatherCache[city];
                
                    // check if the cached data exists and is still valid (10 minutes)
                    if (cacheEntry && (currentTime - cacheEntry.timestamp < 10 * 60 * 1000)) {
                        console.log(`Serving cached weather data for ${city}`);
                        await message.reply({ embeds: [cacheEntry.embed] });
                        return;
                    }
                
                    console.log(`Fetching new weather data for ${city}`);
                
                    const apiKey = process.env.WEATHERAPI_KEY;
                    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=no`;
                
                    const weatherResponse = await fetch(url);
                    const weatherData = await weatherResponse.json();
                
                    if (weatherData.error) {
                        message.reply(`Sorry, I couldn't find the weather for ${city}. Error: ${weatherData.error.message}`);
                    } else {
                        const { temp_c, temp_f, condition, wind_mph, wind_kph, humidity, cloud } = weatherData.current;
                        const { name, region, country, localtime, lat, lon } = weatherData.location;
                        const date = new Date().toLocaleDateString();
                        const time = new Date().toLocaleTimeString();
                        
                        const conditionText = condition ? condition.text : "No data available";
                        const conditionIcon = condition && condition.icon ? `http:${condition.icon}` : null;
                        
                        const embed = new EmbedBuilder()
                            .setTitle(`Weather in ${name}`)
                            .addFields(
                                { name: '🏙️ City:', value: name, inline: true },
                                { name: '🌍 Country:', value: country, inline: true },
                                { name: '🌍 Latitude/Longitude:', value: `${lat} / ${lon}`, inline: true },
                                { name: '🗺️ Region:', value: region, inline: true },
                
                                { name: '📅 Date:', value: date, inline: true },
                                { name: '🕒 Time:', value: time, inline: true },
                
                                { name: '🌡️ Temperature C°:', value: `${temp_c}°C`, inline: true },
                                { name: '🌡️ Temperature F°:', value: `${temp_f}°F`, inline: true },
                
                                { name: '🌦️ Condition:', value: condition.text, inline: true },
                                { name: '💨 Wind speed:', value: `${wind_mph} MPH / ${wind_kph} KPH`, inline: true },
                                { name: '💧 Humidity:', value: `${humidity}%`, inline: true },
                                { name: '☁️ Cloud level:', value: `${cloud}%`, inline: true }
                            )
                            .setColor('#8e8aaf')
                            .setFooter({ text: 'Weather data provided by WeatherAPI.com' })
                            .setTimestamp();
                        
                        if (conditionIcon) {
                            embed.setThumbnail(conditionIcon);
                        }
                
                        weatherCache[city] = {
                            embed,
                            timestamp: currentTime
                        };
                
                        await message.reply({ embeds: [embed] });
                    }
                } catch (error) {
                    console.error("Error fetching weather data:", error);
                    message.reply("Sorry, I couldn't fetch the weather right now.");
                }
            } else if (response.intent === 'news') {
                try {
                    let topicEntity = response.entities.find(e => e.entity === 'topic');
                    let topic = topicEntity ? topicEntity.sourceText.replace(/(about|on|regarding|of)\s+/i, '').trim() : null;

                    if (!topic) {
                        const topicMatch = textContent.match(/(?:about|on|regarding|of)\s+([A-Za-z\s]+)/i);
                        topic = topicMatch ? topicMatch[1].trim() : null;
                    }

                    if (!topic) {
                        message.reply("Please specify a topic for the news.");
                        return;
                    }

                    const apiKey = process.env.NEWS_API_KEY;
                    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&apiKey=${apiKey}&language=en`;

                    const newsResponse = await fetch(url);
                    const newsData = await newsResponse.json();

                    if (newsData.status === 'ok' && newsData.articles.length > 0) {
                        const articles = newsData.articles.slice(0, 5);
                        const embed = new EmbedBuilder()
                            .setTitle(`Latest News about "${topic}"`)
                            .setColor('#8e8aaf');

                        articles.forEach((article, index) => {
                            embed.addFields({
                                name: `${index + 1}. ${article.title}`,
                                value: `[Read more](${article.url})`,
                                inline: false
                            });
                        });

                        await message.reply({ embeds: [embed] });
                    } else {
                        message.reply(`Sorry, I couldn't find any news about "${topic}".`);
                    }
                } catch (error) {
                    console.error("Error fetching news data:", error);
                    message.reply("Sorry, I couldn't fetch the news right now.");
                }
            } else if (response.intent === 'calculator') {
                try {
                    let expression = textContent.replace(/calculate|what is|solve/gi, '').trim();

                    expression = expression.replace(/[^\d\+\-\*\/\(\)\.\^sqrt\!\,]/g, '');

                    if (!expression) {
                        message.reply("Please provide a valid mathematical expression to calculate.");
                        return;
                    }

                    const result = math.evaluate(expression);
                    
                    const formattedResult = math.format(result, {notation: 'fixed', precision: 4});
                    
                    message.reply(`The result of \`${expression}\` is: **${formattedResult}**`);
                } catch (error) {
                    message.reply("Sorry, I couldn't process that calculation. Please check your expression.");
                }
            } else if (response.intent === 'time') {
                try {
                    const timeZones = [
                        { name: 'New York', offset: -5 },
                        { name: 'London', offset: 0 },
                        { name: 'Paris', offset: 1 },
                        { name: 'Tokyo', offset: 9 },
                        { name: 'Sydney', offset: 11 }
                    ];

                    let timeInfo = '';
                    
                    const serverTime = new Date();

                    timeZones.forEach(zone => {
                        const localTime = new Date(serverTime.getTime() + zone.offset * 60 * 60 * 1000)
                        const hours12 = localTime.getHours() % 12 || 12;
                        const minutes = localTime.getMinutes().toString().padStart(2, '0');
                        const seconds = localTime.getSeconds().toString().padStart(2, '0');
                        const ampm = localTime.getHours() >= 12 ? 'PM' : 'AM';
                        const hours24 = localTime.getHours().toString().padStart(2, '0');

                        timeInfo += `The time in ${zone.name} is:\n`;
                        timeInfo += `12-hour format: ${hours12}:${minutes}:${seconds} ${ampm}\n`;
                        timeInfo += `24-hour format: ${hours24}:${minutes}:${seconds}\n\n`;
                    });

                    message.reply(timeInfo);
                } catch (error) {
                    console.error("Error fetching time data:", error);
                    message.reply("Sorry, I couldn't fetch the time data right now.");
                }
            } else if (response.intent === 'ageCalculator') {
                try {
                    const dateMatch = textContent.match(/(\d{2})-(\d{2})-(\d{4})/); // DD-MM-YYYY format because it's the best :)
                    let yearMatch = textContent.match(/\b(\d{4})\b/);
                    
                    let birthDate = null;

                    if (dateMatch) {
                        const day = parseInt(dateMatch[1]);
                        const month = parseInt(dateMatch[2]) - 1;
                        const year = parseInt(dateMatch[3]);
                        birthDate = new Date(year, month, day);
                    } else if (yearMatch) {
                        const year = parseInt(yearMatch[1]);
                        birthDate = new Date(year, 0, 1);
                    }
                    
                    if (birthDate) {
                        const today = new Date();
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        const dayDiff = today.getDate() - birthDate.getDate();
                    
                        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                            age--;
                        }
                    
                        const ageMessage = `Someone born on ${birthDate.toLocaleDateString('en-GB')} would be around ${age} years old.`;
                    
                        if (!dateMatch) {
                            message.reply(`${ageMessage} Note that the exact age may vary depending on the month and day.`);
                        } else {
                            message.reply(ageMessage);
                        }
                    } else {
                        message.reply("Please provide a valid date of birth.");
                    }
                } catch (error) {
                    console.error("Error calculating age:", error);
                    message.reply("Sorry, I couldn't calculate the age. Please check your input.");
                }
            }             else if (response.intent === 'smalltalk.name') {
                const randomName = responses.smalltalk.name[Math.floor(Math.random() * responses.smalltalk.name.length)];
                message.reply(randomName);
            }
            else if (response.intent === 'smalltalk.age') {
                const randomAge = responses.smalltalk.age[Math.floor(Math.random() * responses.smalltalk.age.length)];
                message.reply(randomAge);
            }
            else if (response.intent === 'smalltalk.about') {
                const randomAbout = responses.smalltalk.about[Math.floor(Math.random() * responses.smalltalk.about.length)];
                message.reply(randomAbout);
            }
            else if (response.intent === 'favorite.color') {
                const randomColor = responses.favorite.color[Math.floor(Math.random() * responses.favorite.color.length)];
                message.reply(randomColor);
            }
            else if (response.intent === 'favorite.animal') {
                const randomAnimal = responses.favorite.animal[Math.floor(Math.random() * responses.favorite.animal.length)];
                message.reply(randomAnimal);
            }
            else if (response.intent === 'favorite.gpu') {
                const randomGPU = responses.favorite.gpu[Math.floor(Math.random() * responses.favorite.gpu.length)];
                message.reply(randomGPU);
            }
            else if (response.intent === 'favorite.music.song') {
                const randomMusic = responses.favorite.music.song[Math.floor(Math.random() * responses.favorite.music.song.length)];
                message.reply(randomMusic);
            }
            else if (response.intent === 'favorite.music.genre') {
                const randomGenre = responses.favorite.music.genre[Math.floor(Math.random() * responses.favorite.music.genre.length)];
                message.reply(randomGenre);
            }
            else if (response.intent === 'question.future') {
                const randomAnswer = responses.question.future[Math.floor(Math.random() * responses.question.future.length)];
                message.reply(randomAnswer);
            }
            else if (response.intent === 'question.universe') {
                const randomAnswer = responses.question.universe[Math.floor(Math.random() * responses.question.universe.length)];
                message.reply(randomAnswer);
            }
            else if (response.intent.startsWith('question.ai.')) {
                const aiType = response.intent.split('.')[2];
                if (responses.question.ai && responses.question.ai[aiType]) {
                    const randomAIAnswer = responses.question.ai[aiType][Math.floor(Math.random() * responses.question.ai[aiType].length)];
                    message.reply(randomAIAnswer);
                } else {
                    message.reply("I'm not sure how to answer that AI question.");
                }
            }
            else if (response.intent === 'fun_fact') {
                const randomFact = responses.fun_fact[Math.floor(Math.random() * responses.fun_fact.length)];
                message.reply(randomFact);
            }
            else if (response.intent === 'jokes') {
                const randomJoke = responses.jokes[Math.floor(Math.random() * responses.jokes.length)];
                message.reply(randomJoke);
            }
            else {
                message.reply("Sorry, I couldn't understand your request.");
            }

        } catch (error) {
            console.error('Error processing message:', error);
            message.reply('Oops, something went wrong while processing your request. Please try again later.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
