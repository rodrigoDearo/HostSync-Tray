const { app } = require('electron')
const path = require('node:path')

//const userDataPath = path.join(app.getPath('userData'), 'ConfigFiles');
const userDataPath = 'src/build';
require('dotenv').config({ path: path.join(userDataPath, '.env') });

function returnInfo(infoRequired){
    return new Promise((resolve, reject) => {
        switch (infoRequired) {
            case 'user_database':
                resolve(process.env.USR_DATABASE) 
                break;
        
            case 'password_database':
                resolve(process.env.PSW_DATABASE) 
                break;

            case 'consumer_key':
                resolve(process.env.CSM_KEY) 
                break;
            
            case 'consumer_secret':
                resolve(process.env.CSM_SECRET) 
                break;

            case 'access_token':
                resolve(process.env.ACS_TOKEN) 
                break;

            case 'refresh_token':
                resolve(process.env.RFS_TOKEN) 
                break;
        }
    })
}

module.exports = {
    returnInfo
}