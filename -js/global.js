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
// CONTROLE DO DROPDOWN DO PERFIL NO CABEÇALHO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const botaoPerfil = document.getElementById("botaoPerfil");
  const dropdownPerfil = document.getElementById("dropdownPerfil");

  if (botaoPerfil && dropdownPerfil) {
    // Abre/Fecha ao clicar no perfil
    botaoPerfil.addEventListener("click", (e) => {
      e.stopPropagation(); // Evita que o clique feche imediatamente
      dropdownPerfil.classList.toggle("mostrar");
    });

    // Fecha se clicar em qualquer outro lugar da tela
    document.addEventListener("click", (e) => {
      if (
        !dropdownPerfil.contains(e.target) &&
        !botaoPerfil.contains(e.target)
      ) {
        dropdownPerfil.classList.remove("mostrar");
      }
    });
  }

  // ==========================================
  // CONTROLE DO DROPDOWN DE NOTIFICAÇÕES
  // ==========================================
  const botaoNotificacao = document.getElementById("botaoNotificacao");
  const dropdownNotificacoes = document.getElementById("dropdownNotificacoes");

  if (botaoNotificacao && dropdownNotificacoes) {
    // Abre/Fecha ao clicar no Sino
    botaoNotificacao.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownNotificacoes.classList.toggle("mostrar");

      // Dica de UX: Se abrir o Sino, fecha o Perfil pra não encavalar
      const dropPerfil = document.getElementById("dropdownPerfil");
      if (dropPerfil) dropPerfil.classList.remove("mostrar");
    });

    // Fecha se clicar fora
    document.addEventListener("click", (e) => {
      if (
        !dropdownNotificacoes.contains(e.target) &&
        !botaoNotificacao.contains(e.target)
      ) {
        dropdownNotificacoes.classList.remove("mostrar");
      }
    });
  }

  // ==========================================
  // LÓGICA DE NOTIFICAÇÕES DINÂMICAS (SUPABASE + MEMÓRIA)
  // ==========================================
  const badgeNotificacao = document.querySelector(".badge-notificacao");
  const containerListaNotificacoes = document.getElementById(
    "containerListaNotificacoes",
  );
  const btnMarcarLidasGlobal = document.getElementById("btnMarcarLidasGlobal");

  // Configurações do Banco para as Notificações
  const baseSupabaseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKeySupabase = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersSupabase = {
    "Content-Type": "application/json",
    apikey: apiKeySupabase,
    Authorization: `Bearer ${apiKeySupabase}`,
  };

  async function carregarNotificacoesDinamicas() {
    if (!containerListaNotificacoes) return;

    const sessaoStr = localStorage.getItem("sgm_sessao");
    if (!sessaoStr) return;
    const sessao = JSON.parse(sessaoStr);
    const papel = sessao.id_papel; // 1: ADM, 2: Solicitante, 3: Técnico, 4: Gerente

    let notificacoes = [];

    try {
      // 1. ALERTA DE ESTOQUE BAIXO (Apenas para Técnicos, Gerentes e Admins)
      if (papel === 1 || papel === 3 || papel === 4) {
        const resPecas = await fetch(
          `${baseSupabaseUrl}/peca?select=id,descricao,qtde,estoque_minimo&is_active=eq.true`,
          { headers: headersSupabase },
        );
        if (resPecas.ok) {
          const pecas = await resPecas.json();
          pecas.forEach((peca) => {
            // Se não tiver estoque_minimo cadastrado no banco, ele assume 5 como limite de alerta
            const limiteMinimo = peca.estoque_minimo || 5;

            if (peca.qtde <= limiteMinimo) {
              notificacoes.push({
                id_unica: `peca_${peca.id}`,
                titulo: "Estoque Crítico",
                mensagem: `A peça "${peca.descricao}" está acabando! Restam apenas ${peca.qtde} unidades.`,
                link: "pecas_adm.html",
                tempo: "Alerta do Sistema",
                icone: "bi-exclamation-triangle",
                classeCor: "alerta", // Puxa o vermelho do CSS
              });
            }
          });
        }
      }

      // 2. ALERTA DE NOVAS ORDENS DE SERVIÇO (Para dar volume de dados reais)
      const resOs = await fetch(
        `${baseSupabaseUrl}/abertura_ordem_servico?select=id,data_abertura&order=id.desc&limit=2`,
        { headers: headersSupabase },
      );
      if (resOs.ok) {
        const ordens = await resOs.json();
        ordens.forEach((os) => {
          // Formata a data bonitinha
          const dataFormatada = new Date(os.data_abertura).toLocaleDateString(
            "pt-BR",
          );
          notificacoes.push({
            id_unica: `os_${os.id}`,
            titulo: "Nova OS Registrada",
            mensagem: `A Ordem de Serviço #${os.id} foi aberta.`,
            link: "todas_os.html",
            tempo: dataFormatada,
            icone: "bi-clipboard-plus",
            classeCor: "os", // Puxa o verde do CSS
          });
        });
      }

      // Depois de buscar tudo, manda desenhar na tela!
      renderizarNotificacoes(notificacoes);
    } catch (erro) {
      console.error("Erro ao puxar notificações do banco:", erro);
    }
  }

  function renderizarNotificacoes(lista) {
    if (lista.length === 0) {
      containerListaNotificacoes.innerHTML = `
              <p style="text-align: center; font-size: 11px; color: #8b9ab1; padding: 25px 15px;">
                  Tudo tranquilo! Você não tem novas notificações.
              </p>`;
      if (badgeNotificacao) badgeNotificacao.style.display = "none";
      return;
    }

    containerListaNotificacoes.innerHTML = "";

    // Pega da memória quais notificações o usuário JÁ LEU (guardadas pelo ID único que criamos)
    let notificacoesLidas =
      JSON.parse(localStorage.getItem("sgm_notificacoes_lidas_bd")) || [];
    let contagemNaoLidas = 0;

    lista.forEach((noti) => {
      const isLida = notificacoesLidas.includes(noti.id_unica);
      if (!isLida) contagemNaoLidas++;

      const classeLida = isLida ? "" : "nao-lida"; // Se não leu, ganha a barrinha azul

      // Cria o HTML real injetando as variáveis do banco de dados
      containerListaNotificacoes.innerHTML += `
              <a href="${noti.link}" class="notificacao-item ${classeLida}" data-id="${noti.id_unica}">
                  <div class="notificacao-icone ${noti.classeCor}">
                      <i class="bi ${noti.icone}"></i>
                  </div>
                  <div class="notificacao-conteudo">
                      <strong>${noti.titulo}</strong>
                      <p>${noti.mensagem}</p>
                      <span>${noti.tempo}</span>
                  </div>
              </a>
          `;
    });

    // Atualiza a bolinha vermelha no sino
    if (badgeNotificacao) {
      if (contagemNaoLidas > 0) {
        badgeNotificacao.textContent = contagemNaoLidas;
        badgeNotificacao.style.display = "flex";
      } else {
        badgeNotificacao.style.display = "none";
      }
    }

    // Adiciona o "Ouvinte" de clique em cada notificação desenhada
    document.querySelectorAll(".notificacao-item").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-id");
        let lidas =
          JSON.parse(localStorage.getItem("sgm_notificacoes_lidas_bd")) || [];

        // Se clicou, salva na memória que leu e o navegador leva pra página do HREF naturalmente
        if (!lidas.includes(id)) {
          lidas.push(id);
          localStorage.setItem(
            "sgm_notificacoes_lidas_bd",
            JSON.stringify(lidas),
          );
        }
      });
    });
  }

  // AÇÃO GLOBAL: Botão "Marcar como lidas"
  if (btnMarcarLidasGlobal) {
    btnMarcarLidasGlobal.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const todosItens = document.querySelectorAll(".notificacao-item");
      let lidas =
        JSON.parse(localStorage.getItem("sgm_notificacoes_lidas_bd")) || [];

      todosItens.forEach((item) => {
        item.classList.remove("nao-lida");
        const id = item.getAttribute("data-id");
        if (!lidas.includes(id)) lidas.push(id);
      });

      // Salva na memória do PC e esconde a bolinha
      localStorage.setItem("sgm_notificacoes_lidas_bd", JSON.stringify(lidas));
      if (badgeNotificacao) badgeNotificacao.style.display = "none";
    });
  }

  // Roda a função principal assim que a tela abre!
  carregarNotificacoesDinamicas();
});

// ==========================================
// FUNÇÃO PARA SAIR DO SISTEMA (LOGOUT)
// ==========================================
function sairSistema() {
  localStorage.removeItem("sgm_sessao");
  window.location.href = "../index.html";
}
