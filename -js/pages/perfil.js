document.addEventListener("DOMContentLoaded", () => {

  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
  };


  const sessaoStr = localStorage.getItem("sgm_sessao");
  if (!sessaoStr) return;
  const sessao = JSON.parse(sessaoStr);
  const idUsuario = sessao.id;
  const perfilAvatar = document.getElementById("perfilAvatar");
  const perfilNome = document.getElementById("perfilNome");
  const perfilFuncao = document.getElementById("perfilFuncao");
  const perfilMatricula = document.getElementById("perfilMatricula");
  const perfilContato = document.getElementById("perfilContato");
  const perfilNivel = document.getElementById("perfilNivel");
  const formSenha = document.getElementById("formAlterarSenha");
  const inputSenhaAtual = document.getElementById("senhaAtual");
  const inputNovaSenha = document.getElementById("novaSenha");
  const inputConfirmar = document.getElementById("confirmarSenha");
  const btnSalvar = document.getElementById("btnSalvarSenha");

  let senhaRealDoBanco = "";

  async function carregarDadosPerfil() {
    try {
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

      senhaRealDoBanco = usuarioData.senha;
    } catch (erro) {
      console.error("Falha ao carregar perfil:", erro);
    }
  }

  formSenha.addEventListener("submit", async (e) => {
    e.preventDefault();

    const senhaAtualDigitada = inputSenhaAtual.value.trim();
    const novaSenha = inputNovaSenha.value.trim();
    const confirmacao = inputConfirmar.value.trim();

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

      localStorage.removeItem("sgm_sessao");
      window.location.href = "../index.html";
    } catch (erro) {
      console.error(erro);
      alert(erro.message);
      btnSalvar.textContent = textoOriginal;
      btnSalvar.disabled = false;
    }
  });

  carregarDadosPerfil();
});
