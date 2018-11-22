import { Article } from '../../data/Article'
import { DataScraper } from './DataScraper'
import Color from 'colors'

import cheerio from 'cheerio'
import delay from 'delay'

export class ScholarDataScraper extends DataScraper {
  constructor(public throttle: number = 2, public cookie?: string) {
    super()
  }

  public async getData(article: Article): Promise<Article> {
    await delay(Math.random() * (this.throttle * 1000))

    article.cites = undefined
    article.abstract = undefined

    const $ = await this.getCheerio(article)
    const articles = $('.gs_r')

    articles.each((_, element) => {
      const title = $(element).find('h3 a').text()
      if (article.title.toLowerCase() === title.toLowerCase()) {
        article.abstract = $(element).find('.gs_rs').text()

        const citeText = $(element).find('.gs_or_cit').next().text()
        if (citeText.startsWith('Cited by')) {
          const matches = citeText.match(/\d+/)
          if (matches !== null) article.cites = parseInt(matches[0])
        } else article.cites = 0
      }
    })

    return article
  }

  private async getHtml(q : string) {
    const html = await ScholarDataScraper.get(
      'https://scholar.google.com/scholar',
      { q }, { Cookie: this.cookie }
    )
    if (html.data.includes('Please show you&#39;re not a robot'))
      throw (new Error('Captcha detected'))
    return html.data
  }

  private async getCheerio(article : Article) {
    if (article.doi) {
      const html = await this.getHtml(article.doi)
      const $ = cheerio.load(html)
      const articles = $('.gs_r')
      if (articles.length !== 0) return $
    }
    const html = await this.getHtml(article.title)
    const $ = cheerio.load(html)
    return $
  }
}