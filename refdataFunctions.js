function refDataValues(list) {
  values = []
  list.map(l => values.push({label:l}))
  return values
}

function setupRefData(categoryUUID,values) {
  return (folio({
      method: 'put',
      url: '/oa/refdata/'+categoryUUID,
      data : {
        "values": values
      }
    }))
}

function getRefDataCategories() {
  return folio({
      method: 'get',
      url: '/oa/refdata?max=100'
    })
}

module.exports ={
                  refDataValues,
                  setupRefData,
                  getRefDataCategories
                }
