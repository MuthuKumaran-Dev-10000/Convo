const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Firebase Admin Initialization
const serviceAccount = require('C:/Users/muthu/Projects/Html/project/convo-74155-firebase-adminsdk-js7hz-fac0240420.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://convo-74155-default-rtdb.firebaseio.com/',
});
const db = admin.database();
const usersRef = db.ref('users');
const videosRef = db.ref('videos');

// Multer configuration for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads'); // File upload directory
    },
    filename: function (req, file, cb) {
        cb(null, uuidv4() + '-' + file.originalname); // Unique file name
    }
});
const upload = multer({ storage: storage });

// Serve login.html and login.css
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/login.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.css'));
});

// Serve signup.html
app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

// Serve home.html
app.get('/home.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('chat message', (data) => {
        io.emit('chat message', data);
        console.log('chat message:', data.message);
    });
});

/// Upload video route
// Upload video route
app.post('/uploadVideo', upload.single('videoFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const { title, description, channelId } = req.body;
        const videoUrl = req.file.path; // Path to the uploaded video file

        const videoId = uuidv4();
        await videosRef.child(videoId).set({
            title,
            description,
            videoUrl,
            channel_id: channelId,
        });

        console.log('Video added to Firebase:', title); // Print action message
        res.status(200).json({ message: 'Video uploaded successfully', videoId });
    } catch (error) {
        console.error('Error uploading video:', error);
        res.status(500).json({ message: 'Error occurred during file upload' });
    }
});

app.get('/videos', async (req, res) => {
    try {
        const snapshot = await videosRef.once('value');
        const videos = [];
        snapshot.forEach((childSnapshot) => {
            const video = childSnapshot.val();
            videos.push(video);
        });
        res.status(200).json(videos);
    } catch (error) {
        console.error('Error retrieving videos:', error);
        res.status(500).json({ message: 'Error occurred' });
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
