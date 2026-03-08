# Vivioke Desktop (Electron)

Este projeto está configurado para distribuição desktop com Electron.

## Pré-requisitos

- Windows 10/11 (para gerar instalador `.exe`)
- Node.js 20+
- Dependências instaladas (`npm install`)

## Comandos

### Executar em modo desktop durante desenvolvimento

```powershell
npm run electron:dev
```

- Sobe o servidor local na porta `3002`
- Abre o app em janela desktop Electron

### Gerar pacote sem instalador (pasta executável)

```powershell
npm run electron:pack
```

Saída principal:

- `release/win-unpacked/`

### Gerar instalador Windows (.exe)

```powershell
npm run electron:dist
```

Saída principal:

- `release/Vivioke-Setup-<versao>.exe`

## Observações

- O build está configurado com assinatura automática desabilitada (`CSC_IDENTITY_AUTO_DISCOVERY=false`) para funcionar em ambientes sem certificado de code signing.
- O app inicia o backend Node interno em produção ao abrir o executável desktop.
- O menu da janela fica oculto por padrão.
- O instalador NSIS está configurado para criar atalho na Área de Trabalho e no Menu Iniciar.
- O script `criar-atalho-vivioke.ps1` agora prioriza abrir o app desktop instalado; se não encontrar, cai para modo local (`npm run start`).

## Arquivos de configuração

- `electron/main.cjs`
- `electron/preload.cjs`
- `package.json` (scripts `electron:*` e bloco `build`)
