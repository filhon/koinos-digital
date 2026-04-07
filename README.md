# Koinos - SaaS de Gestão para Igrejas

Bem-vindo ao repositório do **Koinos**, o SaaS moderno de gestão para igrejas evangélicas brasileiras, focado em agilidade, segurança LGPD e design superior.

## Como rodar o projeto localmente

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure suas variáveis de ambiente:
   ```bash
   cp .env.example .env.local
   ```
   _Atenção: A chave `ENCRYPTION_KEY` precisa ter exatamente 32 caracteres (para o AES-256)._
4. Inicie o Supabase localmente (Docker é obrigatório para rodar esse comando):
   ```bash
   npx supabase start
   ```
5. Inicie o servidor de desenvolvimento do Next.js:
   ```bash
   npm run dev
   ```

## Como aplicar migrations e seed

As migrations e os arquivos de seed são aplicados automaticamente na primeira vez em que você roda o `npx supabase start`.
Caso precise resetar seu banco de dados e reaplicar as alterações (limpando e reiniciando o seed):

```bash
npx supabase db reset
```

## Credenciais de Teste (Seed)

Rodando o seed com o Supabase local, o banco será pré-populado com os usuários descritos abaixo, permitindo que você navegue pela aplicação simulando diferentes permissões.

**Senha de acesso padrão para todos os usuários:** `Senha123`

| Papel                           | E-mail de acesso       |
| ------------------------------- | ---------------------- |
| **Pastor (Liderança/Fundador)** | `pastor@teste.com`     |
| **Presbítero**                  | `presbitero@teste.com` |
| **Diácono**                     | `diacono@teste.com`    |
| **Tesoureiro**                  | `tesoureiro@teste.com` |
| **Líder**                       | `lider@teste.com`      |
| **Membro**                      | `membro@teste.com`     |
| **Visitante 1**                 | `visitante1@teste.com` |
| **Visitante 2**                 | `visitante2@teste.com` |

Para acesso do usuário com hierarquia máxima dentro do banco, inicie logando como `pastor@teste.com`.
