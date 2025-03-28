const fs = require('fs')
const { app } = require('electron')
const path = require('node:path')

const { returnInfo } = require('../envManager');
const { returnValueFromJson } = require('./manageInfoUser');
const { error } = require('node:console');

//const userDataPath = path.join(app.getPath('userData'), 'ConfigFiles');
const userDataPath = 'src/build';
const pathLog = path.join(userDataPath, 'logs');
const pathConfigApp = path.join(userDataPath, 'configApp.json');
const pathProducts = path.join(userDataPath, 'products.json');
const pathCategories = path.join(userDataPath, 'categories.json');
const pathErrorsDB = path.join(userDataPath, 'errorsDB.json');


async function returnConfigToAccessDB(){
    return new Promise(async (resolve, reject) => {
        await returnValueFromJson('pathdbhost')
        .then(async (response) => {
            config = {
                host: 'localhost',
                port: 3050,
                database: `${response}/HOST.FDB`,
                charset: 'UTF8'
            }
        })
        .then(async () => {
            let envInfo = await returnInfo('user_database')
            config.user = `${envInfo}`;
        })
        .then(async () => {
            let envInfo = await returnInfo('password_database')
            config.password = `${envInfo}`;
        })
        .finally(() => {
            resolve(config)
        })
    })
}


function gravarLog(mensagem) {
  if (!fs.existsSync(pathLog)) {
      fs.mkdirSync(pathLog, { recursive: true }); // Adicionado recursive: true
  }

  const data = new Date();
  data.setHours(data.getHours() - 3);
  const dataFormatada = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  const logMessage = `[${data.toISOString()}]: ${mensagem}\n`;
  const logFileName = `log_${dataFormatada}.txt`;
  const logFilePath = path.join(pathLog, logFileName);

  fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
          console.error('Erro ao gravar o log:', err);
      } else {
          console.log('Log gravado com sucesso!');
      }
  });
}



async function succesHandlingRequests(destiny, resource, idHost, idTray, othersInfo){
  return new Promise(async (resolve, reject) => {

    if(destiny=="product"){
      let productsDB = JSON.parse(fs.readFileSync(pathProducts))

      switch (resource) {
        case "post":
          productsDB[`${idHost}`] = {
            "idTray": `${idTray}`,
            "status": "ATIVO",
            "variations": {}
          }
          await verifyToDeleteErrorRecord(destiny, idHost)
          break;

        case "update":
          
          break;

        case "delete":
          productsDB[`${idHost}`].status = "INATIVO";
          break;

        case "undelete":
          productsDB[`${idHost}`].status = "ATIVO";
          break;
      }

      fs.writeFileSync(pathProducts, JSON.stringify(productsDB), 'utf-8')
      gravarLog('Gravado/Atualizado registro no banco de ' + destiny);
      resolve()
    }else
    if(destiny=="category"){
      let categoriesDB = JSON.parse(fs.readFileSync(pathCategories))

      switch (resource) {
        case "post":
          categoriesDB[`${othersInfo[0]}`] = {
            "idTray": `${idTray}`,
            "subCategories": {}
          }
          break;

        case "delete":
          categoriesDB[`${othersInfo[0]}`].status = "INATIVO";
          break;

      }
      
      fs.writeFileSync(pathCategories, JSON.stringify(categoriesDB), 'utf-8')
      gravarLog('Gravado/Atualizado registro no banco de ' + destiny);
      resolve()
    }else
    if(destiny=="subcategory"){
      let categoriesDB = JSON.parse(fs.readFileSync(pathCategories))

      switch (resource) {
        case "post":
          categoriesDB[`${othersInfo[1]}`].subCategories[`${othersInfo[0]}`] = idTray
          break;

        case "delete":
          delete categoriesDB[`${othersInfo[0]}`].subCategories[`${othersInfo[1]}`]
          break;


      }
      
      fs.writeFileSync(pathCategories, JSON.stringify(categoriesDB), 'utf-8')
      gravarLog('Gravado/Atualizado registro no banco de ' + destiny);
      resolve()
    }
  })
}


async function errorHandlingRequest(destiny, resource, idHost, idTray, errors, body){
  return new Promise(async (resolve, reject) => {
      let errorsDB = JSON.parse(fs.readFileSync(pathErrorsDB))

      const data = new Date();
      data.setHours(data.getHours() - 3);
      const dataFormatada = `${data.getFullYear()}-${data.getMonth() + 1}-${data.getDate()}`;

      errorsDB[destiny][idHost] = {
        "typeRequest": resource,
        "idTray": idTray,
        "timeRequest": dataFormatada,
        "returnRequest": errors,
        "bodyRequest": body
      }

      fs.writeFileSync(pathErrorsDB, JSON.stringify(errorsDB), 'utf-8');
      gravarLog('Gravado/Atualizado registro no banco de erros')
      resolve()
  })
}


async function verifyToDeleteErrorRecord(destiny, idHost){
  return new Promise(async (resolve, reject) => {
    let errorsDB = JSON.parse(fs.readFileSync(pathErrorsDB));

    if(errorsDB[destiny][idHost]&&errorsDB[destiny][idHost].typeRequest == 'POST'){
        delete errorsDB[destiny][idHost]
    }

    fs.writeFileSync(pathErrorsDB, JSON.stringify(errorsDB), 'utf-8');
    gravarLog('Retirado registro no banco de erros')
    resolve()
  })
}


async function deleteErrorsRecords(){
  return new Promise(async (resolve, reject) => {
    let errorsDB = JSON.parse(fs.readFileSync(pathErrorsDB));

    errorsDB.product = {}
    errorsDB.category = {}
    errorsDB.subategory = {}

    fs.writeFileSync(pathErrorsDB, JSON.stringify(errorsDB), 'utf-8');
    gravarLog('RESETADO BANCO DE ERROS')
    resolve()
  })
}


async function getActualDatetime(){
  return new Promise(async (resolve, reject) => {
    const now = new Date();

    now.setMinutes(now.getMinutes() - 1);

    let actualTime = now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, '0') + "-" +
    String(now.getDate()).padStart(2, '0') + "T" +
    String(now.getHours()).padStart(2, '0') + ":" +
    String(now.getMinutes()).padStart(2, '0') + ":00";

    resolve(actualTime)
  })
}


/*
async function returnProductIdHostFromIdPed(idProductPed){
  return new Promise(async (resolve, reject) => {
    let productsDB = JSON.parse(fs.readFileSync(pathProducts))

    for (const idProductHost in productsDB) {
      if (productsDB.hasOwnProperty(idProductHost)) {
          const product = productsDB[idProductHost];
          if (product.idTray == idProductPed) {
              resolve(idProductHost) 
          }
      }
    }

    return null;
  })
}*/


function copyJsonFilesToUserData() {
  // Caminho correto onde os arquivos são empacotados
  const resourcesPath = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);

  const filesToCopy = [
      'configApp.json',
      'products.json',
      'customers.json',
      'sales.json',
      'errorsDB.json',
      '.env'
  ];

  filesToCopy.forEach(file => {
      const sourcePath = path.join(resourcesPath, file);
      const destinationPath = path.join(userDataPath, file);

      console.log(`📂 Copiando: ${file}`);

      if (!fs.existsSync(userDataPath)) {
          fs.mkdirSync(userDataPath, { recursive: true });
      }

      if (!fs.existsSync(destinationPath)) {
          if (fs.existsSync(sourcePath)) {
              fs.copyFileSync(sourcePath, destinationPath);
              console.log(`Copiado ${file} para ${userDataPath}`);
          } else {
              console.warn(`Arquivo nao encontrado: ${sourcePath}`);
          }
      } else {
          console.log(`${file} ja existe em ${userDataPath}`);
      }
  });
}


module.exports = {
    copyJsonFilesToUserData,
    returnConfigToAccessDB,
    succesHandlingRequests,
    errorHandlingRequest,
    deleteErrorsRecords,
    getActualDatetime,
   // returnProductIdHostFromIdPed,
    gravarLog
}
