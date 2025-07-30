import cheerio from 'cheerio';

export default async function handler(req, res) {
  const { name, id } = req.query;

  // Search by name
  if (name) {
    try {
      const q = encodeURIComponent(name);
      const html = await fetch(`https://myanimelist.net/anime.php?q=${q}`).then(r => r.text());
      const $ = cheerio.load(html);
      const results = [];

      $('table tr').each((_, el) => {
        const title = $(el).find('strong a').text();
        const link = $(el).find('strong a').attr('href');
        const img = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
        const synopsis = $(el).find('.pt4').text().trim();
        const idMatch = link?.match(/anime\/(\d+)/);

        if (title && link && idMatch) {
          results.push({
            id: idMatch[1],
            title,
            link,
            img,
            synopsis
          });
        }
      });

      return res.status(200).json({ results });
    } catch {
      return res.status(500).json({ error: 'Failed to scrape anime list' });
    }
  }

  // Get by ID
  if (id) {
    try {
      const html = await fetch(`https://myanimelist.net/anime/${id}`).then(r => r.text());
      const $ = cheerio.load(html);

      const title = $('h1 span[itemprop="name"]').first().text().trim();
      const img = $('img.ac').first().attr('data-src') || $('img.ac').first().attr('src');
      const synopsis = $('span[itemprop="description"]').text().trim();

      const info = {};
      $('.spaceit_pad').each((_, el) => {
        const label = $(el).find('span').text().trim().replace(':', '');
        const value = $(el).clone().children().remove().end().text().trim();
        if (label && value) info[label.toLowerCase()] = value;
      });

      return res.status(200).json({ id, title, img, synopsis, info });
    } catch {
      return res.status(500).json({ error: 'Failed to scrape anime detail' });
    }
  }

  return res.status(400).json({ error: 'Query ?name= or ?id= required' });
}
