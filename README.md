# 🎫 Help Desk System

Sistema completo de gerenciamento de tickets de suporte técnico.

## 🚀 Tecnologias

### Backend
- Node.js
- Express
- SQLite3
- JWT (autenticação)
- Bcrypt (criptografia de senhas)

### Frontend
- React
- React Router
- Axios
- CSS3

## 📋 Funcionalidades

✅ Autenticação de usuários (Login/Registro)  
✅ Criação e gerenciamento de tickets  
✅ Sistema de comentários  
✅ Categorias personalizadas  
✅ Filtros por status, prioridade e categoria  
✅ Dashboard com estatísticas  
✅ Interface responsiva  

## 🔧 Instalação

### Pré-requisitos

- Node.js (v14 ou superior)
- npm ou yarn

### Backend

```bash
cd backend
npm install
node src/database/init.js
npm run dev

# Iniciar servidor
npm run dev

# Reinicializar banco (limpar tudo)
npm run init-db

# Criar backup simples
npm run backup

# Criar backup avançado (com limpeza)
npm run backup-advanced

# Restaurar backup
npm run restore
