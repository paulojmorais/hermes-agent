# Diagnóstico — agente cloud responde "funciono com Hermes Agent da Nous Research"

> Estado: **a resolver** (troubleshoot na cloud). Contexto: sessão nova iniciada no
> workspace da cloud, o agente auto-identifica-se bem na 1ª parte ("Sou o CEODigital
> Agent") mas mantém "funciono com o Hermes Agent da Nous Research".

## Causa raiz (diagnóstico)

O `default_soul.py` do fork (HEAD) **já está branded**:
```
You are CEODigital Agent, an AI assistant created by CEODigital.
```
Sem qualquer menção a "Hermes Agent da Nous Research". 

Portanto a resposta "funciono com o Hermes Agent da Nous Research" **NÃO vem do
`default_soul.py` atual** — vem do **`SOUL.md` antigo persistido** no `HERMES_HOME`
da máquina/workspace da cloud. O `SOUL.md` é **semeado no primeiro run/install
e NUNCA é reescrito** por uma instalação nova nem por uma sessão nova.

**Sessão nova ≠ home novo.** O `HERMES_HOME` persiste entre sessões; um novo
contexto de chat não recria o home nem reescreve o `SOUL.md`.

## Não é (só) a wheel
A instância que responde "CEODigital Agent" já corre uma **versão com a branding**
(por isso o `default_soul.py` entra). Mas o **SOUL.md velho em disco** persiste e
sobrepõe-se. Novo wheel ajuda a ter a persona nova no código, mas **não reescreve
o SOUL.md de uma home existente**.

## Verificação na cloud
```bash
hermes --version                                # versão (esperada: 0.20.4+)
echo "$HERMES_HOME"                             # ou default ~/.hermes
cat "$HERMES_HOME/SOUL.md" 2>/dev/null || cat ~/.hermes/SOUL.md
pip show hermes-agent 2>/dev/null | grep -E "Version|Location"
```

## Fix definitivo (na cloud)
```bash
H="$HERMES_HOME"; [ -z "$H" ] && H="$HOME/.hermes"
rm -f "$H/SOUL.md"      # apaga o SOUL antigo p/ ser re-semeado com o branding

# (se não for re-semeado automaticamente na próxima execução)
mkdir -p "$H"
printf '%s\n' "You are CEODigital Agent, an AI assistant created by CEODigital." > "$H/SOUL.md"
```
Depois: **novo contexto** (a carregar o SOUL novo).

> Nota: o texto "created by CEODigital" do SOUL deve coincidir com o
> `default_soul.py` do fork (0.20.4+, já mergeado). Não incluir "Hermes Agent da
> Nous" em nenhuma string de persona.

## Entregável pós-fix
O agente na cloud deve auto-identificar-se **apenas** como "CEODigital Agent,
created by CEODigital" — sem referência ao Hermes/Nous.