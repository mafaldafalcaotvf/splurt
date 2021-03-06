import { Article } from '../data/Article'
import { DBLPArticleScraper } from '../scraper/article/DBLPArticleScraper'
import { ScopusArticleScraper } from '../scraper/article/ScopusArticleScraper'
import { SplurtCommand } from './SplurtCommand'

import Color from 'colors'

export class SplurtFetch implements SplurtCommand<Article[]> {
  constructor(
    public query = '',
    public maximum = 10,
    public databases: string[] = [],
    public scopusKey? : string,
    public title? : boolean) { }

  public async execute() {
    this.verifyOptions()

    const promises = this.databases.map(database => {
      switch (database) {
        case 'dblp':
          const dblp = new DBLPArticleScraper()
          return dblp.query(this.query, this.maximum)
        case 'scopus':
          const scopus = new ScopusArticleScraper(this.scopusKey, this.title)
          return scopus.query(this.query, this.maximum)
        default:
          console.warn(Color.yellow(`WARNING: Unknown research database: ${database}`))
          return Promise.resolve([])
      }
    })

    return (await Promise.all(promises)).reduce((acc, val) => acc.concat(val), [])
  }

  public verifyOptions() {
    if (!this.databases || this.databases.length === 0)
      throw new Error('No research database chosen!')

    if (!this.query)
      throw new Error('No query given!')
  }
}
