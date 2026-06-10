# 📚 Documentação da API

Base URL: `http://localhost:5000/api`

## 🔐 Autenticação

### Registrar Usuário

```http
POST /auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "123456"
}

### Resposta ###
{
  "message": "Usuário criado com sucesso!",
  "userId": 2
}

### Login ###

POST /auth/login
Content-Type: application/json

{
  "email": "joao@email.com",
  "password": "123456"
}

### Resposta ###
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "name": "João Silva",
    "email": "joao@email.com",
    "role": "user"
  }
}

### 🎫 Tickets ###

### Listar Tickets ###

GET /tickets?status=open&priority=high&category_id=1
Authorization: Bearer {token}

### Criar Ticket ###

POST /tickets
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Computador não liga",
  "description": "O computador da sala 205 não está ligando",
  "priority": "high",
  "category_id": 1
}

### Detalhes do Ticket ###

GET /tickets/:id
Authorization: Bearer {token}

### Atualizar Ticket ###

PUT /tickets/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in_progress"
}


### 💬 Comentários ###

### Listar Comentários ###

GET /tickets/:id/comments
Authorization: Bearer {token}

### Adicionar Comentário ###

POST /tickets/:id/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Estou verificando o problema agora"
}

### 📊 Categorias ###

GET /categories
Authorization: Bearer {token}


### 📈 Dashboard ### 

GET /dashboard/stats
Authorization: Bearer {token}

### Resposta ###
{
  "totalTickets": 45,
  "openTickets": 12,
  "inProgressTickets": 8,
  "closedTickets": 25,
  "recentTickets": [...]
}


---

## **✅ Checklist Final**

✅ `.gitignore` criado  
✅ Repositório Git inicializado  
✅ Repositório no GitHub criado  
✅ Código enviado para o GitHub  
✅ README.md completo  
✅ SQLite configurado e funcionando  
✅ Scripts úteis criados  
✅ Documentação da API criada  

---

## **🎉 Pronto!**

Seu projeto está:
- ✅ Versionado no Git
- ✅ No GitHub
- ✅ Com banco SQLite funcionando
- ✅ Totalmente documentado

**Me confirme se conseguiu subir para o GitHub!** 🚀
