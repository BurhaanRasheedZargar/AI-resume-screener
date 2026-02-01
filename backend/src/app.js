const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const resumeRoutes = require('./routes/resumeRoutes');
const jobRoutes = require('./routes/jobRoutes');
const matchRoutes = require('./routes/matchRoutes');
const authRoutes = require('./routes/authRoutes');
const app = express();

app.use(helmet());
app.use(cors()); 
app.use(morgan('dev')); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/jobs', jobRoutes); 
app.use('/api/match', matchRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'Resume Screener API'
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

module.exports = app;