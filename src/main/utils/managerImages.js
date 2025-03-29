/* ---------------------- IMPORTAÇÃO DE MÓDULOS ----------------------*/
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

const { returnValueFromJson } = require('./manageInfoUser.js')
const { gravarLog } = require('./auxFunctions.js')
const { returnInfo } = require('../envManager.js')

//const userDataPath = path.join(app.getPath('userData'), 'ConfigFiles');
const userDataPath = 'src/build';
const pathLinksIMG = path.join(userDataPath, 'links_img.json');

  async function return8caracteresBase64(imagem){
    return new Promise(async (resolve, reject) => {
      try {
        let caminho = await returnValueFromJson('pathdbhost')

        // Verificar se o arquivo existe antes de prosseguir
        if (!fs.existsSync(`${caminho}/imgProdutos/${imagem}`)) {
          gravarLog(`A imagem ${caminho}/imgProdutos/${imagem} não foi encontrada.`);
          resolve();
          return;
        }

        const buffer = fs.readFileSync(`${caminho}/imgProdutos/${imagem}`);
        const base64String = buffer.toString('base64');
        const primeiros8Caracteres = base64String.substring(0, 8);

        resolve(primeiros8Caracteres);        
  
      } catch (error) {
        gravarLog(`Erro na codificação da imagem ${caminho}/imgProdutos/${imagem} em BASE64`);
        reject(error);
      }
    })
  }


/**
 * 
 * @param {string} imagem: nome do arquivo do tipo imagem dentro do caminho especificado no arquivo dados.json da pasta de imagens dos produtos
 * @returns url da imagem alocada na web 
 */
async function uploadImageImgur(idProduto, imagem){
   return new Promise(async (resolve, reject) => {
    try {
        const imagens = JSON.parse(fs.readFileSync(pathLinksIMG, 'utf8'));
        let clientID = await returnInfo('cliente_id')

        // Verificar se o arquivo existe antes de prosseguir
        if(!fs.existsSync(`${caminho}/imgProdutos/${imagem}`)) {
          gravarLog(`A imagem ${caminho}/imgProdutos/${imagem} não foi encontrada.`);
          resolve();
          return;
        }

        let data = new FormData()
        data.append('image', fs.createReadStream(`${caminho}/imgProdutos/${imagem}`));
        data.append('type', 'image');

        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: 'https://api.imgur.com/3/image',
          headers: { 
            'Authorization': `Client-ID ${clientID}`, 
            ...data.getHeaders()
          },
          data: data
        };

        axios(config)
        .then(async function (response) {
          gravarLog(`UPLOAD DA IMAGEM ${caminho}/imgProdutos/${imagem} NO IMGUR REALIZADO COM SUCESSO`);
          let primeirosCaracterBase64 = await return8caracteresBase64(imagem);
          imagens[idProduto] = {
            "link": response.data.data.link,
            "img64": primeirosCaracterBase64,
            "deletehash": response.data.data.deletehash
          }
          fs.writeFileSync(pathLinksIMG, JSON.stringify(imagens));
        })
        .then(() => {
          resolve()
        })
        .catch(function (error) {
          let erroRetorno = JSON.stringify(error);
          gravarLog(`Erro na requisicao de upload da imagem no Imgur. Com erro: ${erroRetorno}`);
          console.log(`Erro na requisicao de upload da imagem no Imgur. Com erro: ${erroRetorno}`);
          resolve()
        });

    } catch (error) {
        gravarLog(`ERRO IMGUR CODE 0001: ` + JSON.stringify(error))
        console.error(error)
        resolve()
    }
   }) 
}


/**
 * Função para deletar imagem do IMGUR
 * @param {*} idProduto ID DO PRODUTO QUE POSSUI A IMAGEM A SER DELETADA
 */
async function deleteImageImgur(idProduto){
  return new Promise(async (resolve, reject) => {
    try {
      const imagens = JSON.parse(fs.readFileSync(pathLinksIMG, 'utf8'));
      let clientID = await returnInfo('cliente_id')
      let imageDeleteHash = imagens[idProduto].deletehash;

      let data = new FormData();
      var config = {
        method: 'delete',
      maxBodyLength: Infinity,
        url: `https://api.imgur.com/3/image/${imageDeleteHash}`,
        headers: { 
          'Authorization': `Client-ID ${clientID}`, 
          ...data.getHeaders()
        },
        data : data
      };
      
      axios(config)
      .then(() => {
        gravarLog(`DELETADO DO IMGUR A IMAGEM DO PRODUTO DE ID ${idProduto}`);
        delete imagens[idProduto];
        fs.writeFileSync(pathLinksIMG, JSON.stringify(imagens));
      })
      .then(() => {
        resolve();
      })
      .catch(function (error) {
        gravarLog("ERRO IMGUR CODE 0002: " + JSON.stringify(error))
        console.log(error);
      });
    } catch (error) {
      gravarLog('Erro ao deletar imagem do IMGUR. Erro: ' + error + ' do produto de ID: ' + idProduto);
      console.log('Erro ao deletar imagem do IMGUR. Erro: ' + error + ' do produto de ID: ' + idProduto);
      resolve()
    }
  })
}


async function managementImageImgur(idProduto, imagem){
  return new Promise(async (resolve, reject) => {
    try {
      const bancoImagens = JSON.parse(fs.readFileSync(pathLinksIMG, 'utf8'));
      let primeirosCaracterBase64 = await return8caracteresBase64(imagem);

      if (!fs.existsSync(`${caminho}/imgProdutos/${imagem}`)) {
        gravarLog(`A IMAGEM ${caminho}/imgProdutos/${imagem} NAO FOI ENCONTRADA.`);
        resolve();
        return;
      }

      if(imagem){
        if(bancoImagens[idProduto]){
          if(primeirosCaracterBase64==bancoImagens[idProduto].img64){
            resolve()
          }
          else{
            await deleteImageImgur(idProduto)
            .then(async () => {
              await uploadImageImgur(idProduto, imagem)
            })
            .then(() => {
              setTimeout(() => {
                resolve()
              }, 20000);
            })

          }
        }
        else{
          await uploadImageImgur(idProduto, imagem)
          .then(() => {
            setTimeout(() => {
              resolve()
            }, 15000);
          })
        }
      }
      else{
        if(bancoImagens[idProduto]){
          await deleteImageImgur(idProduto)
          .then(() => {
            setTimeout(() => {
              resolve()
            }, 10000);
          })
        }
        else{
          resolve()
        }
      }
        

    } catch (error) {
      gravarLog(`ERRO NA TRATATIVA DE ERRO DO IMGUR: ${error}`);
      console.log(`ERRO NA TRATATIVA DE ERRO DO IMGUR`);
    }
  })
}


module.exports = {
  managementImageImgur
};
