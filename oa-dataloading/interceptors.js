function setupInterceptors(axios) {
  axios.interceptors.request.use((config) => {
    if (config.delayed) {
      return new Promise(resolve => setTimeout(() => resolve(config), 600));
    }
    return {
      ...config,
      p0: performance.now(),
    };
  }, (error) => Promise.reject(error));

  axios.interceptors.response.use(async (response) => {
    const minimumDelay = 1000;
    const latency = performance.now() - response.config.p0;
    const shouldNotDelay = minimumDelay < latency;

    if (shouldNotDelay) {
      return response;
    }

    const remainder = minimumDelay - latency;
    const [responseWithDelay] = await Promise.all([
      response,
      new Promise((resolve) => setTimeout(resolve, remainder)),
    ]);

    return responseWithDelay;
  }, (error) => Promise.reject(error));

}

module.exports ={
                  setupInterceptors
                }
