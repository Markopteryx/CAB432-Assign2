if (window.env.API_URL === '_API_URL_') {
    API_URL = process.env.REACT_APP_API_URL
  }
  else {
    API_URL = window.env.API_URL
  }

export const getDownloadFile = async () => {
    return axios.get(`http://${API_URL}:8000/preURL/${id}`, {
        responseType: 'blob',
    })
    .then(response => response.blob())
  }