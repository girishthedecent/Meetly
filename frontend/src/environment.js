let IS_PROD = true;


const server = IS_PROD ?
    "https://meetly-backend-ogx5.onrender.com" :
    "http://localhost:3000"
    


export default server;