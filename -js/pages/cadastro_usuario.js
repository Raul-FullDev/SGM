document.getElementById("userForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    // 1. Capturando os elementos de forma segura
    const nome = document.getElementById("userName").value;
    const matricula = document.getElementById("userRegistration").value;
    const contato = document.getElementById("userContact").value;
    const funcao = document.getElementById("userFunction").value;
    const senha = document.getElementById("userPassword").value;
    const nivel = document.getElementById("userLevel").value;

    // 2. Montando o objeto exatamente igual às colunas do Supabase
    const novoUsuario = {
      nome: nome,
      matricula: matricula,
      contato: contato,
      funcao: funcao,
      senha: senha,
      id_papel: Number(nivel), // Corrigido de 'id_nivel_usuario' para 'id_papel'
    };

    if (contato.length > 12){
      alert("Seu número de telefone passa do limite de 12 caracteres");
      return;
    }

    if (contato.length < 12){
      alert("Digite um número valido")
      return;
    }

    try {
        const checkResponse = await fetch(`https://akbqnlvyfravlglouoqs.supabase.co/rest/v1/usuario?contato=eq.${encodeURIComponent(contato)}`, {
            method: 'GET',
            headers: {
                "apikey": "sb_publishable_1c5c9HTR_Hcf3KF5SX22NQ_wNXFADKK",
                "Authorization": "Bearer sb_publishable_1c5c9HTR_Hcf3KF5SX22NQ_wNXFADKK"
                }
            });

            const checagemContanto = await checkResponse.json();

            if (checagemContanto.length > 0){
                alert("O número inserido já foi cadastrado");
                return;
            }

            } catch (error) {
            console.error("Erro na verificação de contato:", error);
                alert("Erro ao verificar duplicidade de contato.");
                return;
            }


// async function carregarSetores() {
//         try {
//             // Faz o GET na tabela 'local'
//             const resposta = await fetch(`${baseUrl}/local?select=*`, {
//                 method: 'GET',
//                 headers: headersConfig
//             });

//             if (!resposta.ok) throw new Error("Erro ao buscar setores");

//             const setores = await resposta.json();
            
//             // Limpa o HTML atual
//             listaSetores.innerHTML = '';

//             // Se não tiver setor, mostra mensagem vazia
//             if (setores.length === 0) {
//                 listaSetores.innerHTML = '<p>Nenhum setor cadastrado ainda.</p>';
//                 return;
//             }

//             // Injeta o HTML para cada setor encontrado
//             setores.forEach(setor => {
//                 const cardHtml = `
//                     <article class="card-setor">
//                       <div class="cabecalho-card-setor">
//                         <div class="informacoes-setor">
//                           <h2>${setor.setor}</h2>
//                           <p class="responsavel-setor">
//                             ID do Banco: <span>#${setor.id}</span>
//                           </p>
//                         </div>
//                         <div class="icone-setor" aria-hidden="true">
//                           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
//                             <path d="M4 20V10l8-6 8 6v10"></path>
//                             <path d="M9 20v-6h6v6"></path>
//                             <path d="M8 10h.01"></path>
//                             <path d="M12 10h.01"></path>
//                             <path d="M16 10h.01"></path>
//                           </svg>
//                         </div>
//                       </div>
//                     </article>
//                 `;
//                 listaSetores.innerHTML += cardHtml;
//             });

//         } catch (erro) {
//             console.error("Falha ao carregar setores:", erro);
//         }
//     }

    console.log("Enviando usuário:", novoUsuario);

    // 3. Fazendo a requisição (POST) para o Supabase
    fetch("https://umvtsquzpugempndwitx.supabase.co/rest/v1/usuario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb",
        Authorization: "Bearer sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb",
        Prefer: "return=representation", // Faz o Supabase devolver os dados inseridos na resposta
      },
      body: JSON.stringify(novoUsuario),
    })
      .then(async (response) => {
        const respostaText = await response.text();

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${respostaText}`);
        }

        return respostaText ? JSON.parse(respostaText) : {};
      })
      .then((dadosInseridos) => {
        console.log("Usuário cadastrado com sucesso:", dadosInseridos);
        alert("Usuário cadastrado com sucesso!");

        // Opcional: Limpar o formulário após o sucesso
        document.getElementById("userForm").reset();

        // Opcional: Redirecionar para a tela de listagem
        // window.location.href = 'usuarios.html';
      })
      .catch((error) => {
        console.error("Falha ao salvar no banco:", error);
        alert("Ocorreu um erro ao cadastrar. Verifique o console.");
      });
});
