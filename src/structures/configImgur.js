/* ---------------------- IMPORTAÇÃO DE MÓDULOS ----------------------*/
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');


var clientID, caminho;


/**
 * Função para ler dados.json e parametrizar valores a serem enviados nas requisições
 * @returns gravação dos valores usados na requisição
 */
async function leituraDosDados() {
    return new Promise((resolve, reject) => {
      fs.readFile('./src/build/dados.json', 'utf-8', (err, data) => {
        if (err) {
          console.error(err);
          reject(err);
        }
  
        let dados = JSON.parse(data);
  
        try {
          caminho = dados.dadosApp.host.caminho_imagens;
          clientID = '08385443e92b609';
          
          resolve();
        } catch {
          console.log('Erro na leitura');
          gravarLogErro('Erro na leitura dos dados, CONFIGIMGUR.JS')
          reject(new Error('Erro na leitura dos dados'));
        }
      });
    });
  }


  async function return8caracteresBase64(imagem){
    return new Promise(async (resolve, reject) => {
      try {
        await leituraDosDados()
  
        // Verificar se o arquivo existe antes de prosseguir
        if (!fs.existsSync(`${caminho}/${imagem}`)) {
          
          gravarLog(`A imagem ${caminho}/${imagem} não foi encontrada.`);
          resolve();
          return;
        }

        const buffer = fs.readFileSync(`${caminho}/${imagem}`);
        const base64String = buffer.toString('base64');
        const primeiros8Caracteres = base64String.substring(0, 8);

        resolve(primeiros8Caracteres);        
  
      } catch (error) {
        gravarLogErro(`Erro na codificação da imagem ${caminho}/${imagem} em BASE64`);
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
        await leituraDosDados();
        const imagens = JSON.parse(fs.readFileSync('./src/build/tray/links_img.json', 'utf8'));

        // Verificar se o arquivo existe antes de prosseguir
        if (!fs.existsSync(`${caminho}/${imagem}`)) {

          gravarLog(`A imagem ${caminho}/${imagem} não foi encontrada.`);
          resolve();
          return;
        }

        let data = new FormData()
        data.append('image', fs.createReadStream(`${caminho}/${imagem}`));
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
          gravarLog(`UPLOAD DA IMAGEM ${caminho}/${imagem} NO IMGUR REALIZADO COM SUCESSO`);
          let primeirosCaracterBase64 = await return8caracteresBase64(imagem);
          imagens[idProduto] = {
            "link": response.data.data.link,
            "img64": primeirosCaracterBase64,
            "deletehash": response.data.data.deletehash
          }
          fs.writeFileSync('./src/build/tray/links_img.json', JSON.stringify(imagens));
        })
        .then(() => {
          resolve()
        })
        .catch(function (error) {
          let erroRetorno = JSON.stringify(error);
          gravarLogErro(`Erro na requisicao de upload da imagem no Imgur. Com erro: ${erroRetorno}`);
          console.log(`Erro na requisicao de upload da imagem no Imgur. Com erro: ${erroRetorno}`);
          resolve()
        });

    } catch (error) {
        gravarLogErro(`ERRO IMGUR CODE 0001: ` + JSON.stringify(error))
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
      await leituraDosDados();

      const imagens = JSON.parse(fs.readFileSync('./src/build/tray/links_img.json', 'utf8'));
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
        fs.writeFileSync('./src/build/tray/links_img.json', JSON.stringify(imagens));
      })
      .then(() => {
        resolve();
      })
      .catch(function (error) {
        gravarLogErro("ERRO IMGUR CODE 0002: " + JSON.stringify(error))
        console.log(error);
      });
    } catch (error) {
      gravarLogErro('Erro ao deletar imagem do IMGUR. Erro: ' + error + ' do produto de ID: ' + idProduto);
      console.log('Erro ao deletar imagem do IMGUR. Erro: ' + error + ' do produto de ID: ' + idProduto);
      resolve()
    }
  })
}


async function gestaoImagemImgur(idProduto, imagem){
  return new Promise(async (resolve, reject) => {
    try {
      await leituraDosDados();

      const bancoImagens = JSON.parse(fs.readFileSync('./src/build/tray/links_img.json', 'utf8'));
      let primeirosCaracterBase64 = await return8caracteresBase64(imagem);

      if (!fs.existsSync(`${caminho}/${imagem}`)) {
        gravarLog(`A IMAGEM ${caminho}/${imagem} NAO FOI ENCONTRADA.`);
        resolve();
        return;
      }

      if((imagem!=null)&&(imagem!=" ")&&(imagem!=undefined)){
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
      gravarLogErro(`ERRO NA TRATATIVA DE ERRO DO IMGUR: ${error}`);
      console.log(`ERRO NA TRATATIVA DE ERRO DO IMGUR`);
    }
  })
}


function gravarLog(mensagem) {
  if (!fs.existsSync('../logs')) {
    fs.mkdirSync('../logs');
  }
  const data = new Date();
  data.setHours(data.getHours() - 3);
  const dataFormatada = `${data.getFullYear()}-${data.getMonth() + 1}-${data.getDate()}`;
  const logMessage = `[${data.toISOString()}]: ${mensagem}\n`;
  const logFileName = `../../../logs/log_${dataFormatada}.txt`;
  const logFilePath = path.join(__dirname, logFileName);
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Erro ao gravar o log:', err);
    } else {
      console.log('Log gravado com sucesso!');
    }
  });
}


function gravarLogErro(mensagem) {
  if (!fs.existsSync('../logs')) {
    fs.mkdirSync('../logs');
  }
  
  if (!fs.existsSync('../logs/logsErr')) {
    fs.mkdirSync('../logs/logsErr');
  }

  const data = new Date();
  data.setHours(data.getHours() - 3);
  const dataFormatada = `${data.getFullYear()}-${data.getMonth() + 1}-${data.getDate()}`;
  const logMessage = `[${data.toISOString()}]: ${mensagem}\n`;
  const logFileName = `../../../logs/logsErr/log_${dataFormatada}Err.txt`;
  const logFilePath = path.join(__dirname, logFileName);

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Erro ao gravar o log:', err);
    } else {
      console.log('Log gravado com sucesso!');
    }
  });
}

module.exports = {
  gestaoImagemImgur
};