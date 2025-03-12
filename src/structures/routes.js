const createCustomAlert = (message, status) => {
    // Cria um elemento de alerta personalizado
    const alertElement = document.createElement('div');
    alertElement.classList.add('custom-alert');
    alertElement.textContent = message;
  
    // Define a posição absoluta do alerta
    if(status == 'success'){
        alertElement.style.backgroundColor = '#d4edda';
        alertElement.style.color = '#155724';
        alertElement.style.border = '1px solid #c3e6cb';  
    }  
    else if(status == 'warning'){
        alertElement.style.backgroundColor = '#fff3cd';
        alertElement.style.color = '#856404';
        alertElement.style.border = '1px solid #ffeeba';  
    }
    else if(status == 'danger'){
        alertElement.style.backgroundColor = '#f8d7da';
        alertElement.style.color = '#721c24';
        alertElement.style.border = '1px solid #f5c6cb';  
    }

    // Adiciona o alerta ao corpo da página
    document.body.appendChild(alertElement);
  
    // Define um tempo para remover o alerta após alguns segundos
    setTimeout(() => {
      alertElement.remove();
    }, 7000); // Remove o alerta após 5 segundos (ajuste conforme necessário)
};



/**
 * 
 */
function sincronizacaoContinua(){
    let sincronizar = true;

    if(sincronizar==true){
        const elements = document.getElementsByClassName('sync');
        document.getElementById('gif-loading').src = "./build/loading.gif";
        for (let i = 0; i < elements.length; i++) {
            elements[i].disabled = true;
        }
        fetch(`http://localhost:3000/sincronizacaoContinua`)
            .then(response => response.text())
            .then(data => {
                createCustomAlert(data, 'danger');
                document.getElementById('gif-loading').src = "";
                for (let i = 0; i < elements.length; i++) {
                    elements[i].disabled = false;
                }
            })
            .catch(error => {
                console.error(error);
            });
    }
    else{
        console.log('Cancelado pedido de sincronização');
    }
}


/**
 * Função que faz requisição para porta 3000 para fechamento ao app Electron.js
 */
function closeApp(){
    fetch('http://localhost:3000/closeApp')
        .then(response => response.text())
        .then(data => {
            console.log(data);
        })
        .catch(error => {
            console.error(error);
        });
}


/**
 * Função que faz requisição para porta 3000 para fechamento do app Electron.js
 */
function minimizeApp(){
    fetch('http://localhost:3000/minimizeApp')
        .then(response => response.text())
        .then(data => {
            console.log(data);
        })
        .catch(error => {
            console.error(error);
        });
}


/**
 * Função de requisição para porta 3000 para gravar dados do cadastro de informações do Saurus
 */
function saveHost(){
    let caminhoBanco = document.getElementById('caminhoBanco-input').value;
    let caminhoImagens = document.getElementById('caminhoImagens-input').value;

    urlBanco = encodeURIComponent(caminhoBanco);
    urlImagens = encodeURIComponent(caminhoImagens);

    fetch(`http://localhost:3000/saveHost/${urlBanco}/${urlImagens}`)
    .catch(error =>{
        confirm.log(error);
    })
}


/**
 * Função de requisição para porta 3000 para gravar dados do cadastro de informações da Tray
 */
function saveTray(){
    let code = document.getElementById('code-input').value;
    let url = document.getElementById('url-input').value;
    url = encodeURIComponent(url);
    fetch(`http://localhost:3000/saveTray/${code}/${url}`)
    .catch(error =>{
        confirm.log(error);
    })
}


/**
 * Função de requisição para porta 3000 para carregar valores dos campos "value" dos inputs HTML Saurus
 */
function carregarInfoHost(){
    fetch('http://localhost:3000/carregarInfo')
    .then(response => response.json())
    .then(dados =>{
        document.getElementById('caminhoBanco-input').value = dados[0];
        document.getElementById('caminhoImagens-input').value = dados[1];
    });
}


/**
 * Função de requisição para porta 3000 para carregar valores dos campos "value" dos inputs HTML Tray
 */
function carregarInfoTray(){
    fetch('http://localhost:3000/carregarInfo')
    .then(response => response.json())
    .then(dados =>{
        document.getElementById('code-input').value = dados[2];
        document.getElementById('url-input').value = dados[3];
    });
}


/**
 * Função para rodar funções no carregamento das paginas
 */
window.onload = function(){
    carregarInfoHost();
    carregarInfoTray();
};

