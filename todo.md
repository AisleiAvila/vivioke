# Vivioke — Backlog Atualizado

## ✅ Entregue recentemente

### Produto e UX

- [x] Tema visual festivo global (cores vivas + fundos animados)
- [x] Transições de rota com slide/fade
- [x] Efeitos de celebração (confete/light burst) no resultado
- [x] Fundo com artistas (caricaturas PNG) com rotação automática
- [x] Camada translúcida para manter imagem de fundo visível com legibilidade

### Fluxo de música e pontuação

- [x] Lista com colunas na ordem: Código, Música, Artista
- [x] Ordenação por todas as colunas da lista
- [x] Indicador visual da coluna/direção de ordenação
- [x] Exibir tela de pontuação imediatamente ao fim do vídeo
- [x] Contador animado de pontos com som a cada incremento
- [x] Ajuste de velocidade da contagem para efeito dramático

### Base técnica

- [x] Parsing de músicas via `media/BD.ini` com validação de `.mp4`
- [x] URL de mídia com `encodeURIComponent` para nomes com caracteres especiais
- [x] Ajustes no carregamento de analytics para evitar placeholders inválidos

---

## 🚀 Prioridade Alta (próximos passos)

### 1) Estabilidade de ambiente e execução

- [ ] Validar variáveis de ambiente com schema (startup check)
- [ ] Criar modo degradado local para OAuth (sem bloquear `npm run start`)
- [ ] Exibir mensagem amigável na UI quando autenticação externa não estiver configurada

### 2) Segurança e robustez backend

- [ ] Adicionar `helmet` e `express-rate-limit`
- [ ] Ajustar limites de payload por rota (evitar `50mb` global)
- [ ] Padronizar tratamento de erros da API (payload consistente)

### 3) Persistência de performance

- [ ] Garantir gravação da performance ao final da música (com retry/idempotência)
- [ ] Exibir feedback de sucesso/falha de gravação
- [ ] Salvar histórico de melhores pontuações por música/usuário

---

## ⚡ Prioridade Média

### 4) Performance frontend

- [ ] Implementar code splitting por rota para reduzir bundle inicial
- [ ] Otimizar carregamento de vídeo e assets visuais
- [ ] Melhorar estratégia de cache de arquivos estáticos

### 5) Evolução da tela de músicas

- [ ] Mover paginação/ordenação para backend (escala)
- [ ] Adicionar preview rápido de música (trecho curto)
- [ ] Melhorar feedback de busca vazia com sugestões

### 6) Áudio e pontuação

- [ ] Refinar algoritmo de score por estabilidade/rítmica
- [ ] Ajustar sensibilidade por perfil de voz
- [ ] Adicionar indicadores de latência e qualidade de captura

---

## 🧪 Qualidade e testes

### 7) Cobertura de testes

- [ ] Testes de integração para rotas tRPC principais
- [ ] Testes de fluxo E2E: selecionar música → cantar → pontuar
- [ ] Testes de regressão para score animado e redirecionamento ao fim do vídeo

### 8) Pipeline de qualidade

- [ ] Adicionar script de lint no `package.json`
- [ ] Incluir cobertura de testes no CI
- [ ] Definir gates mínimos (build + test + lint)

---

## 📱 Acessibilidade e produto

### 9) Acessibilidade

- [ ] Melhorar contraste dinâmico sobre fundos com imagem
- [ ] Adicionar `aria-live` para contador de pontuação
- [ ] Revisar navegação por teclado nas telas principais

### 10) Métricas de uso

- [ ] Instrumentar eventos (play, fim, score, erros de microfone)
- [ ] Criar painel básico de métricas de jornada
- [ ] Monitorar taxa de abandono por etapa

---

## 📘 Documentação

- [ ] Atualizar README com setup local completo (incluindo OAuth opcional)
- [ ] Documentar variáveis de ambiente obrigatórias e opcionais
- [ ] Publicar guia de troubleshooting (porta, cache, mídia, auth)
