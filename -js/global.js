// ==========================================
// 1. EXECUÇÃO IMEDIATA (ANTI-PISCAR E INJEÇÃO CSS)
// Roda imediatamente assim que o arquivo é lido para evitar FOUC
// ==========================================
(function aplicarSeguranca() {
  const paginaAtual = window.location.pathname;
  const ehTelaLogin =
    paginaAtual.endsWith("index.html") ||
    paginaAtual === "/" ||
    paginaAtual.endsWith("sgm/");

  const sessaoStr = localStorage.getItem("sgm_sessao");
  const sessao = sessaoStr ? JSON.parse(sessaoStr) : null;

  // Se NÃO está logado e tentou acessar página interna -> Expulsa pro Login
  if (!sessao && !ehTelaLogin) {
    window.location.href = "../index.html";
    return;
  }

  // Se JÁ ESTÁ logado e abriu a tela de login -> Vai pro Dashboard
  if (sessao && ehTelaLogin) {
    window.location.href = "_pages/dashboard.html";
    return;
  }

  // ==========================================
  // 2. INJEÇÃO DE CSS BRUTAL (RBAC)
  // Esconde os elementos sem depender do HTML estar perfeitamente igual
  // ==========================================
  if (sessao && !ehTelaLogin) {
    const papel = sessao.id_papel; // 1: ADM, 2: Solicitante, 3: Técnico, 4: Gerente
    let cssRegras = "";

    // Função que cria as regras CSS para aniquilar o menu
    // Função que cria as regras CSS para aniquilar o menu e fechar o buraco
    function ocultar(keyword) {
      cssRegras += `
                .lista-navegacao li.item-navegacao:has(a[href*="${keyword}"]),
                .lista-navegacao li.item-navegacao:has([data-menu*="${keyword}"]),
                a[href*="${keyword}"],
                [data-menu*="${keyword}"] {
                    display: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    height: 0 !important;
                    min-height: 0 !important;
                    overflow: hidden !important;
                }
            `;
    }

    // === REGRAS DE CADA PAPEL ===
    if (papel === 2) {
      // SOLICITANTE
      ocultar("equipamentos");
      ocultar("setor");
      ocultar("historico");
      ocultar("indicadores");
      ocultar("relatorios");
      ocultar("manutencao");
      ocultar("pecas");
      ocultar("usuarios");
      ocultar("administracao");
      ocultar("niveis_acesso");
    } else if (papel === 3) {
      // TÉCNICO
      ocultar("setor");
      ocultar("administracao");
      ocultar("usuarios");
      ocultar("niveis_acesso");
      // Esconde botões específicos das telas (inclusive se estiverem dentro de um <a>)
      cssRegras += `
                #botaoNovoEquipamento, 
                #botaoNovaCategoria, 
                a:has(#botaoNovaPeca), 
                #botaoNovaPeca { display: none !important; }
            `;
    } else if (papel === 4) {
      // GERENTE
      ocultar("historico");
      ocultar("indicadores");
      ocultar("manutencao");
      ocultar("administracao");
      ocultar("usuarios");
      ocultar("niveis_acesso");
      cssRegras += `
                #botaoNovoEquipamento, 
                a:has(#btnNovaOS), 
                #btnNovaOS { display: none !important; }
            `;
    }

    // Se houver regras para esconder, injeta o CSS no <head> instantaneamente
    if (cssRegras !== "") {
      const styleBloco = document.createElement("style");
      styleBloco.innerHTML = cssRegras;
      document.head.appendChild(styleBloco);
    }
  }
})();

// ==========================================
// 3. PREENCHIMENTO DE DADOS (Pós-carregamento)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const sessaoStr = localStorage.getItem("sgm_sessao");
  if (!sessaoStr) return;

  const sessao = JSON.parse(sessaoStr);

  // Preencher Nome, Papel e Iniciais no Cabeçalho
  const elNome = document.querySelector(".informacoes-usuario strong");
  const elPapel = document.querySelector(".informacoes-usuario span");
  const elAvatar = document.querySelector(".avatar-usuario");

  if (elNome) elNome.textContent = sessao.nome;
  if (elPapel) elPapel.textContent = sessao.nome_papel;

  if (elAvatar) {
    // Pega as iniciais (Ex: "Maria Costa" vira "MC")
    const iniciais = sessao.nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
    elAvatar.textContent = iniciais;
  }

  // Comportamento de abrir/fechar menu lateral mobile
  const botaoMenu = document.getElementById("botaoMenu");
  const barraLateral = document.getElementById("barraLateral");

  if (botaoMenu && barraLateral) {
    botaoMenu.addEventListener("click", () => {
      barraLateral.classList.toggle("recolhida");
    });
  }
});

// ==========================================
// FUNÇÃO PARA SAIR DO SISTEMA (LOGOUT)
// ==========================================
function sairSistema() {
  localStorage.removeItem("sgm_sessao");
  window.location.href = "../index.html";
}
