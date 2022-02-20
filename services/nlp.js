const request = require('request')

module.exports = class Nlp {

    classify(text){

        const options = {
            baseUrl: 'http://127.0.0.1:5000/classify?text='+text,
            uri: '/apiSend',
        }

       return new Promise((resolve, reject) => {

            request(options, (error, response, body) => {

                if (error) {
                    reject(error)
                } else {
                    resolve(JSON.parse(body))
                }
            });
        });

    }

    async classifyAsync (text){

        try{
            let cls = await this.classify(text)
            return cls
        }catch (e) {
            console.log(e)
            return e
        }

    }

}

