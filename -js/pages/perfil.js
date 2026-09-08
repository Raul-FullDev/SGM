document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // CONFIGURAÇÕES DA API SUPABASE
  // ==========================================
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
  };

  // Pega a sessão atual garantida pelo global.js
  const sessaoStr = localStorage.getItem("sgm_sessao");
  if (!sessaoStr) return;
  const sessao = JSON.parse(sessaoStr);
  const idUsuario = sessao.id;

  // Elementos da Tela (Dados)
  const perfilAvatar = document.getElementById("perfilAvatar");
  const perfilNome = document.getElementById("perfilNome");
  const perfilFuncao = document.getElementById("perfilFuncao");
  const perfilMatricula = document.getElementById("perfilMatricula");
  const perfilContato = document.getElementById("perfilContato");
  const perfilNivel = document.getElementById("perfilNivel");

  // Elementos da Tela (Formulário Senha)
  const formSenha = document.getElementById("formAlterarSenha");
  const inputSenhaAtual = document.getElementById("senhaAtual");
  const inputNovaSenha = document.getElementById("novaSenha");
  const inputConfirmar = document.getElementById("confirmarSenha");
  const btnSalvar = document.getElementById("btnSalvarSenha");

  // Guarda a senha atual vinda do banco para verificação
  let senhaRealDoBanco = "";

  // ==========================================
  // 1. CARREGAR DADOS DO USUÁRIO
  // ==========================================
  async function carregarDadosPerfil() {
    try {
      // Busca os dados completos do usuário ativo no banco
      const resposta = await fetch(
        `${baseUrl}/usuario?select=*,nivel(funcao)&id=eq.${idUsuario}`,
        {
          method: "GET",
          headers: headersConfig,
        },
      );

      if (!resposta.ok) throw new Error("Erro ao buscar dados do perfil.");

      const usuarios = await resposta.json();
      if (usuarios.length === 0) return;

      const usuarioData = usuarios[0];

      // Preenche a tela
      const iniciais = usuarioData.nome
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
      perfilAvatar.textContent = iniciais;
      perfilNome.textContent = usuarioData.nome;
      perfilFuncao.textContent = usuarioData.funcao;
      perfilMatricula.textContent = usuarioData.matricula;
      perfilContato.textContent = usuarioData.contato || "Não informado";
      perfilNivel.textContent =
        usuarioData.nivel?.funcao || "Nível Desconhecido";

      // Guarda a senha para a validação do formulário
      senhaRealDoBanco = usuarioData.senha;
    } catch (erro) {
      console.error("Falha ao carregar perfil:", erro);
    }
  }

  // ==========================================
  // 2. ALTERAR SENHA (UPDATE)
  // ==========================================
  formSenha.addEventListener("submit", async (e) => {
    e.preventDefault();

    const senhaAtualDigitada = inputSenhaAtual.value.trim();
    const novaSenha = inputNovaSenha.value.trim();
    const confirmacao = inputConfirmar.value.trim();

    // Validações locais
    if (senhaAtualDigitada !== senhaRealDoBanco) {
      alert("A senha atual digitada está incorreta!");
      return;
    }

    if (novaSenha !== confirmacao) {
      alert("A nova senha e a confirmação não coincidem!");
      return;
    }

    if (novaSenha === senhaAtualDigitada) {
      alert("A nova senha não pode ser igual à senha atual.");
      return;
    }

    // Se passou, desativa botão e manda o PATCH pro Supabase
    const textoOriginal = btnSalvar.textContent;
    btnSalvar.textContent = "Atualizando...";
    btnSalvar.disabled = true;

    try {
      const resposta = await fetch(`${baseUrl}/usuario?id=eq.${idUsuario}`, {
        method: "PATCH",
        headers: headersConfig,
        body: JSON.stringify({ senha: novaSenha }),
      });

      if (!resposta.ok) throw new Error("Erro ao atualizar a senha no banco.");

      alert(
        "Senha atualizada com sucesso! Por segurança, faça o login novamente.",
      );

      // Limpa a sessão e desloga
      localStorage.removeItem("sgm_sessao");
      window.location.href = "../index.html";
    } catch (erro) {
      console.error(erro);
      alert(erro.message);
      btnSalvar.textContent = textoOriginal;
      btnSalvar.disabled = false;
    }
  });

  // Inicia o carregamento
  carregarDadosPerfil();
});
