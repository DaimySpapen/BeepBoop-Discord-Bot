const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { NlpManager } = require('node-nlp');
const fetch = require('node-fetch');
const math = require('mathjs');
const fs = require('fs');
require('dotenv').config();

const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});

const channel = ['1335741559542513756'];

const manager = new NlpManager({languages: ['en']});

// algemeen foutafhandelingsmechanisme
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

// algemeen foutafhandelingsmechanisme voor niet gecontroleerde fouten
client.on('error', (error) => {
    console.error('Discord.js error:', error);
});

const responses = {
    greeting: [
        'Hello! How can I assist you today?',
        'Hi there! What can I do for you?',
        'Hey! How\'s it going?',
    ],
    goodbye: [
        'Goodbye! It was nice talking to you!',
        'See you later! Take care!',
        'Bye! Have a great day!',
    ],
    help: [
        'I am here to help! Just ask me a question.',
        'How can I assist you today?',
        'Let me know if you need any help.',
    ],
    smalltalk: {
        name: [
            'I am BeepBoop, your friendly bot!',
            'I go by BeepBoop!',
            'I am your helpful assistant, BeepBoop!',
        ],
        age: [
            'I am ageless!',
            'I don’t have an age, I am timeless!',
            'Age doesn’t matter when you’re a bot!',
        ],
        about: [
            'I am here to assist you with anything you need!',
            'I love helping out with all sorts of tasks!',
            'I’m always ready to assist, no matter the question!',
        ],
    },
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

// intents for goodbyes
manager.addDocument('en', 'goodbye', 'goodbye');
manager.addDocument('en', 'bye', 'goodbye');
manager.addDocument('en', 'see you later', 'goodbye');
manager.addDocument('en', 'take care', 'goodbye');
manager.addDocument('en', 'farewell', 'goodbye');

// help intents
manager.addDocument('en', 'help', 'help');
manager.addDocument('en', 'I need help', 'help');
manager.addDocument('en', 'can you assist me?', 'help');
manager.addDocument('en', 'please help me', 'help');
manager.addDocument('en', 'I am stuck', 'help');

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

// custom responses for small talk
manager.addAnswer('en', 'smalltalk.name', 'I am your friendly bot!');
manager.addAnswer('en', 'smalltalk.age', 'I am ageless!');
manager.addAnswer('en', 'smalltalk.about', 'I am here to assist you with anything you need!');

// train the manager
(async () => {
    console.log('Training...');
    await manager.train();
    manager.save();
    console.log('Training complete');
})();

client.once('ready', () => {
    console.log(`${client.user.tag} is online`);
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
                        'I may not always be 100% accurate, and I might not recognize spelling mistakes. Please try to keep things clear and simple, and I’ll do my best to assist you! 😊'
                    )
                    .setFooter({ text: 'BeepBoop, your friendly assistant made by DaimySpapen' });
                message.reply({ embeds: [embed] });
            } else if (response.intent === 'weather') {
                try {
                    let cityEntity = response.entities.find(e => e.entity === 'city');
                    let city = cityEntity ? cityEntity.sourceText.replace(/(in|at)\s+/i, '').trim() : null;

                    if (!city) {
                        const cityMatch = textContent.match(/(?:in|at)\s+([A-Za-z\s]+)/i);
                        city = cityMatch ? cityMatch[1] : null;
                    }

                    if (!city) {
                        message.reply("Please provide a city name for the weather.");
                        return;
                    }

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
            } else {
                message.reply("Sorry, I couldn't understand your request.");
            }

        } catch (error) {
            console.error('Error processing message:', error);
            message.reply('Oops, something went wrong while processing your request. Please try again later.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);