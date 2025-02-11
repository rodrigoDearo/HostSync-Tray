/* ---------------------- IMPORTAÇÃO DE MÓDULOS ----------------------*/
const { retornaCampo } = require('./manipulacaoJSON');
const { createToken, refreshToken, cadastrarProduto, atualizarProduto, deletarProduto, cadastrarVariante, atualizarVariante, deletarVariante, cadastrarImagem, criarCategoria, criarSubCategoria } = require('./configTray');
const { criarTabela, criarGeneratorID, criarTriggerUpdateProduto, criarTriggerInsertProduto, criarTriggerInsertGrupo, criarTriggerUpdateGrupo, criarTriggerDeleteGrupo, criarTriggerInsertSubGrupo, criarTriggerUpdateSubGrupo, criarTriggerDeleteSubGrupo, criarTriggerInsertVariacao, criarTriggerUpdateVariacao, criarTriggerDeleteVariacao, criarTriggerInsertGrade, criarTriggerUpdateGrade, criarTriggerDeleteGrade, limparTabela } = require('./dependenciasSQL');
const { gestaoImagemImgur } = require('./configImgur');

const conexao = require('node-firebird');
const fs = require('fs');
const path = require('path');
const { response } = require('express');
const { error } = require('console');

var Dominio, config;


/**
 * Define a senha para ser enviada na requisição para consumir WebService Saurus
 * @returns {senha} no padrão consultado com desenvolvdedores do software
 */
function setSenha() {
  let dataAtual = new Date();
  let dia = dataAtual.getDate();
  let mes = dataAtual.getMonth();
  let ano = dataAtual.getFullYear() + 1;

  let senha = `ophd02ophd02|@${dia + mes + ano - 2000}|${Dominio}|1`;
  senha = senha.toString();
  return senha;
}


async function sincronizacao() {
  retornaCampo('caminho_banco')
  .then(response => {
    caminho = response;
  })
  .then(() => {
    config = {
      host: 'localhost',
      port: 3050,
      database: `${caminho}/HOST.FDB`,
      user: 'SYSDBA',
      password: 'masterkey',
      charset: 'UTF8'
    };
  })
  .then(async() => {
      await createToken()
      .then(async () => {
        await criarTabela(config) 
      })
      .then(async () => {
        await criarGeneratorID(config);
      })
      .then(async () => {
        await criarTriggerInsertProduto(config);
      })
      .then(async () => {
        await criarTriggerUpdateProduto(config);
      })
      .then(async () => {
        await criarTriggerInsertGrupo(config)
      })
      .then(async () => {
        await criarTriggerUpdateGrupo(config);
      })
      .then(async () => {
        await criarTriggerDeleteGrupo(config);
      })
      .then(async () => {
        await criarTriggerInsertSubGrupo(config);
      })
      .then(async () => {
        await criarTriggerUpdateSubGrupo(config);
      })
      .then(async () => {
        await criarTriggerDeleteSubGrupo(config);
      })
      .then(async () => {
        await criarTriggerInsertVariacao(config);
      })
      .then(async () => {
        await criarTriggerUpdateVariacao(config);
      })
      .then(async () => {
        await criarTriggerDeleteVariacao(config);
      })
      .then(async () => {
        await criarTriggerInsertGrade(config)
      })
      .then(async () => {
        await criarTriggerUpdateGrade(config);
      })
      .then(async () => {
        await criarTriggerDeleteGrade(config)
      })
      .then(async () => {
        setInterval(refreshToken, 5400000);
      })
      .catch(() => {
        console.log('Erro ao criar/verificar as dependências SQL necessárias no banco FDB. Consultar o desenvolvedor do sistema com URGÊNCIA');
        gravarLogErro('Erro ao criar/verificar as dependências SQL necessárias no banco FDB. Consultar o desenvolvedor do sistema com URGÊNCIA');
      })
  })
  .then(async() => {
    await limparTabela(config)
  })
  .then(async () => {
    await sincronizacaoInicialGrupo();
  })
  .then(async () => {
    await sincronizacaoInicialSubGrupo();
  })
  .then(async () => {
    await sincronizacaoInicialProdutos();
  })
  .then(async () => { 
    await sincronizacaoInicialVariantes();
  })
  .then(async () => {
    await sincronizarBanco();
  })
  .catch((err) => {
    console.log(err);
  })
}









async function sincronizarBanco(){

  conexao.attach(config, function (err, db) {
    if (err){
      console.log(err);
      gravarLog(err)
    }
      //throw err;
 
    db.query('SELECT COUNT(*) AS numeroRegistros FROM NOTIFICACOES_HOSTSYNC', function (err, result) {
      if (err){
        console.log(err);
        gravarLog(err)
      }
        //err;

      let totalRegistros = result[0].NUMEROREGISTROS;

      if (totalRegistros > 0) {
        db.query('SELECT FIRST 1 ID as row, TIPO as tabela, OBS AS obsproduto, IDITEM AS id FROM NOTIFICACOES_HOSTSYNC', async function (err, resultNotificacao) {
          if (err){
            console.log(err);
            gravarLog(err)
          }

          let registroLido = resultNotificacao[0].ROW
          let tabelaRegistro = resultNotificacao[0].TABELA;
          let obsDoRegistro = resultNotificacao[0].OBSPRODUTO;
          let idRegistro = resultNotificacao[0].ID;


          switch (tabelaRegistro) {
            case "PRODUTO":
              db.query(`SELECT ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, CUSTO, DESCRICAO_COMPLEMENTAR, FOTO, PRODUTOS_MARCA.MARCA, GRUPO, SUBGRUPO, BARRAS, STATUS FROM PRODUTOS LEFT JOIN PRODUTOS_MARCA ON PRODUTOS.MARCA = PRODUTOS_MARCA.ID WHERE PRODUTOS.ID_PRODUTO=${idRegistro}`, async function (err, result) {
                
                db.detach();
                if (err){
                  console.log(err);
                  gravarLog(err)
                }
                
                let { ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, CUSTO, DESCRICAO_COMPLEMENTAR, FOTO, MARCA, GRUPO, SUBGRUPO, BARRAS, STATUS } = result[0];

                await tratativaProdutos(ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, CUSTO, DESCRICAO_COMPLEMENTAR, FOTO, MARCA, GRUPO, SUBGRUPO, BARRAS, STATUS)
                .catch(() => {
                  gravarLogErro('ERRO AO CADASTRAR PRODUTO DE ID: '+ ID_PRODUTO);
                })
                         
              })
              break;
          

            case "VARIACAO":
              db.query(`SELECT produtos_grade_itens.id_produto, GRADE.grade, PRODUTOS_GRADE_ITENS.ESTOQUE FROM PRODUTOS_GRADE_ITENS JOIN GRADE ON PRODUTOS_GRADE_ITENS.id_grade = GRADE.id WHERE PRODUTOS_GRADE_ITENS.id=${idRegistro}`, async function (err, result) {
                
                db.detach();
                if (err){
                  console.log(err);
                  gravarLog(err)
                }
                
                const {ID_PRODUTO, GRADE, ESTOQUE} = result[0];
                await tratativaVariante(ID_PRODUTO, GRADE, ESTOQUE)
                .catch((error) => {
                  gravarLogErro(`ERRO AO CADASTRAR VARIANTE DE ID: ${idRegistro}`);
                })
                         
              })             
              break;


            case "GRADE":
              break;


            case "GRUPO":
              switch (obsDoRegistro) {
                case "CADASTRADO":
                  db.query(`SELECT GRUPO FROM PRODUTOS_GRUPO WHERE PRODUTOS_GRUPO.ID=${idRegistro}`, async function (err, result) {
                
                    db.detach();
                    if (err){
                      console.log(err);
                      gravarLog(err)
                    }
                    
                    const {GRUPO} = result[0];
                    await setCategoria(GRUPO)
                    .catch((error) => {
                      gravarLogErro(`ERRO AO CADASTRAR GRUPO DE ID: ${idRegistro}`);
                    })
                             
                  })  
                  break;
                
                case "ATUALIZADO":
                  break;

                case "DELETADO":
                  break;

              }
              break;


            case "SUBGRUPO":
              switch (obsDoRegistro) {
                case "CADASTRADO":
                  db.query(`SELECT PRODUTOS_SUBGRUPO.SUBGRUPO, PRODUTOS_GRUPO.GRUPO FROM PRODUTOS_SUBGRUPO JOIN PRODUTOS_GRUPO ON PRODUTOS_SUBGRUPO.ID_GRUPO = PRODUTOS_GRUPO.ID WHERE PRODUTOS_SUBGRUPO.ID=${idRegistro}`, async function (err, result) {
                
                    db.detach();
                    if (err){
                      console.log(err);
                      gravarLog(err)
                    }
                    
                    const { SUBGRUPO, GRUPO } = result[0];
                    await setSubCategoria(GRUPO, SUBGRUPO)
                    .catch((error) => {
                      gravarLogErro(`ERRO AO CADASTRAR SUBGRUPO DE ID: ${idRegistro}`);
                    })
                             
                  })  
                  break;
                
                case "ATUALIZADO":
                  break;

                case "DELETADO":
                  break;

              }
              break;


              case "MARCA":
              break;

            default:
              console.log('ERRO FATAL CRÍTICO, ENTRE IMEDIATAMENTE EM CONTATO COM DESENVOLVIMENTO, O INTEGRADOR POSSIVELMENTE NÃO ESTÁ EM FUNCIONAMENTO DE FORMA ADEQUADA')
              break;
             
          }

          db.query(`DELETE FROM NOTIFICACOES_HOSTSYNC WHERE ID = ${registroLido}`);
          setTimeout(sincronizarBanco, 5000);
  
          
        });
      } else {
        console.log('Nenhum registro encontrado para leitura.');
        db.detach(function (err) {
          if (err){
            console.log(err);
            gravarLog(err)
          }
            
        setTimeout(sincronizarBanco, 3000);
        });
      }
    });
  });
}








//    #####    ####    ##   ##    ####             ####    ##   ##   ####      ####    ####      ##     ####
//   ##   ##    ##     ###  ##   ##  ##             ##     ###  ##    ##      ##  ##    ##      ####     ##
//   #          ##     #### ##  ##                  ##     #### ##    ##     ##         ##     ##  ##    ##
//    #####     ##     ## ####  ##                  ##     ## ####    ##     ##         ##     ##  ##    ##
//        ##    ##     ##  ###  ##                  ##     ##  ###    ##     ##         ##     ######    ##   #
//   ##   ##    ##     ##   ##   ##  ##             ##     ##   ##    ##      ##  ##    ##     ##  ##    ##  ##
//    #####    ####    ##   ##    ####             ####    ##   ##   ####      ####    ####    ##  ##   #######


async function sincronizacaoInicialProdutos() {
  return new Promise(async (resolve, reject) => {
      try {

          conexao.attach(config, function (err, db) {
              if (err)
                  throw err;

              db.query('SELECT ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, CUSTO, DESCRICAO_COMPLEMENTAR, FOTO, PRODUTOS_MARCA.MARCA, GRUPO, SUBGRUPO, BARRAS, STATUS FROM PRODUTOS LEFT JOIN PRODUTOS_MARCA ON PRODUTOS.MARCA = PRODUTOS_MARCA.ID', async function (err, result) {
                // ver codigo de barras
              db.detach();
              if (err)
                  throw err;

              // ABERTURA DO ARQUIVO DE PRODUTOS

              for (const row of result) {
                
                let { ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, CUSTO, DESCRICAO_COMPLEMENTAR, FOTO, MARCA, GRUPO, SUBGRUPO, BARRAS, STATUS } = row;

                await tratativaProdutos(ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, CUSTO, DESCRICAO_COMPLEMENTAR, FOTO, MARCA, GRUPO, SUBGRUPO, BARRAS, STATUS);

              }

              resolve();
              });
          });
      } catch (error) {
          reject(error);
      }
  });
}


/**
 * FUNÇÃO RESPONSÁVEL POR FAZER A CARGA INICIAL DE VARIANTES
 */
async function sincronizacaoInicialVariantes(){
  return new Promise(async(resolve, reject) => {
    try {

        conexao.attach(config, function(err, db){
          if(err)
            throw err

          db.query('SELECT produtos_grade_itens.id_produto, GRADE.grade, PRODUTOS_GRADE_ITENS.ESTOQUE FROM PRODUTOS_GRADE_ITENS JOIN GRADE ON PRODUTOS_GRADE_ITENS.id_grade = GRADE.id', async function (err, result){
              db.detach()

              if(err)
                throw err

              for(const row of result){

                const {ID_PRODUTO, GRADE, ESTOQUE} = row;
                await tratativaVariante(ID_PRODUTO, GRADE, ESTOQUE)

              }

              resolve();
          })
        })
    } catch (error) {
        reject(error)
    }
  })
}


/**
 * FUNÇÃO RESPONSÁVEL POR FAZER A CARGA INICIAL DE GRUPOS
 */
async function sincronizacaoInicialGrupo(){
  return new Promise(async(resolve, reject) => {
    try {

        conexao.attach(config, function(err, db){
          if(err)
            throw err

          db.query('SELECT GRUPO FROM PRODUTOS_GRUPO', async function (err, result){
              db.detach()

              if(err)
                throw err

              for(const row of result){
                const {GRUPO} = row;
                await setCategoria(GRUPO)
              }

              resolve();
          })
        })
    } catch (error) {
        reject(error)
    }
  })
}


/**
 * FUNÇÃO RESPONSÁVEL POR FAZER A CARGA INICIAL DE SUBGRUPOS
 */
async function sincronizacaoInicialSubGrupo(){
  return new Promise(async(resolve, reject) => {
    try {
      conexao.attach(config, function(err, db){
        if(err)
          throw err;

        db.query('SELECT PRODUTOS_SUBGRUPO.SUBGRUPO, PRODUTOS_GRUPO.GRUPO FROM PRODUTOS_SUBGRUPO JOIN PRODUTOS_GRUPO ON PRODUTOS_SUBGRUPO.ID_GRUPO = PRODUTOS_GRUPO.ID', async function(err, result){
          db.detach();

          if(err)
            throw err;

          for(const row of result){
            const { SUBGRUPO, GRUPO } = row;
            await setSubCategoria(GRUPO, SUBGRUPO);
          }

          resolve();
        })

      })


    } catch (error) {
      reject(error)
    }
  })
}



async function setCategoria(name){
  let idCategoria;
  return new Promise(async (resolve, reject) => {
    try {
      const dados = JSON.parse(fs.readFileSync('./src/build/tray/categoria.json', 'utf8'));

      if(dados.categorias[name]){
        idCategoria = dados.categorias[name].id;
      }
      else{
        await criarCategoria(name)
        .then(response => {
          dados.categorias[name] = {
            id: response,
            subcategorias: {}
          };
          fs.writeFileSync('./src/build/tray/categoria.json', JSON.stringify(dados));
          gravarLog(`CRIADO CATEGORIA ${name} -> ${response}`);
          resolve(response);
        })
      }

      fs.writeFileSync('./src/build/tray/categoria.json', JSON.stringify(dados));
      resolve(idCategoria)
    } catch (error) {
      reject(error)
    }
  })
}


async function setSubCategoria(categoria, subCategoria) {
  return new Promise(async (resolve, reject) => {
    try {
      const dados = JSON.parse(fs.readFileSync('./src/build/tray/categoria.json', 'utf8'));
      let idCategoria, idSubcategoria;

      if (!dados.categorias[categoria]) {
        try {
          idCategoria = await setCategoria(categoria)
        } catch (error) {
          reject(error);
          return;
        }
      } else {
        idCategoria = dados.categorias[categoria].id;
      }

      const dadosNovos = JSON.parse(fs.readFileSync('./src/build/tray/categoria.json', 'utf8'));

      if(dadosNovos.categorias[categoria] == undefined){
        gravarLogErro(`Indefinido esta no 1 ${idCategoria}`);
      }
      else if (dadosNovos.categorias[categoria].subcategorias[subCategoria]) {
        idSubcategoria = dadosNovos.categorias[categoria].subcategorias[subCategoria];

        resolve(idSubcategoria);
      } else {
        try { 
          let response = await criarSubCategoria(subCategoria, idCategoria);
          dadosNovos.categorias[categoria].subcategorias[subCategoria] = response;
          if(dadosNovos.categorias[categoria] == undefined){
            gravarLogErro('Indefinido esta no 2');
          }
        
          fs.writeFileSync('./src/build/tray/categoria.json', JSON.stringify(dadosNovos));
          gravarLog(`CRIADO SUBCATEGORIA ${subCategoria} -> ${response}`);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      }
    } catch (error) {
      reject(error);
    }
  });
}


async function returnGrupo(categoria, subCategoria) {
  return new Promise(async (resolve, reject) => {
    try {
      var grupo;
      var subgrupo;

      if((categoria=="")||(categoria==null)||(categoria==0)||(categoria==undefined)){
        resolve("");
      }  
      else{
        if((subCategoria=="")||(subCategoria==null)||(subCategoria==0)||(subCategoria==undefined)){
          conexao.attach(config, function(err, db){
            if(err)
              throw err;
    
            db.query(`SELECT GRUPO FROM PRODUTOS_GRUPO WHERE ID=${categoria}`, async function(err, result){
                db.detach();

                if(err)
                throw err;
    
                for(const row of result){
                  const { GRUPO } = row;
                  grupo = setCategoria(GRUPO);
                }
    
              resolve(grupo);
            })
          })

        }
        else{
          conexao.attach(config, function(err, db){
            if(err)
              throw err;
    
            db.query(`SELECT SUBGRUPO, PRODUTOS_GRUPO.GRUPO FROM PRODUTOS_SUBGRUPO JOIN PRODUTOS_GRUPO ON PRODUTOS_SUBGRUPO.ID_GRUPO = PRODUTOS_GRUPO.ID WHERE PRODUTOS_SUBGRUPO.ID=${subCategoria}`, async function(err, result){
                db.detach();

                if(err)
                throw err;
    
                for(const row of result){
                  const { SUBGRUPO, GRUPO } = row;

                  subgrupo = setSubCategoria(GRUPO, SUBGRUPO);
                }
    
              resolve(subgrupo);
            })
          })

        }
      }
    } catch (error) {
      reject(error);
    }
  });
}



async function tratativaProdutos(ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, CUSTO, DESCRICAO_COMPLEMENTAR, FOTO, MARCA, GRUPO, SUBGRUPO, BARRAS, STATUS){
  return new Promise(async (resolve, reject) => {
              const produtos = JSON.parse(fs.readFileSync('./src/build/tray/produtos.json', 'utf8'));  
              
                if((PRODUTO=="")||(PRODUTO==null)||(PRODUTO==undefined)){
                  gravarLogErro(`O PRODUTO ${PRODUTO} NÃO FOI CADASTRADO DEVIDO A UM ERRO, ENTRE EM CONTATO COM SUPORTE TÉCNICO`) 
                }
                    
                if((DESCRICAO_COMPLEMENTAR==null)||DESCRICAO_COMPLEMENTAR==undefined){
                  DESCRICAO_COMPLEMENTAR == "";
                }

                if((BARRAS==null)||(BARRAS==undefined)){
                  BARRAS = "";
                }

                if(((produtos[ID_PRODUTO]))&&((ESTOQUE<=0)||(STATUS=="INATIVO"))){
                  let ID_PRODUTO_TRAY = produtos[ID_PRODUTO].id_tray;

                  await deletarProduto(ID_PRODUTO_TRAY)
                  .then(() => {
                    const linksImagem = JSON.parse(fs.readFileSync('./src/build/tray/links_img.json', 'utf8')); 

                    delete produtos[ID_PRODUTO];
                    delete linksImagem.ID_PRODUTO_TRAY;

                    fs.writeFileSync('./src/build/tray/links_img.json', JSON.stringify(linksImagem));
                    gravarLog(`PRODUTO ${PRODUTO} DE ID ${ID_PRODUTO} FOI DELETADO NA TRAY NO ID ${ID_PRODUTO_TRAY}`)
                  })
                  .catch(() => {
                    gravarLogErro(`ERRO AO DELETAR PRODUTO ${PRODUTO} DA BASE TRAY, SERA DELETADO DO BANCO DO INTEGRADOR. ID HOST: ${ID_PRODUTO}, ID TRAY: ${ID_PRODUTO_TRAY}`);
                  })
                }
                else if(((produtos[ID_PRODUTO]))&&(ESTOQUE>0)&&(STATUS=="ATIVO")){
                  let IDGRUPO = await returnGrupo(GRUPO, SUBGRUPO);
                  var ID_PRODUTO_TRAY = produtos[ID_PRODUTO].id_tray;

                  await atualizarProduto(PRODUTO, ESTOQUE, VALOR_VENDA, CUSTO, DESCRICAO_COMPLEMENTAR, MARCA, IDGRUPO, BARRAS, ID_PRODUTO_TRAY)
                  .then(async () => {
                    await tratativaDeImagem(PRODUTO, ID_PRODUTO, ID_PRODUTO_TRAY, FOTO)               
                  })
                }
                else if((!(produtos[ID_PRODUTO]))&&(ESTOQUE>0)&&(STATUS=="ATIVO")){
                  let IDGRUPO = await returnGrupo(GRUPO, SUBGRUPO);
                  
                  await cadastrarProduto(PRODUTO, ESTOQUE, VALOR_VENDA, CUSTO, DESCRICAO_COMPLEMENTAR, MARCA, IDGRUPO, BARRAS)
                  .then(async (response) => {
                    let imagem;

                    produtos[ID_PRODUTO] = {
                      "id_tray": response,
                      "variantes": {}
                    }

                    gravarLog(`PRODUTO ${PRODUTO} DE ID ${ID_PRODUTO} FOI CADASTRADO NA TRAY NO ID ${response}`);

                    await tratativaDeImagem(PRODUTO, ID_PRODUTO, response, FOTO)

                  })
                  .catch(err => {
                    console.log(err)
                    gravarLogErro(`O PRODUTO ${PRODUTO} NÃO FOI CADASTRADO DEVIDO A UM ERRO, ENTRE EM CONTATO COM SUPORTE TÉCNICO`) 
                  })
                }
                                 
                fs.writeFileSync('./src/build/tray/produtos.json', JSON.stringify(produtos));

                resolve()
  })
}


async function tratativaVariante(ID_PRODUTO, GRADE, ESTOQUE_GRADE){
  return new Promise(async (resolve, reject) => {
    var produtos = JSON.parse(fs.readFileSync('./src/build/tray/produtos.json', 'utf-8'));
    
    if(produtos[ID_PRODUTO]){
      if((produtos[ID_PRODUTO].variantes[GRADE])&&(!(ESTOQUE_GRADE>0))){
        let idVariante = produtos[ID_PRODUTO].variantes[GRADE];

        await deletarVariante(idVariante)
        .then(() => {
          delete produtos[ID_PRODUTO].variantes[GRADE];
          gravarLog('DELETADO GRADE: ' + GRADE + ' DO PRODUTO DE ID HOST: ' + ID_PRODUTO)
        })
      }
      else if((produtos[ID_PRODUTO].variantes[GRADE])&&(ESTOQUE_GRADE>0)){
        let idVariante = produtos[ID_PRODUTO].variantes[GRADE];

       await  atualizarVariante(ID_PRODUTO, idVariante, GRADE, ESTOQUE_GRADE)
        .then(() => {
          gravarLog(`ATUALIZADO GRADE ${GRADE} DO PRODUTO DE ID HOST ${ID_PRODUTO}`);
        })
      }
      else if((produtos[ID_PRODUTO].variantes[GRADE]==undefined)&&(ESTOQUE_GRADE>0)){
        let idProdutoTray = produtos[ID_PRODUTO].id_tray;

        await cadastrarVariante(idProdutoTray, GRADE, ESTOQUE_GRADE)
        .then((response) => {
          produtos[ID_PRODUTO].variantes[GRADE] = response;

          gravarLog(`CADASTRADO GRADE ${GRADE} NO PRODUTO DE ID HOST ${ID_PRODUTO}`);
        })
      }
      
;
    }

    fs.writeFileSync('./src/build/tray/produtos.json', JSON.stringify(produtos));

    resolve()

  })
}


async function tratativaDeImagem(PRODUTO, ID_PRODUTO, ID_PRODUTO_TRAY, FOTO){
  return new Promise(async (resolve, reject) => {
    var imagem;
    
    gravarLog(`PRODUTO ${PRODUTO} DE ID ${ID_PRODUTO} FOI ATUALIZADO NA TRAY NO ID ${ID_PRODUTO_TRAY}`);

    //TRECHO PARA ATIVAR FUNCIONALIDADE DE CADASTRO DE IMG
    await gestaoImagemImgur(ID_PRODUTO, FOTO)
      .then(() => {
        var imagens_links = JSON.parse(fs.readFileSync('./src/build/tray/links_img.json', 'utf-8'));

        if (imagens_links[ID_PRODUTO]) {
          imagem = imagens_links[ID_PRODUTO].link;
        }
        else {
          imagem = " ";
        }
      })
      .then(async () => {
        await cadastrarImagem(ID_PRODUTO_TRAY, imagem)
          .then(() => {
            gravarLog('CADASTRADO IMAGEM NO PRODUTO ' + PRODUTO + ` DE ID ${ID_PRODUTO} COM O ID ${ID_PRODUTO_TRAY} NA TRAY`);
          })
          .catch((error) => {
            gravarLogErro("ERRO AO CADASTRAR IMAGEM NO PRODUTO " + PRODUTO + ` DE ID ${ID_PRODUTO} COM O ID ${ID_PRODUTO_TRAY} NA TRAY`)
          })
          
          resolve()
      })
      .catch((error) => {
        console.log(error)
        gravarLogErro("ERRO NA TRATATIVA DE IMAGEM - 1645: " + JSON.stringify(error));
        resolve()
      })
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
  setSenha,
  sincronizacao,
  setCategoria
};