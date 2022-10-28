function readDataFile(file,requests) {
  return new Promise((resolve,reject) => {
    const requests = []
    fs.createReadStream(file)
      .pipe(csv())
      .on('data', (data) => requests.push(data))
      .on('end', () => {
        resolve(requests)
        // we have an array of 'results'
        // {
        //   File: 'UL_2019_apc_enriched.csv',
        //   institution: 'Leipzig U',
        //   period: '2019',
        //   euro: '1685.04',
        //   doi: '10.1186/s13019-019-0831-0',
        //   is_hybrid: 'FALSE',
        //   publisher: 'Springer Nature',
        //   journal_full_title: 'Journal of Cardiothoracic Surgery',
        //   issn: '1749-8090',
        //   issn_print: 'NA',
        //   issn_electronic: '1749-8090',
        //   issn_l: '1749-8090',
        //   license_ref: 'http://creativecommons.org/licenses/by/4.0/',
        //   indexed_in_crossref: 'TRUE',
        //   pmid: '30651112',
        //   pmcid: 'PMC6335711',
        //   ut: 'ut:000455922000001',
        //   url: 'NA',
        //   doaj: 'TRUE'
        // }
      });
  })
}

module.exports ={
                  readDataFile
                  
                }
