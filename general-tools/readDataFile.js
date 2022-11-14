const fs = require('fs')
const csv = require('csv-parser');
function readDataFile(file) {
  return new Promise((resolve,reject) => {
    const records = []
    fs.createReadStream(file)
      .pipe(csv({ separator: '\t' }))
      .on('data', (data) => records.push(data))
      .on('end', () => {
        resolve(records)
        // we have an array of 'records'
      });
  })
}

module.exports ={
                  readDataFile
                }
