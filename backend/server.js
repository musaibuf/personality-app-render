const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001; // Use a different port than the frontend

// Middleware
app.use(cors()); // Allow requests from your React app
app.use(express.json()); // Allow the server to understand JSON data

// The scoring map, same as in your frontend
const scoringMap = {
    1: { 0: 'Driver', 1: 'Amiable', 2: 'Analytical', 3: 'Expressive' }, 2: { 0: 'Analytical', 1: 'Driver', 2: 'Amiable', 3: 'Expressive' }, 3: { 0: 'Amiable', 1: 'Expressive', 2: 'Analytical', 3: 'Driver' }, 4: { 0: 'Expressive', 1: 'Amiable', 2: 'Analytical', 3: 'Driver' }, 5: { 0: 'Driver', 1: 'Expressive', 2: 'Amiable', 3: 'Analytical' }, 6: { 0: 'Amiable', 1: 'Analytical', 2: 'Expressive', 3: 'Driver' }, 7: { 0: 'Analytical', 1: 'Driver', 2: 'Expressive', 3: 'Amiable' }, 8: { 0: 'Expressive', 1: 'Analytical', 2: 'Amiable', 3: 'Driver' }, 9: { 0: 'Amiable', 1: 'Analytical', 2: 'Driver', 3: 'Expressive' }, 10: { 0: 'Driver', 1: 'Amiable', 2: 'Expressive', 3: 'Analytical' }, 11: { 0: 'Amiable', 1: 'Driver', 2: 'Expressive', 3: 'Analytical' }, 12: { 0: 'Analytical', 1: 'Amiable', 2: 'Driver', 3: 'Expressive' }, 13: { 0: 'Analytical', 1: 'Expressive', 2: 'Driver', 3: 'Amiable' }, 14: { 0: 'Analytical', 1: 'Expressive', 2: 'Amiable', 3: 'Driver' }, 15: { 0: 'Expressive', 1: 'Amiable', 2: 'Analytical', 3: 'Driver' }, 16: { 0: 'Analytical', 1: 'Driver', 2: 'Amiable', 3: 'Expressive' }, 17: { 0: 'Driver', 1: 'Amiable', 2: 'Analytical', 3: 'Expressive' }, 18: { 0: 'Amiable', 1: 'Analytical', 2: 'Driver', 3: 'Expressive' }
};

// The main API endpoint that the frontend will call
app.post('/api/submit', async (req, res) => {
    try {
        const { name, company, responses } = req.body;

        // --- Calculate Scores ---
        const scores = { 'Driver': 0, 'Analytical': 0, 'Amiable': 0, 'Expressive': 0 };
        responses.forEach((responseIndex, i) => {
            if (responseIndex !== null) {
                const questionNum = i + 1;
                const style = scoringMap[questionNum][responseIndex];
                if (style) scores[style]++;
            }
        });
        const maxScore = Math.max(...Object.values(scores));
        const dominantStyles = Object.keys(scores).filter(s => scores[s] === maxScore);

        // --- Prepare Data for Google Sheets ---
        const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
        
        const totalQuestions = responses.length;
        const percentageScores = {
            Driver: `${((scores.Driver / totalQuestions) * 100).toFixed(1)}%`,
            Analytical: `${((scores.Analytical / totalQuestions) * 100).toFixed(1)}%`,
            Amiable: `${((scores.Amiable / totalQuestions) * 100).toFixed(1)}%`,
            Expressive: `${((scores.Expressive / totalQuestions) * 100).toFixed(1)}%`,
        };

        const letterResponses = responses.map(r => r !== null ? String.fromCharCode(65 + r) : '');

        const dataToSave = [
            timestamp,
            name,
            company,
            dominantStyles.join(' & '),
            percentageScores.Driver,      // Use percentage
            percentageScores.Analytical, // Use percentage
            percentageScores.Amiable,    // Use percentage
            percentageScores.Expressive, // Use percentage
            ...letterResponses
        ];


        // --- Authenticate and Append to Sheet ---
        const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_CREDENTIALS);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: 'https://www.googleapis.com/auth/spreadsheets',
        });
        const sheets = google.sheets({ version: 'v4', auth });

        await sheets.spreadsheets.values.append({
            spreadsheetId: '1_3tGeu3fhqtNrg62Z2YTsjgOin419n--G1Z6B0ujxUM', // <-- IMPORTANT: REPLACE THIS
            range: 'Sheet1!A:A',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [dataToSave],
            },
        });

        console.log('Data saved to Google Sheets successfully.');
        res.status(200).json({ message: 'Assessment submitted successfully!' });

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Failed to submit assessment.', error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server is up and listening on port ${PORT}`);
});