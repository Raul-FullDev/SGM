(function aplicarSeguranca() {
  const paginaAtual = window.location.pathname;
  const ehTelaLogin =
    paginaAtual.endsWith("index.html") ||
    paginaAtual === "/" ||
    paginaAtual.endsWith("sgm/");

  const sessaoStr = localStorage.getItem("sgm_sessao");
  const sessao = sessaoStr ? JSON.parse(sessaoStr) : null;

  if (!sessao && !ehTelaLogin) {
    window.location.href = "../index.html";
    return;
  }

  if (sessao && ehTelaLogin) {
    window.location.href = "_pages/dashboard.html";
    return;
  }

  if (sessao && !ehTelaLogin) {
    const papel = sessao.id_papel;
    let cssRegras = "";

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

    if (papel === 2) {
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
      ocultar("setor");
      ocultar("administracao");
      ocultar("usuarios");
      ocultar("niveis_acesso");
      cssRegras += `
                #botaoNovoEquipamento, 
                #botaoNovaCategoria, 
                a:has(#botaoNovaPeca), 
                #botaoNovaPeca { display: none !important; }
            `;
    } else if (papel === 4) {
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

    if (cssRegras !== "") {
      const styleBloco = document.createElement("style");
      styleBloco.innerHTML = cssRegras;
      document.head.appendChild(styleBloco);
    }
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const sessaoStr = localStorage.getItem("sgm_sessao");
  if (!sessaoStr) return;

  const sessao = JSON.parse(sessaoStr);
  const elNome = document.querySelector(".informacoes-usuario strong");
  const elPapel = document.querySelector(".informacoes-usuario span");
  const elAvatar = document.querySelector(".avatar-usuario");

  if (elNome) elNome.textContent = sessao.nome;
  if (elPapel) elPapel.textContent = sessao.nome_papel;

  if (elAvatar) {
    const iniciais = sessao.nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
    elAvatar.textContent = iniciais;
  }

  const botaoMenu = document.getElementById("botaoMenu");
  const barraLateral = document.getElementById("barraLateral");

  if (botaoMenu && barraLateral) {
    botaoMenu.addEventListener("click", () => {
      barraLateral.classList.toggle("recolhida");
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const botaoPerfil = document.getElementById("botaoPerfil");
  const dropdownPerfil = document.getElementById("dropdownPerfil");

  if (botaoPerfil && dropdownPerfil) {
    botaoPerfil.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownPerfil.classList.toggle("mostrar");
    });

    document.addEventListener("click", (e) => {
      if (
        !dropdownPerfil.contains(e.target) &&
        !botaoPerfil.contains(e.target)
      ) {
        dropdownPerfil.classList.remove("mostrar");
      }
    });
  }

  const botaoNotificacao = document.getElementById("botaoNotificacao");
  const dropdownNotificacoes = document.getElementById("dropdownNotificacoes");

  if (botaoNotificacao && dropdownNotificacoes) {
    botaoNotificacao.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownNotificacoes.classList.toggle("mostrar");

      const dropPerfil = document.getElementById("dropdownPerfil");
      if (dropPerfil) dropPerfil.classList.remove("mostrar");
    });

    document.addEventListener("click", (e) => {
      if (
        !dropdownNotificacoes.contains(e.target) &&
        !botaoNotificacao.contains(e.target)
      ) {
        dropdownNotificacoes.classList.remove("mostrar");
      }
    });
  }

  const badgeNotificacao = document.querySelector(".badge-notificacao");
  const containerListaNotificacoes = document.getElementById(
    "containerListaNotificacoes",
  );
  const btnMarcarLidasGlobal = document.getElementById("btnMarcarLidasGlobal");
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
    const papel = sessao.id_papel;

    let notificacoes = [];

    try {
      if (papel === 1 || papel === 3 || papel === 4) {
        const resPecas = await fetch(
          `${baseSupabaseUrl}/peca?select=id,descricao,qtde,estoque_minimo&is_active=eq.true`,
          { headers: headersSupabase },
        );
        if (resPecas.ok) {
          const pecas = await resPecas.json();
          pecas.forEach((peca) => {
            const limiteMinimo = peca.estoque_minimo || 5;

            if (peca.qtde <= limiteMinimo) {
              notificacoes.push({
                id_unica: `peca_${peca.id}`,
                titulo: "Estoque Crítico",
                mensagem: `A peça "${peca.descricao}" está acabando! Restam apenas ${peca.qtde} unidades.`,
                link: "pecas_adm.html",
                tempo: "Alerta do Sistema",
                icone: "bi-exclamation-triangle",
                classeCor: "alerta",
              });
            }
          });
        }
      }

      const resOs = await fetch(
        `${baseSupabaseUrl}/abertura_ordem_servico?select=id,data_abertura&order=id.desc&limit=2`,
        { headers: headersSupabase },
      );
      if (resOs.ok) {
        const ordens = await resOs.json();
        ordens.forEach((os) => {
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
            classeCor: "os",
          });
        });
      }


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

    let notificacoesLidas =
      JSON.parse(localStorage.getItem("sgm_notificacoes_lidas_bd")) || [];
    let contagemNaoLidas = 0;

    lista.forEach((noti) => {
      const isLida = notificacoesLidas.includes(noti.id_unica);
      if (!isLida) contagemNaoLidas++;

      const classeLida = isLida ? "" : "nao-lida";

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

    if (badgeNotificacao) {
      if (contagemNaoLidas > 0) {
        badgeNotificacao.textContent = contagemNaoLidas;
        badgeNotificacao.style.display = "flex";
      } else {
        badgeNotificacao.style.display = "none";
      }
    }

    document.querySelectorAll(".notificacao-item").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-id");
        let lidas =
          JSON.parse(localStorage.getItem("sgm_notificacoes_lidas_bd")) || [];
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

      localStorage.setItem("sgm_notificacoes_lidas_bd", JSON.stringify(lidas));
      if (badgeNotificacao) badgeNotificacao.style.display = "none";
    });
  }

  carregarNotificacoesDinamicas();
});

function sairSistema() {
  localStorage.removeItem("sgm_sessao");
  window.location.href = "../index.html";
}
