document.addEventListener("DOMContentLoaded", () => {
    const baseUrl =
        "https://umvtsquzpugempndwitx.supabase.co/rest/v1";

    const apiKey =
        "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";

    const headersConfig = {
        "Content-Type": "application/json",
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        Prefer: "return=representation"
    };

    const formulario = document.getElementById("formAlterarSenha");
    const campoNovaSenha = document.getElementById("novaSenha");
    const campoConfirmarSenha =
        document.getElementById("confirmarSenha");

    if (!formulario || !campoNovaSenha || !campoConfirmarSenha) {
        console.error("Elementos do formulário de senha não encontrados.");
        return;
    }

    formulario.addEventListener("submit", async (event) => {
        event.preventDefault();

        const novaSenha = campoNovaSenha.value.trim();
        const confirmarSenha = campoConfirmarSenha.value.trim();

        // Validações
        if (novaSenha.length < 6) {
            alert("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        if (novaSenha !== confirmarSenha) {
            alert("As senhas não coincidem!");
            return;
        }

        let sessao;

        try {
            const sessaoStr = localStorage.getItem("sgm_sessao");

            if (!sessaoStr) {
                alert("Sessão não encontrada. Faça login novamente.");
                window.location.replace("../index.html");
                return;
            }

            sessao = JSON.parse(sessaoStr);

        } catch (erro) {
            console.error("Erro ao recuperar a sessão:", erro);
            alert("Não foi possível identificar o usuário.");
            return;
        }

        const idUsuario = sessao.id;

        if (!idUsuario) {
            alert("ID do usuário não encontrado na sessão.");
            return;
        }

        const botao = formulario.querySelector(
            'button[type="submit"]'
        );

        if (botao) botao.disabled = true;

        try {
            const resposta = await fetch(
                `${baseUrl}/usuario?id=eq.${encodeURIComponent(idUsuario)}`,
                {
                    method: "PATCH",
                    headers: headersConfig,
                    body: JSON.stringify({
                        senha: novaSenha,
                        precisa_trocar_senha: false
                    })
                }
            );

            const textoResposta = await resposta.text();

            let dados = [];

            if (textoResposta) {
                try {
                    dados = JSON.parse(textoResposta);
                } catch {
                    dados = [];
                }
            }

            if (!resposta.ok) {
                console.error("Erro do Supabase:", textoResposta);
                throw new Error("Não foi possível atualizar a senha.");
            }

            if (!Array.isArray(dados) || dados.length === 0) {
                throw new Error(
                    "Nenhum usuário foi atualizado. Verifique as permissões do banco."
                );
            }

            alert("Senha alterada com sucesso!");

            formulario.reset();

            window.location.replace("dashboard.html");

        } catch (erro) {
            console.error("Erro ao alterar senha:", erro);
            alert(erro.message || "Erro ao alterar a senha.");

        } finally {
            if (botao) botao.disabled = false;
        }
    });
});
