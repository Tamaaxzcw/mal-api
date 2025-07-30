import cheerio from 'cheerio';

export default async function handler(req, res) {
  const { name, id } = req.query;

  // Search character by name
  if (name) {
    try {
      const q = encodeURIComponent(name);
      const html = await fetch(`https://myanimelist.net/character.php?q=${q}`).then(r => r.text());
      const $ = cheerio.load(html);
      const results = [];

      $('table tr').each((_, el) => {
        const charLink = $(el).find('a').attr('href') || '';
        const title = $(el).find('a strong').text();
        const img = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
        const about = $(el).find('.pt4').text().trim();
        const idMatch = charLink?.match(/character\/(\d+)/);

        if (title && idMatch) {
          results.push({
            id: idMatch[1],
            title,
            link: charLink,
            img,
            about
          });
        }
      });

      return res.status(200).json({ results });
    } catch {
      return res.status(500).json({ error: 'Failed to scrape character list' });
    }
  }

  // Get character by ID
  if (id) {
    try {
      const html = await fetch(`https://myanimelist.net/character/${id}`).then(r => r.text());
      const $ = cheerio.load(html);

      const name = $('h1 span[itemprop="name"]').first().text().trim();
      const img = $('.js-picture-gallery img').first().attr('data-src') || $('.js-picture-gallery img').first().attr('src');
      const description = $('.people-character-description').text().trim();

      const animeography = [];
      $('h2:contains("Animeography")').next('table').find('tr').each((_, tr) => {
        const a = $(tr).find('td:nth-child(2) a');
        animeography.push({
          title: a.text(),
          link: a.attr('href')
        });
      });

      return res.status(200).json({ id, name, img, description, animeography });
    } catch {
      return res.status(500).json({ error: 'Failed to scrape character detail' });
    }
  }

  return res.status(400).json({ error: 'Query ?name= or ?id= required' });
}
