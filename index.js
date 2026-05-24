const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let users = [];
let messages = [];

app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: 'Пользователь уже существует' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = { id: Date.now().toString(), username, email, password_hash: hash };
    users.push(user);
    const token = jwt.sign({ id: user.id }, 'vox_secret');
    res.json({ token, user: { id: user.id, username: user.username } });
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user) return res.status(401).json({ message: 'Неверный логин или пароль' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Неверный логин или пароль' });
    const token = jwt.sign({ id: user.id }, 'vox_secret');
    res.json({ token, user: { id: user.id, username: user.username } });
});

app.get('/api/search', (req, res) => {
    const { query } = req.query;
    const result = users.filter(u => u.username.includes(query)).slice(0, 20);
    res.json({ users: result });
});

app.post('/api/messages/send', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Нет токена' });
    const decoded = jwt.verify(token, 'vox_secret');
    const msg = { id: Date.now().toString(), senderId: decoded.id, ...req.body };
    messages.push(msg);
    res.json(msg);
});

app.get('/api/messages/:chatId', (req, res) => {
    const chatMessages = messages.filter(m => m.chatId === req.params.chatId);
    res.json(chatMessages);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('VOX running'));
