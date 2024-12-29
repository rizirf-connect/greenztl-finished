import RSSParser from 'rss-parser'

const parser = new RSSParser();

/**
 * to get rss 
 * @param  url is the rss feed url xml
 * @returns json format from xml
 */

export const parseRss = async (url) => {
    try {
        const feed = await parser.parseURL(url);
        return feed;
    } catch (error) {
        console.log(error)
    }
}