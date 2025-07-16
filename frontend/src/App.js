import React, { useState, useEffect } from 'react';
import axios from 'axios'; // <-- IMPORT AXIOS
import {
    Container, Box, Typography, TextField, Button, Radio, RadioGroup,
    FormControlLabel, FormControl, FormLabel, Grid, Paper, Tabs, Tab,
    CircularProgress, Alert, LinearProgress
} from '@mui/material';
import { createTheme, ThemeProvider, responsiveFontSizes } from '@mui/material/styles';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import Plot from 'react-plotly.js';

// --- THEME AND STYLES ---
let theme = createTheme({
    palette: {
        primary: {
            main: '#F57C00', // A vibrant orange
            light: 'rgba(245, 124, 0, 0.08)', // A light orange for backgrounds
        },
        secondary: {
            main: '#B31b1b', // Carnelian Red for headings
        },
        text: {
            primary: '#2c3e50',
            secondary: '#34495e',
        },
        background: {
            default: '#f8f9fa',
            paper: '#FFFFFF',
        },
        action: {
            hover: 'rgba(245, 124, 0, 0.04)' // A very light orange for hover
        }
    },
    typography: {
        fontFamily: 'sans-serif',
        h1: {
            fontWeight: 700,
            color: '#B31b1b',
            textAlign: 'center',
        },
        h2: {
            fontWeight: 600,
            color: '#B31b1b',
            textAlign: 'center',
            marginBottom: '1.5rem',
        },
        h5: {
            color: '#F57C00', // Changed to orange to match buttons
            fontWeight: 600,
            borderBottom: '2px solid #F57C00',
            paddingBottom: '0.5rem',
            marginBottom: '1rem',
        }
    },
});

theme = responsiveFontSizes(theme);

const containerStyles = {
    padding: { xs: 2, md: 4 },
    margin: '2rem auto',
    borderRadius: '15px',
    backgroundColor: 'background.paper',
    border: '1px solid #e9ecef',
    maxWidth: '800px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
};

// --- DATA (Questions, Scoring, Descriptions) ---
const questions = [
    {
        text: 'When talking to a customer…',
        choices: [
            'I maintain eye contact the whole time.',
            'I alternate between looking at the person and looking down.',
            'I look around the room a good deal of the time.',
            'I try to maintain eye contact but look away from time to time.'
        ]
    },
    {
        text: 'If I have an important decision to make…',
        choices: [
            'I think it through completely before deciding.',
            'I go with my gut feelings.',
            'I consider the impact it will have on other people before deciding.',
            'I run it by someone whose opinion I respect before deciding.'
        ]
    },
    {
        text: 'My office or work area mostly has…',
        choices: [
            'Family photos and sentimental items displayed.',
            'Inspirational posters, awards, and art displayed.',
            'Graphs and charts displayed.',
            'Calendars and project outlines displayed.'
        ]
    },
    {
        text: 'If I am having a conflict with a colleague or customer…',
        choices: [
            'I try to help the situation along by focusing on the positive.',
            'I stay calm and try to understand the cause of the conflict.',
            'I try to avoid discussing the issue causing the conflict.',
            'I confront it right away so that it can get resolved as soon as possible.'
        ]
    },
    {
        text: 'When I talk on the phone at work…',
        choices: [
            'I keep the conversation focused on the purpose of the call.',
            'I will spend a few minutes chatting before getting down to business.',
            'I am in no hurry to get off the phone and do not mind chatting about personal things, the weather, and so on.',
            'I try to keep the conversation as brief as possible.'
        ]
    },
    {
        text: 'If a colleague is upset…',
        choices: [
            'I ask if I can do anything to help.',
            'I leave him alone because I do not want to intrude on his privacy.',
            'I try to cheer him up and help him to see the bright side.',
            'I feel uncomfortable and hope he gets over it soon.'
        ]
    },
    {
        text: 'When I attend meetings at work…',
        choices: [
            'I sit back and think about what is being said before offering my opinion.',
            'I put all my cards on the table so my opinion is well known.',
            'I express my opinion enthusiastically, but listen to other\'s ideas as well.',
            'I try to support the ideas of the other people in the meeting.'
        ]
    },
    {
        text: 'When I make presentation to a group…',
        choices: [
            'I am entertaining and often humorous.',
            'I am clear and concise.',
            'I speak relatively quietly.',
            'I am direct, specific and sometimes loud.'
        ]
    },
    {
        text: 'When a client is explaining a problem to me…',
        choices: [
            'I try to understand and empathize with how she is feeling.',
            'I look for the specific facts pertaining to the situation.',
            'I listen carefully for the main issue so that I can find a solution.',
            'I use my body language and tone of voice to show that I understand.'
        ]
    },
    {
        text: 'When I attend training programs or presentations…',
        choices: [
            'I get bored if the person moves too slowly.',
            'I try to be supportive of the speaker, knowing how hard the job is.',
            'I want it to be entertaining as well as informative.',
            'I look for the logic behind what the speaker is saying.'
        ]
    },
    {
        text: 'When I want to get my point across to customers or co-workers…',
        choices: [
            'I listen to their point of view first and then express my ideas gently.',
            'I strongly state my opinion so that they know where I stand.',
            'I try to persuade them without being too forceful.',
            'I explain the thinking and logic behind what I am saying.'
        ]
    },
    {
        text: 'When I am late for an appointment or meeting…',
        choices: [
            'I do not panic but call ahead to say that I will be a few minutes late.',
            'I feel bad about keeping the other person waiting.',
            'I get very upset and rush to get there as soon as possible.',
            'I sincerely apologize once I arrive.'
        ]
    },
    {
        text: 'I set goals and objectives at work that…',
        choices: [
            'I think I can realistically attain.',
            'I feel are challenging and would be exciting to achieve.',
            'I need to achieve as part of a bigger objective.',
            'Will make me feel good when I achieve them.'
        ]
    },
    {
        text: 'When explaining a problem to a colleague from whom I need help…',
        choices: [
            'I explain the problem in as much detail as possible.',
            'I sometimes exaggerate to make my point.',
            'I try to explain how the problem makes me feel.',
            'I explain how I would like the problem to be solved.'
        ]
    },
    {
        text: 'If customers or colleagues are late for an appointment with me…',
        choices: [
            'I keep myself busy by making phone calls or working until they arrive.',
            'I assume they were delayed a bit and do not get upset.',
            'I call to make sure that I have the correct information.',
            'I get upset that the person is wasting my time.'
        ]
    },
    {
        text: 'When I am behind on a project and feel pressure to get it done…',
        choices: [
            'I make a list of everything I need to do, in what order, by when.',
            'I block out everything else and focus 100% on the work I need to do.',
            'I become anxious and have a hard time focusing on my work.',
            'I set a date to get the project done by and go for it.'
        ]
    },
    {
        text: 'When I feel verbally attacked…',
        choices: [
            'I ask the person to stop.',
            'I feel hurt but usually do not say anything about it to them.',
            'I ignore their anger and try to focus on the facts of the situation.',
            'I let them know in strong terms that I do not like their behavior.'
        ]
    },
    {
        text: 'When I see someone whom I like and haven\'t seen recently…',
        choices: [
            'I give him a friendly hug.',
            'Greet but do not shake hands.',
            'Give a firm and quick handshake.',
            'Give an enthusiastic handshake that lasts a few moments.'
        ]
    }
];

const scoringMap = {
    1: { 0: 'Driver', 1: 'Amiable', 2: 'Analytical', 3: 'Expressive' }, 2: { 0: 'Analytical', 1: 'Driver', 2: 'Amiable', 3: 'Expressive' }, 3: { 0: 'Amiable', 1: 'Expressive', 2: 'Analytical', 3: 'Driver' }, 4: { 0: 'Expressive', 1: 'Amiable', 2: 'Analytical', 3: 'Driver' }, 5: { 0: 'Driver', 1: 'Expressive', 2: 'Amiable', 3: 'Analytical' }, 6: { 0: 'Amiable', 1: 'Analytical', 2: 'Expressive', 3: 'Driver' }, 7: { 0: 'Analytical', 1: 'Driver', 2: 'Expressive', 3: 'Amiable' }, 8: { 0: 'Expressive', 1: 'Analytical', 2: 'Amiable', 3: 'Driver' }, 9: { 0: 'Amiable', 1: 'Analytical', 2: 'Driver', 3: 'Expressive' }, 10: { 0: 'Driver', 1: 'Amiable', 2: 'Expressive', 3: 'Analytical' }, 11: { 0: 'Amiable', 1: 'Driver', 2: 'Expressive', 3: 'Analytical' }, 12: { 0: 'Analytical', 1: 'Amiable', 2: 'Driver', 3: 'Expressive' }, 13: { 0: 'Analytical', 1: 'Expressive', 2: 'Driver', 3: 'Amiable' }, 14: { 0: 'Analytical', 1: 'Expressive', 2: 'Amiable', 3: 'Driver' }, 15: { 0: 'Expressive', 1: 'Amiable', 2: 'Analytical', 3: 'Driver' }, 16: { 0: 'Analytical', 1: 'Driver', 2: 'Amiable', 3: 'Expressive' }, 17: { 0: 'Driver', 1: 'Amiable', 2: 'Analytical', 3: 'Expressive' }, 18: { 0: 'Amiable', 1: 'Analytical', 2: 'Driver', 3: 'Expressive' }
};

const styleDescriptions = {
    'Analytical': {
        title: 'Analytical Style',
        keywords: ['Serious', 'Well-organized', 'Systematic', 'Logical', 'Factual', 'Reserved'],
        behaviors: ['Show little facial expression', 'Have controlled body movement with slow gestures', 'Have little inflection in their voice and may tend toward monotone', 'Use language that is precise and focuses on specific details', 'Often have charts, graphs and statistics displayed in their office'],
        dealing_tips: ['Do not speak in a loud or fast-paced voice', 'Be more formal in your speech and manners', 'Present the pros and cons of an idea, as well as options', 'Do not overstate the benefits of something', 'Follow up in writing', 'Be on time and keep it brief', 'Show how your tool has minimum risk']
    },
    'Driver': {
        title: 'Driver Style',
        keywords: ['Decisive', 'Independent', 'Efficient', 'Intense', 'Deliberate', 'Achieving'],
        behaviors: ['Make direct eye contact', 'Move quickly and briskly with purpose', 'Speak forcefully and fast-paced', 'Use direct, bottom-line language', 'Have planning calendars and project outlines displayed in their office'],
        dealing_tips: ['Make direct eye contact', 'Speak at a fast pace', 'Get down to business quickly', 'Arrive on time', 'Do not linger', 'Use ABC', 'Avoid over explanation', 'Be organized and well prepared', 'Focus on the results to be produced']
    },
    'Amiable': {
        title: 'Amiable Style',
        keywords: ['Cooperative', 'Friendly', 'Supportive', 'Patient', 'Relaxed'],
        behaviors: ['Have a friendly facial expression', 'Make frequent eye contact', 'Use non-aggressive, non-dramatic gestures', 'Speak slowly and in soft tones with moderate inflection', 'Use language that is supportive and encouraging', 'Display lots of family pictures in their office'],
        dealing_tips: ['Make eye contact but look away once in a while', 'Speak at a moderate pace and with a softer voice', 'Do not use harsh tone of voice or language', 'Ask them for their opinions and ideas', 'Do not try to counter their ideas with logic alone', 'Encourage them to express any doubts or concerns they may have', 'Avoid pressurizing them to make a decision', 'Mutually agree on all goals, action plans and completion dates']
    },
    'Expressive': {
        title: 'Expressive Style',
        keywords: ['Outgoing', 'Enthusiastic', 'Persuasive', 'Humorous', 'Gregarious', 'Lively'],
        behaviors: ['Use rapid hand and arm gestures', 'Speak quickly with lots of animation and inflection', 'Have a wide range of facial expressions', 'Use language that is persuasive', 'Have a workspace cluttered with inspirational items'],
        dealing_tips: ['Make direct eye contact', 'Have energetic and fast-paced speech', 'Allow time in a meeting for socializing', 'Talk about experiences, people, and opinions as well as the facts', 'Ask about their intuitive sense of things', 'Support your ideas with testimonials from people whom they know and like', 'Paraphrase any agreements made', 'Maintain a balance between fun and reaching objectives']
    }
};


// --- MAIN APP COMPONENT ---
function App() {
    const [step, setStep] = useState('welcome'); // welcome, assessment, results
    const [userInfo, setUserInfo] = useState({ name: '', company: '' });
    const [responses, setResponses] = useState(new Array(questions.length).fill(null));
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [tabIndex, setTabIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false); // For loading state on submit button
    
    // This line is designed to work BOTH locally and on Render
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';


    // This hook scrolls the page to the top when a new step begins
    useEffect(() => {
        if (step === 'assessment' || step === 'results') {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, [step]);

    const handleStart = () => {
        if (userInfo.name && userInfo.company) {
            setError('');
            setStep('assessment');
        } else {
            setError('Please fill out both your name and company.');
        }
    };

    // UPDATED handleSubmit function
    const handleSubmit = async () => {
        if (responses.includes(null)) {
            setError('Please answer all questions before submitting.');
            return;
        }
        setError('');
        setIsSubmitting(true); // Start loading

        try {
            // 1. Prepare the data payload for the backend
            const payload = {
                name: userInfo.name,
                company: userInfo.company,
                responses: responses
            };

            // 2. Send the data to the backend server test
            const cleanApiUrl = API_URL.replace(/\/$/, ''); 
            await axios.post(`${cleanApiUrl}/api/submit`, payload);

            // 3. If successful, calculate results for local display
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

            setResults({ scores, dominantStyles });
            setStep('results');

        } catch (err) {
            // 4. Handle errors if the backend call fails
            console.error("Error submitting assessment:", err);
            setError("There was a problem submitting your results. Please try again later.");
        } finally {
            setIsSubmitting(false); // Stop loading, regardless of outcome
        }
    };

    const handleResponseChange = (questionIndex, responseIndex) => {
        const newResponses = [...responses];
        newResponses[questionIndex] = parseInt(responseIndex);
        setResponses(newResponses);
    };

    const renderWelcome = () => (
        <Paper elevation={3} sx={containerStyles}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 3 }}>
                <img src="/logo.png" alt="Carnelian Logo" style={{ width: '120px', height: 'auto' }} />
                <Typography variant="h1">
                    Personality Style Assessment
                </Typography>
            </Box>
            <Typography variant="h5" align="center" color="text.secondary" sx={{ mb: 4, fontWeight: 'normal' }}>
                Unlock insights into your work style. This quick assessment will reveal your dominant behavioral traits and provide tips for better collaboration.
            </Typography>
            <Box sx={{ maxWidth: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    fullWidth
                    label="Your Name"
                    variant="outlined"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                />
                <TextField
                    fullWidth
                    label="Your Company"
                    variant="outlined"
                    value={userInfo.company}
                    onChange={(e) => setUserInfo({ ...userInfo, company: e.target.value })}
                />
                {error && <Alert severity="error">{error}</Alert>}
                <Button
                    variant="contained"
                    size="large"
                    color="primary"
                    onClick={handleStart}
                    disabled={!userInfo.name || !userInfo.company}
                    startIcon={<RocketLaunchIcon />}
                    sx={{ mt: 2, py: 1.5 }}
                >
                    Start Assessment
                </Button>
            </Box>
        </Paper>
    );

    const renderAssessment = () => {
        const answeredQuestions = responses.filter(r => r !== null).length;
        const progress = (answeredQuestions / questions.length) * 100;

        return (
            <Paper sx={containerStyles}>
                <Box sx={{ mb: 3, position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1, pt: 2 }}>
                    <Typography variant="h2">The Assessment</Typography>
                    <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 1 }}>
                        {answeredQuestions} of {questions.length} questions answered
                    </Typography>
                    <LinearProgress variant="determinate" value={progress} sx={{ height: '8px', borderRadius: '4px' }} />
                </Box>

                {questions.map((q, i) => (
                    <FormControl key={i} component="fieldset" fullWidth sx={{ mb: 3, borderTop: '1px solid #eee', pt: 3 }}>
                        <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary', fontSize: '1.1rem' }}>
                            {`Question ${i + 1}: ${q.text}`}
                        </FormLabel>
                        <RadioGroup
                            value={responses[i]}
                            onChange={(e) => handleResponseChange(i, e.target.value)}
                        >
                            {q.choices.map((choice, j) => {
                                const isSelected = responses[i] === j;
                                return (
                                    <FormControlLabel
                                        key={j}
                                        value={j}
                                        control={<Radio sx={{ display: 'none' }} />}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: '50%',
                                                        border: '2px solid',
                                                        borderColor: isSelected ? 'primary.main' : '#ccc',
                                                        backgroundColor: isSelected ? 'primary.main' : 'transparent',
                                                        mr: 2,
                                                        flexShrink: 0,
                                                    }}
                                                />
                                                {choice}
                                            </Box>
                                        }
                                        sx={{
                                            my: 0.5,
                                            ml: { xs: 0, md: 1 },
                                            mr: { xs: 0, md: 1 },
                                            p: 1.5,
                                            cursor: 'pointer',
                                            border: '2px solid',
                                            borderColor: isSelected ? 'primary.main' : '#ddd',
                                            backgroundColor: isSelected ? 'primary.light' : 'transparent',
                                            borderRadius: 2,
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                backgroundColor: 'action.hover'
                                            },
                                        }}
                                    />
                                );
                            })}
                        </RadioGroup>
                    </FormControl>
                ))}

                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button
                        variant="contained"
                        size="large"
                        color="primary"
                        onClick={handleSubmit}
                        disabled={isSubmitting} // Disable button while submitting
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit & View Results'}
                    </Button>
                </Box>
            </Paper>
        );
    };

    const renderResults = () => {
        if (!results) return <CircularProgress />;

        const { scores, dominantStyles } = results;

        const renderStyleDetails = (style) => {
            const info = styleDescriptions[style];
            return (
                <Box sx={{ mt: 2 }}>
                    <Paper elevation={2} sx={{ p: 2, my: 2, backgroundColor: 'rgba(245, 124, 0, 0.1)' }}>
                        <Typography variant="body1" align="center" fontStyle="italic">
                            <strong>Keywords:</strong> {info.keywords.join(', ')}
                        </Typography>
                    </Paper>
                    <Grid container spacing={{ xs: 2, md: 4 }}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h5">Key Behaviors</Typography>
                            <ul style={{ paddingLeft: '20px', lineHeight: 1.7 }}>
                                {info.behaviors.map((b, i) => <li key={i}>{b}</li>)}
                            </ul>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h5">Tips for Interaction</Typography>
                            <ul style={{ paddingLeft: '20px', lineHeight: 1.7 }}>
                                {info.dealing_tips.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                        </Grid>
                    </Grid>
                </Box>
            );
        };

        return (
            <Paper sx={containerStyles}>
                <Typography variant="h2">Your Assessment Results</Typography>
                <Plot
                    data={[{
                        labels: Object.keys(scores),
                        values: Object.values(scores),
                        type: 'pie',
                        hole: .4,
                        marker: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'] },
                        texttemplate: "%{label}<br>%{percent:.1%}",
                        hoverinfo: "label+percent+value",
                    }]}
                    layout={{
                        showlegend: false,
                        height: 400,
                        margin: { l: 20, r: 20, t: 20, b: 20 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        font: { color: theme.palette.text.primary }
                    }}
                    style={{ width: '100%' }}
                    config={{ responsive: true }}
                />
                <Typography variant="h4" align="center" color="secondary" sx={{ mt: 2, fontWeight: 'bold' }}>
                    {dominantStyles.length > 1 ? 'You have a blend of styles!' : `Your Dominant Style is ${dominantStyles[0]}`}
                </Typography>

                {dominantStyles.length > 1 ? (
                    <Box sx={{ width: '100%', mt: 3 }}>
                        <Tabs value={tabIndex} onChange={(e, newValue) => setTabIndex(newValue)} centered>
                            {dominantStyles.map(style => <Tab key={style} label={style} />)}
                        </Tabs>
                        {renderStyleDetails(dominantStyles[tabIndex])}
                    </Box>
                ) : (
                    <Box sx={{ mt: 3 }}>
                        {renderStyleDetails(dominantStyles[0])}
                    </Box>
                )}
                 <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
                    <Typography variant="body1" color="text.secondary">
                        Thank you for taking the assessment.
                    </Typography>
                </Box>
            </Paper>
        );
    };

    return (
        <ThemeProvider theme={theme}>
            <Container component="main" sx={{ mt: { xs: 2, md: 4 }, mb: 4 }}>
                {step === 'welcome' && renderWelcome()}
                {step === 'assessment' && renderAssessment()}
                {step === 'results' && renderResults()}
            </Container>
        </ThemeProvider>
    );
}

export default App;