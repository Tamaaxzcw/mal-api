// File: api/char/mal.js

import cheerio from 'cheerio';
import axios from 'axios';

export default async function handler(req, res) {
  const { id, name } = req.query;

  try {
    let url;
    if (id) {
      url = `https://myanimelist.net/character/${id}`;
    } else if (name) {
      const searchUrl = `https://myanimelist.net/character.php?q=${encodeURIComponent(name)}`;
      const { data: searchHtml } = await axios.get(searchUrl);
      const $search = cheerio.load(searchHtml);
      const firstResult = $search('.characters-favorites-ranking-table a').attr('href');
      if (!firstResult) {
        return res.status(404).json({ error: 'Character not found.' });
      }
      url = firstResult;
    } else {
      return res.status(400).json({ error: 'Please provide either id or name parameter.' });
    }

    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const name = $('h1 span[itemprop="name"]').first().text().trim();

    const img = $('img.ac').first().attr('data-src') || $('img.ac').first().attr('src');

    const description =
      $('.left-column > .people-character-description').text().trim() ||
      $('.js-scrollfix-bottom-rel .mb8').text().trim();

    const animeography = [];
    $('h2:contains("Animeography")')
      .next('table')
      .find('tr')
      .each((_, tr) => {
        const title = $(tr).find('td:nth-child(2) a').text();
        const link = $(tr).find('td:nth-child(2) a').attr('href');
        if (title && link) {
          animeography.push({ title, link });
        }
      });

    const voiceActors = [];
    $('h2:contains("Voice Actors")')
      .next('table')
      .find('tr')
      .each((_, tr) => {
        const actorName = $(tr).find('td:nth-child(2) a').text().trim();
        const lang = $(tr).find('td:last-child small').text().trim();
        const link = $(tr).find('td:nth-child(2) a').attr('href');
        const photo = $(tr).find('td:first-child img').attr('data-src') || $(tr).find('td:first-child img').attr('src');
        if (actorName && lang) {
          voiceActors.push({ actorName, lang, link, photo });
        }
      });

    res.status(200).json({
      name,
      img,
      description,
      animeography,
      voiceActors,
      source: url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to scrape character detail.' });
  }
}
