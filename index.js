require('./utils');

const express = require('express');
require('dotenv').config();
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const passwordValidator = require('password-validator');

const app = express();

const port = process.env.PORT || 3000;
const expireTime = 1000 * 60 * 60; // 1 hour
const database = include('databaseConnection');
const db_utils = include('database/db_utils');
const db_users = include('database/users');

const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: false }));

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@cluster0.lbwzy87.mongodb.net/sessions`,
    crypto: {
        secret: mongodb_session_secret
    }
})

app.use(session({
    secret: node_session_secret,
    store: mongoStore, //default is memory store 
    saveUninitialized: false,
    resave: true
}
));

function isValidSession(req) {
    if (req.session.authenticated) {
        return true;
    }
    return false;
}

function sessionValidation(req, res, next) {
    if (!isValidSession(req)) {
        req.session.destroy();
        res.redirect('/login');
        return;
    }
    else {
        next();
    }
}

const schema = new passwordValidator();
schema
    .is().min(10)
    .has().uppercase()
    .has().lowercase()
    .has().digits()
    .has().symbols();

app.get('/', async (req, res) => {
    if (isValidSession(req)) {
        res.render('loggedin', { username: req.session.username });
    } else {
        res.render('index');
    }
});

app.get('/signup', (req, res) => {
    res.render('signup', { error: '' });
});
app.post('/submit_user', async (req, res) => {
    const { username, email, password } = req.body;

    // Check if any field is empty
    if (!username || !email || !password) {
        const missingField = !username ? 'username' : !email ? 'email' : 'password';
        res.render('signup', { error: `Please enter ${missingField}` });
        return;
    }

    // Validate the password
    if (!schema.validate(password)) {
        res.render('signup', { error: 'Password must be at least 10 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one symbol.' });
        return;
    }

    try {
        // Check if the email is already registered
        const existingUser = await db_users.getUserByEmail(email);
        if (existingUser) {
            res.render('signup', { error: 'Email already exists. Please use a different email.' });
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create the user
        await db_users.createUser({ username, email, hashedPassword });

        console.log('User created');
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Internal Server Error');
        return;
    }

    res.redirect('/login');
});

app.post('/create-group', async (req, res) => {
    try {
        // Fetch list of users to display in the form
        const users = await db_users.getAllUsers();
        
        res.render('createGroup', { users: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/creatinggroup', async (req, res) => {
    const groupName = req.body.name;
    let selectedUsers = req.body.selectedUsers; // Assuming 'selectedUsers' is an array of selected user IDs
    selectedUsers = Array.isArray(selectedUsers) ? selectedUsers : selectedUsers ? [selectedUsers] : [];

    // Check if the group name is provided
    if (!groupName) {
        res.status(400).send('Group name is required');
        console.log(groupName);
        return;
    }

    try {
        // Call the SQL function to create a group
        const groupId = await db_users.createGroup(groupName);

        // Add selected users to the group
        await db_users.addUserToGroup(groupId, selectedUsers);

        // Assuming the group is created and users are added successfully
        res.redirect('/groups');
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/add-members', async (req, res) => {
    const room_id = req.body.room_id;
    let selectedUsers = req.body.selectedUsers; // Assuming 'selectedUsers' is an array of selected user IDs
    selectedUsers = Array.isArray(selectedUsers) ? selectedUsers : selectedUsers ? [selectedUsers] : [];

    // Check if any users are selected
    if (!selectedUsers || selectedUsers.length === 0) {
        res.status(400).send('No users selected');
        return;
    }

    try {
        // Add selected users to the group
        await db_users.addUserToGroup(room_id, selectedUsers);

        // Redirect back to the group chat page
        res.redirect(`/group-chat/${room_id}`);
    } catch (error) {
        console.error('Error adding members to group:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/login', (req, res) => {
    res.render('login', { error: '' });
});

app.post('/loggingin', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        const results = await db_users.findUsers(username, null);

        if (results.length === 0) {
            res.redirect('/login?error=true');
            return;
        } else if (results.length > 1) {
            console.error("Duplicate users found");
            res.redirect('/login?error=true');
            return;
        } else {
            const user = results[0];
            
            // Ensure the user object has the password field
            if (!user.password_hash) {
                console.error("Password hash not found in user object");
                res.redirect('/login?error=true');
                return;
            }

            if (bcrypt.compareSync(password, user.password_hash)) {
                req.session.authenticated = true;
                req.session.username = user.username;
                req.session.email = user.email;
                req.session.user_id = user.user_id;
                req.session.cookie.maxAge = expireTime;
                res.redirect('/loggedin');
            } else {
                res.redirect('/login?error=true');
            }
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/loggedin', (req, res) => {
    if (isValidSession(req)) {
        res.render('loggedin', { username: req.session.username });
    } else {
        res.redirect('/login');
    }
});


app.use('/groups', sessionValidation);
app.get('/groups', async (req, res) => {
    try {
        // Retrieve user_id from session
        const user_id = req.session.user_id;

        if (!user_id) {
            res.status(400).send('User ID is required');
            return;
        }

        // Fetch groups based on user_id
        const groups = await db_users.getGroupsData(user_id);

        // Iterate through groups to count unread messages for each group
        for (const group of groups) {
            const mostRecentReadMessageId = await db_users.getMostRecentReadMessageId(group.room_user_id);
            if (mostRecentReadMessageId !== null) {
                group.unreadMessagesCount = await db_users.countUnreadMessages(group.room_user_id, mostRecentReadMessageId);
            } else {
                group.unreadMessagesCount = 0; // Set unreadMessagesCount to 0 if no most recent read message found
            }
        }

        res.render('groups', { groups: groups });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/group-chat/:room_id', async (req, res) => {
    try {
        const room_id = req.params.room_id;
        const user_id = req.session.user_id;
        
        // Retrieve group data based on room_id
        const group = await db_users.getGroupData(room_id);
        const members = await db_users.getAllUsers();

        if (!group) {
            res.status(404).send('Group not found');
            return;
        }

        // Fetch messages for the group, including reactions
        const messages = await db_users.getMessagesWithReactionsByRoomId(room_id, user_id);
        // Render the group chat page with group data and messages
        res.render('gc', { groupName: group.name, messages: messages, members: members, room_id: room_id});
    } catch (error) {
        console.error('Error fetching group chat:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/send-message', async (req, res) => {
    const user_id = req.session.user_id;
    const room_id = req.body.room_id;
    const message = req.body.message;

    room_user_id = await db_users.getRoomUserId(room_id, user_id);
    console.log("Room user id:" + room_user_id);

    console.log(user_id);
    console.log({room_id, message});

    // Check if the message is provided
    if (!message) {
        res.status(400).send('Message is required');
        return;
    }

    try {
        // Call the SQL function to send a message
        await db_users.sendMessage(room_user_id, message);

        // Assuming the message is sent successfully
        res.redirect(`/group-chat/${room_id}`);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/add-reaction', async (req, res) => {
    try {
        const { message_id, emoji } = req.body;
        const user_id = req.session.user_id;

        console.log({message_id, emoji});

        // Check if the message_id and emoji are provided
        if (!message_id || !emoji) {
            res.status(400).send('Message ID and Emoji are required');
            return;
        }

        // Add the reaction to the database
        await db_users.addReaction(message_id, user_id, emoji);

        // Redirect back to the group chat page
        res.redirect(`/group-chat/${req.body.room_id}`);
    } catch (error) {
        console.error('Error adding reaction:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get("*", (req, res) => {
    res.status(404);
    res.render("404");
})

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});