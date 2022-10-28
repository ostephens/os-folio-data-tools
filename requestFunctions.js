function addRequests(requests) {
  requests.forEach((r) => {
      i = r["issn"].toUpperCase()
      p = r["issn_print"].toUpperCase()
      e = r["issn_electronic"].toUpperCase()
      k = i.replace("-","")

      if(citationFunctions.validateISSN(i)) {
        const citation = citationFunctions.createCitation(r)
        //would be better to first search for issn and only create if we need to
        folio({
          method: 'post',
          url: '/oa/works/citation',
          data: citation
        })
        .then(response => {
          workId = response.data.id
          console.log(workId)
          request = {
            requestDate: "2020-12-31",
            requestStatus: {value: "open"},
            publisher: {value: r.publisher},
            license: {value: r.license_ref},
            doi: r.doi,
            publicationTitle: r.publicationTitle,
            authorNames: r.authorNames,
            publicationUrl: r.url,
            work: {id: workId},
            publicationType: "journal_article"
            //pmid?
            //need to add hybrid and doaj at this level
            //if(request["is_hybrid"]==="FALSE") {
            //   oas = "gold"
            // } else {
            //   oas = "hybrid"
            // }
            // if(request["doaj"]==="TRUE") {
            //   doaj = "yes"
            // } else {
            //   doaj = "no"
            // }
          }
          folio({
            method: 'post',
            url: '/oa/publicationRequest',
            data: request
          })
          .then(response => {
            if(response.data.id != undefined) {
              charge = {
                tax: "0",
                discountType: {value: "subtracted"},
                exchangeRate: {coefficient: 1,toCurrency: "EUR"},
                amount: {baseCurrency: "EUR", value: r.euro},
                category: {value: "apc"},
                chargeStatus: {value: "paid"},
                discount: 0,
                paymentPeriod: r.period,
                estimatedInvoicePrice: {baseCurrency: "EUR", value: r.euro},
                estimatedPrice: {baseCurrency: "EUR", value: r.euro},
                owner: {id: response.data.id}
              }
              folio({
                method: 'post',
                url: '/oa/charges',
                data: charge
              })
              .then(chargeResponse => {
                return
              })
            return
            }
          })
          .catch(error => {
            console.log(error);
          })
        })
        .catch(error => {
          console.log(error);
        })
      }
    })
}

module.exports ={
                  addRequests
                }
