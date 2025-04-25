const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

function getOAuth2Client() {
    return new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: 'https://yourdomain.com/auth/callback'
    });
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/auth/google', async (req, res) => {
    try {
        const client = await authenticate({
            scopes: SCOPES,
            keyfilePath: CREDENTIALS_PATH,
        });

        if (client.credentials) {
            await saveCredentials(client);
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ success: false, error: 'Authentication failed' });
    }
});

app.get('/auth/callback', async (req, res) => {
    try {
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(req.query.code);
        await saveCredentials({ credentials: tokens });
        res.redirect('/');
    } catch (error) {
        console.error('Error getting tokens:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

app.get('/auth/status', async (req, res) => {
    try {
        const client = await loadSavedCredentialsIfExist();
        res.json({ authenticated: !!client });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check auth status' });
    }
});

app.get('/calendar/events', async (req, res) => {
    try {
        const client = await loadSavedCredentialsIfExist();
        if (!client) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const calendar = google.calendar({ version: 'v3', auth: client });
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });

        res.json(response.data.items);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 