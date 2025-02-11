/* ---------------------- IMPORTAÇÃO DE MÓDULOS ----------------------*/
const axios = require('axios');
const { Console } = require('console');
const { response } = require('express');
const fs = require('fs');
const { resolve } = require('path');

var consumerSecret, consumerKey, code, url, tokenRefresh, acessToken;


/**
 * Função para gravar no arquivo dados.JSOn as informações retornadas na requisição
 * @param {*} dados 
 */
function gravarDados(dados) {
    fs.readFile('./src/build/dados.json', 'utf-8', (err, data) => {
      if (err) {
        console.error(err);
      }
  
      let arquivoJSON = JSON.parse(data);
  
      arquivoJSON.dadosApp.tray.access_token = dados.access_token;
      arquivoJSON.dadosApp.tray.refresh_token = dados.refresh_token;
      arquivoJSON.dadosApp.tray.date_expiration_access_token = dados.date_expiration_access_token;
      arquivoJSON.dadosApp.tray.date_expiration_refresh_token = dados.date_expiration_refresh_token;
      
      fs.writeFile('./src/build/dados.json', JSON.stringify(arquivoJSON), (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log('Dados Gravados com Sucesso');
        }
      });
    });
  }  
  


/**
 * Função para ler dados.json e parametrizar valores a serem enviados nas requisições
 * @returns gravação dos valores usados na requisição
 */
function leituraDosDados() {
    return new Promise((resolve, reject) => {
      fs.readFile('./src/build/dados.json', 'utf-8', (err, data) => {
        if (err) {
          console.error(err);
          reject(err);
        }
  
        let dados = JSON.parse(data);
  
        try {
          consumerKey = "028498124042aefd587c4f9e1264e6eedce3954fbd6a6902bc5f14179021156c";
          consumerSecret = "56df8ec8ecd4f74552d6d7da9b619dd98d3a7ba314d4b7aab759978694681d6d";
          code = dados.dadosApp.tray.code;
          url = dados.dadosApp.tray.url;
          tokenRefresh = dados.dadosApp.tray.refresh_token;
          acessToken = dados.dadosApp.tray.access_token;
          
          resolve();
        } catch {
          console.log('Erro na leitura');
          reject(new Error('Erro na leitura dos dados'));
        }
      });
    });
  }


  
/**
 * Função para gerar o token de acesso, função executado quando será gerado o acess_token do cliente pela primeira vez ou quando refresh_token vence
 */
async function createToken() {
    try {
        await leituraDosDados();
  
        let keysValue = new URLSearchParams();
        keysValue.append('consumer_key', consumerKey);
        keysValue.append('consumer_secret', consumerSecret);
        keysValue.append('code', code);
  
        const config = {
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        
        axios.post(`${url}/auth`, keysValue, config)
        .then((response) => {
            console.log('Re-gerado Token de Acesso')
            gravarDados(response.data);
        })
        .catch((error) => {
            console.log(error);
        });

    } catch (error) {
      console.log(error);
    }
}


/**
 * Função para renovar token de acesso, será executada qando expirar data valida para o acess_token
 */
async function refreshToken(){
    try {
        await leituraDosDados();
        axios.get(`${url}/auth`, { params:{
            refresh_token: tokenRefresh
        } })
        .then((response) => {
            console.log('Atualizado Token de Acesso')
            gravarDados(response.data);
        })
        .catch((error) => {
            console.error(error);
        });
    }
    catch(error){
        console.err(error);
    }
}


async function definirProduto(nome, estoque, preco, custo, descricao, marca, grupo, barras) {
  return new Promise((resolve, reject) => {
    try {
      let produto = {
        "Product": {
          "name": `${nome}`,
          "price": `${preco}`,
          "stock": `${estoque}`,
          "cost_price": `${custo}`,
          "category_id": `${grupo}`
        }
      };

      if(marca!=null){
        produto.Product.brand = marca;
      }
 
      if(descricao!=null){
        produto.Product.description = descricao;
      }

      if(barras!=null){
        produto.Product.ean = barras;
      }

      resolve(produto);
    } catch (error) {
      reject(error);
    }
  });
}


async function definirVariante(idProduto, grade, estoque) {
  return new Promise((resolve, reject) => {
    try {
      let variante = {
        "Variant": {
            "stock": `${estoque}`,
            "type_1": "Variacoes",
            "value_1": `${grade}`
        }
    };

    if(idProduto!=null){
      variante.Variant.product_id = idProduto;
    }
 
      resolve(variante);
    } catch (error) {
      reject(error);
    }
  });
}


async function cadastrarProduto(thisnome, thisestoque, thisprecoVenda, thisprecoCompra, thisdescricao, thismarca, thisgrupo, thisbarras) {
  return new Promise(async (resolve, reject) => {
    try {
      await leituraDosDados();
      const produto = await definirProduto(thisnome, thisestoque, thisprecoVenda, thisprecoCompra, thisdescricao, thismarca, thisgrupo, thisbarras);
      const response = await axios.post(`${url}/products?access_token=${acessToken}`, produto);
      const id = response.data.id
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}


async function cadastrarVariante(thisidproduto, thisdescricao, thisestoque) {
  return new Promise(async (resolve, reject) => {
    try {
      await leituraDosDados();
      const variante = await definirVariante(thisidproduto, thisdescricao, thisestoque);

      await axios.post(`${url}/products/variants/?access_token=${acessToken}`, variante)
      .then(response => {
        const id = response.data.id
        resolve(id);
      })
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * *ESTA FUNÇÃO TEM COMO PROPÓSITO RETORNAR A CHAVE QUE TEM COMO VALOR O PARÂMETRO RECEBIDO, USADA PARA ENCONTRAR ID_SAURUS ATRAVÉS DO ID_TRAY
 * @param {string} arquivoJSON
 * @param {string} value 
 * @returns {} 
 */
async function retornarChaveJSONatravesDeValue(arquivoJSON, valorDaChave){
  return new Promise(async (resolve, reject) => {
    try {
      for (const idDaChave in arquivoJSON) {
        if (arquivoJSON.hasOwnProperty(idDaChave)) {
          if (arquivoJSON[idDaChave].trim() === valorDaChave.trim()) {
            resolve(idDaChave);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  })
}


async function atualizarProduto(thisnome, thisestoque, thisprecoVenda, thisprecoCompra, thisdescricao, thismarca, thisgrupo, thisbarras, thisid) {
  try {
    let id;
    await leituraDosDados()
      .then(() => {
        id = thisid;
      })
      .then(() => definirProduto(thisnome, thisestoque, thisprecoVenda, thisprecoCompra, thisdescricao, thismarca, thisgrupo, thisbarras))
      .then(produtoAtualizado => {
        axios.put(`${url}/products/${id}?access_token=${acessToken}`, produtoAtualizado)
        .catch(async (error)=> {

          if(error.response.data.causes[0]=='Invalid parameter id.'){  //* VERIFICA SE O ERRO ESTÁ RELACIONADO COM UM ID NÃO ENCONTRADO NA BASE
            const produtosSincronizadosJSON = JSON.parse(fs.readFileSync('./src/build/tray/produtos.json', 'utf8'));
            await retornarChaveJSONatravesDeValue(produtosSincronizadosJSON.produtos, id)
            .then(idHost => {
              delete produtosSincronizadosJSON.produtos[idHost]
              console.log(`O PRODUTO DE ID_HOST: ${idHost} NÃO FOI ENCONTRADO NA BASE TRAY PELO ID REFERENCIADO (${id}), PORTANTO FOI DELETADO DA BASE DOS PRODUTOS SINCRONIZADOS PARA RE-CADASTRO`)
              fs.writeFileSync('./src/build/tray/produtos.json', JSON.stringify(produtosSincronizadosJSON));
            })
          }
          else{
            console.log(error);
          }
        });

      });
  } catch (error) {
    console.error(error);
  }
}


async function atualizarVariante(thisidproduto, thisidvariante, thisdescricao, thisestoque) {
  return new Promise(async (resolve, reject) => {
    try {
      await leituraDosDados();
      const variante = await definirVariante(null, thisdescricao, thisestoque);
      await axios.put(`${url}/products/variants/${thisidvariante}?access_token=${acessToken}`, variante)
      .then((response) => {
        const id = response.data.id
        resolve(id);
      })
      .catch(async (error)=> {
        if(error.response.data.causes[0]=='Invalid parameter id.'){  //* VERIFICA SE O ERRO ESTÁ RELACIONADO COM UM ID NÃO ENCONTRADO NA BASE
          let produtos = JSON.parse(fs.readFileSync('./src/build/tray/produtos.json', 'utf-8'));

          delete produtos[thisidproduto].variantes[descricao];

          fs.writeFileSync('./src/build/tray/produtos.json', JSON.stringify(produtos));

          resolve()
        }
        else{
          console.error(error)
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function deletarVariante(thisidvariante){
  return new Promise(async (resolve, reject) => {
    try{
      await leituraDosDados();
      await axios.delete(`${url}/products/variants/${thisidvariante}?$access_token=${acessToken}`)
      .then(() => {
        resolve()
      })
      .catch(async (error)=> {
          resolve()
      })

    } catch {
      reject(error)
    }
  })
}


async function criarCategoria(name){
  return new Promise(async (resolve, reject) => {
    try {
      await leituraDosDados()
      .then(() => {
        const requestData = {
          Category: {
            name: name,
            description: '',
            slug: '',
            order: '',
            title: name,
            small_description: '',
            has_acceptance_term: '',
            acceptance_term: '',
            metatag: {
              keywords: '',
              description: '',
            },
            property: '',
          },
        };
    
        axios.post(`${url}/categories?access_token=${acessToken}`, requestData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${acessToken}`,
          },
        })
          .then((response) => {
            resolve(response.data.id);
          })
          .catch((error) => {
            console.error(error);
          });
      })

    } catch (error) {
      reject(error)
    }
  })
}


async function criarSubCategoria(name, idFather){
  return new Promise(async (resolve, reject) => {
    try {
      await leituraDosDados()
      .then(() => {
        const requestData = {
          Category: {
            name: name,
            description: '',
            slug: '',
            order: '',
            title: name,
            small_description: '',
            has_acceptance_term: '',
            acceptance_term: '',
            metatag: {
              keywords: '',
              description: '',
            },
            property: '',
            parent_id: idFather
          },
        };
    
        axios.post(`${url}/categories?access_token=${acessToken}`, requestData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${acessToken}`,
          },
        })
          .then((response) => {
            resolve(response.data.id);
          })
          .catch((error) => {
            console.error(error.response.data);
          });
      })

    } catch (error) {
      reject(error)
    }
  })
}


async function deletarProduto(thisid) {
  try {
    let id = thisid;
    await leituraDosDados()
      .then(() => {
        axios.delete(`${url}/products/${id}?access_token=${acessToken}`)
          .then(response => {
            resolve()
          })
          .catch(error => {
            console.error('Erro ao fazer requisição:', error);
          });
      });
  } catch (error) {
    console.error(error);
  }
}


async function cadastrarImagem(id, linkIMG){
  await leituraDosDados();
  return new Promise(async (resolve, reject) => {
    try {
      await axios.post(`${url}/products/${id}/images?access_token=${acessToken}`, {
        "Images": {
          "picture_source_1": linkIMG
        }
      })
      .then(() => {
        resolve()
      })
    } catch (error) {
      reject(error);
    }
  });
}


module.exports = {
    createToken,
    refreshToken,
    cadastrarProduto,
    atualizarProduto,
    deletarProduto,
    cadastrarVariante,
    atualizarVariante,
    deletarVariante,
    criarCategoria,
    criarSubCategoria,
    cadastrarImagem
};

//
