function getUniqueValues(data,key) {
  d = data
  k= key
  return Array.from(new Set(d.map(({ [k]: value }) => value)))
}

function setToken() {
  return (folio({
      method: 'post',
      url: '/bl-users/login',
      data : {
        "username": c.username,
        "password": c.password
      }
    })
    .then(response => {
      token = response.headers['x-okapi-token']
      return
    })
    .catch(error => {
      console.log(error);
    })
  )
}

module.exports ={
                  getUniqueValues,
                  setToken
                }
