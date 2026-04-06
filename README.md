# FitGen ⚡

Gerador de treinos personalizados com IA, usando **Next.js 14**, **Tailwind CSS** e a API do **Grok (xAI)**.

## Pré-requisitos

- [Node.js 18+](https://nodejs.org)
- Chave de API do Grok

## Como obter a chave de API

1. Acesse [console.x.ai](https://console.x.ai)
2. Crie uma conta ou faça login
3. Vá em **API Keys** e gere uma nova chave
4. Copie a chave gerada

## Configuração

1. Clone ou baixe este repositório
2. Abra o arquivo `.env.local` na raiz do projeto
3. Substitua `sua_chave_aqui` pela sua chave real:

```env
XAI_API_KEY=xai-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Instalação e execução

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## Build para produção

```bash
npm run build
npm start
```

## Estrutura do projeto

```
fitgen/
├── app/
│   ├── api/generate/route.ts   # Route handler — chama o Grok
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Página principal
├── components/
│   ├── WorkoutForm.tsx          # Formulário de configuração
│   ├── WorkoutResult.tsx        # Exibição do treino gerado
│   └── LoadingState.tsx         # Animação de carregamento
├── types/
│   └── workout.ts               # Tipos TypeScript
├── .env.local                   # Variáveis de ambiente (não versionar)
└── README.md
```

## Funcionalidades

- Formulário com 5 parâmetros: grupo muscular, equipamento, tempo, nível e objetivo
- Geração de treinos estruturados em JSON via Grok (grok-3-mini)
- Exibição visual com cards por exercício (séries, reps, descanso, dica)
- Copiar treino completo como texto
- Gerar novo treino com os mesmos parâmetros
- Dark mode completo com design estilo app de academia
- Totalmente responsivo para mobile

## Variáveis de ambiente

| Variável      | Descrição                  | Onde obter         |
|---------------|----------------------------|--------------------|
| `XAI_API_KEY` | Chave de API do Grok (xAI) | console.x.ai       |

> **Atenção:** Nunca exponha a `XAI_API_KEY` no frontend. Todas as chamadas à API são feitas server-side pelo route handler.
