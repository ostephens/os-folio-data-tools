function getUniqueValues(data,key) {
  d = data
  k= key
  return Array.from(new Set(d.map(({ [k]: value }) => value)))
}

function getToken(folio,u,p) {
  return folio({
      method: 'post',
      url: '/bl-users/login',
      data : {
        "username": u,
        "password": p
      }
    })
}

module.exports ={
                  getUniqueValues,
                  getToken
                }
